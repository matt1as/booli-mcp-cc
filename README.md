# Booli MCP Server

A Model Context Protocol (MCP) server for accessing Swedish real estate data from Booli.se through GraphQL API. This server enables AI assistants to search and analyze property listings using natural language queries.

## Features

- **Property Search**: Search for apartments and houses with flexible filtering
- **Natural Language Queries**: AI assistants can interpret conversational property requests
- **GraphQL Integration**: Efficient API communication with Booli's GraphQL endpoint
- **Structured Responses**: Returns property data in standardized format

## Installation

```bash
npm install
npm run build
```

## Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Set the Booli GraphQL endpoint in `.env`:
```env
BOOLI_GRAPHQL_URL=https://api.booli.se/graphql
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### With Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "booli": {
      "command": "node",
      "args": ["/path/to/booli-mcp-server/dist/index.js"],
      "env": {
        "BOOLI_GRAPHQL_URL": "https://api.booli.se/graphql"
      }
    }
  }
}
```

## Available Tools

### search_properties

Search for properties with the following parameters:

- `location` (string): Location to search (e.g., "Stockholm", "Södermalm")
- `minPrice` (number): Minimum price in SEK
- `maxPrice` (number): Maximum price in SEK  
- `minRooms` (number): Minimum number of rooms
- `maxRooms` (number): Maximum number of rooms
- `minArea` (number): Minimum living area in m²
- `maxArea` (number): Maximum living area in m²
- `propertyType` (string): "apartment" or "house"
- `limit` (number): Maximum results to return (default: 10)

## Example Queries

- "Show me 2-bedroom apartments under 4M SEK in Stockholm"
- "Find houses in Göteborg with at least 100m² living area"
- "Search for properties in Södermalm between 2-5M SEK"

## Development

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build
npm run build
```

## License

MIT