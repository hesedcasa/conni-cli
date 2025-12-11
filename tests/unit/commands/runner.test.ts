import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runCommand } from '../../../src/commands/runner.js';

// Mock the utils module
vi.mock('../../../src/utils/index.js', () => ({
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
  loadConfig: vi.fn(),
  clearClients: vi.fn(),
}));

// Mock process.env
const originalEnv = process.env;

describe('commands/runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('runCommand', () => {
    it('should execute list-spaces command', async () => {
      const { listSpaces, loadConfig, clearClients } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      listSpaces.mockResolvedValue({ success: true, result: '{"spaces": []}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('list-spaces', null, null);

      expect(loadConfig).toHaveBeenCalled();
      expect(listSpaces).toHaveBeenCalledWith('cloud', 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"spaces": []}');
      expect(clearClients).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute list-spaces with custom profile and format', async () => {
      const { listSpaces, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: {
          cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' },
          staging: { host: 'https://staging.atlassian.net', email: 'staging@test.com', apiToken: 'staging-token' },
        },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      listSpaces.mockResolvedValue({ success: true, result: '{"spaces": []}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('list-spaces', '{"profile":"staging","format":"toon"}', null);

      expect(listSpaces).toHaveBeenCalledWith('staging', 'toon');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"spaces": []}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute get-space command with spaceKey', async () => {
      const { getSpace, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      getSpace.mockResolvedValue({ success: true, result: '{"key":"DOCS","name":"Documentation"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('get-space', '{"spaceKey":"DOCS"}', null);

      expect(getSpace).toHaveBeenCalledWith('cloud', 'DOCS', 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"key":"DOCS","name":"Documentation"}');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should exit with error if get-space missing spaceKey', async () => {
      const { loadConfig, clearClients } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('get-space', '{}', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "spaceKey" parameter is required');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(clearClients).toHaveBeenCalled();

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute list-pages command with all parameters', async () => {
      const { listPages, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      listPages.mockResolvedValue({ success: true, result: '{"pages": []}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('list-pages', '{"spaceKey":"DOCS","title":"Test","limit":10,"start":0}', null);

      expect(listPages).toHaveBeenCalledWith('cloud', 'DOCS', 'Test', 10, 0, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"pages": []}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute list-pages with minimal parameters', async () => {
      const { listPages, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      listPages.mockResolvedValue({ success: true, result: '{"pages": []}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('list-pages', null, null);

      expect(listPages).toHaveBeenCalledWith('cloud', undefined, undefined, undefined, undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"pages": []}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute get-page command', async () => {
      const { getPage, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      getPage.mockResolvedValue({ success: true, result: '{"id":"123","title":"Test Page"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('get-page', '{"pageId":"123"}', null);

      expect(getPage).toHaveBeenCalledWith('cloud', '123', 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"id":"123","title":"Test Page"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should exit with error if get-page missing pageId', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('get-page', '{}', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "pageId" parameter is required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute create-page command', async () => {
      const { createPage, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      createPage.mockResolvedValue({ success: true, result: '{"id":"456","title":"New Page"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('create-page', '{"spaceKey":"DOCS","title":"New Page","body":"<p>Content</p>"}', null);

      expect(createPage).toHaveBeenCalledWith('cloud', 'DOCS', 'New Page', '<p>Content</p>', undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"id":"456","title":"New Page"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute create-page with parentId', async () => {
      const { createPage, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      createPage.mockResolvedValue({ success: true, result: '{"id":"789"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

      await runCommand(
        'create-page',
        '{"spaceKey":"DOCS","title":"Child Page","body":"<p>Child</p>","parentId":"123"}',
        null
      );

      expect(createPage).toHaveBeenCalledWith('cloud', 'DOCS', 'Child Page', '<p>Child</p>', '123', 'json');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });

    it('should exit with error if create-page missing required parameters', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('create-page', '{"spaceKey":"DOCS"}', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "spaceKey", "title", and "body" parameters are required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute update-page command', async () => {
      const { updatePage, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      updatePage.mockResolvedValue({ success: true, result: 'Page updated' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('update-page', '{"pageId":"123","title":"Updated","body":"<p>New</p>","version":1}', null);

      expect(updatePage).toHaveBeenCalledWith('cloud', '123', 'Updated', '<p>New</p>', 1);
      expect(consoleLogSpy).toHaveBeenCalledWith('Page updated');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should exit with error if update-page missing version', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('update-page', '{"pageId":"123","title":"Updated","body":"<p>New</p>"}', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ERROR: "pageId", "title", "body", and "version" parameters are required'
      );
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute add-comment command', async () => {
      const { addComment, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      addComment.mockResolvedValue({ success: true, result: '{"id":"999"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('add-comment', '{"pageId":"123","body":"<p>Comment</p>"}', null);

      expect(addComment).toHaveBeenCalledWith('cloud', '123', '<p>Comment</p>', 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"id":"999"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should exit with error if add-comment missing parameters', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('add-comment', '{"pageId":"123"}', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "pageId" and "body" parameters are required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute delete-page command', async () => {
      const { deletePage, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      deletePage.mockResolvedValue({ success: true, result: 'Page deleted' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('delete-page', '{"pageId":"123"}', null);

      expect(deletePage).toHaveBeenCalledWith('cloud', '123');
      expect(consoleLogSpy).toHaveBeenCalledWith('Page deleted');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should exit with error if delete-page missing pageId', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('delete-page', '{}', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "pageId" parameter is required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute get-user with accountId', async () => {
      const { getUser, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      getUser.mockResolvedValue({ success: true, result: '{"accountId":"123","displayName":"User"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('get-user', '{"accountId":"123"}', null);

      expect(getUser).toHaveBeenCalledWith('cloud', '123', undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"accountId":"123","displayName":"User"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute get-user with username', async () => {
      const { getUser, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      getUser.mockResolvedValue({ success: true, result: '{"displayName":"Test User"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('get-user', '{"username":"testuser"}', null);

      expect(getUser).toHaveBeenCalledWith('cloud', undefined, 'testuser', 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"displayName":"Test User"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute get-user without parameters (current user)', async () => {
      const { getUser, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      getUser.mockResolvedValue({ success: true, result: '{"displayName":"Current User"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('get-user', null, null);

      expect(getUser).toHaveBeenCalledWith('cloud', undefined, undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"displayName":"Current User"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute test-connection command', async () => {
      const { testConnection, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      testConnection.mockResolvedValue({ success: true, result: 'Connected successfully' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-connection', null, null);

      expect(testConnection).toHaveBeenCalledWith('cloud');
      expect(consoleLogSpy).toHaveBeenCalledWith('Connected successfully');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should handle command failure', async () => {
      const { getSpace, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      getSpace.mockResolvedValue({ success: false, error: 'Space not found' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('get-space', '{"spaceKey":"INVALID"}', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Space not found');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle unknown command', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('unknown-command', '{}', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown command: unknown-command');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON parse error in arguments', async () => {
      const { loadConfig, clearClients } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('list-spaces', 'invalid json', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error executing command:',
        expect.stringContaining('not valid JSON')
      );
      expect(clearClients).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should use CLAUDE_PROJECT_ROOT from environment if set', async () => {
      process.env.CLAUDE_PROJECT_ROOT = '/custom/project/root';
      const { loadConfig, listSpaces } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      listSpaces.mockResolvedValue({ success: true, result: '{"spaces": []}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

      await runCommand('list-spaces', null, null);

      expect(loadConfig).toHaveBeenCalledWith('/custom/project/root');

      exitSpy.mockRestore();
    });

    it('should use current directory if CLAUDE_PROJECT_ROOT not set', async () => {
      delete process.env.CLAUDE_PROJECT_ROOT;
      const { loadConfig, listSpaces } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      listSpaces.mockResolvedValue({ success: true, result: '{"spaces": []}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

      await runCommand('list-spaces', null, null);

      expect(loadConfig).toHaveBeenCalledWith(process.cwd());

      exitSpy.mockRestore();
    });

    it('should clear clients on successful execution', async () => {
      const { listSpaces, loadConfig, clearClients } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
        defaultFormat: 'json',
      });
      listSpaces.mockResolvedValue({ success: true, result: '{}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('list-spaces', null, null);

      expect(clearClients).toHaveBeenCalled();

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should clear clients on error', async () => {
      const { loadConfig, clearClients } = await import('../../../src/utils/index.js');
      loadConfig.mockImplementation(() => {
        throw new Error('Config error');
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('list-spaces', null, null);

      expect(clearClients).toHaveBeenCalled();

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle exceptions and display error message', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockImplementation(() => {
        throw new Error('Configuration load failed');
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('list-spaces', null, null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error executing command:', 'Configuration load failed');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
