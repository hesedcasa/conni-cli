import * as fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the mocked module to access mocked functions
import * as configLoaderModule from '../../../src/utils/config-loader.js';
import { ConfluenceUtil } from '../../../src/utils/confluence-utils.js';

// Import mocked modules
vi.mock('@toon-format/toon', () => ({
  encode: vi.fn().mockReturnValue('toon-encoded-output'),
}));

vi.mock('../../../src/utils/config-loader.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/utils/config-loader.js')>(
    '../../../src/utils/config-loader.js'
  );
  return {
    ...actual,
    getConfluenceClientOptions: vi.fn().mockReturnValue({
      host: 'https://test.atlassian.net',
      authentication: { basic: { email: 'test@test.com', apiToken: 'token' } },
    }),
  };
});

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
}));

// Define mock client type
interface MockConfluenceClient {
  space: {
    getSpaces: ReturnType<typeof vi.fn>;
    getSpace: ReturnType<typeof vi.fn>;
  };
  content: {
    searchContentByCQL: ReturnType<typeof vi.fn>;
    getContentById: ReturnType<typeof vi.fn>;
    createContent: ReturnType<typeof vi.fn>;
    updateContent: ReturnType<typeof vi.fn>;
    deleteContent: ReturnType<typeof vi.fn>;
  };
  contentAttachments: {
    downloadAttachment: ReturnType<typeof vi.fn>;
  };
  users: {
    getUser: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  search: {
    searchUser: ReturnType<typeof vi.fn>;
  };
}

// Mock confluence.js - must export ConfluenceClient as named export (not default)
// Using a class to ensure proper constructor behavior with `new`
vi.mock('confluence.js', () => {
  return {
    ConfluenceClient: vi.fn().mockImplementation(function (this: MockConfluenceClient) {
      this.space = {
        getSpaces: vi.fn(),
        getSpace: vi.fn(),
      };
      this.content = {
        searchContentByCQL: vi.fn(),
        getContentById: vi.fn(),
        createContent: vi.fn(),
        updateContent: vi.fn(),
        deleteContent: vi.fn(),
      };
      this.contentAttachments = {
        downloadAttachment: vi.fn(),
      };
      this.users = {
        getUser: vi.fn(),
        getCurrentUser: vi.fn(),
      };
      this.search = {
        searchUser: vi.fn(),
      };
    }),
  };
});

// Shared mock client that all tests can configure
let mockClient: MockConfluenceClient;

describe('confluence-utils', () => {
  let ConfluenceClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create a fresh mock client for each test
    mockClient = {
      space: {
        getSpaces: vi.fn(),
        getSpace: vi.fn(),
      },
      content: {
        searchContentByCQL: vi.fn(),
        getContentById: vi.fn(),
        createContent: vi.fn(),
        updateContent: vi.fn(),
        deleteContent: vi.fn(),
      },
      contentAttachments: {
        downloadAttachment: vi.fn(),
      },
      users: {
        getUser: vi.fn(),
        getCurrentUser: vi.fn(),
      },
      search: {
        searchUser: vi.fn(),
      },
    };

    // Get the mocked ConfluenceClient constructor
    const confluenceModule = await import('confluence.js');
    ConfluenceClient = vi.mocked(confluenceModule.ConfluenceClient);

    // Reset and set up the mock to use our mockClient
    ConfluenceClient.mockReset();
    ConfluenceClient.mockImplementation(function (this: MockConfluenceClient) {
      Object.assign(this, mockClient);
      return this;
    });
  });

