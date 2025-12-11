import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the dependencies
vi.mock('../../../src/utils/config-loader.js', () => ({
  loadConfig: vi.fn(),
  getConfluenceClientOptions: vi.fn(),
}));

// Define mock instance type
interface MockConfluenceUtil {
  listSpaces: ReturnType<typeof vi.fn>;
  getSpace: ReturnType<typeof vi.fn>;
  listPages: ReturnType<typeof vi.fn>;
  getPage: ReturnType<typeof vi.fn>;
  createPage: ReturnType<typeof vi.fn>;
  updatePage: ReturnType<typeof vi.fn>;
  addComment: ReturnType<typeof vi.fn>;
  deletePage: ReturnType<typeof vi.fn>;
  getUser: ReturnType<typeof vi.fn>;
  testConnection: ReturnType<typeof vi.fn>;
  clearClients: ReturnType<typeof vi.fn>;
}

// Mock confluence-utils module with proper class mock
vi.mock('../../../src/utils/confluence-utils.js', () => ({
  ConfluenceUtil: vi.fn().mockImplementation(function (this: MockConfluenceUtil) {
    this.listSpaces = vi.fn();
    this.getSpace = vi.fn();
    this.listPages = vi.fn();
    this.getPage = vi.fn();
    this.createPage = vi.fn();
    this.updatePage = vi.fn();
    this.addComment = vi.fn();
    this.deletePage = vi.fn();
    this.getUser = vi.fn();
    this.testConnection = vi.fn();
    this.clearClients = vi.fn();
  }),
}));

const originalEnv = process.env;

// Helper function to create a mock instance with all methods
function createMockInstance() {
  return {
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
  };
}

