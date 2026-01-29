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
  downloadAttachment: vi.fn(),
  getUser: vi.fn(),
  testConnection: vi.fn(),
  loadConfig: vi.fn(),
  clearClients: vi.fn(),
}));

describe('commands/runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runCommand', () => {
    it('should execute list-spaces command', async () => {
      const { listSpaces, loadConfig, clearClients } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      listSpaces.mockResolvedValue({ success: true, result: '{"spaces": []}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('list-spaces', null, null);

      expect(loadConfig).toHaveBeenCalled();
      expect(listSpaces).toHaveBeenCalledWith('json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"spaces": []}');
      expect(clearClients).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute list-spaces with custom format', async () => {
      const { listSpaces, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      listSpaces.mockResolvedValue({ success: true, result: '{"spaces": []}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('list-spaces', '{"format":"toon"}', null);

      expect(listSpaces).toHaveBeenCalledWith('toon');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"spaces": []}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute get-space command with spaceKey', async () => {
      const { getSpace, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      getSpace.mockResolvedValue({ success: true, result: '{"key":"DOCS","name":"Documentation"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('get-space', '{"spaceKey":"DOCS"}', null);

      expect(getSpace).toHaveBeenCalledWith('DOCS', 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"key":"DOCS","name":"Documentation"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should exit with error if get-space missing spaceKey', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('get-space', '{}', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "spaceKey" parameter is required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute list-pages command with all parameters', async () => {
      const { listPages, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      listPages.mockResolvedValue({ success: true, result: '{"pages": []}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('list-pages', '{"spaceKey":"DOCS","title":"Test","limit":10,"start":5}', null);

      expect(listPages).toHaveBeenCalledWith('DOCS', 'Test', 10, 5, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"pages": []}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute list-pages with minimal parameters', async () => {
      const { listPages, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      listPages.mockResolvedValue({ success: true, result: '{"pages": []}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('list-pages', null, null);

      expect(listPages).toHaveBeenCalledWith(undefined, undefined, undefined, undefined, 'json');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute get-page command', async () => {
      const { getPage, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      getPage.mockResolvedValue({ success: true, result: '{"id":"123","title":"Test Page"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('get-page', '{"pageId":"123"}', null);

      expect(getPage).toHaveBeenCalledWith('123', 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"id":"123","title":"Test Page"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should exit with error if get-page missing pageId', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
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
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      createPage.mockResolvedValue({ success: true, result: '{"id":"456","title":"New Page"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('create-page', '{"spaceKey":"DOCS","title":"New Page","body":"<p>Content</p>"}', null);

      expect(createPage).toHaveBeenCalledWith('DOCS', 'New Page', '<p>Content</p>', undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"id":"456","title":"New Page"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute create-page with parentId', async () => {
      const { createPage, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      createPage.mockResolvedValue({ success: true, result: '{"id":"789"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

      await runCommand(
        'create-page',
        '{"spaceKey":"DOCS","title":"Child Page","body":"<p>Child</p>","parentId":"123"}',
        null
      );

      expect(createPage).toHaveBeenCalledWith('DOCS', 'Child Page', '<p>Child</p>', '123', 'json');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });

    it('should exit with error if create-page missing required parameters', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
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
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      updatePage.mockResolvedValue({ success: true, result: '{"id":"123"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('update-page', '{"pageId":"123","title":"Updated","body":"<p>New</p>","version":1}', null);

      expect(updatePage).toHaveBeenCalledWith('123', 'Updated', '<p>New</p>', 1);
      expect(consoleLogSpy).toHaveBeenCalledWith('{"id":"123"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should exit with error if update-page missing version', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
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
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      addComment.mockResolvedValue({ success: true, result: '{"id":"comment123"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('add-comment', '{"pageId":"123","body":"<p>Comment</p>"}', null);

      expect(addComment).toHaveBeenCalledWith('123', '<p>Comment</p>', 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"id":"comment123"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should exit with error if add-comment missing parameters', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
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
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      deletePage.mockResolvedValue({ success: true, result: 'Page deleted' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('delete-page', '{"pageId":"123"}', null);

      expect(deletePage).toHaveBeenCalledWith('123');
      expect(consoleLogSpy).toHaveBeenCalledWith('Page deleted');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should exit with error if delete-page missing pageId', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
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

    it('should execute download-attachment command', async () => {
      const { downloadAttachment, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      downloadAttachment.mockResolvedValue({
        success: true,
        result: 'Attachment downloaded to ./file.pdf',
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('download-attachment', '{"attachmentId":"att123","outputPath":"./file.pdf"}', null);

      expect(downloadAttachment).toHaveBeenCalledWith('att123', './file.pdf');
      expect(consoleLogSpy).toHaveBeenCalledWith('Attachment downloaded to ./file.pdf');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute get-user with accountId', async () => {
      const { getUser, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      getUser.mockResolvedValue({ success: true, result: '{"displayName":"John Doe"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('get-user', '{"accountId":"123"}', null);

      expect(getUser).toHaveBeenCalledWith('123', undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"displayName":"John Doe"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute get-user with username', async () => {
      const { getUser, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      getUser.mockResolvedValue({ success: true, result: '{"displayName":"Jane Doe"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('get-user', '{"username":"janedoe"}', null);

      expect(getUser).toHaveBeenCalledWith(undefined, 'janedoe', 'json');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute get-user without parameters (current user)', async () => {
      const { getUser, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      getUser.mockResolvedValue({ success: true, result: '{"displayName":"Current User"}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('get-user', null, null);

      expect(getUser).toHaveBeenCalledWith(undefined, undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"displayName":"Current User"}');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute test-connection command', async () => {
      const { testConnection, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      testConnection.mockResolvedValue({ success: true, result: 'Connected successfully' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-connection', null, null);

      expect(testConnection).toHaveBeenCalledWith();
      expect(consoleLogSpy).toHaveBeenCalledWith('Connected successfully');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should handle command failure', async () => {
      const { getSpace, loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
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
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
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
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
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

    it('should call loadConfig without parameters', async () => {
      const { loadConfig } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

      await runCommand('test-connection', null, null);

      expect(loadConfig).toHaveBeenCalledWith();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });

    it('should clear clients on successful execution', async () => {
      const { listSpaces, loadConfig, clearClients } = await import('../../../src/utils/index.js');
      loadConfig.mockReturnValue({
        host: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token',
        defaultFormat: 'json',
      });
      listSpaces.mockResolvedValue({ success: true, result: '{}' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

      await runCommand('list-spaces', null, null);

      expect(clearClients).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
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
