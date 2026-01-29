# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
# Install dependencies
npm install

# Build the TypeScript source
npm run build

# Run the CLI (development mode with tsx)
npm start

# Run in development (same as start)
npm run dev

# Run tests
npm test                    # Run all tests once
npm run test:watch          # Run tests in watch mode
npm run test:ui             # Run tests with UI
npm run test:coverage       # Run tests with coverage report

# Run a single test file
npm test -- <test-file>     # e.g., npm test -- config-loader.test.ts

# Code quality
npm run format              # Format code with ESLint and Prettier
npm run find-deadcode       # Find unused exports with ts-prune
npm run pre-commit          # Run format + find-deadcode
```

## Project Architecture

This is a **Confluence CLI tool** that provides both interactive REPL and headless modes for Confluence operations.

### Project Structure

```
src/
├── index.ts                               # Main entry point
├── cli/
│   ├── index.ts                           # Barrel export
│   └── wrapper.ts                         # CLI class with REPL logic
├── commands/
│   ├── index.ts                           # Barrel export
│   ├── helpers.ts                         # Command info helpers
│   └── runner.ts                          # Headless command execution
├── config/
│   ├── index.ts                           # Barrel export
│   └── constants.ts                       # Command definitions
└── utils/
    ├── index.ts                           # Barrel export
    ├── arg-parser.ts                      # Command-line argument parser
    ├── config-loader.ts                   # INI config file loader & setup
    ├── confluence-client.ts               # Confluence API wrapper functions
    └── confluence-utils.ts                # Core Confluence utility class

tests/
├── unit/
│   ├── cli/
│   │   └── wrapper.test.ts                # CLI class tests
│   ├── commands/
│   │   ├── helpers.test.ts                # Command helper tests
│   │   └── runner.test.ts                 # Command runner tests
│   └── utils/
│       ├── arg-parser.test.ts             # Argument parser tests
│       ├── config-loader.test.ts          # Config loading tests
│       ├── confluence-client.test.ts      # Confluence client wrapper tests
│       └── confluence-utils.test.ts       # Core utility tests
└── integration/
    └── cli-integration.test.ts            # End-to-end CLI tests
```

### Core Components

#### Entry Point (`src/index.ts`)

- Minimal bootstrapper that routes to interactive REPL or headless mode
- Delegates argument parsing to `parseArguments()` from `utils/arg-parser.ts`
- Handles top-level error catching

#### CLI Module (`src/cli/wrapper.ts`)

- **wrapper class**: Main orchestrator managing:
  - `connect()` - Loads configuration from `~/.connicli`
  - `start()` - Initiates interactive REPL with readline interface
  - `handleCommand()` - Parses and processes user commands
  - `runCommand()` - Executes Confluence commands with result formatting
  - `disconnect()` - Graceful cleanup on exit signals (SIGINT/SIGTERM)

**Special REPL commands**: `help`, `commands`, `format <type>`, `clear`, `exit/quit/q`

#### Commands Module (`src/commands/`)

- `helpers.ts` - Display command information and help
  - `printAvailableCommands()` - Lists all 11 available commands
  - `printCommandDetail(command)` - Shows detailed help for specific command
  - `getCurrentVersion()` - Reads version from package.json
- `runner.ts` - Execute commands in headless mode
  - `runCommand(command, arg, flag)` - Non-interactive command execution

#### Config Module (`src/config/constants.ts`)

- `COMMANDS[]` - Array of 11 available Confluence command names
- `COMMANDS_INFO[]` - Brief descriptions for each command
- `COMMANDS_DETAIL[]` - Detailed parameter documentation

#### Utils Module (`src/utils/`)

- `arg-parser.ts` - Command-line argument handling
  - `parseArguments(args)` - Parses CLI flags, config setup, and routes execution
  - Handles `conni-cli config` command for interactive setup
- `config-loader.ts` - Configuration file management
  - `loadConfig()` - Loads INI config from `~/.connicli`
  - `setupConfig()` - Interactive config setup with readline prompts
  - `parseIniConfig(content)` - INI parser with validation
  - Security: Atomic write with `0o600` permissions
  - TypeScript interfaces: `Config`, `ConfluenceClientOptions`
- `confluence-client.ts` - Confluence API wrapper functions
  - Exports: `listSpaces()`, `getSpace()`, `listPages()`, `getPage()`, `createPage()`, `updatePage()`, `addComment()`, `deletePage()`, `downloadAttachment()`, `getUser()`, `testConnection()`, `clearClients()`
  - Manages singleton `ConfluenceUtil` instance
- `confluence-utils.ts` - Core Confluence utility class
  - `ConfluenceUtil` class - Client pooling and API calls
  - Implements all 11 Confluence commands
  - Formats results as JSON or TOON

### Configuration System

Configuration is stored in `~/.connicli` using INI format:

```ini
[auth]
host=https://your-domain.atlassian.net/wiki
email=your-email@example.com
api_token=YOUR_API_TOKEN_HERE

