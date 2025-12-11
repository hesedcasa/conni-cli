# Confluence CLI

[![npm conni-cli package](https://img.shields.io/npm/v/conni-cli.svg)](https://npmjs.org/package/conni-cli)

A powerful command-line interface for Confluence interaction with support for pages, spaces, comments, and multiple output formats.

## Features

- 💻 **Interactive REPL** for Confluence exploration and management
- 🚀 **Headless mode** for one-off command execution and automation
- 🔐 **Multi-profile support** for managing different Confluence instances
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

### Step 1: Create API Token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "Confluence CLI")
4. Copy the generated token

### Step 2: Create Configuration File

Create a configuration file at `.claude/atlassian-config.local.md` in your project root:

```markdown
---
profiles:
  cloud:
    host: https://your-domain.atlassian.net/wiki
    email: your-email@example.com
    apiToken: YOUR_API_TOKEN_HERE

defaultProfile: cloud
defaultFormat: json
---

# Confluence API Configuration

This file stores your Confluence API connection profiles.
```

### Configuration Options

- **profiles**: Named Confluence connection profiles
  - `host`: Your Confluence Cloud instance URL (must start with https:// and include /wiki)
  - `email`: Your Atlassian account email
  - `apiToken`: Your Confluence API token

- **defaultProfile**: Profile name to use when none specified
- **defaultFormat**: Default output format (`json` or `toon`)

### Multiple Profiles Example

```yaml
---
profiles:
  production:
    host: https://company.atlassian.net/wiki
    email: user@company.com
    apiToken: prod_token_here

  staging:
    host: https://company-staging.atlassian.net/wiki
    email: user@company.com
    apiToken: staging_token_here

defaultProfile: production
defaultFormat: json
---
```

## Quick Start

### Interactive Mode

Start the CLI and interact with Confluence through a REPL:

```bash
npx conni-cli
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
npx conni-cli test-connection

# List all spaces
npx conni-cli list-spaces

# Get space details
npx conni-cli get-space '{"spaceKey":"DOCS"}'

# List pages in a space
npx conni-cli list-pages '{"spaceKey":"DOCS","limit":10}'

# Get page details
npx conni-cli get-page '{"pageId":"123456"}'

# Create a new page
npx conni-cli create-page '{"spaceKey":"DOCS","title":"New Page","body":"<p>Hello World</p>"}'

# Add comment to a page
npx conni-cli add-comment '{"pageId":"123456","body":"<p>Great article!</p>"}'

# Download an attachment
npx conni-cli download-attachment '{"attachmentId":"att12345","outputPath":"./document.pdf"}'
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
- **profile \<name\>** - Switch to a different profile
- **profiles** - List all available profiles
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

1. **Never commit** `.claude/atlassian-config.local.md` to version control
2. Add `*.local.md` to your `.gitignore`
3. Keep your API tokens secure and rotate them periodically
4. Use different API tokens for different environments
5. API tokens have the same permissions as your user account

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

## Examples

### Basic Workflow

```bash
# Start interactive mode
npx conni-cli

# List all spaces
conni> list-spaces

# Get specific space
conni> get-space {"spaceKey":"DOCS"}

# List pages in a space
conni> list-pages {"spaceKey":"DOCS","limit":10}

# Get specific page
conni> get-page {"pageId":"123456"}

# Create new page
conni> create-page {"spaceKey":"DOCS","title":"New Page","body":"<p>Hello World</p>"}

# Update page
conni> update-page {"pageId":"123456","title":"Updated Title","body":"<p>Updated content</p>","version":1}

# Add comment to page
conni> add-comment {"pageId":"123456","body":"<p>Great article!</p>"}

# Download attachment
conni> download-attachment {"attachmentId":"att12345","outputPath":"./document.pdf"}
```

### Automation Scripts

```bash
#!/bin/bash
# Get all pages in a space
npx conni-cli list-pages '{"spaceKey":"DOCS","limit":100}' > pages.json

# Test connection
npx conni-cli test-connection

# Create page from script
npx conni-cli create-page '{
  "spaceKey": "DOCS",
  "title": "Automated Page Creation",
  "body": "<p>Created via automation script</p>"
}'

# Add comment to page
npx conni-cli add-comment '{
  "pageId": "123456",
  "body": "<p><strong>Automation Update</strong><br/>Build completed successfully at $(date)</p>"
}'
```

## Troubleshooting

### Connection Issues

```bash
# Test your connection
npx conni-cli test-connection

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