  describe('ConfluenceUtil', () => {
    let confluenceUtil: ConfluenceUtil;
    const mockConfig = {
      host: 'https://test.atlassian.net',
      email: 'test@test.com',
      apiToken: 'token',
      defaultFormat: 'json' as const,
    };

    beforeEach(() => {
      confluenceUtil = new ConfluenceUtil(mockConfig);
    });

    describe('constructor', () => {
      it('should initialize with config and null client', () => {
        expect(confluenceUtil).toBeDefined();
        // @ts-expect-error - accessing private property for testing
        expect(confluenceUtil.client).toBeNull();
      });
    });

    describe('getClient', () => {
      it('should create client', () => {
        vi.mocked(configLoaderModule.getConfluenceClientOptions).mockReturnValue({
          host: 'https://test.atlassian.net',
          authentication: { basic: { email: 'test@test.com', apiToken: 'token' } },
        });

        const client = confluenceUtil.getClient();

        expect(configLoaderModule.getConfluenceClientOptions).toHaveBeenCalledWith(mockConfig);
        expect(ConfluenceClient).toHaveBeenCalled();
        // Verify client has the expected structure (from mockClient)
        expect(client.space).toBeDefined();
        expect(client.content).toBeDefined();
        expect(client.users).toBeDefined();
      });

      it('should reuse existing client', () => {
        vi.mocked(configLoaderModule.getConfluenceClientOptions).mockReturnValue({
          host: 'https://test.atlassian.net',
          authentication: { basic: { email: 'test@test.com', apiToken: 'token' } },
        });

        // First call creates client
        const client1 = confluenceUtil.getClient();
        // Second call reuses client
        const client2 = confluenceUtil.getClient();

        expect(ConfluenceClient).toHaveBeenCalledTimes(1);
        // Should be the exact same object reference
        expect(client2).toBe(client1);
      });
    });

    describe('formatAsJson', () => {
      it('should format data as JSON string', () => {
        const data = { key: 'value', number: 42 };
        const result = confluenceUtil.formatAsJson(data);

        expect(result).toBe(JSON.stringify(data, null, 2));
      });

      it('should format empty object', () => {
        const result = confluenceUtil.formatAsJson({});
        expect(result).toBe('{}');
      });

      it('should format null', () => {
        const result = confluenceUtil.formatAsJson(null);
        expect(result).toBe('null');
      });
    });

    describe('formatAsToon', () => {
      it('should format data using TOON encoder', async () => {
        const { encode } = vi.mocked(await import('@toon-format/toon'));
        const data = { key: 'value' };

        const result = confluenceUtil.formatAsToon(data);

        expect(encode).toHaveBeenCalledWith(data);
        expect(result).toBe('toon-encoded-output');
      });

      it('should return empty string for null data', () => {
        const result = confluenceUtil.formatAsToon(null);
        expect(result).toBe('');
      });

      it('should return empty string for undefined data', () => {
        const result = confluenceUtil.formatAsToon(undefined);
        expect(result).toBe('');
      });
    });

    describe('formatResult', () => {
      it('should format as JSON by default', () => {
        const data = { test: 'value' };
        const result = confluenceUtil.formatResult(data);

        expect(result).toBe(JSON.stringify(data, null, 2));
      });

      it('should format as JSON when specified', () => {
        const data = { test: 'value' };
        const result = confluenceUtil.formatResult(data, 'json');

        expect(result).toBe(JSON.stringify(data, null, 2));
      });

      it('should format as TOON when specified', async () => {
        const data = { test: 'value' };
        const { encode } = vi.mocked(await import('@toon-format/toon'));

        const result = confluenceUtil.formatResult(data, 'toon');

        expect(encode).toHaveBeenCalledWith(data);
        expect(result).toBe('toon-encoded-output');
      });
    });

    describe('listSpaces', () => {
      it('should return formatted spaces on success', async () => {
        mockClient.space.getSpaces.mockResolvedValue({
          results: [{ key: 'DOCS', name: 'Documentation', type: 'global', id: 1 }],
        });

        const result = await confluenceUtil.listSpaces('json');

        expect(mockClient.space.getSpaces).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.data).toEqual([{ key: 'DOCS', name: 'Documentation', type: 'global', id: '1' }]);
        expect(result.result).toBeDefined();
        expect(result.result).toContain('DOCS');
      });

      it('should return error on API failure', async () => {
        mockClient.space.getSpaces.mockRejectedValue(new Error('API Error'));

        const result = await confluenceUtil.listSpaces();

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: API Error');
      });

      it('should simplify space data', async () => {
        mockClient.space.getSpaces.mockResolvedValue({
          results: [{ key: 'DOCS', name: 'Documentation', type: 'global', id: 1, extraField: 'ignored' }],
        });

        const result = await confluenceUtil.listSpaces();

        expect(result.data).toEqual([{ key: 'DOCS', name: 'Documentation', type: 'global', id: '1' }]);
        expect((result.data as Array<Record<string, unknown>>)[0]).not.toHaveProperty('extraField');
      });

      it('should handle empty results', async () => {
        mockClient.space.getSpaces.mockResolvedValue({ results: [] });

        const result = await confluenceUtil.listSpaces();

        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });
    });

    describe('getSpace', () => {
      it('should return space details on success', async () => {
        const mockSpace = { key: 'DOCS', name: 'Documentation', type: 'global' };
        mockClient.space.getSpace.mockResolvedValue(mockSpace);

        const result = await confluenceUtil.getSpace('DOCS', 'json');

        expect(mockClient.space.getSpace).toHaveBeenCalledWith({ spaceKey: 'DOCS' });
        expect(result.success).toBe(true);
        expect(result.data).toBe(mockSpace);
      });

      it('should return error on API failure', async () => {
        mockClient.space.getSpace.mockRejectedValue(new Error('Space not found'));

        const result = await confluenceUtil.getSpace('INVALID');

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: Space not found');
      });
    });

    describe('listPages', () => {
      it('should search pages with CQL query', async () => {
        mockClient.content.searchContentByCQL.mockResolvedValue({
          results: [
            { id: '1', title: 'Page 1', type: 'page', status: 'current', space: { key: 'DOCS' } },
            { id: '2', title: 'Page 2', type: 'page', status: 'current', space: { key: 'DOCS' } },
          ],
        });

        const result = await confluenceUtil.listPages('DOCS', 'Test', 10, 0, 'json');

        expect(mockClient.content.searchContentByCQL).toHaveBeenCalledWith({
          cql: 'type=page AND space="DOCS" AND title~"Test"',
          limit: 10,
        });
        expect(result.success).toBe(true);
        expect(result.data).toEqual([
          { id: '1', title: 'Page 1', type: 'page', status: 'current', spaceKey: 'DOCS' },
          { id: '2', title: 'Page 2', type: 'page', status: 'current', spaceKey: 'DOCS' },
        ]);
      });

      it('should build CQL query with spaceKey only', async () => {
        mockClient.content.searchContentByCQL.mockResolvedValue({ results: [] });

        await confluenceUtil.listPages('DOCS');

        expect(mockClient.content.searchContentByCQL).toHaveBeenCalledWith({
          cql: 'type=page AND space="DOCS"',
          limit: 25,
        });
      });

      it('should build CQL query with title only', async () => {
        mockClient.content.searchContentByCQL.mockResolvedValue({ results: [] });

        await confluenceUtil.listPages(undefined, 'Test');

        expect(mockClient.content.searchContentByCQL).toHaveBeenCalledWith({
          cql: 'type=page AND title~"Test"',
          limit: 25,
        });
      });

      it('should build minimal CQL query without filters', async () => {
        mockClient.content.searchContentByCQL.mockResolvedValue({ results: [] });

        await confluenceUtil.listPages();

        expect(mockClient.content.searchContentByCQL).toHaveBeenCalledWith({
          cql: 'type=page',
          limit: 25,
        });
      });

      it('should handle API errors', async () => {
        mockClient.content.searchContentByCQL.mockRejectedValue(new Error('Search failed'));

        const result = await confluenceUtil.listPages('DOCS');

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: Search failed');
      });
    });

    describe('getPage', () => {
      it('should return page details on success', async () => {
        const mockPage = { id: '123', title: 'Test Page', body: { storage: { value: '<p>Content</p>' } } };
        mockClient.content.getContentById.mockResolvedValue(mockPage);

        const result = await confluenceUtil.getPage('123', 'json');

        expect(mockClient.content.getContentById).toHaveBeenCalledWith({
          id: '123',
          expand: ['body.storage', 'children.attachment'],
        });
        expect(result.success).toBe(true);
        expect(result.data).toBe(mockPage);
      });

      it('should return error on API failure', async () => {
        mockClient.content.getContentById.mockRejectedValue(new Error('Page not found'));

        const result = await confluenceUtil.getPage('999');

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: Page not found');
      });
    });

    describe('createPage', () => {
      it('should create page without parent', async () => {
        const mockResponse = { id: '456', title: 'New Page' };
        mockClient.content.createContent.mockResolvedValue(mockResponse);

        const result = await confluenceUtil.createPage('DOCS', 'New Page', '<p>Content</p>', undefined, 'json');

        expect(mockClient.content.createContent).toHaveBeenCalledWith({
          type: 'page',
          title: 'New Page',
          space: { key: 'DOCS' },
          body: {
            storage: {
              value: '<p>Content</p>',
              representation: 'storage',
            },
          },
        });
        expect(result.success).toBe(true);
        expect(result.data).toBe(mockResponse);
      });

      it('should create page with parent', async () => {
        const mockResponse = { id: '789' };
        mockClient.content.createContent.mockResolvedValue(mockResponse);

        await confluenceUtil.createPage('DOCS', 'Child Page', '<p>Child</p>', '123', 'json');

        expect(mockClient.content.createContent).toHaveBeenCalledWith({
          type: 'page',
          title: 'Child Page',
          space: { key: 'DOCS' },
          body: {
            storage: {
              value: '<p>Child</p>',
              representation: 'storage',
            },
          },
          ancestors: [{ id: '123' }],
        });
      });

      it('should return error on API failure', async () => {
        mockClient.content.createContent.mockRejectedValue(new Error('Permission denied'));

        const result = await confluenceUtil.createPage('DOCS', 'New Page', '<p>Content</p>');

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: Permission denied');
      });
    });

    describe('updatePage', () => {
      it('should update page with new version', async () => {
        mockClient.content.updateContent.mockResolvedValue({});

        const result = await confluenceUtil.updatePage('123', 'Updated Title', '<p>New Content</p>', 1);

        expect(mockClient.content.updateContent).toHaveBeenCalledWith({
          id: '123',
          type: 'page',
          body: {
            storage: {
              value: '<p>New Content</p>',
              representation: 'storage',
            },
          },
          title: 'Updated Title',
          version: { number: 2 },
        });
        expect(result.success).toBe(true);
        expect(result.result).toBe('Page 123 updated successfully!');
      });

      it('should increment version number', async () => {
        mockClient.content.updateContent.mockResolvedValue({});

        await confluenceUtil.updatePage('123', 'Title', 'Body', 5);

        expect(mockClient.content.updateContent).toHaveBeenCalledWith(
          expect.objectContaining({ version: { number: 6 } })
        );
      });

      it('should return error on API failure', async () => {
        mockClient.content.updateContent.mockRejectedValue(new Error('Version conflict'));

        const result = await confluenceUtil.updatePage('123', 'Title', 'Body', 1);

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: Version conflict');
      });
    });

    describe('addComment', () => {
      it('should add comment to page', async () => {
        const mockPage = { space: { key: 'DOCS' } };
        const mockComment = { id: '999' };
        mockClient.content.getContentById.mockResolvedValue(mockPage);
        mockClient.content.createContent.mockResolvedValue(mockComment);

        const result = await confluenceUtil.addComment('123', '<p>Comment</p>', 'json');

        expect(mockClient.content.getContentById).toHaveBeenCalledWith({
          id: '123',
          expand: ['space'],
        });
        expect(mockClient.content.createContent).toHaveBeenCalledWith({
          type: 'comment',
          container: { id: '123', type: 'page' },
          title: '',
          space: { key: 'DOCS' },
          body: {
            storage: {
              value: '<p>Comment</p>',
              representation: 'storage',
            },
          },
        });
        expect(result.success).toBe(true);
        expect(result.data).toBe(mockComment);
      });

      it('should return error on API failure', async () => {
        mockClient.content.getContentById.mockRejectedValue(new Error('Page not found'));

        const result = await confluenceUtil.addComment('999', '<p>Comment</p>');

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: Page not found');
      });
    });

    describe('deletePage', () => {
      it('should delete page successfully', async () => {
        mockClient.content.deleteContent.mockResolvedValue({});

        const result = await confluenceUtil.deletePage('123');

        expect(mockClient.content.deleteContent).toHaveBeenCalledWith({ id: '123' });
        expect(result.success).toBe(true);
        expect(result.result).toBe('Page 123 deleted successfully!');
      });

      it('should return error on API failure', async () => {
        mockClient.content.deleteContent.mockRejectedValue(new Error('Delete failed'));

        const result = await confluenceUtil.deletePage('123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: Delete failed');
      });
    });

    describe('getUser', () => {
      it('should get user by accountId', async () => {
        const mockUser = { accountId: '123', displayName: 'Test User' };
        mockClient.users.getUser.mockResolvedValue(mockUser);

        const result = await confluenceUtil.getUser('123', undefined, 'json');

        expect(mockClient.users.getUser).toHaveBeenCalledWith({ accountId: '123' });
        expect(result.success).toBe(true);
        expect(result.data).toBe(mockUser);
      });

      it('should search user by username', async () => {
        const mockUser = { displayName: 'Test User' };
        mockClient.search.searchUser.mockResolvedValue({ results: [mockUser] });

        const result = await confluenceUtil.getUser(undefined, 'testuser', 'json');

        expect(mockClient.search.searchUser).toHaveBeenCalledWith({
          cql: 'user.fullname~"testuser"',
          limit: 1,
        });
        expect(result.success).toBe(true);
        expect(result.data).toBe(mockUser);
      });

      it('should return error if user not found by username', async () => {
        mockClient.search.searchUser.mockResolvedValue({ results: [] });

        const result = await confluenceUtil.getUser(undefined, 'nonexistent');

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: User "nonexistent" not found');
      });

      it('should get current user when no parameters provided', async () => {
        const mockUser = { displayName: 'Current User', email: 'current@test.com' };
        mockClient.users.getCurrentUser.mockResolvedValue(mockUser);

        const result = await confluenceUtil.getUser(undefined, undefined, 'json');

        expect(mockClient.users.getCurrentUser).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.data).toBe(mockUser);
      });

      it('should return error on API failure', async () => {
        mockClient.users.getUser.mockRejectedValue(new Error('User not found'));

        const result = await confluenceUtil.getUser('999');

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: User not found');
      });
    });

