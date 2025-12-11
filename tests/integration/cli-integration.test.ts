import fs from 'fs';
import os from 'os';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  let testDir: string;
  let configPath: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conni-cli-integration-'));
    fs.mkdirSync(path.join(testDir, '.claude'));
    configPath = path.join(testDir, '.claude', 'atlassian-config.local.md');

    // Write valid config
    const configContent = `---
profiles:
  cloud:
    host: https://test.atlassian.net/wiki
    email: test@test.com
    apiToken: test_token_123
  staging:
    host: https://staging.atlassian.net/wiki
    email: staging@test.com
    apiToken: staging_token_456

defaultProfile: cloud
defaultFormat: json
---

# Test Config`;
    fs.writeFileSync(configPath, configContent);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('Config Loading Integration', () => {
    it('should load and parse configuration file', async () => {
      process.env.CLAUDE_PROJECT_ROOT = testDir;

      const { loadConfig } = await import('../../src/utils/config-loader.js');
      const config = await loadConfig(testDir);

      expect(config).toBeDefined();
      expect(config.profiles).toBeDefined();
      expect(config.profiles.cloud).toBeDefined();
      expect(config.profiles.cloud.host).toBe('https://test.atlassian.net/wiki');
      expect(config.profiles.cloud.email).toBe('test@test.com');
      expect(config.profiles.cloud.apiToken).toBe('test_token_123');
      expect(config.defaultProfile).toBe('cloud');
      expect(config.defaultFormat).toBe('json');
    });

    it('should support multiple profiles', async () => {
      const { loadConfig } = await import('../../src/utils/config-loader.js');
      const config = await loadConfig(testDir);

      expect(Object.keys(config.profiles)).toHaveLength(2);
      expect(config.profiles.cloud).toBeDefined();
      expect(config.profiles.staging).toBeDefined();
    });

    it('should validate required profile fields', async () => {
      const invalidConfig = `---
profiles:
  incomplete:
    host: https://test.atlassian.net/wiki
    email: test@test.com
    # Missing apiToken
---
`;
      fs.writeFileSync(configPath, invalidConfig);

      const { loadConfig } = await import('../../src/utils/config-loader.js');

      expect(() => loadConfig(testDir)).toThrow('missing required field');
    });
  });

  describe('Command Runner Integration', () => {
    it('should parse command line arguments and execute', async () => {
      process.env.CLAUDE_PROJECT_ROOT = testDir;

      const { parseArguments } = await import('../../src/utils/arg-parser.js');
      const { listSpaces } = await import('../../src/utils/confluence-client.js');

      // Mock the Confluence API call
      listSpaces.mockResolvedValue({
        success: true,
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
    it('should initialize Confluence client with profile', async () => {
      process.env.CLAUDE_PROJECT_ROOT = testDir;

      const { getConfluenceClientOptions } = await import('../../src/utils/config-loader.js');
      const { loadConfig } = await import('../../src/utils/config-loader.js');

      const config = await loadConfig(testDir);
      const options = getConfluenceClientOptions(config, 'cloud');

      expect(options.host).toBe('https://test.atlassian.net/wiki');
      expect(options.authentication).toBeDefined();
      expect(options.authentication.basic.email).toBe('test@test.com');
      expect(options.authentication.basic.apiToken).toBe('test_token_123');
    });

    it('should handle different profiles', async () => {
      const { getConfluenceClientOptions } = await import('../../src/utils/config-loader.js');
      const { loadConfig } = await import('../../src/utils/config-loader.js');

      const config = await loadConfig(testDir);
      const cloudOptions = getConfluenceClientOptions(config, 'cloud');
      const stagingOptions = getConfluenceClientOptions(config, 'staging');

      expect(cloudOptions.host).toBe('https://test.atlassian.net/wiki');
      expect(stagingOptions.host).toBe('https://staging.atlassian.net/wiki');
      expect(cloudOptions).not.toEqual(stagingOptions);
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
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`10. ${COMMANDS[9]}`));

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
      process.env.CLAUDE_PROJECT_ROOT = testDir;

      const { wrapper } = await import('../../src/cli/wrapper.js');
      const { loadConfig } = await import('../../src/utils/config-loader.js');

      const cli = new wrapper();

      await cli.connect();

      expect(loadConfig).toHaveBeenCalledWith(testDir);
    });

    it('should handle profile switching', async () => {
      process.env.CLAUDE_PROJECT_ROOT = testDir;

      const { wrapper } = await import('../../src/cli/wrapper.js');
      const cli = new wrapper();

      await cli.connect();

      // Simulate profile switch
      const handleCommand = cli['handleCommand'].bind(cli);
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await handleCommand('profile staging');

      expect(consoleLogSpy).toHaveBeenCalledWith('Switched to profile: staging');

      consoleLogSpy.mockRestore();
    });

    it('should handle format switching', async () => {
      process.env.CLAUDE_PROJECT_ROOT = testDir;

      const { wrapper } = await import('../../src/cli/wrapper.js');
      const cli = new wrapper();

      await cli.connect();

      const handleCommand = cli['handleCommand'].bind(cli);
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await handleCommand('format toon');

      expect(consoleLogSpy).toHaveBeenCalledWith('Output format set to: toon');

      consoleLogSpy.mockRestore();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle missing config file', async () => {
      fs.rmSync(configPath);

      process.env.CLAUDE_PROJECT_ROOT = testDir;

      const { loadConfig } = await import('../../src/utils/config-loader.js');

      expect(() => loadConfig(testDir)).toThrow('Configuration file not found');
    });

    it('should handle invalid config format', async () => {
      const invalidConfig = `# Invalid Config

This is just markdown without frontmatter
`;
      fs.writeFileSync(configPath, invalidConfig);

      const { loadConfig } = await import('../../src/utils/config-loader.js');

      expect(() => loadConfig(testDir)).toThrow('Invalid configuration file format');
    });

    it('should handle missing profile', async () => {
      const { getConfluenceClientOptions } = await import('../../src/utils/config-loader.js');
      const { loadConfig } = await import('../../src/utils/config-loader.js');

      const config = await loadConfig(testDir);

      expect(() => getConfluenceClientOptions(config, 'nonexistent')).toThrow('Profile "nonexistent" not found');
    });

    it('should handle invalid host URL', async () => {
      const invalidConfig = `---
profiles:
  invalid:
    host: invalid-url
    email: test@test.com
    apiToken: token
---
`;
      fs.writeFileSync(configPath, invalidConfig);

      const { loadConfig } = await import('../../src/utils/config-loader.js');

      expect(() => loadConfig(testDir)).toThrow('host must start with http:// or https://');
    });

    it('should handle invalid email format', async () => {
      const invalidConfig = `---
profiles:
  invalid:
    host: https://test.atlassian.net/wiki
    email: invalid-email
    apiToken: token
---
`;
      fs.writeFileSync(configPath, invalidConfig);

      const { loadConfig } = await import('../../src/utils/config-loader.js');

      expect(() => loadConfig(testDir)).toThrow('email appears to be invalid');
    });
  });

  describe('End-to-End Workflows', () => {
    it('should execute list-spaces workflow', async () => {
      process.env.CLAUDE_PROJECT_ROOT = testDir;

      const { runCommand } = await import('../../src/commands/runner.js');
      const { listSpaces } = await import('../../src/utils/confluence-client.js');

      listSpaces.mockResolvedValue({
        success: true,
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

      expect(listSpaces).toHaveBeenCalledWith('cloud', 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('DOCS'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Engineering'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute create-page workflow', async () => {
      process.env.CLAUDE_PROJECT_ROOT = testDir;

      const { runCommand } = await import('../../src/commands/runner.js');
      const { createPage } = await import('../../src/utils/confluence-client.js');

      createPage.mockResolvedValue({
        success: true,
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

      expect(createPage).toHaveBeenCalledWith('cloud', 'DOCS', 'New Page', '<p>Page content</p>', undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('12345'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute get-user workflow', async () => {
      process.env.CLAUDE_PROJECT_ROOT = testDir;

      const { runCommand } = await import('../../src/commands/runner.js');
      const { getUser } = await import('../../src/utils/confluence-client.js');

      getUser.mockResolvedValue({
        success: true,
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

      expect(getUser).toHaveBeenCalledWith('cloud', '5b10a2844c20165700ede21g', undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('John Doe'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute test-connection workflow', async () => {
      process.env.CLAUDE_PROJECT_ROOT = testDir;

      const { runCommand } = await import('../../src/commands/runner.js');
      const { testConnection } = await import('../../src/utils/confluence-client.js');

      testConnection.mockResolvedValue({
        success: true,
        result: 'Connection successful!\n\nProfile: cloud\nLogged in as: John Doe (john.doe@test.com)',
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

      expect(testConnection).toHaveBeenCalledWith('cloud');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Connection successful'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('John Doe'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });
});
