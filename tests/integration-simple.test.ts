import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the GraphQL client
const mockSearchForSale = jest.fn() as jest.MockedFunction<any>;
jest.mock('../src/client/graphql', () => ({
  BooliGraphQLClient: jest.fn().mockImplementation(() => ({
    searchForSale: mockSearchForSale
  }))
}));

import { searchProperties } from '../src/tools/searchProperties';

describe('Integration Tests - Tool Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Property Search Scenarios', () => {
    it('should handle complete property search workflow', async () => {
      const mockResponse = {
        data: {
          searchForSale: {
            totalCount: 3,
            result: [
              {
                id: "5750842",
                livingArea: { value: "29,5", formatted: "29,5 m²" },
                rooms: { value: "1", formatted: "1 rum" },
                plotArea: null,
                listPrice: { value: "1 695 000", formatted: "1 695 000 kr" }
              },
              {
                id: "5750843",
                livingArea: { value: "55", formatted: "55 m²" },
                rooms: { value: "2", formatted: "2 rum" },
                plotArea: { value: "150", formatted: "150 m²" },
                listPrice: { value: "3 200 000", formatted: "3 200 000 kr" }
              },
              {
                id: "5750844",
                livingArea: { value: "75", formatted: "75 m²" },
                rooms: { value: "3", formatted: "3 rum" },
                plotArea: null,
                listPrice: { value: "4 500 000", formatted: "4 500 000 kr" }
              }
            ]
          }
        }
      };

      mockSearchForSale.mockResolvedValue(mockResponse);

      const searchArgs = {
        location: "Stockholm",
        minPrice: 1000000,
        maxPrice: 5000000,
        propertyType: "apartment",
        limit: 10
      };

      const result = await searchProperties(searchArgs);

      // Verify GraphQL client was called with correct parameters
      expect(mockSearchForSale).toHaveBeenCalledWith({
        location: "Stockholm",
        minPrice: 1000000,
        maxPrice: 5000000,
        minRooms: undefined,
        maxRooms: undefined,
        minArea: undefined,
        maxArea: undefined,
        propertyType: "apartment"
      });

      // Verify response structure
      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe('text');
      expect(result.content[1].type).toBe('text');

      // Verify summary content
      const summaryText = result.content[0].text;
      expect(summaryText).toContain('Found 3 properties in Stockholm');
      expect(summaryText).toContain('Property ID: 5750842');
      expect(summaryText).toContain('Property ID: 5750843');
      expect(summaryText).toContain('Property ID: 5750844');
      expect(summaryText).toContain('1 695 000 kr');
      expect(summaryText).toContain('3 200 000 kr');
      expect(summaryText).toContain('4 500 000 kr');

      // Verify raw data content
      const rawDataText = result.content[1].text;
      expect(rawDataText).toContain('Raw data:');
      expect(rawDataText).toContain('"totalCount": 3');
      expect(rawDataText).toContain('"id": "5750842"');
    });

    it('should handle property search with geographic filtering', async () => {
      const mockResponse = {
        data: {
          searchForSale: {
            totalCount: 2,
            result: [
              {
                id: "house1",
                livingArea: { value: "120", formatted: "120 m²" },
                rooms: { value: "4", formatted: "4 rum" },
                plotArea: { value: "500", formatted: "500 m²" },
                listPrice: { value: "6 500 000", formatted: "6 500 000 kr" }
              },
              {
                id: "house2",
                livingArea: { value: "95", formatted: "95 m²" },
                rooms: { value: "3", formatted: "3 rum" },
                plotArea: { value: "300", formatted: "300 m²" },
                listPrice: { value: "4 800 000", formatted: "4 800 000 kr" }
              }
            ]
          }
        }
      };

      mockSearchForSale.mockResolvedValue(mockResponse);

      const searchArgs = {
        location: "Göteborg",
        propertyType: "house",
        minArea: 90,
        minRooms: 3
      };

      const result = await searchProperties(searchArgs);

      expect(mockSearchForSale).toHaveBeenCalledWith({
        location: "Göteborg",
        minPrice: undefined,
        maxPrice: undefined,
        minRooms: 3,
        maxRooms: undefined,
        minArea: 90,
        maxArea: undefined,
        propertyType: "house"
      });

      const summaryText = result.content[0].text;
      expect(summaryText).toContain('Found 2 properties in Göteborg');
      expect(summaryText).toContain('Property ID: house1');
      expect(summaryText).toContain('Plot Area: 500 m²');
      expect(summaryText).toContain('Plot Area: 300 m²');
    });

    it('should handle luxury property search with high price filters', async () => {
      const mockResponse = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: "luxury1",
                livingArea: { value: "200", formatted: "200 m²" },
                rooms: { value: "5", formatted: "5 rum" },
                plotArea: { value: "1000", formatted: "1000 m²" },
                listPrice: { value: "15 000 000", formatted: "15 000 000 kr" }
              }
            ]
          }
        }
      };

      mockSearchForSale.mockResolvedValue(mockResponse);

      const searchArgs = {
        location: "Östermalm",
        minPrice: 10000000,
        minRooms: 4,
        minArea: 150,
        propertyType: "apartment"
      };

      const result = await searchProperties(searchArgs);

      expect(mockSearchForSale).toHaveBeenCalledWith({
        location: "Östermalm",
        minPrice: 10000000,
        maxPrice: undefined,
        minRooms: 4,
        maxRooms: undefined,
        minArea: 150,
        maxArea: undefined,
        propertyType: "apartment"
      });

      const summaryText = result.content[0].text;
      expect(summaryText).toContain('Found 1 properties in Östermalm');
      expect(summaryText).toContain('15 000 000 kr');
      expect(summaryText).toContain('200 m²');
    });

    it('should handle large result set with pagination', async () => {
      const mockResponse = {
        data: {
          searchForSale: {
            totalCount: 150,
            result: Array.from({ length: 20 }, (_, i) => ({
              id: `prop${i + 1}`,
              livingArea: { value: `${50 + i * 2}`, formatted: `${50 + i * 2} m²` },
              rooms: { value: "2", formatted: "2 rum" },
              plotArea: null,
              listPrice: { value: `${2000000 + i * 50000}`, formatted: `${2000000 + i * 50000} kr` }
            }))
          }
        }
      };

      mockSearchForSale.mockResolvedValue(mockResponse);

      const searchArgs = {
        location: "Stockholm",
        propertyType: "apartment",
        limit: 5
      };

      const result = await searchProperties(searchArgs);

      const summaryText = result.content[0].text;
      expect(summaryText).toContain('Found 150 properties in Stockholm');
      expect(summaryText).toContain('(showing first 5)');
      
      // Count properties in output
      const propertyMatches = summaryText.match(/Property ID: prop\d+/g);
      expect(propertyMatches).toHaveLength(5);
      
      // Verify pagination worked correctly
      expect(summaryText).toContain('Property ID: prop1');
      expect(summaryText).toContain('Property ID: prop5');
      expect(summaryText).not.toContain('Property ID: prop6');
    });

    it('should handle API error scenarios gracefully', async () => {
      mockSearchForSale.mockRejectedValue(new Error('GraphQL API rate limit exceeded'));

      const searchArgs = {
        location: "Stockholm",
        maxPrice: 3000000
      };

      const result = await searchProperties(searchArgs);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(
        'Error searching for properties: GraphQL API rate limit exceeded'
      );
      expect(result.isError).toBe(true);
    });

    it('should handle empty result sets appropriately', async () => {
      const emptyResponse = {
        data: {
          searchForSale: {
            totalCount: 0,
            result: []
          }
        }
      };

      mockSearchForSale.mockResolvedValue(emptyResponse);

      const searchArgs = {
        location: "Remote Area",
        minPrice: 20000000,
        propertyType: "house"
      };

      const result = await searchProperties(searchArgs);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(
        'No properties found matching your criteria in Remote Area.'
      );
      expect(result.isError).toBeUndefined();
    });

    it('should handle mixed property types in results', async () => {
      const mixedResponse = {
        data: {
          searchForSale: {
            totalCount: 2,
            result: [
              {
                id: "apt1",
                livingArea: { value: "60", formatted: "60 m²" },
                rooms: { value: "2", formatted: "2 rum" },
                plotArea: null,
                listPrice: { value: "2 800 000", formatted: "2 800 000 kr" }
              },
              {
                id: "house1",
                livingArea: { value: "110", formatted: "110 m²" },
                rooms: { value: "4", formatted: "4 rum" },
                plotArea: { value: "400", formatted: "400 m²" },
                listPrice: { value: "5 200 000", formatted: "5 200 000 kr" }
              }
            ]
          }
        }
      };

      mockSearchForSale.mockResolvedValue(mixedResponse);

      const searchArgs = {
        location: "Suburb Area",
        minRooms: 2,
        maxPrice: 6000000
      };

      const result = await searchProperties(searchArgs);

      const summaryText = result.content[0].text;
      expect(summaryText).toContain('Found 2 properties in Suburb Area');
      
      // Apartment without plot area
      expect(summaryText).toContain('Property ID: apt1');
      expect(summaryText).toContain('2 800 000 kr');
      expect(summaryText).not.toContain('Plot Area: null');
      
      // House with plot area
      expect(summaryText).toContain('Property ID: house1');
      expect(summaryText).toContain('5 200 000 kr');
      expect(summaryText).toContain('Plot Area: 400 m²');
    });
  });

  describe('Parameter Validation Integration', () => {
    it('should handle all parameter combinations correctly', async () => {
      const mockResponse = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: "test1",
                livingArea: { value: "80", formatted: "80 m²" },
                rooms: { value: "3", formatted: "3 rum" },
                plotArea: null,
                listPrice: { value: "3 500 000", formatted: "3 500 000 kr" }
              }
            ]
          }
        }
      };

      mockSearchForSale.mockResolvedValue(mockResponse);

      const complexSearchArgs = {
        location: "Malmö",
        minPrice: 2000000,
        maxPrice: 4000000,
        minRooms: 2,
        maxRooms: 4,
        minArea: 70,
        maxArea: 120,
        propertyType: "apartment",
        limit: 15
      };

      await searchProperties(complexSearchArgs);

      expect(mockSearchForSale).toHaveBeenCalledWith({
        location: "Malmö",
        minPrice: 2000000,
        maxPrice: 4000000,
        minRooms: 2,
        maxRooms: 4,
        minArea: 70,
        maxArea: 120,
        propertyType: "apartment"
      });
    });

    it('should handle partial parameter sets correctly', async () => {
      const mockResponse = {
        data: {
          searchForSale: {
            totalCount: 5,
            result: []
          }
        }
      };

      mockSearchForSale.mockResolvedValue(mockResponse);

      const partialSearchArgs = {
        maxPrice: 2500000,
        propertyType: "house"
      };

      await searchProperties(partialSearchArgs);

      expect(mockSearchForSale).toHaveBeenCalledWith({
        location: undefined,
        minPrice: undefined,
        maxPrice: 2500000,
        minRooms: undefined,
        maxRooms: undefined,
        minArea: undefined,
        maxArea: undefined,
        propertyType: "house"
      });
    });
  });
});