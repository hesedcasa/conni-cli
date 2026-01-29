/**
 * Confluence API client wrapper functions
 */
import { loadConfig } from './config-loader.js';
import type { ApiResult } from './confluence-utils.js';
import { ConfluenceUtil } from './confluence-utils.js';

let confluenceUtil: ConfluenceUtil | null = null;

/**
 * Initialize Confluence utility
 */
async function initConfluence(): Promise<ConfluenceUtil> {
  if (confluenceUtil) return confluenceUtil;

  try {
    const config = loadConfig();
    confluenceUtil = new ConfluenceUtil(config);
    return confluenceUtil;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize Confluence client: ${errorMessage}`);
  }
}

/**
 * List all spaces
 * @param format - Output format (json, toon)
 */
export async function listSpaces(format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.listSpaces(format);
}

/**
 * Get space details
 * @param spaceKey - Space key
 * @param format - Output format (json, toon)
 */
export async function getSpace(spaceKey: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.getSpace(spaceKey, format);
}

/**
 * List pages in a space or by search criteria
 * @param spaceKey - Space key (optional)
 * @param title - Title search string (optional)
 * @param limit - Maximum number of results
 * @param start - Starting index for pagination
 * @param format - Output format (json, toon)
 */
export async function listPages(
  spaceKey?: string,
  title?: string,
  limit = 25,
  start = 0,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.listPages(spaceKey, title, limit, start, format);
}

/**
 * Get page details
 * @param pageId - Page ID
 * @param format - Output format (json, toon)
 */
export async function getPage(pageId: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.getPage(pageId, format);
}

/**
 * Create a new page
 * @param spaceKey - Space key where the page will be created
 * @param title - Page title
 * @param body - Page body content (storage format)
 * @param parentId - Parent page ID (optional)
 * @param format - Output format (json, toon)
 */
export async function createPage(
  spaceKey: string,
  title: string,
  body: string,
  parentId?: string,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.createPage(spaceKey, title, body, parentId, format);
}

/**
 * Update an existing page
 * @param pageId - Page ID to update
 * @param title - New page title
 * @param body - New page body content (storage format)
 * @param version - Current page version number
 */
export async function updatePage(pageId: string, title: string, body: string, version: number): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.updatePage(pageId, title, body, version);
}

/**
 * Add a comment to a page
 * @param pageId - Page ID to add comment to
 * @param body - Comment body content (storage format)
 * @param format - Output format (json, toon)
 */
export async function addComment(pageId: string, body: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.addComment(pageId, body, format);
}

/**
 * Delete a page
 * @param pageId - Page ID to delete
 */
export async function deletePage(pageId: string): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.deletePage(pageId);
}

/**
 * Download an attachment from a page
 * @param attachmentId - Attachment ID to download
 * @param outputPath - Path to save the file (optional)
 */
export async function downloadAttachment(attachmentId: string, outputPath?: string): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.downloadAttachment(attachmentId, outputPath);
}

/**
 * Get user information
 * @param accountId - User account ID
 * @param username - Username
 * @param format - Output format (json, toon)
 */
export async function getUser(
  accountId?: string,
  username?: string,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.getUser(accountId, username, format);
}

/**
 * Test Confluence API connection
 */
export async function testConnection(): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.testConnection();
}

/**
 * Clear Confluence client pool (for cleanup)
 */
export function clearClients(): void {
  if (confluenceUtil) {
    confluenceUtil.clearClients();
    confluenceUtil = null;
  }
}
