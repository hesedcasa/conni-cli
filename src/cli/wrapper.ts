import readline from 'readline';

import { getCurrentVersion, printAvailableCommands, printCommandDetail } from '../commands/index.js';
import { COMMANDS } from '../config/index.js';
import {
  addComment,
  clearClients,
  createPage,
  deletePage,
  downloadAttachment,
  getPage,
  getSpace,
  getUser,
  listPages,
  listSpaces,
  loadConfig,
  testConnection,
  updatePage,
} from '../utils/index.js';
import type { Config } from '../utils/index.js';

/**
 * Main CLI class for Confluence interaction
 */
export class wrapper {
  private rl: readline.Interface;
  private config: Config | null = null;
  private currentFormat: 'json' | 'toon' = 'json';

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'conni> ',
    });
  }

  /**
   * Initialize the CLI and load configuration
   */
  async connect(): Promise<void> {
    try {
      this.config = loadConfig();
      this.currentFormat = this.config.defaultFormat;
      this.printHelp();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
      process.exit(1);
    }
  }

  /**
   * Handles user input commands
   * @param input - The raw user input string
   */
  private async handleCommand(input: string): Promise<void> {
    const trimmed = input.trim();

    if (!trimmed) {
      this.rl.prompt();
      return;
    }

    // Handle special commands
    if (trimmed === 'exit' || trimmed === 'quit' || trimmed === 'q') {
      await this.disconnect();
      return;
    }

    if (trimmed === 'help' || trimmed === '?') {
      this.printHelp();
      this.rl.prompt();
      return;
    }

    if (trimmed === 'commands') {
      printAvailableCommands();
      this.rl.prompt();
      return;
    }

    if (trimmed === 'clear') {
      console.clear();
      this.rl.prompt();
      return;
    }

    if (trimmed.startsWith('format ')) {
      const newFormat = trimmed.substring(7).trim() as 'json' | 'toon';
      if (['json', 'toon'].includes(newFormat)) {
        this.currentFormat = newFormat;
        console.log(`Output format set to: ${newFormat}`);
      } else {
        console.error('ERROR: Invalid format. Choose: json or toon');
      }
      this.rl.prompt();
      return;
    }

    // Parse command invocation: command [args...]
    const firstSpaceIndex = trimmed.indexOf(' ');
    const command = firstSpaceIndex === -1 ? trimmed : trimmed.substring(0, firstSpaceIndex);
    const arg = firstSpaceIndex === -1 ? '' : trimmed.substring(firstSpaceIndex + 1).trim();

    if (arg === '-h') {
      printCommandDetail(command);
      this.rl.prompt();
      return;
    }

    await this.runCommand(command, arg);
  }

  /**
   * Runs a Confluence command
   * @param command - The command name to execute
   * @param arg - JSON string or empty string for the command arguments
   */
  private async runCommand(command: string, arg: string): Promise<void> {
    if (!this.config) {
      console.log('Configuration not loaded!');
      this.rl.prompt();
      return;
    }

    try {
      // Parse arguments
      const args = arg && arg.trim() !== '' ? JSON.parse(arg) : {};
      const format = args.format || this.currentFormat;

      let result;

      switch (command) {
        case 'list-spaces':
          result = await listSpaces(format);
          break;

        case 'get-space':
          if (!args.spaceKey) {
            console.error('ERROR: "spaceKey" parameter is required');
            this.rl.prompt();
            return;
          }
          result = await getSpace(args.spaceKey, format);
          break;

        case 'list-pages':
          result = await listPages(args.spaceKey, args.title, args.limit, args.start, format);
          break;

        case 'get-page':
          if (!args.pageId) {
            console.error('ERROR: "pageId" parameter is required');
            this.rl.prompt();
            return;
          }
          result = await getPage(args.pageId, format);
          break;

        case 'create-page':
          if (!args.spaceKey || !args.title || !args.body) {
            console.error('ERROR: "spaceKey", "title", and "body" parameters are required');
            this.rl.prompt();
            return;
          }
          result = await createPage(args.spaceKey, args.title, args.body, args.parentId, format);
          break;

        case 'update-page':
          if (!args.pageId || !args.title || !args.body || args.version === undefined) {
            console.error('ERROR: "pageId", "title", "body", and "version" parameters are required');
            this.rl.prompt();
            return;
          }
          result = await updatePage(args.pageId, args.title, args.body, args.version);
          break;

        case 'add-comment':
          if (!args.pageId || !args.body) {
            console.error('ERROR: "pageId" and "body" parameters are required');
            this.rl.prompt();
            return;
          }
          result = await addComment(args.pageId, args.body, format);
          break;

        case 'delete-page':
          if (!args.pageId) {
            console.error('ERROR: "pageId" parameter is required');
            this.rl.prompt();
            return;
          }
          result = await deletePage(args.pageId);
          break;

        case 'download-attachment':
          if (!args.attachmentId) {
            console.error('ERROR: "attachmentId" parameter is required');
            this.rl.prompt();
            return;
          }
          result = await downloadAttachment(args.attachmentId, args.outputPath);
          break;

        case 'get-user':
          result = await getUser(args.accountId, args.username, format);
          break;

        case 'test-connection':
          result = await testConnection();
          break;

        default:
          console.error(`Unknown command: ${command}. Type "commands" to see available commands.`);
          this.rl.prompt();
          return;
      }

      // Display result
      if (result.success) {
        console.log('\n' + result.result);
      } else {
        console.error('\n' + result.error);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error running command:', errorMessage);
    }

    this.rl.prompt();
  }

  /**
   * Prints help message
   */
  private printHelp(): void {
    const version = getCurrentVersion();
    const currentFormat = this.currentFormat;
    const commandList = COMMANDS.join(', ');

    console.log(`
Confluence CLI v${version}

Current Settings:
  Format:  ${currentFormat}

Usage:

commands              list all available Confluence commands
<command> -h          quick help on <command>
<command> <arg>       run <command> with JSON argument
format <type>         set output format (json, toon)
clear                 clear the screen
exit, quit, q         exit the CLI

All commands:

${commandList}

Examples:
  list-spaces
  get-space {"spaceKey":"DOCS"}
  list-pages {"spaceKey":"DOCS","title":"Getting Started","limit":10}
  get-page {"pageId":"123456"}
  create-page {"spaceKey":"DOCS","title":"New Page","body":"<p>Hello World</p>"}
  test-connection

`);
  }

  /**
   * Starts the interactive REPL loop
   */
  async start(): Promise<void> {
    this.rl.prompt();

    this.rl.on('line', async line => {
      await this.handleCommand(line);
    });

    this.rl.on('close', async () => {
      clearClients();
      process.exit(0);
    });

    const gracefulShutdown = async () => {
      try {
        await this.disconnect();
      } catch (error) {
        console.error('Error during shutdown:', error);
      } finally {
        process.exit(0);
      }
    };

    ['SIGINT', 'SIGTERM'].forEach(sig => {
      process.on(sig, () => {
        gracefulShutdown();
      });
    });
  }

  /**
   * Disconnects from Confluence and closes the CLI
   */
  private async disconnect(): Promise<void> {
    console.log('\nClosing Confluence connections...');
    clearClients();
    this.rl.close();
  }
}
