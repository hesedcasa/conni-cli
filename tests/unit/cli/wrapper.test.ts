import { beforeEach, describe, expect, it, vi } from 'vitest';

import { wrapper } from '../../../src/cli/wrapper.js';

// Create shared mock interface for readline
const mockRlInterface = {
  prompt: vi.fn(),
  on: vi.fn(),
  close: vi.fn(),
};

// Mock readline
vi.mock('readline', () => ({
  default: {
    createInterface: vi.fn(() => mockRlInterface),
  },
  createInterface: vi.fn(() => mockRlInterface),
}));

// Mock the commands module
vi.mock('../../../src/commands/index.js', () => ({
  getCurrentVersion: vi.fn().mockReturnValue('0.0.0'),
  printAvailableCommands: vi.fn(),
  printCommandDetail: vi.fn(),
}));

// Mock the config module
vi.mock('../../../src/config/index.js', () => ({
  COMMANDS: [
    'list-spaces',
    'get-space',
    'list-pages',
    'get-page',
    'create-page',
    'update-page',
    'add-comment',
    'delete-page',
    'get-user',
    'test-connection',
  ],
}));

// Mock the utils module
vi.mock('../../../src/utils/index.js', () => ({
  addComment: vi.fn(),
  clearClients: vi.fn(),
  createPage: vi.fn(),
  deletePage: vi.fn(),
  downloadAttachment: vi.fn(),
  getPage: vi.fn(),
  getSpace: vi.fn(),
  getUser: vi.fn(),
  listPages: vi.fn(),
  listSpaces: vi.fn(),
  loadConfig: vi.fn(),
  testConnection: vi.fn(),
  updatePage: vi.fn(),
}));

const originalEnv = process.env;

