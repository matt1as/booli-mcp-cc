# Claude Desktop Setup Guide

## ✅ Current Configuration

Your Claude Desktop is now configured with the Booli MCP server. The configuration file is located at:
```
/Users/mattias/Library/Application Support/Claude/claude_desktop_config.json
```

## 🔧 Troubleshooting Steps

### 1. Restart Claude Desktop
After making any configuration changes:
1. Quit Claude Desktop completely
2. Wait 3-5 seconds  
3. Restart Claude Desktop

### 2. Check MCP Connection Status
In Claude Desktop, look for:
- MCP server indicators in the UI
- Any error messages about disconnected servers
- The Booli tools should appear in the tools list

### 3. Test the Server
You can manually test the server by running:
```bash
cd /Users/mattias/Developer/booli-mcp-cc
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | ./run-server.sh
```

### 4. Check Logs
View Claude Desktop logs in Console.app:
1. Open Console.app
2. Search for "Claude"
3. Look for any MCP-related error messages

### 5. Common Issues & Solutions

**Issue: "MCP has disconnected"**
- Solution: Restart Claude Desktop after config changes
- Verify the wrapper script path is correct
- Check that all files have proper permissions

**Issue: "Permission denied"**
- Solution: Ensure scripts are executable:
```bash
chmod +x /Users/mattias/Developer/booli-mcp-cc/run-server.sh
chmod +x /Users/mattias/Developer/booli-mcp-cc/dist/index.js
```

**Issue: "Node.js not found"**
- Solution: The wrapper script uses absolute paths to avoid environment issues
- Verify Node.js path: `/Users/mattias/.nvm/versions/node/v24.0.1/bin/node`

**Issue: "403 Forbidden from Booli API"**
- Solution: This indicates Booli's GraphQL endpoint may require different authentication or have access restrictions
- The MCP server is working correctly - this is an API access issue

## 🧪 Testing the Integration

Once connected, you can test the Booli MCP server in Claude Desktop by asking:

- "What properties are available in Stockholm under 3M SEK?"
- "Find 2-bedroom apartments in Göteborg"
- "Search for houses with at least 100m² living area"

## 📁 File Structure

```
/Users/mattias/Developer/booli-mcp-cc/
├── run-server.sh           # Wrapper script (used by Claude Desktop)
├── dist/index.js           # Built MCP server
├── src/                    # Source code
└── claude-desktop-config.json  # Example configuration
```

## 🔄 Making Changes

If you modify the server code:
1. Run `npm run build` to rebuild
2. Restart Claude Desktop
3. Test the connection

## ⚡ Quick Fix Commands

```bash
# Rebuild and test
cd /Users/mattias/Developer/booli-mcp-cc
npm run build
chmod +x dist/index.js run-server.sh

# Test server manually  
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | ./run-server.sh
```

## 🆘 If Still Having Issues

1. Check the debug output:
```bash
./debug-claude-desktop.sh
```

2. Try the alternative direct configuration in Claude Desktop config:
```json
{
  "mcpServers": {
    "booli": {
      "command": "/Users/mattias/.nvm/versions/node/v24.0.1/bin/node",
      "args": ["/Users/mattias/Developer/booli-mcp-cc/dist/index.js"],
      "env": {
        "BOOLI_GRAPHQL_URL": "https://www.booli.se/graphql"
      }
    }
  }
}
```

3. Contact support with the debug output and any error messages from Console.app