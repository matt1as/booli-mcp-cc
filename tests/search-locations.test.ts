/**
 * @fileoverview Unit tests for the location search MCP tool.
 * Tests the searchLocations function with various input scenarios and validates
 * proper error handling, input validation, and response formatting.
 */

import { searchLocations } from '../src/tools/searchLocations';
import { BooliGraphQLClient } from '../src/client/graphql';

// Mock the GraphQL client
jest.mock('../src/client/graphql');
const MockedBooliGraphQLClient = jest.mocked(BooliGraphQLClient);

describe('searchLocations', () => {
  let mockClient: jest.Mocked<BooliGraphQLClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock client instance
    mockClient = {
      searchLocations: jest.fn(),
      searchForSale: jest.fn(),
      buildSearchInput: jest.fn(),
      introspectSchema: jest.fn(),
      testConnection: jest.fn(),
    } as any;

    // Mock the constructor to return our mock client
    MockedBooliGraphQLClient.mockImplementation(() => mockClient);
  });

  describe('Input Validation', () => {
    it('should return error for missing query parameter', async () => {
      const result = await searchLocations({} as any);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Query parameter is required');
    });

    it('should return error for non-string query parameter', async () => {
      const result = await searchLocations({ query: 123 } as any);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Query parameter is required');
    });

    it('should return error for empty query string', async () => {
      const result = await searchLocations({ query: '' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Search query cannot be empty');
    });

    it('should return error for whitespace-only query string', async () => {
      const result = await searchLocations({ query: '   ' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Search query cannot be empty');
    });

    it('should return error for query string that is too short', async () => {
      const result = await searchLocations({ query: 'a' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Search query must be at least 2 characters long');
    });

    it('should accept valid query string with minimum length', async () => {
      const mockResponse = {
        data: {
          areaSuggestionSearch: {
            suggestions: []
          }
        }
      };

      mockClient.searchLocations.mockResolvedValue(mockResponse);

      const result = await searchLocations({ query: 'ab' });

      expect(result.isError).toBeUndefined();
      expect(mockClient.searchLocations).toHaveBeenCalledWith({ query: 'ab' });
    });
  });

  describe('Successful Searches', () => {
    const mockLocationResponse = {
      data: {
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
      }
    };

    it('should return formatted location suggestions for valid query', async () => {
      mockClient.searchLocations.mockResolvedValue(mockLocationResponse);

      const result = await searchLocations({ query: 'ektorp' });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Found 2 location suggestions for "ektorp"');
      expect(result.content[0].text).toContain('**Ektorp** (ID: 509)');
      expect(result.content[0].text).toContain('**Ektorpsvägen** (ID: 99592)');
      expect(result.content[0].text).toContain('Located in: Nacka kommun');
      expect(result.content[0].text).toContain('Type: Kommun');
      expect(result.content[0].text).toContain('Parent ID: 76');
      expect(result.content[0].text).toContain('Use this ID (509) for property searches');
      expect(result.content[0].text).toContain('How to use these results:');
    });

    it('should respect the limit parameter', async () => {
      const mockManyResults = {
        data: {
          areaSuggestionSearch: {
            suggestions: Array.from({ length: 15 }, (_, i) => ({
              id: `${500 + i}`,
              displayName: `Location ${i}`,
              parent: 'Test',
              parentType: 'Kommun',
              parentDisplayName: 'Test kommun',
              parentTypeDisplayName: 'Kommun',
              parentId: '1'
            }))
          }
        }
      };

      mockClient.searchLocations.mockResolvedValue(mockManyResults);

      const result = await searchLocations({ query: 'test', limit: 5 });

      expect(result.content[0].text).toContain('Found 15 location suggestions');
      expect(result.content[0].text).toContain('(showing first 5)');
      
      // Count the numbered entries (1. through 5.)
      const numberedEntries = result.content[0].text.match(/^\d+\./gm);
      expect(numberedEntries).toHaveLength(5);
    });

    it('should use default limit of 10 when not specified', async () => {
      const mockManyResults = {
        data: {
          areaSuggestionSearch: {
            suggestions: Array.from({ length: 20 }, (_, i) => ({
              id: `${500 + i}`,
              displayName: `Location ${i}`,
              parent: 'Test',
              parentType: 'Kommun',
              parentDisplayName: 'Test kommun',
              parentTypeDisplayName: 'Kommun',
              parentId: '1'
            }))
          }
        }
      };

      mockClient.searchLocations.mockResolvedValue(mockManyResults);

      const result = await searchLocations({ query: 'test' });

      expect(result.content[0].text).toContain('Found 20 location suggestions');
      expect(result.content[0].text).toContain('(showing first 10)');
      
      // Count the numbered entries (1. through 10.)
      const numberedEntries = result.content[0].text.match(/^\d+\./gm);
      expect(numberedEntries).toHaveLength(10);
    });

    it('should trim whitespace from query parameter', async () => {
      mockClient.searchLocations.mockResolvedValue(mockLocationResponse);

      await searchLocations({ query: '  ektorp  ' });

      expect(mockClient.searchLocations).toHaveBeenCalledWith({ query: 'ektorp' });
    });
  });

  describe('Empty Results', () => {
    it('should handle empty search results gracefully', async () => {
      const emptyResponse = {
        data: {
          areaSuggestionSearch: {
            suggestions: []
          }
        }
      };

      mockClient.searchLocations.mockResolvedValue(emptyResponse);

      const result = await searchLocations({ query: 'nonexistent' });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('No locations found matching "nonexistent"');
      expect(result.content[0].text).toContain('Try a different search term');
    });
  });

  describe('Error Handling', () => {
    it('should handle GraphQL client errors', async () => {
      const errorMessage = 'GraphQL query failed';
      mockClient.searchLocations.mockRejectedValue(new Error(errorMessage));

      const result = await searchLocations({ query: 'test' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error searching for locations');
      expect(result.content[0].text).toContain(errorMessage);
    });

    it('should handle unknown errors gracefully', async () => {
      mockClient.searchLocations.mockRejectedValue('Unknown error');

      const result = await searchLocations({ query: 'test' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error searching for locations');
      expect(result.content[0].text).toContain('Unknown error occurred');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockClient.searchLocations.mockRejectedValue(timeoutError);

      const result = await searchLocations({ query: 'test' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error searching for locations');
      expect(result.content[0].text).toContain('Request timeout');
    });
  });

  describe('Response Format Validation', () => {
    it('should format location information correctly', async () => {
      const singleLocationResponse = {
        data: {
          areaSuggestionSearch: {
            suggestions: [
              {
                id: '12345',
                displayName: 'Test Location',
                parent: 'Test Parent',
                parentType: 'Region',
                parentDisplayName: 'Test Parent Region',
                parentTypeDisplayName: 'Region Type',
                parentId: '999'
              }
            ]
          }
        }
      };

      mockClient.searchLocations.mockResolvedValue(singleLocationResponse);

      const result = await searchLocations({ query: 'test' });

      const text = result.content[0].text;
      expect(text).toContain('1. **Test Location** (ID: 12345)');
      expect(text).toContain('📍 Located in: Test Parent Region');
      expect(text).toContain('🏛️  Type: Region Type');
      expect(text).toContain('🔗 Parent ID: 999');
      expect(text).toContain('💡 Use this ID (12345) for property searches');
    });

    it('should include usage instructions in all responses', async () => {
      const mockResponse = {
        data: {
          areaSuggestionSearch: {
            suggestions: [
              {
                id: '1',
                displayName: 'Test',
                parent: 'Parent',
                parentType: 'Type',
                parentDisplayName: 'Parent Display',
                parentTypeDisplayName: 'Type Display',
                parentId: '2'
              }
            ]
          }
        }
      };

      mockClient.searchLocations.mockResolvedValue(mockResponse);

      const result = await searchLocations({ query: 'test' });

      const text = result.content[0].text;
      expect(text).toContain('**How to use these results:**');
      expect(text).toContain('Copy the ID number to use in property searches');
      expect(text).toContain('search_properties with location="509"');
      expect(text).toContain('Larger areas (like municipalities) will show more properties');
    });
  });
});