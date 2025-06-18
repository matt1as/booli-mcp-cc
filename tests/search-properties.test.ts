import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the GraphQL client
const mockSearchForSale = jest.fn() as jest.MockedFunction<any>;
jest.mock('../src/client/graphql', () => ({
  BooliGraphQLClient: jest.fn().mockImplementation(() => ({
    searchForSale: mockSearchForSale
  }))
}));

import { searchProperties } from '../src/tools/searchProperties';

describe('searchProperties Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockApiResponse = {
    data: {
      searchForSale: {
        totalCount: 2,
        result: [
          {
            id: "5750842",
            livingArea: {
              value: "29,5",
              formatted: "29,5 m²"
            },
            rooms: {
              value: "1",
              formatted: "1 rum"
            },
            plotArea: null,
            listPrice: {
              value: "1 695 000",
              formatted: "1 695 000 kr"
            }
          },
          {
            id: "5750843",
            livingArea: {
              value: "55",
              formatted: "55 m²"
            },
            rooms: {
              value: "2",
              formatted: "2 rum"
            },
            plotArea: {
              value: "150",
              formatted: "150 m²"
            },
            listPrice: {
              value: "3 200 000",
              formatted: "3 200 000 kr"
            }
          }
        ]
      }
    }
  };

  describe('Successful searches', () => {
    it('should handle basic location search', async () => {
      mockSearchForSale.mockResolvedValue(mockApiResponse);

      const args = {
        location: "Stockholm"
      };

      const result = await searchProperties(args);

      expect(mockSearchForSale).toHaveBeenCalledWith({
        location: "Stockholm",
        minPrice: undefined,
        maxPrice: undefined,
        minRooms: undefined,
        maxRooms: undefined,
        minArea: undefined,
        maxArea: undefined,
        propertyType: undefined
      });

      expect(result.content).toHaveLength(2);
      expect(result.content[0].text).toContain("Found 2 properties in Stockholm");
      expect(result.content[0].text).toContain("Property ID: 5750842");
      expect(result.content[0].text).toContain("1 695 000 kr");
    });

    it('should handle price range search', async () => {
      mockSearchForSale.mockResolvedValue(mockApiResponse);

      const args = {
        minPrice: 1000000,
        maxPrice: 5000000,
        location: "Göteborg"
      };

      const result = await searchProperties(args);

      expect(mockSearchForSale).toHaveBeenCalledWith({
        location: "Göteborg",
        minPrice: 1000000,
        maxPrice: 5000000,
        minRooms: undefined,
        maxRooms: undefined,
        minArea: undefined,
        maxArea: undefined,
        propertyType: undefined
      });

      expect(result.content[0].text).toContain("Found 2 properties in Göteborg");
    });

    it('should handle rooms and area filters', async () => {
      mockSearchForSale.mockResolvedValue(mockApiResponse);

      const args = {
        minRooms: 2,
        maxRooms: 4,
        minArea: 50,
        maxArea: 120,
        propertyType: "apartment"
      };

      const result = await searchProperties(args);

      expect(mockSearchForSale).toHaveBeenCalledWith({
        location: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        minRooms: 2,
        maxRooms: 4,
        minArea: 50,
        maxArea: 120,
        propertyType: "apartment"
      });
    });

    it('should handle custom limit parameter', async () => {
      const largeResponse = {
        data: {
          searchForSale: {
            totalCount: 50,
            result: Array.from({ length: 20 }, (_, i) => ({
              id: `${i + 1}`,
              livingArea: { value: "50", formatted: "50 m²" },
              rooms: { value: "2", formatted: "2 rum" },
              plotArea: null,
              listPrice: { value: "2500000", formatted: "2 500 000 kr" }
            }))
          }
        }
      };

      mockSearchForSale.mockResolvedValue(largeResponse);

      const args = {
        location: "Stockholm",
        limit: 5
      };

      const result = await searchProperties(args);

      expect(result.content[0].text).toContain("Found 50 properties");
      expect(result.content[0].text).toContain("(showing first 5)");
      
      // Count the number of properties listed
      const propertyMatches = result.content[0].text.match(/Property ID: \d+/g);
      expect(propertyMatches).toHaveLength(5);
    });

    it('should handle default limit when not specified', async () => {
      const largeResponse = {
        data: {
          searchForSale: {
            totalCount: 50,
            result: Array.from({ length: 20 }, (_, i) => ({
              id: `${i + 1}`,
              livingArea: { value: "50", formatted: "50 m²" },
              rooms: { value: "2", formatted: "2 rum" },
              plotArea: null,
              listPrice: { value: "2500000", formatted: "2 500 000 kr" }
            }))
          }
        }
      };

      mockSearchForSale.mockResolvedValue(largeResponse);

      const args = {
        location: "Stockholm"
      };

      const result = await searchProperties(args);

      expect(result.content[0].text).toContain("(showing first 10)");
      
      // Count the number of properties listed (should be 10 by default)
      const propertyMatches = result.content[0].text.match(/Property ID: \d+/g);
      expect(propertyMatches).toHaveLength(10);
    });

    it('should format property details correctly', async () => {
      mockSearchForSale.mockResolvedValue(mockApiResponse);

      const args = { location: "Stockholm" };
      const result = await searchProperties(args);

      const text = result.content[0].text;
      
      // Check first property formatting
      expect(text).toContain("1. Property ID: 5750842");
      expect(text).toContain("Rooms: 1 rum");
      expect(text).toContain("Living Area: 29,5 m²");
      expect(text).toContain("List Price: 1 695 000 kr");
      
      // Check second property formatting
      expect(text).toContain("2. Property ID: 5750843");
      expect(text).toContain("Rooms: 2 rum");
      expect(text).toContain("Living Area: 55 m²");
      expect(text).toContain("Plot Area: 150 m²");
      expect(text).toContain("List Price: 3 200 000 kr");
    });

    it('should include raw JSON data in response', async () => {
      mockSearchForSale.mockResolvedValue(mockApiResponse);

      const args = { location: "Stockholm" };
      const result = await searchProperties(args);

      expect(result.content).toHaveLength(2);
      expect(result.content[1].text).toContain("Raw data:");
      expect(result.content[1].text).toContain('"totalCount": 2');
      expect(result.content[1].text).toContain('"id": "5750842"');
    });

    it('should handle properties with null values gracefully', async () => {
      const responseWithNulls = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: "12345",
                livingArea: null,
                rooms: { value: "2", formatted: "2 rum" },
                plotArea: null,
                listPrice: null
              }
            ]
          }
        }
      };

      mockSearchForSale.mockResolvedValue(responseWithNulls);

      const args = { location: "Stockholm" };
      const result = await searchProperties(args);

      const text = result.content[0].text;
      expect(text).toContain("Property ID: 12345");
      expect(text).toContain("Rooms: 2 rum");
      expect(text).not.toContain("Living Area:");
      expect(text).not.toContain("Plot Area:");
      expect(text).not.toContain("List Price:");
    });
  });

  describe('Empty results', () => {
    it('should handle empty search results', async () => {
      const emptyResponse = {
        data: {
          searchForSale: {
            totalCount: 0,
            result: []
          }
        }
      };

      mockSearchForSale.mockResolvedValue(emptyResponse);

      const args = {
        location: "Nonexistent City",
        minPrice: 10000000
      };

      const result = await searchProperties(args);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(
        "No properties found matching your criteria in Nonexistent City."
      );
    });

    it('should handle empty results without location', async () => {
      const emptyResponse = {
        data: {
          searchForSale: {
            totalCount: 0,
            result: []
          }
        }
      };

      mockSearchForSale.mockResolvedValue(emptyResponse);

      const args = {
        minPrice: 10000000,
        maxPrice: 15000000
      };

      const result = await searchProperties(args);

      expect(result.content[0].text).toBe(
        "No properties found matching your criteria in the specified area."
      );
    });
  });

  describe('Error handling', () => {
    it('should handle GraphQL client errors', async () => {
      const errorMessage = "API connection failed";
      mockSearchForSale.mockRejectedValue(new Error(errorMessage));

      const args = { location: "Stockholm" };
      const result = await searchProperties(args);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(
        `Error searching for properties: ${errorMessage}`
      );
      expect(result.isError).toBe(true);
    });

    it('should handle unknown error types', async () => {
      mockSearchForSale.mockRejectedValue("Unknown error type");

      const args = { location: "Stockholm" };
      const result = await searchProperties(args);

      expect(result.content[0].text).toBe(
        "Error searching for properties: Unknown error occurred"
      );
      expect(result.isError).toBe(true);
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      mockSearchForSale.mockRejectedValue(timeoutError);

      const args = { location: "Stockholm" };
      const result = await searchProperties(args);

      expect(result.content[0].text).toBe(
        "Error searching for properties: Request timeout"
      );
      expect(result.isError).toBe(true);
    });
  });

  describe('Input validation', () => {
    it('should handle empty arguments object', async () => {
      mockSearchForSale.mockResolvedValue(mockApiResponse);

      const args = {};
      const result = await searchProperties(args);

      expect(mockSearchForSale).toHaveBeenCalledWith({
        location: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        minRooms: undefined,
        maxRooms: undefined,
        minArea: undefined,
        maxArea: undefined,
        propertyType: undefined
      });
    });

    it('should handle zero values correctly', async () => {
      mockSearchForSale.mockResolvedValue(mockApiResponse);

      const args = {
        minPrice: 0,
        minRooms: 0,
        minArea: 0
      };

      const result = await searchProperties(args);

      expect(mockSearchForSale).toHaveBeenCalledWith({
        location: undefined,
        minPrice: 0,
        maxPrice: undefined,
        minRooms: 0,
        maxRooms: undefined,
        minArea: 0,
        maxArea: undefined,
        propertyType: undefined
      });
    });
  });
});