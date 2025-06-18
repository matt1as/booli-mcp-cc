# Booli MCP Server

A Model Context Protocol (MCP) server for accessing Swedish real estate data from Booli.se through GraphQL API. This server enables AI assistants to search and analyze property listings using natural language queries.

## Features

- **Property Search**: Search for apartments and houses with comprehensive filtering options
- **Location Discovery**: Find area IDs and location names for targeted property searches
- **Natural Language Queries**: AI assistants can interpret conversational property requests
- **GraphQL Integration**: Efficient API communication with Booli's GraphQL endpoint
- **Structured Responses**: Returns property data in standardized format with rich text formatting

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

### search_locations

Find location suggestions and area IDs for property searches:

- `query` (string, required): Search query to find location suggestions (e.g., "ektorp", "stockholm", "nacka")
- `limit` (number, optional): Maximum results to return (default: 10)

**Example usage**: Use this tool first to discover location IDs, then use those IDs in property searches for more targeted results.

### search_properties

Search for properties with comprehensive filtering options:

**Basic Parameters:**
- `location` (string): Location to search (area ID or name, e.g., "Stockholm", "509")
- `minPrice` (number): Minimum price in SEK
- `maxPrice` (number): Maximum price in SEK  
- `minRooms` (number): Minimum number of rooms
- `maxRooms` (number): Maximum number of rooms
- `minArea` (number): Minimum living area in m²
- `maxArea` (number): Maximum living area in m²
- `propertyType` (string): "apartment" or "house"

**Advanced Parameters:**
- `minPricePerSqm` (number): Minimum price per square meter
- `maxPricePerSqm` (number): Maximum price per square meter
- `minPlotArea` (number): Minimum plot area for houses
- `maxPlotArea` (number): Maximum plot area for houses
- `minConstructionYear` (number): Minimum construction year
- `maxConstructionYear` (number): Maximum construction year
- `maxRent` (number): Maximum monthly rent for cooperatives
- `daysActive` (number): Maximum days listing has been active
- `amenities` (string): Comma-separated amenities list
- `floor` (string): "bottomFloor" or "topFloor"
- `showOnly` (string): Special filters (e.g., "priceDecrease,newConstruction")
- `limit` (number): Maximum results to return (default: 10)

## Example Queries

**Location Discovery:**
- "Find locations matching 'ektorp'"
- "Search for areas in Stockholm"
- "What locations are available in Nacka?"

**Property Search:**
- "Show me 2-bedroom apartments under 4M SEK in Stockholm"
- "Find houses in Göteborg with at least 100m² living area"
- "Search for properties in Södermalm between 2-5M SEK"
- "Find apartments in area 509 with balcony"

**Combined Workflow:**
1. First: "Find locations matching 'södermalm'"
2. Then: "Search properties in area 123 with 2-3 rooms under 5M SEK"

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Start development server
npm run dev
```

## Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test files
npm test tests/location-types.test.ts
npm test tests/types.test.ts

# Run tests with coverage
npm run test:coverage
```

Test coverage includes:
- Type validation with Zod schemas
- GraphQL client functionality
- MCP tool implementations
- Error handling and edge cases
- Integration tests with real API calls

## License

MIT