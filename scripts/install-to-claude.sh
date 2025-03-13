#!/bin/bash
# Install the Bear MCP server to Claude's MCP settings file
# Usage: ./install-to-claude.sh --token YOUR_BEAR_TOKEN [--app]

# Parse command-line arguments
TOKEN=""
APP=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --token)
      TOKEN="$2"
      shift 2
      ;;
    --app)
      APP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./install-to-claude.sh --token YOUR_BEAR_TOKEN [--app]"
      exit 1
      ;;
  esac
done

# Check if token is provided
if [ -z "$TOKEN" ]; then
  echo "Error: Bear API token is required"
  echo "Usage: ./install-to-claude.sh --token YOUR_BEAR_TOKEN [--app]"
  exit 1
fi

# Get the absolute path to the server
SERVER_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_PATH="$SERVER_PATH/build/index.js"

# Check if the build exists
if [ ! -f "$BUILD_PATH" ]; then
  echo "Error: Build not found at $BUILD_PATH"
  echo "Please run 'npm run build' first"
  exit 1
fi

# Determine the settings file path
if [ "$APP" = true ]; then
  # Claude Desktop App
  SETTINGS_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
  echo "Installing to Claude Desktop App settings..."
else
  # Claude VS Code Extension
  SETTINGS_FILE="$HOME/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"
  echo "Installing to Claude VS Code Extension settings..."
fi

# Create the settings directory if it doesn't exist
mkdir -p "$(dirname "$SETTINGS_FILE")"

# Check if the settings file exists
if [ -f "$SETTINGS_FILE" ]; then
  # Backup the existing settings file
  cp "$SETTINGS_FILE" "$SETTINGS_FILE.bak"
  echo "Backed up existing settings to $SETTINGS_FILE.bak"
  
  # Check if the file is valid JSON
  if ! jq empty "$SETTINGS_FILE" 2>/dev/null; then
    echo "Warning: Existing settings file is not valid JSON. Creating a new one."
    echo '{
  "mcpServers": {
    "bear": {
      "command": "node",
      "args": ["'"$BUILD_PATH"'", "--token", "'"$TOKEN"'"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}' > "$SETTINGS_FILE"
  else
    # Update the existing settings file
    if jq '.mcpServers' "$SETTINGS_FILE" | grep -q "null"; then
      # mcpServers doesn't exist, create it
      jq '. + {"mcpServers": {"bear": {"command": "node", "args": ["'"$BUILD_PATH"'", "--token", "'"$TOKEN"'"], "env": {}, "disabled": false, "autoApprove": []}}}' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp"
    else
      # mcpServers exists, update it
      jq '.mcpServers.bear = {"command": "node", "args": ["'"$BUILD_PATH"'", "--token", "'"$TOKEN"'"], "env": {}, "disabled": false, "autoApprove": []}' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp"
    fi
    mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
  fi
else
  # Create a new settings file
  echo '{
  "mcpServers": {
    "bear": {
      "command": "node",
      "args": ["'"$BUILD_PATH"'", "--token", "'"$TOKEN"'"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}' > "$SETTINGS_FILE"
fi

echo "Bear MCP server installed successfully to $SETTINGS_FILE"
echo "Server path: $BUILD_PATH"
echo "Token: $TOKEN"
echo ""
echo "You can now use the Bear MCP server with Claude!"
