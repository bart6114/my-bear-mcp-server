# Bear MCP Server

A Model Context Protocol (MCP) server that allows AI assistants like Claude to read notes from the [Bear](https://bear.app/) note-taking app. This implementation connects directly to the Bear SQLite database in a read-only mode, ensuring your notes remain safe and unmodified.

[![Read-Only](https://img.shields.io/badge/Mode-Read%20Only-brightgreen.svg)](https://github.com/bart6114/my-bear-mcp-server)
[![Bear App](https://img.shields.io/badge/For-Bear%20App-blue.svg)](https://bear.app)
[![Works with Claude](https://img.shields.io/badge/Works%20with-Claude%20AI-blueviolet.svg)](https://claude.ai)
[![TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-007ACC.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start

### Option 1: Install from GitHub (Recommended)

```bash
npx github:bart6114/my-bear-mcp-server
```

That's it! The server will start running and connect to your Bear database.

### Option 2: Clone and Run Locally

```bash
# Clone the repository
git clone https://github.com/bart6114/my-bear-mcp-server.git
cd my-bear-mcp-server

# Install dependencies
npm install

# Build and run
npm run build
npm start
```

## Prerequisites

- macOS with Bear app installed
- Node.js 18 or higher

## Configuration

### For Claude Desktop App

Add this to your configuration file at `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bear": {
      "command": "npx",
      "args": ["github:bart6114/my-bear-mcp-server"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### For Claude VS Code Extension

Add this to your configuration file at `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "bear": {
      "command": "npx",
      "args": ["github:bart6114/my-bear-mcp-server"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools

The Bear MCP server provides these read-only tools (all operations are non-destructive and cannot modify your Bear database):

### open_note

Open a note by title or ID.

### search_notes

Search for notes by term or tag.

### get_tags

Get all tags in Bear.

### open_tag

Show all notes with a specific tag.

## Example Usage

Here are examples of how to interact with the Bear MCP tools through AI assistants:

### Searching for Notes

Ask your AI assistant to search for notes containing specific terms:

```
Can you find all my notes about "project management"?
```

### Opening a Specific Note

Ask your AI assistant to retrieve a specific note by title:

```
Show me my note titled "Meeting Notes - March 2025"
```

### Viewing Tags

Ask your AI assistant to list all your Bear tags:

```
What tags do I have in my Bear notes?
```

### Finding Notes with a Specific Tag

Ask your AI assistant to show notes with a particular tag:

```
Show me all notes with the #work tag
```

## Advanced Options

If your Bear database is in a non-standard location:

```bash
npx github:bart6114/my-bear-mcp-server --db-path /path/to/your/database.sqlite
```

## Technical Details

### Read-Only Implementation

This MCP server connects to your Bear SQLite database using a strict read-only connection. This is enforced at the database driver level:

```typescript
// From src/bear-db.ts
this.db = new Database(dbPath, { readonly: true });
```

This ensures that:
- No write operations can be performed on your database
- Your notes and tags cannot be modified, deleted, or corrupted
- The database connection will fail if write permissions are attempted

All operations performed by this server are SELECT queries that only retrieve data without modifying it.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
