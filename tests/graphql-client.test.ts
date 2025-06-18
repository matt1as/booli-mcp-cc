import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { BooliGraphQLClient } from '../src/client/graphql';
import { SearchCriteria } from '../src/types';

// Mock the graphql-request module
const mockRequest = jest.fn() as jest.MockedFunction<any>;
const mockSetHeader = jest.fn();
jest.mock('graphql-request', () => ({
  GraphQLClient: jest.fn().mockImplementation(() => ({
    request: mockRequest,
    setHeader: mockSetHeader
  }))
}));

describe('BooliGraphQLClient', () => {
  let client: BooliGraphQLClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BOOLI_GRAPHQL_URL = 'https://test-api.booli.se/graphql';
    process.env.BOOLI_API_KEY = 'test-api-key';
    client = new BooliGraphQLClient();
  });

  afterEach(() => {
    delete process.env.BOOLI_GRAPHQL_URL;
    delete process.env.BOOLI_API_KEY;
  });

  describe('Constructor', () => {
    it('should use default URL when environment variable is not set', () => {
      delete process.env.BOOLI_GRAPHQL_URL;
      const newClient = new BooliGraphQLClient();
      expect(newClient).toBeDefined();
    });

    it('should handle missing API key gracefully', () => {
      delete process.env.BOOLI_API_KEY;
      const newClient = new BooliGraphQLClient();
      expect(newClient).toBeDefined();
    });
  });

  describe('searchForSale', () => {
    const mockGraphQLResponse = {
      searchForSale: {
        totalCount: 2,
        result: [
          {
            id: "1",
            livingArea: { value: "50", formatted: "50 m²" },
            rooms: { value: "2", formatted: "2 rum" },
            plotArea: null,
            listPrice: { value: "2500000", formatted: "2 500 000 kr" }
          },
          {
            id: "2",
            livingArea: { value: "75", formatted: "75 m²" },
            rooms: { value: "3", formatted: "3 rum" },
            plotArea: { value: "200", formatted: "200 m²" },
            listPrice: { value: "4500000", formatted: "4 500 000 kr" }
          }
        ]
      }
    };

    it('should execute search with location criteria', async () => {
      mockRequest.mockResolvedValue(mockGraphQLResponse);
      
      const criteria: SearchCriteria = {
        location: "Stockholm"
      };

      const result = await client.searchForSale(criteria);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('query SearchForSale'),
        {
          input: {
            location: "Stockholm"
          }
        }
      );
      expect(result.data.searchForSale.totalCount).toBe(2);
      expect(result.data.searchForSale.result).toHaveLength(2);
    });

    it('should execute search with price range criteria', async () => {
      mockRequest.mockResolvedValue(mockGraphQLResponse);
      
      const criteria: SearchCriteria = {
        minPrice: 1000000,
        maxPrice: 5000000
      };

      await client.searchForSale(criteria);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('query SearchForSale'),
        {
          input: {
            priceRange: {
              min: 1000000,
              max: 5000000
            }
          }
        }
      );
    });

    it('should execute search with rooms range criteria', async () => {
      mockRequest.mockResolvedValue(mockGraphQLResponse);
      
      const criteria: SearchCriteria = {
        minRooms: 2,
        maxRooms: 4
      };

      await client.searchForSale(criteria);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('query SearchForSale'),
        {
          input: {
            roomsRange: {
              min: 2,
              max: 4
            }
          }
        }
      );
    });

    it('should execute search with area range criteria', async () => {
      mockRequest.mockResolvedValue(mockGraphQLResponse);
      
      const criteria: SearchCriteria = {
        minArea: 50,
        maxArea: 150
      };

      await client.searchForSale(criteria);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('query SearchForSale'),
        {
          input: {
            areaRange: {
              min: 50,
              max: 150
            }
          }
        }
      );
    });

    it('should execute search with property type criteria', async () => {
      mockRequest.mockResolvedValue(mockGraphQLResponse);
      
      const criteria: SearchCriteria = {
        propertyType: 'apartment'
      };

      await client.searchForSale(criteria);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('query SearchForSale'),
        {
          input: {
            propertyType: "APARTMENT"
          }
        }
      );
    });

    it('should execute search with multiple criteria', async () => {
      mockRequest.mockResolvedValue(mockGraphQLResponse);
      
      const criteria: SearchCriteria = {
        location: "Göteborg",
        minPrice: 2000000,
        maxPrice: 6000000,
        minRooms: 2,
        propertyType: 'house'
      };

      await client.searchForSale(criteria);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('query SearchForSale'),
        {
          input: {
            location: "Göteborg",
            priceRange: {
              min: 2000000,
              max: 6000000
            },
            roomsRange: {
              min: 2
            },
            propertyType: "HOUSE"
          }
        }
      );
    });

    it('should handle partial price range (min only)', async () => {
      mockRequest.mockResolvedValue(mockGraphQLResponse);
      
      const criteria: SearchCriteria = {
        minPrice: 1000000
      };

      await client.searchForSale(criteria);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('query SearchForSale'),
        {
          input: {
            priceRange: {
              min: 1000000
            }
          }
        }
      );
    });

    it('should handle partial price range (max only)', async () => {
      mockRequest.mockResolvedValue(mockGraphQLResponse);
      
      const criteria: SearchCriteria = {
        maxPrice: 3000000
      };

      await client.searchForSale(criteria);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('query SearchForSale'),
        {
          input: {
            priceRange: {
              max: 3000000
            }
          }
        }
      );
    });

    it('should handle empty criteria', async () => {
      mockRequest.mockResolvedValue(mockGraphQLResponse);
      
      const criteria: SearchCriteria = {};

      await client.searchForSale(criteria);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('query SearchForSale'),
        {
          input: {}
        }
      );
    });

    it('should handle GraphQL errors gracefully', async () => {
      const errorMessage = 'GraphQL validation error';
      mockRequest.mockRejectedValue(new Error(errorMessage));
      
      const criteria: SearchCriteria = {
        location: "Stockholm"
      };

      await expect(client.searchForSale(criteria)).rejects.toThrow(
        `Failed to search properties: ${errorMessage}`
      );
    });

    it('should handle unknown errors gracefully', async () => {
      mockRequest.mockRejectedValue('Unknown error type');
      
      const criteria: SearchCriteria = {
        location: "Stockholm"
      };

      await expect(client.searchForSale(criteria)).rejects.toThrow(
        'Failed to search properties: Unknown error'
      );
    });
  });

  describe('buildSearchInput', () => {
    it('should not include undefined values in input', async () => {
      mockRequest.mockResolvedValue({
        searchForSale: { totalCount: 0, result: [] }
      });
      
      const criteria: SearchCriteria = {
        location: "Stockholm",
        minPrice: undefined,
        maxPrice: undefined,
        minRooms: undefined,
        maxRooms: undefined
      };

      await client.searchForSale(criteria);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('query SearchForSale'),
        {
          input: {
            location: "Stockholm"
          }
        }
      );
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      mockRequest.mockResolvedValue({
        searchForSale: { totalCount: 100 }
      });

      const result = await client.testConnection();

      expect(result).toBe(true);
      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('query Test')
      );
    });

    it('should return false when connection fails', async () => {
      mockRequest.mockRejectedValue(new Error('Connection failed'));

      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });
});