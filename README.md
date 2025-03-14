# Bear MCP Server

A Model Context Protocol (MCP) server for interacting with the [Bear](https://bear.app/) note-taking app. This server allows AI assistants like Claude to interact with Bear through the MCP protocol.

## Features

- Read notes from Bear's SQLite database
- Search for notes by text or tags
- View tags
- Browse notes by tag

## Prerequisites

- Node.js 18 or higher
- macOS with Bear app installed
- Access to Bear's SQLite database (located at `~/Library/Group Containers/9K33E3U3T4.net.shinyfrog.bear/Application Data/database.sqlite`)

## Installation

### Manual Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/bear-mcp-server.git
   cd bear-mcp-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the server:
   ```
   npm run build
   ```

## Usage

Run the server:

```
npm start
```

Or directly:

```
node build/index.js
```

By default, the server will connect to Bear's SQLite database at the standard location. If your database is in a different location, you can specify it with the `--db-path` option:

```
node build/index.js --db-path /path/to/your/database.sqlite
```

The server runs on stdio (standard input/output), which is the standard transport mechanism for MCP servers. This allows Claude to communicate with the server through a standardized protocol when it's launched as a child process.

## Available Tools

The Bear MCP server provides the following read-only tools:

### open_note

Open a note identified by its title or id and return its content.

```json
{
  "id": "note-id",
  "title": "Note Title",
  "header": "Section Header",
  "exclude_trashed": true
}
```

### search_notes

Search for notes by term or tag.

```json
{
  "term": "project",
  "tag": "work",
  "max_notes": 50
}
```

By default, search results are limited to 25 notes. You can adjust this limit using the `max_notes` parameter.

### get_tags

Return all the tags currently in Bear.

```json
{
  "max_tags": 200
}
```

By default, tag results are limited to 100 tags. You can adjust this limit using the `max_tags` parameter.

### open_tag

Show all the notes which have a selected tag.

```json
{
  "name": "work/projects",
  "max_notes": 50
}
```

By default, results are limited to 25 notes. You can adjust this limit using the `max_notes` parameter.

## Configuring Claude to Use the Bear MCP Server

### Manual Configuration

You need to add the server to Claude's MCP settings file:

#### For Claude Desktop App

Edit the configuration file at:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

#### For Claude VS Code Extension

Edit the configuration file at:
- macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

#### Configuration Example

Add the following to your MCP settings file:

```json
{
  "mcpServers": {
    "bear": {
      "command": "node",
      "args": ["/absolute/path/to/my-bear-mcp-server/build/index.js"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Replace `/absolute/path/to/my-bear-mcp-server` with the actual path to your server directory.

## Example MCP Usage

Here's how you might use this server with Claude:

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>open_note</tool_name>
<arguments>
{
  "title": "Meeting Notes"
}
</arguments>
</use_mcp_tool>
```

Or to search for notes:

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>search_notes</tool_name>
<arguments>
{
  "term": "project",
  "tag": "work"
}
</arguments>
</use_mcp_tool>
```

## Features and Improvements

### Key Changes from Previous Version

- **Direct SQLite Access**: Instead of using Bear's x-callback-url API, this server now directly accesses Bear's SQLite database in read-only mode.
- **No Bear App Required**: The server can now read notes even when the Bear app is not running.
- **Read-Only Operations**: For safety and simplicity, this version only supports read operations (no creating or modifying notes).
- **No Token Required**: Since we're directly accessing the database, no Bear API token is needed.
- **Improved Performance**: Direct database access is faster than using x-callback-url.

## License

MIT
