# Bear MCP Server

A Model Context Protocol (MCP) server that allows AI assistants like Claude to read notes from the [Bear](https://bear.app/) note-taking app.

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue.svg)](https://github.com/bart6114/my-bear-mcp-server)

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

The Bear MCP server provides these read-only tools:

### open_note

Open a note by title or ID.

### search_notes

Search for notes by term or tag.

### get_tags

Get all tags in Bear.

### open_tag

Show all notes with a specific tag.

## Example Usage with Claude

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>search_notes</tool_name>
<arguments>
{
  "term": "project"
}
</arguments>
</use_mcp_tool>
```

## Advanced Options

If your Bear database is in a non-standard location:

```bash
npx github:bart6114/my-bear-mcp-server --db-path /path/to/your/database.sqlite
```

## License

MIT
