import { getCurrentVersion, printAvailableCommands, printCommandDetail, runCommand } from '../commands/index.js';
import { COMMANDS } from '../config/index.js';
import { setupConfig } from './config-loader.js';

/**
 * Parses and handles command line arguments
 * @param args - Command line arguments (process.argv.slice(2))
 * @returns true if arguments were handled and should exit, false to continue to interactive mode
 */
export const parseArguments = async (args: string[]): Promise<boolean> => {
  for (let i = 0; i < args.length; i++) {
    // Config setup/update command
    if (args[i] === 'config') {
      try {
        await setupConfig();
        process.exit(0);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Configuration setup failed: ${errorMessage}`);
        process.exit(1);
      }
    }

    // Version flag
    if (args[i] === '--version' || args[i] === '-v') {
      console.log(getCurrentVersion());
      process.exit(0);
    }

    // List commands flag
    if (args[i] === '--commands') {
      printAvailableCommands();
      process.exit(0);
    }

    // Command-specific help
    if (i === 0 && args.length >= 2 && args[1] === '-h') {
      printCommandDetail(args[0]);
      process.exit(0);
    }

    // General help flag
    if (args[i] === '--help' || args[i] === '-h') {
      printGeneralHelp();
      process.exit(0);
    }

    // Execute command in headless mode
    if (i === 0 && args.length >= 1 && args[1] !== '-h' && COMMANDS.includes(args[0])) {
      const rest = args.slice(1);
      const params = (rest.find(a => !a.startsWith('-')) ?? null) as string | null;
      const flag = (rest.find(a => a.startsWith('-')) ?? null) as string | null;

      await runCommand(args[0], params, flag);
      process.exit(0);
    }
  }

  return false;
};

/**
 * Prints general help message for the CLI
 */
const printGeneralHelp = (): void => {
  console.log(`
Confluence CLI

Usage:

conni-cli                             start interactive CLI
conni-cli config                      setup or update configuration
conni-cli --commands                  list all available commands
conni-cli <command> -h                quick help on <command>
conni-cli <command> <arg>             run command in headless mode

All commands:

${COMMANDS.join(', ')}

Examples:
  conni-cli config
  conni-cli list-spaces
  conni-cli get-page '{"pageId":"123456"}'
  conni-cli list-pages '{"spaceKey":"DOCS","limit":10}'
  conni-cli test-connection

`);
};
