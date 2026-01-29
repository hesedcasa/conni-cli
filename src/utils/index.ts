export { parseArguments } from './arg-parser.js';
export { loadConfig, setupConfig } from './config-loader.js';
export type { Config } from './config-loader.js';
export {
  listSpaces,
  getSpace,
  listPages,
  getPage,
  createPage,
  updatePage,
  addComment,
  deletePage,
  downloadAttachment,
  getUser,
  testConnection,
  clearClients,
} from './confluence-client.js';
