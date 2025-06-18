#!/usr/bin/env node

/**
 * @fileoverview Booli MCP (Model Context Protocol) Server
 * 
 * This is the main entry point for the Booli MCP server, which provides
 * AI assistants with access to Swedish real estate data from Booli.se.
 * 
 * The server implements the Model Context Protocol to expose property search
 * functionality as tools that can be used by AI assistants like Claude.
 * It supports comprehensive property filtering and returns formatted results
 * suitable for natural language interactions.
 * 
 * Usage:
 *   - As a standalone server: node dist/index.js
 *   - With Claude Desktop: configure in claude_desktop_config.json
 *   - Via MCP clients: connect to stdio transport
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { searchProperties } from './tools/searchProperties';

/**
 * Main MCP server instance for handling property search requests.
 * Configured with server metadata and tool capabilities.
 */
const server = new Server(
  {
    name: 'booli-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {}, // Indicates this server provides tool functionality
    },
  }
);

/**
 * Available MCP tools exposed by this server.
 * 
 * Currently provides one comprehensive property search tool that supports
 * a wide range of filtering options for Swedish real estate data.
 */
const tools: Tool[] = [
  {
    name: 'search_properties',
    description: 'Search for properties on Booli.se with comprehensive filtering options',
    inputSchema: {
      type: 'object',
      properties: {
        // Basic search parameters
        location: {
          type: 'string',
          description: 'Location to search in (e.g., "Stockholm", "Södermalm", "509" for area ID)',
        },
        minPrice: {
          type: 'number',
          description: 'Minimum list price in SEK',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum list price in SEK',
        },
        minRooms: {
          type: 'number',
          description: 'Minimum number of rooms',
        },
        maxRooms: {
          type: 'number',
          description: 'Maximum number of rooms',
        },
        minArea: {
          type: 'number',
          description: 'Minimum living area in square meters',
        },
        maxArea: {
          type: 'number',
          description: 'Maximum living area in square meters',
        },
        propertyType: {
          type: 'string',
          enum: ['apartment', 'house'],
          description: 'Type of property to search for',
        },
        
        // Advanced filtering parameters
        minPricePerSqm: {
          type: 'number',
          description: 'Minimum price per square meter in SEK',
        },
        maxPricePerSqm: {
          type: 'number',
          description: 'Maximum price per square meter in SEK',
        },
        minPlotArea: {
          type: 'number',
          description: 'Minimum plot area in square meters (for houses)',
        },
        maxPlotArea: {
          type: 'number',
          description: 'Maximum plot area in square meters (for houses)',
        },
        minConstructionYear: {
          type: 'number',
          description: 'Minimum construction year',
        },
        maxConstructionYear: {
          type: 'number',
          description: 'Maximum construction year',
        },
        maxRent: {
          type: 'number',
          description: 'Maximum monthly rent in SEK (for tenant-owned cooperatives)',
        },
        daysActive: {
          type: 'number',
          description: 'Maximum days the listing has been active',
        },
        amenities: {
          type: 'string',
          description: 'Comma-separated amenities (e.g., "hasBalconyOrPatio,hasFireplace,buildingHasElevator")',
        },
        floor: {
          type: 'string',
          enum: ['bottomFloor', 'topFloor'],
          description: 'Specific floor preference',
        },
        showOnly: {
          type: 'string',
          description: 'Special filters (e.g., "priceDecrease,tenureOwnership,newConstruction")',
        },
        
        // Result formatting parameters
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
          default: 10,
        },
      },
      required: [], // All parameters are optional for flexible searching
    },
  },
];

/**
 * Handles the MCP ListTools request to advertise available tools.
 * Returns the tools array containing the property search tool definition.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

/**
 * Handles MCP CallTool requests to execute the specified tool.
 * Routes tool calls to the appropriate implementation based on tool name.
 * 
 * @param request - The MCP tool call request containing tool name and arguments
 * @returns Promise resolving to the tool execution result
 * @throws Error if an unknown tool name is requested
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'search_properties':
      return await searchProperties(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

/**
 * Main server initialization function.
 * 
 * Sets up the stdio transport for MCP communication and starts the server.
 * The server communicates via stdin/stdout, making it suitable for use
 * with MCP clients like Claude Desktop.
 * 
 * @throws Error if server initialization or connection fails
 */
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Booli MCP Server running on stdio');
}

// Start the server if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}