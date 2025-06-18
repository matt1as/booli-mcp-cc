#!/bin/bash

# Booli MCP Server Wrapper Script
# This script ensures the proper environment for Claude Desktop

# Set up environment
export PATH="/Users/mattias/.nvm/versions/node/v24.0.1/bin:$PATH"
export NODE_PATH="/Users/mattias/.nvm/versions/node/v24.0.1/lib/node_modules"

# Set Booli API configuration
export BOOLI_GRAPHQL_URL="https://www.booli.se/graphql"

# Change to server directory
cd "/Users/mattias/Developer/booli-mcp-cc"

# Run the server
exec "/Users/mattias/.nvm/versions/node/v24.0.1/bin/node" "dist/index.js"