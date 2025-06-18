/**
 * @fileoverview Unit tests for the location search functionality in the GraphQL client.
 * Tests the BooliGraphQLClient.searchLocations method with various scenarios including
 * successful queries, error handling, and response validation.
 */

import { BooliGraphQLClient } from '../src/client/graphql';
import { LocationSearchCriteria, LocationApiResponse } from '../src/types';

// Mock the graphql-request library
jest.mock('graphql-request');
import { GraphQLClient } from 'graphql-request';

const MockedGraphQLClient = jest.mocked(GraphQLClient);

describe('BooliGraphQLClient Location Search', () => {
  let client: BooliGraphQLClient;
  let mockGraphQLClient: jest.Mocked<GraphQLClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock GraphQL client instance
    mockGraphQLClient = {
      request: jest.fn(),
    } as any;

    // Mock the GraphQLClient constructor to return our mock
    MockedGraphQLClient.mockImplementation(() => mockGraphQLClient);

    // Create a new client instance
    client = new BooliGraphQLClient();
  });

  describe('searchLocations', () => {
    const validCriteria: LocationSearchCriteria = {
      query: 'ektorp'
    };

    const mockApiResponse = {
      areaSuggestionSearch: {
        suggestions: [
          {
            id: '509',
            displayName: 'Ektorp',
            parent: 'Nacka',
            parentType: 'Kommun',
            parentDisplayName: 'Nacka kommun',
            parentTypeDisplayName: 'Kommun',
            parentId: '76'
          },
          {
            id: '99592',
            displayName: 'Ektorpsvägen',
            parent: 'Nacka',
            parentType: 'Kommun',
            parentDisplayName: 'Nacka kommun',
            parentTypeDisplayName: 'Kommun',
            parentId: '76'
          }
        ]
      }
    };

    it('should construct correct GraphQL query', async () => {
      mockGraphQLClient.request.mockResolvedValue(mockApiResponse);

      await client.searchLocations(validCriteria);

      expect(mockGraphQLClient.request).toHaveBeenCalledTimes(1);
      
      const [query] = mockGraphQLClient.request.mock.calls[0];
      expect(query).toContain('query areaSuggestionSearch');
      expect(query).toContain('areaSuggestionSearch(search: "ektorp")');
      expect(query).toContain('suggestions');
      expect(query).toContain('id');
      expect(query).toContain('displayName');
      expect(query).toContain('parent');
      expect(query).toContain('parentType');
      expect(query).toContain('parentDisplayName');
      expect(query).toContain('parentTypeDisplayName');
      expect(query).toContain('parentId');
    });

    it('should return properly formatted response for successful query', async () => {
      mockGraphQLClient.request.mockResolvedValue(mockApiResponse);

      const result: LocationApiResponse = await client.searchLocations(validCriteria);

      expect(result).toEqual({
        data: {
          areaSuggestionSearch: mockApiResponse.areaSuggestionSearch
        }
      });

      expect(result.data.areaSuggestionSearch.suggestions).toHaveLength(2);
      expect(result.data.areaSuggestionSearch.suggestions[0].id).toBe('509');
      expect(result.data.areaSuggestionSearch.suggestions[0].displayName).toBe('Ektorp');
      expect(result.data.areaSuggestionSearch.suggestions[1].id).toBe('99592');
      expect(result.data.areaSuggestionSearch.suggestions[1].displayName).toBe('Ektorpsvägen');
    });

    it('should handle empty search results', async () => {
      const emptyResponse = {
        areaSuggestionSearch: {
          suggestions: []
        }
      };

      mockGraphQLClient.request.mockResolvedValue(emptyResponse);

      const result = await client.searchLocations(validCriteria);

      expect(result.data.areaSuggestionSearch.suggestions).toHaveLength(0);
    });

    it('should handle single search result', async () => {
      const singleResponse = {
        areaSuggestionSearch: {
          suggestions: [
            {
              id: '123',
              displayName: 'Single Location',
              parent: 'Parent',
              parentType: 'Type',
              parentDisplayName: 'Parent Display',
              parentTypeDisplayName: 'Type Display',
              parentId: '456'
            }
          ]
        }
      };

      mockGraphQLClient.request.mockResolvedValue(singleResponse);

      const result = await client.searchLocations(validCriteria);

      expect(result.data.areaSuggestionSearch.suggestions).toHaveLength(1);
      expect(result.data.areaSuggestionSearch.suggestions[0].id).toBe('123');
    });

    it('should escape special characters in query string', async () => {
      const criteriaWithSpecialChars: LocationSearchCriteria = {
        query: 'test"query\\with/special'
      };

      mockGraphQLClient.request.mockResolvedValue(mockApiResponse);

      await client.searchLocations(criteriaWithSpecialChars);

      const [query] = mockGraphQLClient.request.mock.calls[0];
      expect(query).toContain('areaSuggestionSearch(search: "test"query\\\\with/special")');
    });

    it('should handle Swedish characters in query', async () => {
      const swedishCriteria: LocationSearchCriteria = {
        query: 'södermalm'
      };

      mockGraphQLClient.request.mockResolvedValue(mockApiResponse);

      await client.searchLocations(swedishCriteria);

      const [query] = mockGraphQLClient.request.mock.calls[0];
      expect(query).toContain('areaSuggestionSearch(search: "södermalm")');
    });
  });

  describe('Error Handling', () => {
    const validCriteria: LocationSearchCriteria = {
      query: 'test'
    };

    it('should throw descriptive error for GraphQL failures', async () => {
      const graphqlError = new Error('GraphQL query failed: Invalid syntax');
      mockGraphQLClient.request.mockRejectedValue(graphqlError);

      await expect(client.searchLocations(validCriteria)).rejects.toThrow(
        'Failed to search locations: GraphQL query failed: Invalid syntax'
      );
    });

    it('should throw generic error for unknown failures', async () => {
      mockGraphQLClient.request.mockRejectedValue('Unknown error');

      await expect(client.searchLocations(validCriteria)).rejects.toThrow(
        'Failed to search locations: Unknown error'
      );
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockGraphQLClient.request.mockRejectedValue(timeoutError);

      await expect(client.searchLocations(validCriteria)).rejects.toThrow(
        'Failed to search locations: Request timeout'
      );
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized: 401');
      mockGraphQLClient.request.mockRejectedValue(authError);

      await expect(client.searchLocations(validCriteria)).rejects.toThrow(
        'Failed to search locations: Unauthorized: 401'
      );
    });

    it('should handle malformed response errors', async () => {
      const malformedError = new Error('Invalid JSON response');
      mockGraphQLClient.request.mockRejectedValue(malformedError);

      await expect(client.searchLocations(validCriteria)).rejects.toThrow(
        'Failed to search locations: Invalid JSON response'
      );
    });
  });

  describe('Query Construction Edge Cases', () => {
    it('should handle empty query string', async () => {
      const emptyCriteria: LocationSearchCriteria = {
        query: ''
      };

      mockGraphQLClient.request.mockResolvedValue({
        areaSuggestionSearch: { suggestions: [] }
      });

      await client.searchLocations(emptyCriteria);

      const [query] = mockGraphQLClient.request.mock.calls[0];
      expect(query).toContain('areaSuggestionSearch(search: "")');
    });

    it('should handle very long query strings', async () => {
      const longQuery = 'a'.repeat(1000);
      const longCriteria: LocationSearchCriteria = {
        query: longQuery
      };

      mockGraphQLClient.request.mockResolvedValue({
        areaSuggestionSearch: { suggestions: [] }
      });

      await client.searchLocations(longCriteria);

      const [query] = mockGraphQLClient.request.mock.calls[0];
      expect(query).toContain(`areaSuggestionSearch(search: "${longQuery}")`);
    });

    it('should handle whitespace in query', async () => {
      const whitespaceCriteria: LocationSearchCriteria = {
        query: '  test query  '
      };

      mockGraphQLClient.request.mockResolvedValue({
        areaSuggestionSearch: { suggestions: [] }
      });

      await client.searchLocations(whitespaceCriteria);

      const [query] = mockGraphQLClient.request.mock.calls[0];
      expect(query).toContain('areaSuggestionSearch(search: "  test query  ")');
    });
  });

  describe('Response Data Validation', () => {
    const validCriteria: LocationSearchCriteria = {
      query: 'test'
    };

    it('should handle response with all optional fields present', async () => {
      const completeResponse = {
        areaSuggestionSearch: {
          suggestions: [
            {
              id: '1',
              displayName: 'Complete Location',
              parent: 'Parent Name',
              parentType: 'Municipality',
              parentDisplayName: 'Full Parent Name',
              parentTypeDisplayName: 'Municipality Type',
              parentId: '100'
            }
          ]
        }
      };

      mockGraphQLClient.request.mockResolvedValue(completeResponse);

      const result = await client.searchLocations(validCriteria);

      const suggestion = result.data.areaSuggestionSearch.suggestions[0];
      expect(suggestion.id).toBe('1');
      expect(suggestion.displayName).toBe('Complete Location');
      expect(suggestion.parent).toBe('Parent Name');
      expect(suggestion.parentType).toBe('Municipality');
      expect(suggestion.parentDisplayName).toBe('Full Parent Name');
      expect(suggestion.parentTypeDisplayName).toBe('Municipality Type');
      expect(suggestion.parentId).toBe('100');
    });

    it('should handle response with missing optional fields', async () => {
      const partialResponse = {
        areaSuggestionSearch: {
          suggestions: [
            {
              id: '2',
              displayName: 'Partial Location',
              parent: '',
              parentType: '',
              parentDisplayName: '',
              parentTypeDisplayName: '',
              parentId: ''
            }
          ]
        }
      };

      mockGraphQLClient.request.mockResolvedValue(partialResponse);

      const result = await client.searchLocations(validCriteria);

      const suggestion = result.data.areaSuggestionSearch.suggestions[0];
      expect(suggestion.id).toBe('2');
      expect(suggestion.displayName).toBe('Partial Location');
      expect(suggestion.parent).toBe('');
      expect(suggestion.parentId).toBe('');
    });
  });

  describe('Client Configuration', () => {
    it('should use correct base URL for GraphQL endpoint', () => {
      // Verify that the client was instantiated with correct configuration
      expect(MockedGraphQLClient).toHaveBeenCalledWith(
        'https://www.booli.se/graphql',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('Mozilla'),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': 'https://www.booli.se',
            'Referer': 'https://www.booli.se/',
          })
        })
      );
    });

    it('should use environment variable for base URL if provided', () => {
      const originalEnv = process.env.BOOLI_GRAPHQL_URL;
      process.env.BOOLI_GRAPHQL_URL = 'https://custom.booli.se/graphql';

      // Create a new client with custom URL
      new BooliGraphQLClient();

      expect(MockedGraphQLClient).toHaveBeenCalledWith(
        'https://custom.booli.se/graphql',
        expect.any(Object)
      );

      // Restore original environment
      if (originalEnv) {
        process.env.BOOLI_GRAPHQL_URL = originalEnv;
      } else {
        delete process.env.BOOLI_GRAPHQL_URL;
      }
    });
  });
});