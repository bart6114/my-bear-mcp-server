# Bear MCP Server

A Model Context Protocol (MCP) server for interacting with the [Bear](https://bear.app/) note-taking app. This server allows AI assistants like Claude to interact with Bear through the MCP protocol.

## Features

- Create, read, and modify notes in Bear
- Search for notes by text or tags
- Manage tags
- Create notes from web content
- Access Bear's sidebar views (Today, Todo, Untagged, etc.)

## Prerequisites

- Node.js 18 or higher
- macOS with Bear app installed
- Bear API token

## Installation

### Quick Start

For a guided setup experience, use the quickstart script:

```bash
./scripts/quickstart.sh
```

This interactive script will:
1. Check if Bear and Node.js are installed
2. Build the project if needed
3. Help you get your Bear API token
4. Test the server
5. Configure Claude to use the Bear MCP server
6. Provide next steps

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

## Getting Your Bear API Token

### Automatic Method

You can use the provided script to help you get your Bear API token:

```bash
./scripts/get-bear-token.sh
```

This script will:
1. Open Bear for you
2. Show instructions for getting the API token
3. Provide next steps for using the token

### Manual Method

To get your Bear API token manually:

1. Open Bear on macOS
2. Go to Help → Advanced → API Token → Copy Token
3. The token will be copied to your clipboard

## Usage

Run the server with your Bear API token:

```
npm start -- --token YOUR_BEAR_TOKEN
```

Or directly:

```
node build/index.js --token YOUR_BEAR_TOKEN
```

The server runs on stdio (standard input/output), which is the standard transport mechanism for MCP servers. This allows Claude to communicate with the server through a standardized protocol when it's launched as a child process.

### Testing the Server

To verify that the server is working correctly, you can run the test script:

```
npm test -- --token YOUR_BEAR_TOKEN
```

This will run a series of tests to check if the Bear API client can successfully:
1. Create a new note
2. Retrieve tags
3. Search for notes

If all tests pass, the server is working correctly and ready to be used with Claude.

## Available Tools

The Bear MCP server provides the following tools:

### open_note

Open a note identified by its title or id and return its content.

```json
{
  "id": "note-id",
  "title": "Note Title",
  "header": "Section Header",
  "exclude_trashed": true,
  "new_window": false,
  "float": false,
  "show_window": true,
  "open_note": true,
  "selected": false,
  "pin": false,
  "edit": false,
  "search": "text to find"
}
```

### create_note

Create a new note and return its unique identifier.

```json
{
  "title": "My New Note",
  "text": "# Hello World\n\nThis is a new note created via MCP.",
  "tags": ["work", "important"],
  "pin": true,
  "timestamp": true
}
```

### add_text

Append or prepend text to a note identified by its title or id.

```json
{
  "id": "note-id",
  "text": "Additional text to add",
  "mode": "append",
  "new_line": true
}
```

### search_notes

Show search results in Bear for all notes or for a specific tag. Due to the x-callback-url data retrieval limitation, the search will be performed in the Bear app, but the results cannot be returned to the MCP server. You'll need to view the results directly in the Bear app.

```json
{
  "term": "project",
  "tag": "work"
}
```

### grab_url

Create a new note with the content of a web page.

```json
{
  "url": "https://example.com",
  "tags": ["web", "reference"],
  "pin": false
}
```

### get_tags

Return all the tags currently displayed in Bear's sidebar. Due to the x-callback-url data retrieval limitation, the tags will be retrieved in the Bear app, but the results cannot be returned to the MCP server.

```json
{}
```

### open_tag

Show all the notes which have a selected tag in Bear. Due to the x-callback-url data retrieval limitation, the notes with the specified tag will be shown in the Bear app, but the results cannot be returned to the MCP server.

```json
{
  "name": "work/projects"
}
```

## Configuring Claude to Use the Bear MCP Server

### Automatic Installation (macOS)

The easiest way to configure Claude to use the Bear MCP server is to use the provided installation script:

```bash
# For Claude VS Code Extension
./scripts/install-to-claude.sh --token YOUR_BEAR_TOKEN

# For Claude Desktop App
./scripts/install-to-claude.sh --token YOUR_BEAR_TOKEN --app
```

This script will:
1. Get the absolute path to your Bear MCP server
2. Create or update the appropriate Claude MCP settings file
3. Add the Bear MCP server configuration with your token

### Manual Configuration

If you prefer to configure Claude manually, you need to add the server to Claude's MCP settings file:

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
      "args": ["/absolute/path/to/my-bear-mcp-server/build/index.js", "--token", "YOUR_BEAR_TOKEN"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Replace `/absolute/path/to/my-bear-mcp-server` with the actual path to your server directory and `YOUR_BEAR_TOKEN` with your Bear API token.

## Example MCP Usage

Here's how you might use this server with Claude:

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>create_note</tool_name>
<arguments>
{
  "title": "Meeting Notes",
  "text": "# Team Meeting\n\n## Agenda\n\n- Project updates\n- Timeline review\n- Questions",
  "tags": ["work", "meetings"]
}
</arguments>
</use_mcp_tool>
```

For more examples, see the [examples directory](./examples/), which includes:
- `claude-integration.md`: Examples of how to use the Bear MCP server with Claude
- `claude-mcp-settings.json`: Example configuration for Claude Desktop
- `cline-mcp-settings.json`: Example configuration for Cline (VS Code Extension)

## Features and Improvements

- This server works on macOS, using the `open` command to execute x-callback-url calls.
- The server now captures data returned via x-callback-url's x-success parameter, enabling full functionality for all Bear API features.
- Functions like `search_notes`, `get_tags`, and `open_tag` now return the complete data from Bear, allowing Claude to process and display the results.
- Some functionality requires a Bear API token.
- Encrypted notes cannot be accessed via the API.

### Recent Improvements

- **X-Callback-URL Data Retrieval**: The server now uses a local HTTP server to capture data returned via x-callback-url's x-success parameter. This enables full functionality for all Bear API features.
- **Enhanced Error Handling**: Better error handling and reporting for all API calls.
- **Type Safety**: Improved TypeScript type definitions for better code reliability.

## License

MIT
