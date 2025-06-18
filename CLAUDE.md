# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Booli MCP (Model Context Protocol) Server** that provides AI assistants with access to Swedish real estate data from Booli.se through GraphQL API integration. The project enables natural language property searches and location discovery.

## Development Setup

### Commands
- `npm install` - Install dependencies
- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Start development server
- `npm test` - Run test suite
- `npm run typecheck` - TypeScript type checking
- `npm run lint` - ESLint code quality checks

### Testing
- `npm test` - Run all tests
- `npm test tests/location-types.test.ts` - Run specific test file
- Unit tests use Jest with TypeScript support
- Integration tests make real API calls to Booli.se

## Architecture

### Core Components
- **MCP Server** (`src/index.ts`) - Main server entry point with tool registration
- **GraphQL Client** (`src/client/graphql.ts`) - Handles Booli.se API communication
- **MCP Tools** (`src/tools/`) - Individual tool implementations
  - `searchProperties.ts` - Property search with comprehensive filtering
  - `searchLocations.ts` - Location discovery and area ID lookup
- **Type Definitions** (`src/types.ts`) - Zod schemas and TypeScript types

### Key Features
1. **Property Search** - Comprehensive filtering with 20+ parameters
2. **Location Discovery** - Find area IDs using partial location names
3. **Type Safety** - Full TypeScript with Zod runtime validation
4. **Rich Formatting** - Emoji-enhanced responses for better UX

### API Integration
- **Endpoint**: `https://www.booli.se/graphql`
- **Authentication**: Browser-like headers (no API key required)
- **Queries**: 
  - `searchForSale` - Property listings with union types (Property/Listing)
  - `areaSuggestionSearch` - Location suggestions with hierarchy

## Development Guidelines

### Code Style
- Use TypeScript with strict type checking
- Follow existing JSDoc documentation patterns
- Implement comprehensive error handling
- Write unit tests for new functionality

### Testing Requirements
- All new features must have unit tests
- Test both success and error scenarios
- Include integration tests for API calls
- Maintain existing test coverage

### Adding New Tools
1. Create tool implementation in `src/tools/`
2. Add types to `src/types.ts` with Zod schemas
3. Register tool in `src/index.ts`
4. Write comprehensive tests
5. Update documentation

## Notes

- **No API Keys Required** - Uses browser-like headers for authentication
- **Swedish Market Focus** - All location names and property types in Swedish
- **MCP Protocol** - Follows Model Context Protocol standards for AI integration
- **GraphQL Inline Queries** - Booli API requires inline parameters, not variables
- **Real Estate Domain** - Property types: "Lägenhet" (apartment), "Villa" (house)

## Common Tasks

### Adding New Search Filters
1. Add parameter to tool input schema in `src/index.ts`
2. Update `SearchCriteria` interface in `src/types.ts`
3. Implement filter logic in `buildSearchInput()` method
4. Add tests for new parameter
5. Update documentation

### Debugging API Issues
- Check browser network tab for working GraphQL queries
- Verify headers match browser requests exactly
- Use `testConnection()` method for connectivity checks
- Enable GraphQL query logging in client

### Working with Location Data
- Use `search_locations` tool to discover area IDs
- Location hierarchy: Area → Municipality → Region
- Area IDs are strings (e.g., "509" for Ektorp)
- Parent relationships provide geographic context