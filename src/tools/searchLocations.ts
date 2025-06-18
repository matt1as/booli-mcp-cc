/**
 * @fileoverview MCP tool for searching locations on Booli.se.
 * This module provides location search functionality exposed to MCP clients,
 * handling search parameter validation and result formatting for area suggestions.
 */

import { BooliGraphQLClient } from '../client/graphql';

/** Singleton GraphQL client instance for location searches */
const client = new BooliGraphQLClient();

/**
 * Searches for location suggestions on Booli.se using the provided search query.
 *
 * This function serves as the main MCP tool entry point for location searches.
 * It accepts a search query string, validates it, performs the search via the
 * GraphQL client, and formats the results for display to users.
 *
 * The function helps users discover available locations and find correct area IDs
 * for property searches. Results include location names, IDs, and parent location
 * information to provide context about the geographic hierarchy.
 *
 * Results are formatted with emojis and structured text for optimal readability
 * in chat interfaces and command-line environments.
 *
 * @param args - Raw search arguments from the MCP client
 * @param args.query - Search query string to find location suggestions
 * @param args.limit - Maximum results to return (default: 10)
 *
 * @returns MCP-formatted response with location suggestions or error message
 */
export async function searchLocations(args: { query: string; limit?: number }) {
  try {
    // Validate input parameters
    if (!args.query || typeof args.query !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Query parameter is required and must be a non-empty string.',
          },
        ],
        isError: true,
      };
    }

    // Trim and validate query length
    const query = args.query.trim();
    if (query.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Search query cannot be empty.',
          },
        ],
        isError: true,
      };
    }

    if (query.length < 2) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Search query must be at least 2 characters long.',
          },
        ],
        isError: true,
      };
    }

    // Apply result limit with default value
    const limit = args.limit || 10;

    // Execute location search via GraphQL client
    const response = await client.searchLocations({ query });

    // Handle empty results
    if (!response.data.areaSuggestionSearch.suggestions.length) {
      return {
        content: [
          {
            type: 'text',
            text: `No locations found matching "${query}". Try a different search term or check the spelling.`,
          },
        ],
      };
    }

    // Extract and limit results for display
    const locations = response.data.areaSuggestionSearch.suggestions.slice(0, limit);
    const totalCount = response.data.areaSuggestionSearch.suggestions.length;

    // Build search result summary
    let summary = `Found ${totalCount} location suggestions for "${query}"`;
    if (limit < totalCount) {
      summary += ` (showing first ${limit})`;
    }
    summary += ':\n\n';

    // Format each location for display with comprehensive information
    const locationList = locations
      .map((location, index) => {
        let description = `${index + 1}. **${location.displayName}** (ID: ${location.id})`;

        // Parent location information for geographic context
        if (location.parent && location.parentDisplayName) {
          description += `\n   📍 Located in: ${location.parentDisplayName}`;
        }

        // Location type information
        if (location.parentTypeDisplayName) {
          description += `\n   🏛️  Type: ${location.parentTypeDisplayName}`;
        }

        // Parent location ID for reference
        if (location.parentId) {
          description += `\n   🔗 Parent ID: ${location.parentId}`;
        }

        // Usage hint for property searches
        description += `\n   💡 Use this ID (${location.id}) for property searches in this area`;

        return description;
      })
      .join('\n\n');

    // Add usage instructions
    const usageHint = '\n\n**How to use these results:**\n' +
      '• Copy the ID number to use in property searches\n' +
      '• Example: search_properties with location="509" for Ektorp\n' +
      '• Larger areas (like municipalities) will show more properties';

    // Return formatted search results
    return {
      content: [
        {
          type: 'text',
          text: summary + locationList + usageHint,
        },
      ],
    };
  } catch (error) {
    // Handle and log search errors
    console.error('Location search failed:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error searching for locations: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
      isError: true,
    };
  }
}