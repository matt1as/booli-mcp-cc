/**
 * @fileoverview GraphQL client for interacting with the Booli.se real estate API.
 * This client handles all GraphQL operations including property searches and API communication.
 */

import { GraphQLClient } from 'graphql-request';
import { ApiResponse, SearchCriteria, LocationApiResponse, LocationSearchCriteria, PropertyDetailCriteria } from '../types';

/**
 * GraphQL client for the Booli.se real estate API.
 * Handles authentication, query construction, and response processing.
 * 
 * This client uses browser-like headers to successfully authenticate with Booli's GraphQL endpoint
 * without requiring API keys. It constructs GraphQL queries with inline parameters rather than
 * variables, as required by Booli's implementation.
 */
export class BooliGraphQLClient {
  /** The GraphQL client instance for making HTTP requests */
  private client: GraphQLClient;
  
  /** The base URL for Booli's GraphQL endpoint */
  private readonly baseUrl: string;

  /**
   * Creates a new BooliGraphQLClient instance.
   * Initializes the GraphQL client with browser-like headers for authentication.
   * The base URL can be overridden via the BOOLI_GRAPHQL_URL environment variable.
   */
  constructor() {
    this.baseUrl = process.env.BOOLI_GRAPHQL_URL || 'https://www.booli.se/graphql';
    this.client = new GraphQLClient(this.baseUrl, {
      headers: {
        // Browser-like headers required for Booli API authentication
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
        'Origin': 'https://www.booli.se',
        'Referer': 'https://www.booli.se/',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
    });
  }

  /**
   * Searches for properties for sale using the provided criteria.
   * 
   * This method constructs a GraphQL query with inline parameters (not variables)
   * as required by Booli's API implementation. It supports union types (Property and Listing)
   * to handle different property data structures returned by the API.
   * 
   * @param criteria - The search criteria including location, price range, etc.
   * @returns Promise resolving to the API response with property search results
   * @throws Error if the GraphQL query fails or the API returns an error
   */
  async searchForSale(criteria: SearchCriteria): Promise<ApiResponse> {
    const searchInput = this.buildSearchInput(criteria);
    
    // Convert filters array to GraphQL syntax
    // Booli's API requires inline filter objects rather than variables
    const filtersStr = searchInput.filters.map((filter: { key: string; value: string }) => 
      `{ key: "${filter.key}", value: "${filter.value}" }`
    ).join(', ');
    
    // Construct GraphQL query with inline parameters
    // Note: Booli's API does not accept GraphQL variables, only inline parameters
    const query = `
      query searchCount {
        searchForSale(
          input: {
            filters: [${filtersStr}]
            ${searchInput.areaId ? `areaId: "${searchInput.areaId}"` : ''}
            page: ${searchInput.page}
            ascending: ${searchInput.ascending}
            excludeAncestors: ${searchInput.excludeAncestors}
          }
        ) {
          totalCount
          result {
            ... on Property {
              id
              livingArea {
                value
                formatted
              }
              rooms {
                value
                formatted
              }
              plotArea {
                value
                formatted
              }
              objectType
              streetAddress
              latitude
              longitude
              url
            }
            ... on Listing {
              id
              listPrice {
                formatted
                value
                unit
                raw
              }
              listSqmPrice {
                formatted
              }
              livingArea {
                value
                formatted
              }
              rooms {
                value
                formatted
              }
              objectType
              streetAddress
              daysActive
              published
              tenureForm
              latitude
              longitude
              url
              estimate {
                price {
                  formatted
                }
              }
              agency {
                name
                url
              }
              amenities {
                key
                label
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.client.request<{ searchForSale: any }>(query);
      
      return {
        data: {
          searchForSale: response.searchForSale,
        },
      };
    } catch (error) {
      console.error('GraphQL query failed:', error);
      throw new Error(`Failed to search properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Builds the search input object for the GraphQL query.
   * 
   * Converts the SearchCriteria interface into the filter format expected by
   * Booli's GraphQL API. This includes mapping property types to Swedish terms
   * and handling extended search criteria through type assertion.
   * 
   * @param criteria - The search criteria to convert
   * @returns An object containing filters array and search parameters
   */
  private buildSearchInput(criteria: SearchCriteria): Record<string, any> {
    const filters: Array<{ key: string; value: string }> = [];

    // Price filters - converted to string values as required by the API
    if (criteria.minPrice !== undefined) {
      filters.push({ key: "minListPrice", value: criteria.minPrice.toString() });
    }
    if (criteria.maxPrice !== undefined) {
      filters.push({ key: "maxListPrice", value: criteria.maxPrice.toString() });
    }

    // Room filters - supports fractional rooms (e.g., 1.5, 2.5)
    if (criteria.minRooms !== undefined) {
      filters.push({ key: "minRooms", value: criteria.minRooms.toString() });
    }
    if (criteria.maxRooms !== undefined) {
      filters.push({ key: "maxRooms", value: criteria.maxRooms.toString() });
    }

    // Living area filters in square meters
    if (criteria.minArea !== undefined) {
      filters.push({ key: "minLivingArea", value: criteria.minArea.toString() });
    }
    if (criteria.maxArea !== undefined) {
      filters.push({ key: "maxLivingArea", value: criteria.maxArea.toString() });
    }

    // Property type mapping to Swedish terms
    if (criteria.propertyType === 'apartment') {
      filters.push({ key: "objectType", value: "Lägenhet" });
    } else if (criteria.propertyType === 'house') {
      filters.push({ key: "objectType", value: "Villa" });
    }

    // Extended criteria support - using type assertion for additional filters
    // These are passed through the MCP tool but not in the base SearchCriteria interface
    if ((criteria as any).minPricePerSqm !== undefined) {
      filters.push({ key: "minListSqmPrice", value: (criteria as any).minPricePerSqm.toString() });
    }
    if ((criteria as any).maxPricePerSqm !== undefined) {
      filters.push({ key: "maxListSqmPrice", value: (criteria as any).maxPricePerSqm.toString() });
    }
    if ((criteria as any).minPlotArea !== undefined) {
      filters.push({ key: "minPlotArea", value: (criteria as any).minPlotArea.toString() });
    }
    if ((criteria as any).maxPlotArea !== undefined) {
      filters.push({ key: "maxPlotArea", value: (criteria as any).maxPlotArea.toString() });
    }
    if ((criteria as any).minConstructionYear !== undefined) {
      filters.push({ key: "minConstructionYear", value: (criteria as any).minConstructionYear.toString() });
    }
    if ((criteria as any).maxConstructionYear !== undefined) {
      filters.push({ key: "maxConstructionYear", value: (criteria as any).maxConstructionYear.toString() });
    }
    if ((criteria as any).maxRent !== undefined) {
      filters.push({ key: "maxRent", value: (criteria as any).maxRent.toString() });
    }
    if ((criteria as any).daysActive !== undefined) {
      filters.push({ key: "daysActive", value: (criteria as any).daysActive.toString() });
    }
    if ((criteria as any).amenities) {
      filters.push({ key: "amenities", value: (criteria as any).amenities });
    }
    if ((criteria as any).floor) {
      filters.push({ key: "floor", value: (criteria as any).floor });
    }
    if ((criteria as any).showOnly) {
      filters.push({ key: "showOnly", value: (criteria as any).showOnly });
    }

    // Build the complete search input object
    const input: Record<string, any> = {
      filters: filters,
      page: 1,                    // Always start with first page
      ascending: false,           // Sort by relevance/newest first
      excludeAncestors: true      // Exclude parent area results
    };

    // Handle location parameter
    // Can be either a numeric area ID (e.g., "509") or a text location name
    if (criteria.location) {
      if (/^\d+$/.test(criteria.location)) {
        // Numeric location ID - use directly as areaId
        input.areaId = criteria.location;
      } else {
        // Text location - pass as areaId and let the API handle resolution
        input.areaId = criteria.location;
      }
    }

    return input;
  }

  /**
   * Performs GraphQL schema introspection to understand the API structure.
   * 
   * This method is useful for debugging and understanding the available
   * fields and types in Booli's GraphQL API. It returns the schema metadata
   * including type definitions and field information.
   * 
   * @returns Promise resolving to the schema introspection result, or null if failed
   */
  async introspectSchema(): Promise<any> {
    try {
      const introspectionQuery = `
        query IntrospectionQuery {
          __schema {
            types {
              name
              kind
              description
              fields {
                name
                type {
                  name
                  kind
                }
              }
            }
          }
        }
      `;
      
      const result = await this.client.request(introspectionQuery);
      return result;
    } catch (error) {
      console.error('Schema introspection failed:', error);
      return null;
    }
  }

  /**
   * Searches for location suggestions using the provided search query.
   * 
   * This method constructs a GraphQL query to find area suggestions based on
   * partial location names. It's useful for location discovery and helping users
   * find the correct area IDs for property searches.
   * 
   * @param criteria - The search criteria containing the query string
   * @returns Promise resolving to the API response with location suggestions
   * @throws Error if the GraphQL query fails or the API returns an error
   */
  async searchLocations(criteria: LocationSearchCriteria): Promise<LocationApiResponse> {
    // Construct GraphQL query for area suggestion search
    const query = `
      query areaSuggestionSearch {
        areaSuggestionSearch(search: "${criteria.query}") {
          suggestions {
            id
            displayName
            parent
            parentType
            parentDisplayName
            parentTypeDisplayName
            parentId
          }
        }
      }
    `;

    try {
      const response = await this.client.request<{ areaSuggestionSearch: any }>(query);
      
      return {
        data: {
          areaSuggestionSearch: response.areaSuggestionSearch,
        },
      };
    } catch (error) {
      console.error('Location search query failed:', error);
      throw new Error(`Failed to search locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves detailed information for a specific property by ID.
   * 
   * This method uses the same GraphQL query structure as searchForSale but filters
   * by property ID to return comprehensive details for a single property. It includes
   * all available property fields including pricing, images, agency information, and amenities.
   * 
   * @param criteria - The property detail criteria containing the property ID
   * @returns Promise resolving to the API response with detailed property information
   * @throws Error if the GraphQL query fails, property not found, or API returns an error
   */
  async getPropertyDetails(criteria: PropertyDetailCriteria): Promise<ApiResponse> {
    // Note: Direct property ID lookup is not supported by Booli's GraphQL API
    // The API requires location or other search filters and doesn't support querying by property ID alone
    // For this implementation, we'll return a helpful message explaining the limitation
    
    throw new Error(`Direct property lookup by ID is not supported by Booli's API. Property ID ${criteria.propertyId} cannot be retrieved directly. Please use the search_properties tool with location or other filters to find properties, then reference the detailed information from the search results.`);
  }

  /**
   * Tests the connection to Booli's GraphQL API.
   * 
   * Performs a simple introspection query to verify that the API is accessible
   * and the authentication headers are working correctly. This is useful for
   * health checks and debugging connection issues.
   * 
   * @returns Promise resolving to true if connection successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try a simple introspection query to test connectivity
      const query = `
        query Test {
          __schema {
            queryType {
              name
            }
          }
        }
      `;
      
      await this.client.request(query);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}