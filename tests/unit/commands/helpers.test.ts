import { describe, expect, it, vi } from 'vitest';

import { getCurrentVersion, printAvailableCommands, printCommandDetail } from '../../../src/commands/helpers.js';

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
  COMMANDS_INFO: [
    'List all accessible spaces',
    'Get details of a specific space',
    'List pages in a space or by search criteria',
    'Get details of a specific page',
    'Create a new page',
    'Update an existing page',
    'Add a comment to a page',
    'Delete a page',
    'Get user information',
    'Test Confluence API connection',
  ],
  COMMANDS_DETAIL: [
    '\nParameters:\n- profile (optional): string\n- format (optional): string\n\nExample:\nlist-spaces',
    '\nParameters:\n- spaceKey (required): string\n\nExample:\nget-space',
    '\nParameters:\n- spaceKey (optional): string\n- title (optional): string\n- limit (optional): number\n\nExample:\nlist-pages',
    '\nParameters:\n- pageId (required): string\n\nExample:\nget-page',
    '\nParameters:\n- spaceKey (required): string\n- title (required): string\n- body (required): string\n\nExample:\ncreate-page',
    '\nParameters:\n- pageId (required): string\n- title (required): string\n- body (required): string\n- version (required): number\n\nExample:\nupdate-page',
    '\nParameters:\n- pageId (required): string\n- body (required): string\n\nExample:\nadd-comment',
    '\nParameters:\n- pageId (required): string\n\nExample:\ndelete-page',
    '\nParameters:\n- accountId (optional): string\n- username (optional): string\n\nExample:\nget-user',
    '\nParameters:\n- profile (optional): string\n\nExample:\ntest-connection',
  ],
}));

describe('commands/helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('printAvailableCommands', () => {
    it('should print all available commands with their descriptions', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printAvailableCommands();

      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable commands:');
      expect(consoleLogSpy).toHaveBeenCalledWith('1. list-spaces: List all accessible spaces');
      expect(consoleLogSpy).toHaveBeenCalledWith('2. get-space: Get details of a specific space');
      expect(consoleLogSpy).toHaveBeenCalledWith('3. list-pages: List pages in a space or by search criteria');
      expect(consoleLogSpy).toHaveBeenCalledWith('4. get-page: Get details of a specific page');
      expect(consoleLogSpy).toHaveBeenCalledWith('5. create-page: Create a new page');
      expect(consoleLogSpy).toHaveBeenCalledWith('6. update-page: Update an existing page');
      expect(consoleLogSpy).toHaveBeenCalledWith('7. add-comment: Add a comment to a page');
      expect(consoleLogSpy).toHaveBeenCalledWith('8. delete-page: Delete a page');
      expect(consoleLogSpy).toHaveBeenCalledWith('9. get-user: Get user information');
      expect(consoleLogSpy).toHaveBeenCalledWith('10. test-connection: Test Confluence API connection');

      consoleLogSpy.mockRestore();
    });

    it('should print commands with correct numbering starting from 1', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printAvailableCommands();

      const calls = consoleLogSpy.mock.calls;
      // Find the calls that contain command numbers
      const numberCalls = calls.filter(call => call[0] && call[0].match(/^\d+\./));
      expect(numberCalls).toHaveLength(10);
      expect(numberCalls[0][0]).toBe('1. list-spaces: List all accessible spaces');
      expect(numberCalls[9][0]).toBe('10. test-connection: Test Confluence API connection');

      consoleLogSpy.mockRestore();
    });
  });

  describe('printCommandDetail', () => {
    it('should print detailed information for a valid command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('list-spaces');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('list-spaces'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('List all accessible spaces'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Parameters:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('profile (optional)'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Example:'));

      consoleLogSpy.mockRestore();
    });

    it('should print details for get-space command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('get-space');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('get-space'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Get details of a specific space'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('spaceKey (required)'));

      consoleLogSpy.mockRestore();
    });

    it('should print details for create-page command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('create-page');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('create-page'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Create a new page'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('spaceKey (required)'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('title (required)'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('body (required)'));

      consoleLogSpy.mockRestore();
    });

    it('should print details for update-page command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('update-page');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('update-page'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Update an existing page'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('pageId (required)'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('version (required)'));

      consoleLogSpy.mockRestore();
    });

    it('should print details for all 10 commands', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const commands = [
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
      ];

      commands.forEach(command => {
        consoleLogSpy.mockClear();
        printCommandDetail(command);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(command));
      });

      consoleLogSpy.mockRestore();
    });

    it('should handle empty command string', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('');

      expect(consoleLogSpy).toHaveBeenCalledWith('Please provide a command name.');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable commands:');

      consoleLogSpy.mockRestore();
    });

    it('should handle null command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // @ts-expect-error - Testing null input
      printCommandDetail(null);

      expect(consoleLogSpy).toHaveBeenCalledWith('Please provide a command name.');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable commands:');

      consoleLogSpy.mockRestore();
    });

    it('should handle undefined command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // @ts-expect-error - Testing undefined input
      printCommandDetail(undefined);

      expect(consoleLogSpy).toHaveBeenCalledWith('Please provide a command name.');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable commands:');

      consoleLogSpy.mockRestore();
    });

    it('should handle whitespace-only command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('   ');

      expect(consoleLogSpy).toHaveBeenCalledWith('Please provide a command name.');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable commands:');

      consoleLogSpy.mockRestore();
    });

    it('should show error for unknown command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('invalid-command');

      expect(consoleLogSpy).toHaveBeenCalledWith('Unknown command: invalid-command');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable commands:');

      consoleLogSpy.mockRestore();
    });

    it('should show error for unknown command and then list available commands', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('nonexistent');

      expect(consoleLogSpy.mock.calls[0][0]).toContain('Unknown command:');
      expect(consoleLogSpy.mock.calls[1][0]).toContain('Available commands:');

      consoleLogSpy.mockRestore();
    });

    it('should trim whitespace from command name', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('  list-spaces  ');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('list-spaces'));
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Unknown command'));

      consoleLogSpy.mockRestore();
    });

    it('should handle commands with mixed case', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('LIST-SPACES');

      expect(consoleLogSpy).toHaveBeenCalledWith('Unknown command: LIST-SPACES');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable commands:');

      consoleLogSpy.mockRestore();
    });
  });

  describe('getCurrentVersion', () => {
    it('should return version as string', () => {
      const version = getCurrentVersion();
      expect(typeof version).toBe('string');
    });

    it('should return version in semver format', () => {
      const version = getCurrentVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
