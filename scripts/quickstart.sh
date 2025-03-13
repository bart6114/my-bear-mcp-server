#!/bin/bash
# Quickstart script for the Bear MCP Server
# This script will guide you through the process of setting up the Bear MCP server

echo "=== Bear MCP Server Quickstart ==="
echo ""
echo "This script will guide you through the process of setting up the Bear MCP server."
echo ""

# Check if Bear is installed
if ! [ -d "/Applications/Bear.app" ]; then
  echo "❌ Bear is not installed in your Applications folder."
  echo "Please install Bear from https://bear.app/ and try again."
  exit 1
fi

echo "✅ Bear is installed."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed."
  echo "Please install Node.js from https://nodejs.org/ and try again."
  exit 1
fi

echo "✅ Node.js is installed: $(node --version)"
echo ""

# Check if the project is built
if ! [ -f "build/index.js" ]; then
  echo "❓ The project is not built yet."
  echo "Would you like to build it now? (y/n)"
  read -r answer
  if [ "$answer" = "y" ]; then
    echo "Building the project..."
    npm run build
    if [ $? -ne 0 ]; then
      echo "❌ Failed to build the project."
      echo "Please check the error messages above and try again."
      exit 1
    fi
    echo "✅ Project built successfully."
  else
    echo "Please build the project manually with 'npm run build' and try again."
    exit 1
  fi
else
  echo "✅ Project is already built."
fi
echo ""

# Get the Bear API token
echo "Now we need to get your Bear API token."
echo "Would you like to:"
echo "1. Get the token automatically (opens Bear)"
echo "2. Enter the token manually (if you already have it)"
echo "Enter your choice (1 or 2):"
read -r choice

TOKEN=""
if [ "$choice" = "1" ]; then
  echo ""
  echo "Instructions:"
  echo "1. Bear will open in a moment"
  echo "2. In Bear, go to Help → Advanced → API Token → Copy Token"
  echo "3. The token will be copied to your clipboard"
  echo ""
  echo "Press Enter to open Bear..."
  read
  
  # Open Bear
  open -a Bear
  
  echo ""
  echo "Bear should now be open."
  echo "Once you've copied the token, paste it here:"
  read -r TOKEN
elif [ "$choice" = "2" ]; then
  echo "Enter your Bear API token:"
  read -r TOKEN
else
  echo "Invalid choice. Exiting."
  exit 1
fi

if [ -z "$TOKEN" ]; then
  echo "❌ No token provided. Exiting."
  exit 1
fi

echo "✅ Token received."
echo ""

# Test the server
echo "Would you like to test the server with your token? (y/n)"
read -r test_server
if [ "$test_server" = "y" ]; then
  echo "Testing the server..."
  npm test -- --token "$TOKEN"
  if [ $? -ne 0 ]; then
    echo "❌ Server test failed."
    echo "Would you like to continue anyway? (y/n)"
    read -r continue_anyway
    if [ "$continue_anyway" != "y" ]; then
      echo "Exiting."
      exit 1
    fi
  else
    echo "✅ Server test passed."
  fi
fi
echo ""

# Configure Claude
echo "Would you like to configure Claude to use the Bear MCP server? (y/n)"
read -r configure_claude
if [ "$configure_claude" = "y" ]; then
  echo "Do you want to configure:"
  echo "1. Claude VS Code Extension"
  echo "2. Claude Desktop App"
  echo "Enter your choice (1 or 2):"
  read -r claude_choice
  
  if [ "$claude_choice" = "1" ]; then
    echo "Configuring Claude VS Code Extension..."
    ./scripts/install-to-claude.sh --token "$TOKEN"
  elif [ "$claude_choice" = "2" ]; then
    echo "Configuring Claude Desktop App..."
    ./scripts/install-to-claude.sh --token "$TOKEN" --app
  else
    echo "Invalid choice. Skipping Claude configuration."
  fi
fi
echo ""

# Final instructions
echo "=== Setup Complete ==="
echo ""
echo "You can now use the Bear MCP server with Claude!"
echo ""
echo "To run the server manually:"
echo "npm start -- --token $TOKEN"
echo ""
echo "For more information, see the README.md file."
echo ""
