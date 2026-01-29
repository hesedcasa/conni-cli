import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Confluence API functions
vi.mock('../../src/utils/confluence-client.js', () => ({
  listSpaces: vi.fn(),
  getSpace: vi.fn(),
  listPages: vi.fn(),
  getPage: vi.fn(),
  createPage: vi.fn(),
  updatePage: vi.fn(),
  addComment: vi.fn(),
  deletePage: vi.fn(),
  getUser: vi.fn(),
  testConnection: vi.fn(),
  clearClients: vi.fn(),
}));

// Mock helper functions - only where we need to spy on them
vi.mock('../../src/commands/helpers.js', async () => {
  const actual = await vi.importActual('../../src/commands/helpers.js');
  return {
    ...actual,
    printAvailableCommands: vi.fn(actual.printAvailableCommands),
    printCommandDetail: vi.fn(actual.printCommandDetail),
    getCurrentVersion: vi.fn(() => '0.0.0'),
  };
});

// Mock config-loader to spy on loadConfig
vi.mock('../../src/utils/config-loader.js', async () => {
  const actual = await vi.importActual('../../src/utils/config-loader.js');
  return {
    ...actual,
    loadConfig: vi.fn(actual.loadConfig),
  };
});

// Integration tests that test the entire flow through multiple modules