[defaults]
format=json
```

**Key behaviors:**

- Configuration is validated on load with clear error messages
- API tokens are used for authentication (basic auth)
- File permissions: `0o600` (owner read/write only) for security
- Interactive setup via `conni-cli config` command
- Existing values pre-populated during reconfiguration

**Setup workflow:**

1. User runs `conni-cli config`
2. Prompts for: host (URL validation), email (email validation), api_token (hidden input), format (json/toon)
3. Validates all inputs before writing
4. Atomic write with secure permissions

### REPL Interface

- Custom prompt: `conni>`
- **Special commands**: `help`, `commands`, `format <type>`, `clear`, `exit/quit/q`
- **Confluence commands**: 11 commands accepting JSON arguments
  1. `list-spaces` - List all accessible spaces
  2. `get-space` - Get details of a specific space
  3. `list-pages` - List pages in a space or by search criteria
  4. `get-page` - Get details of a specific page
  5. `create-page` - Create a new page
  6. `update-page` - Update an existing page
  7. `add-comment` - Add a comment to a page
  8. `delete-page` - Delete a page
  9. `download-attachment` - Download an attachment from a page
  10. `get-user` - Get user information
  11. `test-connection` - Test Confluence API connection

### TypeScript Configuration

- **Target**: ES2022 modules (package.json `"type": "module"`)
- **Output**: Compiles to `dist/` directory with modular structure
- **Declarations**: Generates `.d.ts` files for all modules
- **Source Maps**: Enabled for debugging

## Available Commands

The CLI provides **11 Confluence commands**:

1. **list-spaces** - List all accessible spaces
2. **get-space** - Get details of a specific space
3. **list-pages** - List pages in a space or by search criteria
4. **get-page** - Get details of a specific page
5. **create-page** - Create a new page
6. **update-page** - Update an existing page
7. **add-comment** - Add a comment to a page
8. **delete-page** - Delete a page
9. **download-attachment** - Download an attachment from a page
10. **get-user** - Get user information
11. **test-connection** - Test Confluence API connection

### Command Examples

```bash
# Setup configuration (interactive)
conni-cli config

# Start the CLI in interactive mode
npm start

# Inside the REPL:
conni> commands                          # List all 11 commands
conni> help                              # Show help
conni> format json                       # Change output format
conni> list-spaces
conni> get-space '{"spaceKey":"DOCS"}'
conni> list-pages '{"spaceKey":"DOCS","title":"Getting Started","limit":10}'
conni> get-page '{"pageId":"123456"}'
conni> create-page '{"spaceKey":"DOCS","title":"New Page","body":"<p>Hello World</p>"}'
conni> add-comment '{"pageId":"123456","body":"<p>Great article!</p>"}'
conni> download-attachment '{"attachmentId":"att12345","outputPath":"./document.pdf"}'
conni> exit                              # Exit