    describe('testConnection', () => {
      it('should return connection success with user info', async () => {
        const mockUser = { displayName: 'Test User', email: 'test@test.com' };
        mockClient.users.getCurrentUser.mockResolvedValue(mockUser);

        const result = await confluenceUtil.testConnection();

        expect(mockClient.users.getCurrentUser).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ currentUser: mockUser });
        expect(result.result).toContain('Connection successful!');
        expect(result.result).toContain('Test User');
        expect(result.result).toContain('test@test.com');
      });

      it('should return error on connection failure', async () => {
        mockClient.users.getCurrentUser.mockRejectedValue(new Error('Auth failed'));

        const result = await confluenceUtil.testConnection();

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: Auth failed');
      });
    });

    describe('clearClients', () => {
      it('should clear client', () => {
        vi.mocked(configLoaderModule.getConfluenceClientOptions).mockReturnValue({
          host: 'https://test.atlassian.net',
          authentication: { basic: { email: 'test@test.com', apiToken: 'token' } },
        });

        confluenceUtil.getClient();

        // @ts-expect-error - accessing private property for testing
        expect(confluenceUtil.client).not.toBeNull();

        confluenceUtil.clearClients();

        // @ts-expect-error - accessing private property for testing
        expect(confluenceUtil.client).toBeNull();
      });
    });

    describe('downloadAttachment', () => {
      const mockBuffer = Buffer.alloc(16384); // 16KB buffer

      it('should download attachment successfully', async () => {
        const mockAttachment = {
          id: 'att123',
          title: 'document.pdf',
          metadata: { mediaType: 'application/pdf' },
          container: { id: 'page456' },
        };
        mockClient.content.getContentById.mockResolvedValue(mockAttachment);
        mockClient.contentAttachments.downloadAttachment.mockResolvedValue(mockBuffer);

        const result = await confluenceUtil.downloadAttachment('att123', '/tmp/document.pdf');

        expect(mockClient.content.getContentById).toHaveBeenCalledWith({
          id: 'att123',
          expand: ['container', 'metadata.mediaType', 'version'],
        });
        expect(mockClient.contentAttachments.downloadAttachment).toHaveBeenCalledWith({
          id: 'page456',
          attachmentId: 'att123',
        });
        expect(fs.writeFileSync).toHaveBeenCalledWith('/tmp/document.pdf', mockBuffer);
        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          fileName: 'document.pdf',
          filePath: '/tmp/document.pdf',
          fileSize: mockBuffer.length,
          mediaType: 'application/pdf',
        });
        expect(result.result).toContain('document.pdf');
        expect(result.result).toContain('/tmp/document.pdf');
        expect(result.result).toContain('16.00 KB');
        expect(result.result).toContain('application/pdf');
      });

      it('should use default filename if title not provided', async () => {
        const mockAttachment = {
          id: 'att123',
          title: undefined,
          metadata: { mediaType: 'text/plain' },
          container: { id: 'page456' },
        };
        mockClient.content.getContentById.mockResolvedValue(mockAttachment);
        mockClient.contentAttachments.downloadAttachment.mockResolvedValue(mockBuffer);

        const result = await confluenceUtil.downloadAttachment('att123');

        expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringMatching(/download$/), mockBuffer);
        expect(result.success).toBe(true);
        expect((result.data as { fileName: string })?.fileName).toBe('download');
      });

      it('should use default media type if not provided', async () => {
        const mockAttachment = {
          id: 'att123',
          title: 'file.txt',
          metadata: { mediaType: undefined },
          container: { id: 'page456' },
        };
        mockClient.content.getContentById.mockResolvedValue(mockAttachment);
        mockClient.contentAttachments.downloadAttachment.mockResolvedValue(mockBuffer);

        const result = await confluenceUtil.downloadAttachment('att123');

        expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringMatching(/file\.txt$/), mockBuffer);
        expect(result.success).toBe(true);
        expect((result.data as { mediaType: string })?.mediaType).toBe('application/octet-stream');
      });

      it('should return error if container not found', async () => {
        const mockAttachment = {
          id: 'att123',
          title: 'file.txt',
          metadata: { mediaType: 'text/plain' },
          container: { id: undefined },
        };
        mockClient.content.getContentById.mockResolvedValue(mockAttachment);

        const result = await confluenceUtil.downloadAttachment('att123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: Parent content ID not found in attachment metadata');
        expect(mockClient.contentAttachments.downloadAttachment).not.toHaveBeenCalled();
      });

      it('should return error on API failure', async () => {
        mockClient.content.getContentById.mockRejectedValue(new Error('Attachment not found'));

        const result = await confluenceUtil.downloadAttachment('att123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: Attachment not found');
      });

      it('should handle download failure', async () => {
        const mockAttachment = {
          id: 'att123',
          title: 'file.txt',
          metadata: { mediaType: 'text/plain' },
          container: { id: 'page456' },
        };
        mockClient.content.getContentById.mockResolvedValue(mockAttachment);
        mockClient.contentAttachments.downloadAttachment.mockRejectedValue(new Error('Download failed'));

        const result = await confluenceUtil.downloadAttachment('att123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR: Download failed');
      });
    });
  });
});