describe('CLI Integration', () => {
  let testConfigPath: string;

  beforeEach(() => {
    // Create a temporary config file for testing
    testConfigPath = path.join(os.tmpdir(), `.connicli-test-${Date.now()}`);

    // Write valid INI-style config
    const configContent = `[auth]
host=https://test.atlassian.net/wiki
email=test@test.com
api_token=test_token_123

[defaults]
format=json
`;
    fs.writeFileSync(testConfigPath, configContent);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up test config file
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('Config Loading Integration', () => {
    it('should load and parse INI configuration file', async () => {
      // Get original implementations before spying
      const originalExistsSync = fs.existsSync.bind(fs);
      const originalReadFileSync = fs.readFileSync.bind(fs);

      // Mock fs.existsSync to return true for our test config
      vi.spyOn(fs, 'existsSync').mockImplementation(filePath => {
        const pathStr = String(filePath);
        // Check if this is a .connicli file path
        if (pathStr.includes('.connicli') && !pathStr.includes('test-')) {
          return true;
        }
        return originalExistsSync(filePath as fs.PathLike);
      });

      // Mock fs.readFileSync to return our test config
      vi.spyOn(fs, 'readFileSync').mockImplementation((filePath, options) => {
        const pathStr = String(filePath);
        // If this is the .connicli file (not test file), return test config
        if (pathStr.includes('.connicli') && !pathStr.includes('test-')) {
          return originalReadFileSync(testConfigPath, options);
        }
        return originalReadFileSync(filePath as fs.PathLike, options);
      });

      const { loadConfig } = await import('../../src/utils/config-loader.js');
      const config = loadConfig();

      expect(config).toBeDefined();
      expect(config.host).toBe('https://test.atlassian.net/wiki');
      expect(config.email).toBe('test@test.com');
      expect(config.apiToken).toBe('test_token_123');
      expect(config.defaultFormat).toBe('json');

      vi.restoreAllMocks();
    });

    it('should validate required fields', async () => {
      // Write invalid config missing apiToken
      const invalidConfig = `[auth]
host=https://test.atlassian.net/wiki
email=test@test.com
# Missing api_token
`;
      fs.writeFileSync(testConfigPath, invalidConfig);

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(invalidConfig);

      const { loadConfig } = await import('../../src/utils/config-loader.js');

      expect(() => loadConfig()).toThrow('Missing required fields');

      vi.restoreAllMocks();
    });
  });

  describe('Command Runner Integration', () => {
    it('should parse command line arguments and execute', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(fs.readFileSync(testConfigPath, 'utf-8') as string);

      const { parseArguments } = await import('../../src/utils/arg-parser.js');
      const { listSpaces } = await import('../../src/utils/confluence-client.js');

      // Mock the Confluence API call
      listSpaces.mockResolvedValue({
        success: true,
        data: [{ key: 'DOCS', name: 'Documentation' }],
        result: JSON.stringify({ spaces: [{ key: 'DOCS', name: 'Documentation' }] }),
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await parseArguments(['list-spaces']);
      } catch {
        // Expected
      }

      expect(listSpaces).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('spaces'));
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it('should handle --version flag', async () => {
      const { parseArguments } = await import('../../src/utils/arg-parser.js');

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await parseArguments(['--version']);
      } catch {
        // Expected
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('0.0.0');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should handle --commands flag', async () => {
      const { parseArguments } = await import('../../src/utils/arg-parser.js');
      const { printAvailableCommands } = await import('../../src/commands/helpers.js');

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        await parseArguments(['--commands']);
      } catch {
        // Expected
      }

      expect(printAvailableCommands).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });

    it('should handle command-specific help', async () => {
      const { parseArguments } = await import('../../src/utils/arg-parser.js');
      const { printCommandDetail } = await import('../../src/commands/helpers.js');

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        await parseArguments(['list-spaces', '-h']);
      } catch {
        // Expected
      }

      expect(printCommandDetail).toHaveBeenCalledWith('list-spaces');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });
  });

  describe('Confluence API Integration', () => {
    it('should initialize Confluence client with config', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(fs.readFileSync(testConfigPath, 'utf-8') as string);

      const { getConfluenceClientOptions } = await import('../../src/utils/config-loader.js');
      const { loadConfig } = await import('../../src/utils/config-loader.js');

      const config = loadConfig();
      const options = getConfluenceClientOptions(config);

      expect(options.host).toBe('https://test.atlassian.net/wiki');
      expect(options.authentication).toBeDefined();
      expect(options.authentication.basic.email).toBe('test@test.com');
      expect(options.authentication.basic.apiToken).toBe('test_token_123');

      vi.restoreAllMocks();
    });
  });

  describe('Command Help Integration', () => {
    it('should display all available commands', async () => {
      const { printAvailableCommands } = await import('../../src/commands/helpers.js');
      const { COMMANDS } = await import('../../src/config/constants.js');

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printAvailableCommands();

      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable commands:');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`1. ${COMMANDS[0]}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`11. ${COMMANDS[10]}`));

      consoleLogSpy.mockRestore();
    });

    it('should display detailed help for each command', async () => {
      const { printCommandDetail } = await import('../../src/commands/helpers.js');
      const { COMMANDS, COMMANDS_INFO } = await import('../../src/config/constants.js');

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      COMMANDS.forEach((command, index) => {
        consoleLogSpy.mockClear();
        printCommandDetail(command);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(command));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(COMMANDS_INFO[index]));
      });

      consoleLogSpy.mockRestore();
    });
  });

  describe('CLI Wrapper Integration', () => {
    it('should initialize CLI with config', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(fs.readFileSync(testConfigPath, 'utf-8') as string);

      const { wrapper } = await import('../../src/cli/wrapper.js');
      const { loadConfig } = await import('../../src/utils/config-loader.js');

      const cli = new wrapper();

      await cli.connect();

      expect(loadConfig).toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('should handle format switching', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(fs.readFileSync(testConfigPath, 'utf-8') as string);

      const { wrapper } = await import('../../src/cli/wrapper.js');
      const cli = new wrapper();

      await cli.connect();

      const handleCommand = cli['handleCommand'].bind(cli);
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await handleCommand('format toon');

      expect(consoleLogSpy).toHaveBeenCalledWith('Output format set to: toon');

      consoleLogSpy.mockRestore();
      vi.restoreAllMocks();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle missing config file', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const { loadConfig } = await import('../../src/utils/config-loader.js');

      expect(() => loadConfig()).toThrow('Please run: conni-cli config');

      vi.restoreAllMocks();
    });

    it('should handle invalid host URL', async () => {
      const invalidConfig = `[auth]
host=invalid-url
email=test@test.com
api_token=token
`;
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(invalidConfig);

      const { loadConfig } = await import('../../src/utils/config-loader.js');

      expect(() => loadConfig()).toThrow('Invalid host');

      vi.restoreAllMocks();
    });

    it('should handle invalid email format', async () => {
      const invalidConfig = `[auth]
host=https://test.atlassian.net/wiki
email=invalid-email
api_token=token
`;
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(invalidConfig);

      const { loadConfig } = await import('../../src/utils/config-loader.js');

      expect(() => loadConfig()).toThrow('Invalid email');

      vi.restoreAllMocks();
    });
  });

  describe('End-to-End Workflows', () => {
    it('should execute list-spaces workflow', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(fs.readFileSync(testConfigPath, 'utf-8') as string);

      const { runCommand } = await import('../../src/commands/runner.js');
      const { listSpaces } = await import('../../src/utils/confluence-client.js');

      listSpaces.mockResolvedValue({
        success: true,
        data: [
          { key: 'DOCS', name: 'Documentation' },
          { key: 'ENG', name: 'Engineering' },
        ],
        result: JSON.stringify({
          spaces: [
            { key: 'DOCS', name: 'Documentation' },
            { key: 'ENG', name: 'Engineering' },
          ],
        }),
      });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        await runCommand('list-spaces', null, null);
      } catch {
        // Expected
      }

      expect(listSpaces).toHaveBeenCalledWith('json');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('DOCS'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Engineering'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it('should execute create-page workflow', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(fs.readFileSync(testConfigPath, 'utf-8') as string);

      const { runCommand } = await import('../../src/commands/runner.js');
      const { createPage } = await import('../../src/utils/confluence-client.js');

      createPage.mockResolvedValue({
        success: true,
        data: { id: '12345', title: 'New Page', type: 'page' },
        result: JSON.stringify({
          id: '12345',
          title: 'New Page',
          type: 'page',
        }),
      });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        await runCommand(
          'create-page',
          JSON.stringify({
            spaceKey: 'DOCS',
            title: 'New Page',
            body: '<p>Page content</p>',
          }),
          null
        );
      } catch {
        // Expected
      }

      expect(createPage).toHaveBeenCalledWith('DOCS', 'New Page', '<p>Page content</p>', undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('12345'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it('should execute get-user workflow', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(fs.readFileSync(testConfigPath, 'utf-8') as string);

      const { runCommand } = await import('../../src/commands/runner.js');
      const { getUser } = await import('../../src/utils/confluence-client.js');

      getUser.mockResolvedValue({
        success: true,
        data: {
          accountId: '5b10a2844c20165700ede21g',
          displayName: 'John Doe',
          email: 'john.doe@test.com',
        },
        result: JSON.stringify({
          accountId: '5b10a2844c20165700ede21g',
          displayName: 'John Doe',
          email: 'john.doe@test.com',
        }),
      });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        await runCommand('get-user', '{"accountId":"5b10a2844c20165700ede21g"}', null);
      } catch {
        // Expected
      }

      expect(getUser).toHaveBeenCalledWith('5b10a2844c20165700ede21g', undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('John Doe'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it('should execute test-connection workflow', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(fs.readFileSync(testConfigPath, 'utf-8') as string);

      const { runCommand } = await import('../../src/commands/runner.js');
      const { testConnection } = await import('../../src/utils/confluence-client.js');

      testConnection.mockResolvedValue({
        success: true,
        data: { currentUser: { displayName: 'John Doe', email: 'john.doe@test.com' } },
        result: 'Connection successful!\n\nLogged in as: John Doe (john.doe@test.com)',
      });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        await runCommand('test-connection', null, null);
      } catch {
        // Expected
      }

      expect(testConnection).toHaveBeenCalledWith();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Connection successful'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('John Doe'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
      vi.restoreAllMocks();
    });
  });
});