# Headless mode (one-off commands):
conni-cli test-connection
conni-cli list-spaces
conni-cli get-page '{"pageId":"123456","format":"json"}'
conni-cli --commands        # List all commands
conni-cli list-pages -h     # Command-specific help
conni-cli --help            # General help
conni-cli --version         # Show version
```

## Code Structure & Module Responsibilities

### Entry Point (`index.ts`)

- Minimal bootstrapper
- Imports and coordinates other modules
- Handles top-level error catching

### CLI Class (`cli/wrapper.ts`)

- Interactive REPL management
- Configuration loading
- User command processing
- Confluence command execution with result formatting
- Graceful shutdown handling

### Command Helpers (`commands/helpers.ts`)

- Pure functions for displaying command information
- No external dependencies except config
- Easy to test

### Command Runner (`commands/runner.ts`)

- Headless/non-interactive execution
- Single command → result → exit pattern
- Independent configuration loading per execution

### Constants (`config/constants.ts`)

- Single source of truth for all command definitions
- Command names, descriptions, and parameter documentation
- No logic, just data

### Config Loader (`utils/config-loader.ts`)

- Reads and parses `~/.connicli` INI file
- Interactive setup with validation
- Validates required fields (host, email, api_token)
- Provides default values for settings (format defaults to json)
- Builds confluence.js client options
- Security: Atomic write with `0o600` permissions

### Confluence Client (`utils/confluence-client.ts`)

- Wrapper functions for all Confluence operations
- Manages singleton ConfluenceUtil instance
- Exports clean async functions for each command

### Confluence Utils (`utils/confluence-utils.ts`)

- Core Confluence interaction logic
- Client pooling per configuration
- API call execution
- Result formatting (JSON, TOON)
- All 11 command implementations

### Argument Parser (`utils/arg-parser.ts`)

- CLI flag parsing (--help, --version, --commands, etc.)
- Handles `conni-cli config` command
- Routing logic for different execution modes
- Command detection and validation

### Key Implementation Details

- **Barrel Exports**: Each module directory has `index.ts` exporting public APIs
- **ES Modules**: All imports use `.js` extensions (TypeScript requirement)
- **Argument Parsing**: Supports JSON arguments for command parameters
- **Client Pooling**: Reuses Confluence client for efficiency
- **Signal Handling**: Graceful shutdown on Ctrl+C (SIGINT) and SIGTERM
- **Error Handling**: Try-catch blocks with user-friendly error messages
- **Configuration**: INI format in `~/.connicli` with `0o600` permissions

## Dependencies

**Runtime**:

- `confluence.js@^2.1.0` - Confluence API client for Node.js
- `@toon-format/toon@^2.0.0` - TOON format encoder

**Development**:

- `typescript@^5.0.0` - TypeScript compiler
- `tsx@^4.0.0` - TypeScript execution runtime
- `vitest@^4.0.9` - Test framework
- `eslint@^9.39.1` - Linting
- `prettier@3.8.0` - Code formatting
- `ts-prune@^0.10.3` - Find unused exports

## Testing

This project uses **Vitest** for testing with the following configuration:

- **Test Framework**: Vitest with globals enabled
- **Test Files**: `tests/**/*.test.ts`
- **Coverage**: V8 coverage provider with text, JSON, and HTML reports
- **Coverage Exclusions**: Barrel exports (`**/index.ts`), test files, config files, and dist

### Running Tests

```bash
# Run all tests once
npm test

# Watch mode for development
npm run test:watch

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run a single test file
npm test -- <test-file>
```

## Important Notes

1. **Configuration Required**: CLI requires `~/.connicli` with valid Confluence credentials (run `conni-cli config`)
2. **ES2022 Modules**: Project uses `"type": "module"` - no CommonJS
3. **API Authentication**: Uses Confluence API tokens with basic authentication
5. **Flexible Output**: JSON or TOON formats for different use cases
6. **Client Pooling**: Reuses Confluence client for better performance
7. **Storage Format**: Page content uses Confluence storage format (XHTML-based)
8. **Security**: Config file written with `0o600` permissions (owner read/write only)

## Commit Message Convention

**Always use Conventional Commits format** for all commit messages and PR titles:

- `feat:` - New features or capabilities
- `fix:` - Bug fixes
- `docs:` - Documentation changes only
- `refactor:` - Code refactoring without changing functionality
- `test:` - Adding or modifying tests
- `chore:` - Maintenance tasks, dependency updates, build configuration

**Examples:**

```
feat: add list-spaces command for Confluence spaces
fix: handle connection timeout errors gracefully
docs: update configuration examples in README
refactor: extract API formatting into separate module
test: add integration tests for Confluence operations
chore: update confluence.js to latest version
```

When creating pull requests, the PR title must follow this format.
