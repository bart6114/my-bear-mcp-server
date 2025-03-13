#!/bin/bash
# Script to help users get their Bear API token
# This script will open Bear and show instructions for getting the API token

echo "=== Bear API Token Helper ==="
echo ""
echo "This script will help you get your Bear API token."
echo ""
echo "Instructions:"
echo "1. Bear will open in a moment"
echo "2. In Bear, go to Help → Advanced → API Token → Copy Token"
echo "3. The token will be copied to your clipboard"
echo "4. Paste it when using the Bear MCP server"
echo ""
echo "Press Enter to open Bear..."
read

# Open Bear
open -a Bear

echo ""
echo "Bear should now be open."
echo "Follow the instructions above to get your API token."
echo ""
echo "Once you have your token, you can run the server with:"
echo "npm start -- --token YOUR_BEAR_TOKEN"
echo ""
echo "Or install it to Claude with:"
echo "./scripts/install-to-claude.sh --token YOUR_BEAR_TOKEN"
echo ""
