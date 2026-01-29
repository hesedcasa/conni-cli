# Confluence CLI

[![npm conni-cli package](https://img.shields.io/npm/v/conni-cli.svg)](https://npmjs.org/package/conni-cli)

A powerful command-line interface for Confluence interaction with support for pages, spaces, comments, and multiple output formats.

## Features

- 💻 **Interactive REPL** for Confluence exploration and management
- 🚀 **Headless mode** for one-off command execution and automation
- 📊 **Multiple output formats**: JSON or TOON
- 📄 **Page management**: create, read, update, delete pages
- 💬 **Comment support**: add comments to pages with markdown support
- 📁 **Space operations**: list and view space details
- 📎 **Attachment downloads**: download files from Confluence pages
- 🔍 **Search support**: find pages by title, space, or content
- 👤 **User management**: retrieve user information
- ✅ **Connection testing** for quick diagnostics

## Requirements

- [Node.js](https://nodejs.org/) v22.0 or newer
- [npm](https://www.npmjs.com/)
- Confluence Cloud account with API access

## Installation

```bash
npm install -g conni-cli
```

## Configuration

### Interactive Setup

The easiest way to configure the CLI is using the interactive setup command:

```bash
conni-cli config
```

This will prompt you for:

1. **Host URL** - Your Confluence instance URL (e.g., `https://your-domain.atlassian.net/wiki`)
2. **Email** - Your Atlassian account email
3. **API Token** - Your Confluence API token (input is hidden)
4. **Output Format** - Default format for results (json or toon)

### Manual Configuration

Configuration is stored in `~/.connicli` using INI format:

```ini
[auth]
host=https://your-domain.atlassian.net/wiki
email=your-email@example.com
api_token=YOUR_API_TOKEN_HERE

[defaults]
format=json
```

### Creating an API Token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "Confluence CLI")
4. Copy the generated token

### Configuration Options

- **[auth] section**:
  - `host`: Your Confluence Cloud instance URL (must start with https:// and include /wiki)
  - `email`: Your Atlassian account email
  - `api_token`: Your Confluence API token

- **[defaults] section**:
  - `format`: Default output format (`json` or `toon`)

## Quick Start

### Step 1: Configure the CLI

```bash
conni-cli config
```

Follow the prompts to enter your Confluence credentials.

### Step 2: Start the CLI

Start the CLI and interact with Confluence through a REPL:

```bash
conni-cli
```

Once started, you'll see the `conni>` prompt:

```
conni> list-spaces
conni> get-space {"spaceKey":"DOCS"}
conni> list-pages {"spaceKey":"DOCS","limit":10}
```

### Headless Mode

Execute single commands directly:

```bash
# Test connection
conni-cli test-connection

# List all spaces
conni-cli list-spaces

# Get space details
conni-cli get-space '{"spaceKey":"DOCS"}'

# List pages in a space
conni-cli list-pages '{"spaceKey":"DOCS","limit":10}'

# Get page details
conni-cli get-page '{"pageId":"123456"}'

# Create a new page
conni-cli create-page '{"spaceKey":"DOCS","title":"New Page","body":"<p>Hello World</p>"}'

# Add comment to a page
conni-cli add-comment '{"pageId":"123456","body":"<p>Great article!</p>"}'

# Download an attachment
conni-cli download-attachment '{"attachmentId":"att12345","outputPath":"./document.pdf"}'
```

## Available Commands

### Space Commands

- **list-spaces** - List all accessible spaces

  ```bash
  conni> list-spaces
  conni> list-spaces {"format":"json"}
  ```

- **get-space** - Get details of a specific space
  ```bash
  conni> get-space {"spaceKey":"DOCS"}
  ```

### Page Commands

- **list-pages** - List pages in a space or by search criteria

  ```bash
  conni> list-pages
  conni> list-pages {"spaceKey":"DOCS"}
  conni> list-pages {"spaceKey":"DOCS","title":"Getting Started","limit":10}
  ```

- **get-page** - Get details of a specific page

  ```bash
  conni> get-page {"pageId":"123456"}
  ```

- **create-page** - Create a new page

  ```bash
  conni> create-page {"spaceKey":"DOCS","title":"New Page","body":"<p>Hello World</p>"}
  ```

- **update-page** - Update an existing page

  ```bash
  conni> update-page {"pageId":"123456","title":"Updated Title","body":"<p>Updated content</p>","version":1}
  ```

- **add-comment** - Add a comment to a page

  ```bash
  conni> add-comment {"pageId":"123456","body":"<p>Great article!</p>"}
  ```

- **delete-page** - Delete a page
  ```bash
  conni> delete-page {"pageId":"123456"}
  ```

### Attachment Commands

- **download-attachment** - Download an attachment from a page

  ```bash
  conni> download-attachment {"attachmentId":"att12345"}
  conni> download-attachment {"attachmentId":"att12345","outputPath":"./document.pdf"}
  ```

  **Parameters:**
  - `attachmentId` (required): The ID of the attachment to download
  - `outputPath` (optional): Path to save the file (defaults to current directory with original filename)

### User Commands

- **get-user** - Get user information
  ```bash
  conni> get-user
  conni> get-user {"accountId":"5b10a2844c20165700ede21g"}
  ```

### Utility Commands

- **test-connection** - Test Confluence API connection
  ```bash
  conni> test-connection
  ```

## Interactive Mode Commands

Special commands available in the REPL:

- **commands** - List all available commands
- **help** or **?** - Show help message
- **format \<type\>** - Set output format (json, toon)
- **clear** - Clear the screen
- **exit**, **quit**, or **q** - Exit the CLI

## Output Formats

### JSON Format

Machine-readable JSON format (default):

```bash
conni> format json
conni> list-spaces
```

### TOON Format

[Token-Oriented Object Notation](https://github.com/toon-format/toon) for AI-optimized output:

```bash
conni> format toon
conni> list-pages
```

## Security

⚠️ **Important Security Notes:**

1. Configuration file `~/.connicli` is stored with secure permissions (0600 - owner read/write only)
2. Keep your API tokens secure and rotate them periodically
3. Never share your configuration file with others
4. API tokens have the same permissions as your user account
5. Use environment-specific API tokens for different environments

## Development

### Build from Source

```bash
# Clone repository
git clone https://github.com/hesedcasa/conni-cli.git
cd conni-cli

# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm start
```

### Run Tests

```bash
npm test                    # Run all tests once
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage
```

### Code Quality

```bash
npm run format              # Format code with ESLint and Prettier
npm run find-deadcode       # Find unused exports
npm run pre-commit          # Run format + find-deadcode
```

## Troubleshooting

### Connection Issues

```bash
# Test your connection
conni-cli test-connection

# Common issues:
# 1. Invalid API token - regenerate token
# 2. Wrong email address - use Atlassian account email
# 3. Incorrect host URL - ensure https:// prefix and /wiki path
# 4. Missing /wiki in host URL - Confluence Cloud URLs must include /wiki
```

### Authentication Errors

- Verify your API token is correct
- Check that the email matches your Atlassian account
- Ensure the host URL includes `https://` and `/wiki` path
- Confluence Cloud instances require the `/wiki` suffix in the host URL

### Permission Errors

- API tokens inherit your user permissions
- Check that your Confluence account has access to the space/page
- Some operations require specific Confluence permissions
- Page creation requires permission to add content in the target space

## License

Apache-2.0

## Acknowledgments

Built with [confluence.js](https://github.com/MrRefactoring/confluence.js) - A modern Confluence REST API client for Node.js