describe('cli/wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Reset the mock readline interface
    mockRlInterface.prompt.mockClear();
    mockRlInterface.on.mockClear();
    mockRlInterface.close.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('wrapper', () => {
    let cli: wrapper;

    beforeEach(() => {
      cli = new wrapper();
    });

    describe('constructor', () => {
      it('should create readline interface with correct prompt', async () => {
        const readline = await import('readline');

        const newCli = new wrapper();

        expect(readline.default.createInterface).toHaveBeenCalledWith({
          input: process.stdin,
          output: process.stdout,
          prompt: 'conni> ',
        });
        expect(newCli).toBeDefined();
      });
    });

    describe('connect', () => {
      it('should load config successfully', async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue({
          profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
          defaultProfile: 'cloud',
          defaultFormat: 'json',
        });

        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli.connect();

        expect(loadConfig).toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Confluence CLI'));

        consoleLogSpy.mockRestore();
      });

      it('should set default profile and format', async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue({
          profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
          defaultProfile: 'cloud',
          defaultFormat: 'toon',
        });

        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli.connect();

        // @ts-expect-error - accessing private property for testing
        expect(cli.currentProfile).toBe('cloud');
        // @ts-expect-error - accessing private property for testing
        expect(cli.currentFormat).toBe('toon');

        consoleLogSpy.mockRestore();
      });

      it('should exit with error if config load fails', async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockImplementation(() => {
          throw new Error('Config file not found');
        });

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        try {
          await cli.connect();
        } catch {
          // Expected
        }

        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load configuration:', 'Config file not found');
        expect(consoleErrorSpy).toHaveBeenCalledWith('\nMake sure:');
        expect(consoleErrorSpy).toHaveBeenCalledWith('1. .claude/atlassian-config.local.md exists');
        expect(exitSpy).toHaveBeenCalledWith(1);

        consoleErrorSpy.mockRestore();
        exitSpy.mockRestore();
      });

      it('should use CLAUDE_PROJECT_ROOT if set', async () => {
        process.env.CLAUDE_PROJECT_ROOT = '/custom/root';
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue({
          profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
          defaultProfile: 'cloud',
          defaultFormat: 'json',
        });

        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli.connect();

        expect(loadConfig).toHaveBeenCalledWith('/custom/root');

        consoleLogSpy.mockRestore();
      });

      it('should use process.cwd() if CLAUDE_PROJECT_ROOT not set', async () => {
        delete process.env.CLAUDE_PROJECT_ROOT;
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue({
          profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
          defaultProfile: 'cloud',
          defaultFormat: 'json',
        });

        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli.connect();

        expect(loadConfig).toHaveBeenCalledWith(process.cwd());

        consoleLogSpy.mockRestore();
      });
    });

    describe('handleCommand', () => {
      beforeEach(async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue({
          profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
          defaultProfile: 'cloud',
          defaultFormat: 'json',
        });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        await cli.connect();
        consoleLogSpy.mockRestore();
      });

      it('should handle empty input', async () => {
        await cli['handleCommand']('   ');

        expect(mockRlInterface.prompt).toHaveBeenCalled();
      });

      it('should handle exit command', async () => {
        const { clearClients } = await import('../../../src/utils/index.js');
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('exit');

        expect(mockRlInterface.close).toHaveBeenCalled();
        expect(clearClients).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should handle quit command', async () => {
        const { clearClients } = await import('../../../src/utils/index.js');
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('quit');

        expect(mockRlInterface.close).toHaveBeenCalled();
        expect(clearClients).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should handle q command', async () => {
        const { clearClients } = await import('../../../src/utils/index.js');
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('q');

        expect(mockRlInterface.close).toHaveBeenCalled();
        expect(clearClients).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should handle help command', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('help');

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Confluence CLI'));
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should handle ? command as help', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('?');

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Confluence CLI'));
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should handle commands command', async () => {
        const { printAvailableCommands } = await import('../../../src/commands/index.js');

        await cli['handleCommand']('commands');

        expect(printAvailableCommands).toHaveBeenCalled();
        expect(mockRlInterface.prompt).toHaveBeenCalled();
      });

      it('should handle clear command', async () => {
        const consoleSpy = vi.spyOn(console, 'clear').mockImplementation(() => {});

        await cli['handleCommand']('clear');

        expect(consoleSpy).toHaveBeenCalled();
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should switch profile to valid profile', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('profile cloud');

        expect(consoleLogSpy).toHaveBeenCalledWith('Switched to profile: cloud');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should show error for invalid profile', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['handleCommand']('profile nonexistent');

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR:'));
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should switch format to valid format', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('format toon');

        expect(consoleLogSpy).toHaveBeenCalledWith('Output format set to: toon');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should show error for invalid format', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['handleCommand']('format xml');

        expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: Invalid format. Choose: json or toon');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should list available profiles', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('profiles');

        expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable profiles:');
        expect(consoleLogSpy).toHaveBeenCalledWith('1. cloud (current)');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should show command detail with -h flag', async () => {
        const { printCommandDetail } = await import('../../../src/commands/index.js');

        await cli['handleCommand']('list-spaces -h');

        expect(printCommandDetail).toHaveBeenCalledWith('list-spaces');
        expect(mockRlInterface.prompt).toHaveBeenCalled();
      });

      it('should show error for unknown command', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['handleCommand']('unknown-command');

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown command:'));
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should trim whitespace from command', async () => {
        const { listSpaces } = await import('../../../src/utils/index.js');
        vi.mocked(listSpaces).mockResolvedValue({ success: true, result: '{}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('  list-spaces  {}  ');

        expect(listSpaces).toHaveBeenCalled();
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });
    });

    describe('runCommand', () => {
      beforeEach(async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue({
          profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
          defaultProfile: 'cloud',
          defaultFormat: 'json',
        });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        await cli.connect();
        consoleLogSpy.mockRestore();
      });

      it('should execute list-spaces command', async () => {
        const { listSpaces } = await import('../../../src/utils/index.js');
        vi.mocked(listSpaces).mockResolvedValue({ success: true, result: '{"spaces": []}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('list-spaces', '{}');

        expect(listSpaces).toHaveBeenCalledWith('cloud', 'json');

        consoleLogSpy.mockRestore();
      });

      it('should execute get-space with spaceKey', async () => {
        const { getSpace } = await import('../../../src/utils/index.js');
        vi.mocked(getSpace).mockResolvedValue({ success: true, result: '{"key":"DOCS"}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('get-space', '{"spaceKey":"DOCS"}');

        expect(getSpace).toHaveBeenCalledWith('cloud', 'DOCS', 'json');

        consoleLogSpy.mockRestore();
      });

      it('should show error if get-space missing spaceKey', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('get-space', '{}');

        expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "spaceKey" parameter is required');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should execute list-pages with all parameters', async () => {
        const { listPages } = await import('../../../src/utils/index.js');
        vi.mocked(listPages).mockResolvedValue({ success: true, result: '{"pages": []}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('list-pages', '{"spaceKey":"DOCS","title":"Test","limit":10}');

        expect(listPages).toHaveBeenCalledWith('cloud', 'DOCS', 'Test', 10, undefined, 'json');

        consoleLogSpy.mockRestore();
      });

      it('should execute get-page with pageId', async () => {
        const { getPage } = await import('../../../src/utils/index.js');
        vi.mocked(getPage).mockResolvedValue({ success: true, result: '{"id":"123"}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('get-page', '{"pageId":"123"}');

        expect(getPage).toHaveBeenCalledWith('cloud', '123', 'json');

        consoleLogSpy.mockRestore();
      });

      it('should show error if get-page missing pageId', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('get-page', '{}');

        expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "pageId" parameter is required');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should execute create-page with required parameters', async () => {
        const { createPage } = await import('../../../src/utils/index.js');
        vi.mocked(createPage).mockResolvedValue({ success: true, result: '{"id":"456"}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('create-page', '{"spaceKey":"DOCS","title":"New","body":"<p>Content</p>"}');

        expect(createPage).toHaveBeenCalledWith('cloud', 'DOCS', 'New', '<p>Content</p>', undefined, 'json');

        consoleLogSpy.mockRestore();
      });

      it('should show error if create-page missing parameters', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('create-page', '{"spaceKey":"DOCS"}');

        expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "spaceKey", "title", and "body" parameters are required');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should execute update-page with version', async () => {
        const { updatePage } = await import('../../../src/utils/index.js');
        vi.mocked(updatePage).mockResolvedValue({ success: true, result: 'Updated' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('update-page', '{"pageId":"123","title":"New","body":"<p>Content</p>","version":1}');

        expect(updatePage).toHaveBeenCalledWith('cloud', '123', 'New', '<p>Content</p>', 1);

        consoleLogSpy.mockRestore();
      });

      it('should show error if update-page missing version', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('update-page', '{"pageId":"123","title":"New","body":"<p>Content</p>"}');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'ERROR: "pageId", "title", "body", and "version" parameters are required'
        );
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should execute add-comment', async () => {
        const { addComment } = await import('../../../src/utils/index.js');
        vi.mocked(addComment).mockResolvedValue({ success: true, result: '{"id":"999"}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('add-comment', '{"pageId":"123","body":"<p>Comment</p>"}');

        expect(addComment).toHaveBeenCalledWith('cloud', '123', '<p>Comment</p>', 'json');

        consoleLogSpy.mockRestore();
      });

      it('should execute delete-page', async () => {
        const { deletePage } = await import('../../../src/utils/index.js');
        vi.mocked(deletePage).mockResolvedValue({ success: true, result: 'Deleted' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('delete-page', '{"pageId":"123"}');

        expect(deletePage).toHaveBeenCalledWith('cloud', '123');

        consoleLogSpy.mockRestore();
      });

      it('should execute download-attachment', async () => {
        const { downloadAttachment } = await import('../../../src/utils/index.js');
        vi.mocked(downloadAttachment).mockResolvedValue({
          success: true,
          result:
            'Attachment downloaded successfully!\n\nFile: document.pdf\nPath: /tmp/document.pdf\nSize: 16.00 KB\nType: application/pdf',
        });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('download-attachment', '{"attachmentId":"att12345","outputPath":"./document.pdf"}');

        expect(downloadAttachment).toHaveBeenCalledWith('cloud', 'att12345', './document.pdf');

        consoleLogSpy.mockRestore();
      });

      it('should execute get-user', async () => {
        const { getUser } = await import('../../../src/utils/index.js');
        vi.mocked(getUser).mockResolvedValue({ success: true, result: '{"displayName":"User"}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('get-user', '{"accountId":"123"}');

        expect(getUser).toHaveBeenCalledWith('cloud', '123', undefined, 'json');

        consoleLogSpy.mockRestore();
      });

      it('should execute test-connection', async () => {
        const { testConnection } = await import('../../../src/utils/index.js');
        vi.mocked(testConnection).mockResolvedValue({ success: true, result: 'Connected' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('test-connection', '{}');

        expect(testConnection).toHaveBeenCalledWith('cloud');

        consoleLogSpy.mockRestore();
      });

      it('should use profile from args if provided', async () => {
        const { listSpaces } = await import('../../../src/utils/index.js');
        vi.mocked(listSpaces).mockResolvedValue({ success: true, result: '{}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('list-spaces', '{"profile":"staging"}');

        expect(listSpaces).toHaveBeenCalledWith('staging', 'json');

        consoleLogSpy.mockRestore();
      });

      it('should use format from args if provided', async () => {
        const { listSpaces } = await import('../../../src/utils/index.js');
        vi.mocked(listSpaces).mockResolvedValue({ success: true, result: '{}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('list-spaces', '{"format":"toon"}');

        expect(listSpaces).toHaveBeenCalledWith('cloud', 'toon');

        consoleLogSpy.mockRestore();
      });

      it('should use current profile and format by default', async () => {
        const { listSpaces } = await import('../../../src/utils/index.js');
        vi.mocked(listSpaces).mockResolvedValue({ success: true, result: '{}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('list-spaces', '{}');

        expect(listSpaces).toHaveBeenCalledWith('cloud', 'json');

        consoleLogSpy.mockRestore();
      });

      it('should display success result', async () => {
        const { listSpaces } = await import('../../../src/utils/index.js');
        vi.mocked(listSpaces).mockResolvedValue({ success: true, result: '{"spaces": []}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('list-spaces', '{}');

        expect(consoleLogSpy).toHaveBeenCalledWith('\n{"spaces": []}');

        consoleLogSpy.mockRestore();
      });

      it('should display error result', async () => {
        const { listSpaces } = await import('../../../src/utils/index.js');
        vi.mocked(listSpaces).mockResolvedValue({ success: false, error: 'API Error' });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('list-spaces', '{}');

        expect(consoleErrorSpy).toHaveBeenCalledWith('\nAPI Error');

        consoleErrorSpy.mockRestore();
      });

      it('should handle command errors', async () => {
        const { listSpaces } = await import('../../../src/utils/index.js');
        vi.mocked(listSpaces).mockRejectedValue(new Error('Network error'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('list-spaces', '{}');

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error running command:', 'Network error');

        consoleErrorSpy.mockRestore();
      });

      it('should show error if configuration not loaded', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        // @ts-expect-error - accessing private property for testing
        cli.config = null;

        await cli['runCommand']('list-spaces', '{}');

        expect(consoleLogSpy).toHaveBeenCalledWith('Configuration not loaded!');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });
    });

    describe('printHelp', () => {
      beforeEach(async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue({
          profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
          defaultProfile: 'cloud',
          defaultFormat: 'json',
        });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        await cli.connect();
        consoleLogSpy.mockRestore();
      });

      it('should print help message with current settings', () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        cli['printHelp']();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Confluence CLI v0.0.0'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Profile: cloud'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Format:  json'));

        consoleLogSpy.mockRestore();
      });
    });

    describe('start', () => {
      beforeEach(async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue({
          profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
          defaultProfile: 'cloud',
          defaultFormat: 'json',
        });
      });

      it('should setup readline event handlers', async () => {
        await cli.start();

        expect(mockRlInterface.prompt).toHaveBeenCalled();
        expect(mockRlInterface.on).toHaveBeenCalledWith('line', expect.any(Function));
        expect(mockRlInterface.on).toHaveBeenCalledWith('close', expect.any(Function));
      });

      it('should setup signal handlers for SIGINT and SIGTERM', async () => {
        const onSpy = vi.spyOn(process, 'on').mockImplementation(() => process);

        await cli.start();

        expect(onSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

        onSpy.mockRestore();
      });
    });

    describe('disconnect', () => {
      beforeEach(async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue({
          profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
          defaultProfile: 'cloud',
          defaultFormat: 'json',
        });
      });

      it('should clear clients and close readline', async () => {
        const { clearClients } = await import('../../../src/utils/index.js');
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['disconnect']();

        expect(consoleLogSpy).toHaveBeenCalledWith('\nClosing Confluence connections...');
        expect(clearClients).toHaveBeenCalled();
        expect(mockRlInterface.close).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });
    });
  });
});