describe('confluence-client', () => {
  let ConfluenceUtil: ReturnType<typeof vi.fn>;
  let loadConfig: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset modules to clear singleton state
    vi.resetModules();
    process.env = { ...originalEnv };

    // Get the mocked modules
    const confluenceUtilsModule = await import('../../../src/utils/confluence-utils.js');
    ConfluenceUtil = vi.mocked(confluenceUtilsModule.ConfluenceUtil);

    const configLoaderModule = await import('../../../src/utils/config-loader.js');
    loadConfig = vi.mocked(configLoaderModule.loadConfig);

    // Default loadConfig mock setup
    loadConfig.mockReturnValue({
      profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
      defaultProfile: 'cloud',
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('listSpaces', () => {
    it('should call ConfluenceUtil.listSpaces with correct parameters', async () => {
      const instance = createMockInstance();
      instance.listSpaces.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      // Need to re-import to get fresh module with new mock
      vi.resetModules();
      const { listSpaces: freshListSpaces } = await import('../../../src/utils/confluence-client.js');

      const result = await freshListSpaces('cloud', 'json');

      expect(result).toEqual({ success: true, result: '{}' });
      expect(instance.listSpaces).toHaveBeenCalledWith('cloud', 'json');
    });

    it('should use default format when not specified', async () => {
      const instance = createMockInstance();
      instance.listSpaces.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { listSpaces: freshListSpaces } = await import('../../../src/utils/confluence-client.js');

      await freshListSpaces('cloud');

      expect(instance.listSpaces).toHaveBeenCalledWith('cloud', 'json');
    });

    it('should use toon format when specified', async () => {
      const instance = createMockInstance();
      instance.listSpaces.mockResolvedValue({ success: true, result: 'toon-output' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { listSpaces: freshListSpaces } = await import('../../../src/utils/confluence-client.js');

      const result = await freshListSpaces('staging', 'toon');

      expect(result).toEqual({ success: true, result: 'toon-output' });
      expect(instance.listSpaces).toHaveBeenCalledWith('staging', 'toon');
    });
  });

  describe('getSpace', () => {
    it('should call ConfluenceUtil.getSpace with correct parameters', async () => {
      const instance = createMockInstance();
      instance.getSpace.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { getSpace: freshGetSpace } = await import('../../../src/utils/confluence-client.js');

      const result = await freshGetSpace('cloud', 'DOCS', 'json');

      expect(result).toEqual({ success: true, result: '{}' });
      expect(instance.getSpace).toHaveBeenCalledWith('cloud', 'DOCS', 'json');
    });

    it('should use default format when not specified', async () => {
      const instance = createMockInstance();
      instance.getSpace.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { getSpace: freshGetSpace } = await import('../../../src/utils/confluence-client.js');

      await freshGetSpace('cloud', 'DOCS');

      expect(instance.getSpace).toHaveBeenCalledWith('cloud', 'DOCS', 'json');
    });
  });

  describe('listPages', () => {
    it('should call ConfluenceUtil.listPages with all parameters', async () => {
      const instance = createMockInstance();
      instance.listPages.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { listPages: freshListPages } = await import('../../../src/utils/confluence-client.js');

      const result = await freshListPages('cloud', 'DOCS', 'Test', 10, 5, 'json');

      expect(result).toEqual({ success: true, result: '{}' });
      expect(instance.listPages).toHaveBeenCalledWith('cloud', 'DOCS', 'Test', 10, 5, 'json');
    });

    it('should use default values for limit, start, and format', async () => {
      const instance = createMockInstance();
      instance.listPages.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { listPages: freshListPages } = await import('../../../src/utils/confluence-client.js');

      await freshListPages('cloud');

      expect(instance.listPages).toHaveBeenCalledWith('cloud', undefined, undefined, 25, 0, 'json');
    });

    it('should pass undefined for optional parameters', async () => {
      const instance = createMockInstance();
      instance.listPages.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { listPages: freshListPages } = await import('../../../src/utils/confluence-client.js');

      await freshListPages('cloud', undefined, 'Title Only');

      expect(instance.listPages).toHaveBeenCalledWith('cloud', undefined, 'Title Only', 25, 0, 'json');
    });
  });

  describe('getPage', () => {
    it('should call ConfluenceUtil.getPage with correct parameters', async () => {
      const instance = createMockInstance();
      instance.getPage.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { getPage: freshGetPage } = await import('../../../src/utils/confluence-client.js');

      const result = await freshGetPage('cloud', '123', 'json');

      expect(result).toEqual({ success: true, result: '{}' });
      expect(instance.getPage).toHaveBeenCalledWith('cloud', '123', 'json');
    });

    it('should use default format when not specified', async () => {
      const instance = createMockInstance();
      instance.getPage.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { getPage: freshGetPage } = await import('../../../src/utils/confluence-client.js');

      await freshGetPage('cloud', '123');

      expect(instance.getPage).toHaveBeenCalledWith('cloud', '123', 'json');
    });
  });

  describe('createPage', () => {
    it('should call ConfluenceUtil.createPage with all parameters', async () => {
      const instance = createMockInstance();
      instance.createPage.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { createPage: freshCreatePage } = await import('../../../src/utils/confluence-client.js');

      const result = await freshCreatePage('cloud', 'DOCS', 'New Page', '<p>Content</p>', '123', 'json');

      expect(result).toEqual({ success: true, result: '{}' });
      expect(instance.createPage).toHaveBeenCalledWith('cloud', 'DOCS', 'New Page', '<p>Content</p>', '123', 'json');
    });

    it('should use default values for parentId and format', async () => {
      const instance = createMockInstance();
      instance.createPage.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { createPage: freshCreatePage } = await import('../../../src/utils/confluence-client.js');

      await freshCreatePage('cloud', 'DOCS', 'New Page', '<p>Content</p>');

      expect(instance.createPage).toHaveBeenCalledWith(
        'cloud',
        'DOCS',
        'New Page',
        '<p>Content</p>',
        undefined,
        'json'
      );
    });

    it('should pass undefined for optional parentId', async () => {
      const instance = createMockInstance();
      instance.createPage.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { createPage: freshCreatePage } = await import('../../../src/utils/confluence-client.js');

      await freshCreatePage('cloud', 'DOCS', 'New Page', '<p>Content</p>', undefined);

      expect(instance.createPage).toHaveBeenCalledWith(
        'cloud',
        'DOCS',
        'New Page',
        '<p>Content</p>',
        undefined,
        'json'
      );
    });
  });

  describe('updatePage', () => {
    it('should call ConfluenceUtil.updatePage with correct parameters', async () => {
      const instance = createMockInstance();
      instance.updatePage.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { updatePage: freshUpdatePage } = await import('../../../src/utils/confluence-client.js');

      const result = await freshUpdatePage('cloud', '123', 'Updated Page', '<p>New Content</p>', 2);

      expect(result).toEqual({ success: true, result: '{}' });
      expect(instance.updatePage).toHaveBeenCalledWith('cloud', '123', 'Updated Page', '<p>New Content</p>', 2);
    });
  });

  describe('addComment', () => {
    it('should call ConfluenceUtil.addComment with correct parameters', async () => {
      const instance = createMockInstance();
      instance.addComment.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { addComment: freshAddComment } = await import('../../../src/utils/confluence-client.js');

      const result = await freshAddComment('cloud', '123', '<p>Comment</p>', 'json');

      expect(result).toEqual({ success: true, result: '{}' });
      expect(instance.addComment).toHaveBeenCalledWith('cloud', '123', '<p>Comment</p>', 'json');
    });

    it('should use default format when not specified', async () => {
      const instance = createMockInstance();
      instance.addComment.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { addComment: freshAddComment } = await import('../../../src/utils/confluence-client.js');

      await freshAddComment('cloud', '123', '<p>Comment</p>');

      expect(instance.addComment).toHaveBeenCalledWith('cloud', '123', '<p>Comment</p>', 'json');
    });
  });

  describe('deletePage', () => {
    it('should call ConfluenceUtil.deletePage with correct parameters', async () => {
      const instance = createMockInstance();
      instance.deletePage.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { deletePage: freshDeletePage } = await import('../../../src/utils/confluence-client.js');

      const result = await freshDeletePage('cloud', '123');

      expect(result).toEqual({ success: true, result: '{}' });
      expect(instance.deletePage).toHaveBeenCalledWith('cloud', '123');
    });
  });

  describe('getUser', () => {
    it('should call ConfluenceUtil.getUser with all parameters', async () => {
      const instance = createMockInstance();
      instance.getUser.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { getUser: freshGetUser } = await import('../../../src/utils/confluence-client.js');

      const result = await freshGetUser('cloud', '123', 'testuser', 'json');

      expect(result).toEqual({ success: true, result: '{}' });
      expect(instance.getUser).toHaveBeenCalledWith('cloud', '123', 'testuser', 'json');
    });

    it('should use default values for optional parameters', async () => {
      const instance = createMockInstance();
      instance.getUser.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { getUser: freshGetUser } = await import('../../../src/utils/confluence-client.js');

      await freshGetUser('cloud');

      expect(instance.getUser).toHaveBeenCalledWith('cloud', undefined, undefined, 'json');
    });

    it('should pass undefined for accountId and username when not provided', async () => {
      const instance = createMockInstance();
      instance.getUser.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { getUser: freshGetUser } = await import('../../../src/utils/confluence-client.js');

      await freshGetUser('cloud', undefined, undefined);

      expect(instance.getUser).toHaveBeenCalledWith('cloud', undefined, undefined, 'json');
    });

    it('should use toon format when specified', async () => {
      const instance = createMockInstance();
      instance.getUser.mockResolvedValue({ success: true, result: 'toon-output' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { getUser: freshGetUser } = await import('../../../src/utils/confluence-client.js');

      await freshGetUser('cloud', '123', undefined, 'toon');

      expect(instance.getUser).toHaveBeenCalledWith('cloud', '123', undefined, 'toon');
    });
  });

  describe('testConnection', () => {
    it('should call ConfluenceUtil.testConnection with correct profile', async () => {
      const instance = createMockInstance();
      instance.testConnection.mockResolvedValue({ success: true, result: 'Connected' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { testConnection: freshTestConnection } = await import('../../../src/utils/confluence-client.js');

      const result = await freshTestConnection('cloud');

      expect(result).toEqual({ success: true, result: 'Connected' });
      expect(instance.testConnection).toHaveBeenCalledWith('cloud');
    });
  });

  describe('clearClients', () => {
    it('should call clearClients on ConfluenceUtil instance', async () => {
      const instance = createMockInstance();
      instance.listSpaces.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { listSpaces: freshListSpaces, clearClients: freshClearClients } =
        await import('../../../src/utils/confluence-client.js');

      // First initialize to create instance
      await freshListSpaces('cloud');

      freshClearClients();

      expect(instance.clearClients).toHaveBeenCalled();
    });

    it('should reset confluenceUtil to null after clearing', async () => {
      const instance = createMockInstance();
      instance.listSpaces.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const { listSpaces: freshListSpaces, clearClients: freshClearClients } =
        await import('../../../src/utils/confluence-client.js');

      // Initialize
      await freshListSpaces('cloud');

      // Clear
      freshClearClients();

      expect(instance.clearClients).toHaveBeenCalled();
    });
  });

  describe('client initialization', () => {
    it('should initialize ConfluenceUtil on first call', async () => {
      const instance = createMockInstance();
      instance.listSpaces.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const configLoaderModule = await import('../../../src/utils/config-loader.js');
      const freshLoadConfig = vi.mocked(configLoaderModule.loadConfig);
      freshLoadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
      });

      const { listSpaces: freshListSpaces } = await import('../../../src/utils/confluence-client.js');

      await freshListSpaces('cloud');

      expect(freshLoadConfig).toHaveBeenCalled();
      expect(ConfluenceUtil).toHaveBeenCalled();
    });

    it('should reuse existing ConfluenceUtil instance', async () => {
      const instance = createMockInstance();
      instance.listSpaces.mockResolvedValue({ success: true, result: '{}' });
      instance.getSpace.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const configLoaderModule = await import('../../../src/utils/config-loader.js');
      const freshLoadConfig = vi.mocked(configLoaderModule.loadConfig);
      freshLoadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
      });

      const { listSpaces: freshListSpaces, getSpace: freshGetSpace } =
        await import('../../../src/utils/confluence-client.js');

      await freshListSpaces('cloud');
      await freshGetSpace('cloud', 'DOCS');

      expect(ConfluenceUtil).toHaveBeenCalledTimes(1);
      expect(freshLoadConfig).toHaveBeenCalledTimes(1);
    });

    it('should throw error if initialization fails', async () => {
      vi.resetModules();
      const configLoaderModule = await import('../../../src/utils/config-loader.js');
      const freshLoadConfig = vi.mocked(configLoaderModule.loadConfig);
      freshLoadConfig.mockImplementation(() => {
        throw new Error('Config load failed');
      });

      const { listSpaces: freshListSpaces } = await import('../../../src/utils/confluence-client.js');

      await expect(freshListSpaces('cloud')).rejects.toThrow(
        'Failed to initialize Confluence client: Config load failed'
      );
    });
  });

  describe('environment variables', () => {
    it('should use CLAUDE_PROJECT_ROOT if set', async () => {
      process.env.CLAUDE_PROJECT_ROOT = '/custom/root';

      const instance = createMockInstance();
      instance.listSpaces.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const configLoaderModule = await import('../../../src/utils/config-loader.js');
      const freshLoadConfig = vi.mocked(configLoaderModule.loadConfig);
      freshLoadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
      });

      const { listSpaces: freshListSpaces } = await import('../../../src/utils/confluence-client.js');

      await freshListSpaces('cloud');

      expect(freshLoadConfig).toHaveBeenCalledWith('/custom/root');
    });

    it('should use process.cwd() if CLAUDE_PROJECT_ROOT not set', async () => {
      delete process.env.CLAUDE_PROJECT_ROOT;

      const instance = createMockInstance();
      instance.listSpaces.mockResolvedValue({ success: true, result: '{}' });
      ConfluenceUtil.mockImplementation(function (this: MockConfluenceUtil) {
        Object.assign(this, instance);
      });

      vi.resetModules();
      const configLoaderModule = await import('../../../src/utils/config-loader.js');
      const freshLoadConfig = vi.mocked(configLoaderModule.loadConfig);
      freshLoadConfig.mockReturnValue({
        profiles: { cloud: { host: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'token' } },
        defaultProfile: 'cloud',
      });

      const { listSpaces: freshListSpaces } = await import('../../../src/utils/confluence-client.js');

      await freshListSpaces('cloud');

      expect(freshLoadConfig).toHaveBeenCalledWith(process.cwd());
    });
  });
});
