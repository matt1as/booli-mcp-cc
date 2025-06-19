/**
 * @fileoverview Unit tests for the property detail functionality in the GraphQL client.
 * Tests the BooliGraphQLClient.getPropertyDetails method with various scenarios including
 * successful queries, error handling, and response validation.
 */

import { BooliGraphQLClient } from '../src/client/graphql';
import { PropertyDetailCriteria, ApiResponse } from '../src/types';

// Mock the graphql-request library
jest.mock('graphql-request');
import { GraphQLClient } from 'graphql-request';

const MockedGraphQLClient = jest.mocked(GraphQLClient);

describe('BooliGraphQLClient Property Details', () => {
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

  describe('getPropertyDetails', () => {
    const validCriteria: PropertyDetailCriteria = {
      propertyId: '12345'
    };

    const mockApiResponse = {
      searchForSale: {
        totalCount: 1,
        result: [
          {
            id: '12345',
            objectType: 'Lägenhet',
            streetAddress: 'Storgatan 15',
            descriptiveAreaName: 'Södermalm',
            location: {
              region: {
                municipalityName: 'Stockholm'
              }
            },
            rooms: {
              formatted: '3 rum'
            },
            livingArea: {
              formatted: '75 m²'
            },
            listPrice: {
              formatted: '4 500 000 kr',
              value: 4500000,
              unit: 'SEK',
              raw: 4500000
            },
            listSqmPrice: {
              formatted: '60 000 kr/m²'
            },
            tenureForm: 'Bostadsrätt',
            daysActive: 15,
            published: '2024-01-15',
            agency: {
              name: 'Fastighetsbyrån',
              url: 'https://fastighetsbyran.se'
            },
            amenities: [
              { key: 'balcony', label: 'Balkong' },
              { key: 'elevator', label: 'Hiss' }
            ],
            url: '/property/12345'
          }
        ]
      }
    };

    it('should construct correct GraphQL query for property details', async () => {
      mockGraphQLClient.request.mockResolvedValue(mockApiResponse);

      await client.getPropertyDetails(validCriteria);

      expect(mockGraphQLClient.request).toHaveBeenCalledTimes(1);
      
      const [query] = mockGraphQLClient.request.mock.calls[0];
      expect(query).toContain('query propertyDetails');
      expect(query).toContain('searchForSale(');
      expect(query).toContain('filters: [{ key: "booliId", value: "12345" }]');
      expect(query).toContain('page: 1');
      expect(query).toContain('ascending: false');
      expect(query).toContain('excludeAncestors: true');
      
      // Check that both Property and Listing fragments are included
      expect(query).toContain('... on Property {');
      expect(query).toContain('... on Listing {');
      
      // Check for comprehensive field selection
      expect(query).toContain('id');
      expect(query).toContain('livingArea');
      expect(query).toContain('rooms');
      expect(query).toContain('objectType');
      expect(query).toContain('streetAddress');
      expect(query).toContain('listPrice');
      expect(query).toContain('agency');
      expect(query).toContain('amenities');
      expect(query).toContain('primaryImage');
      expect(query).toContain('constructionYear');
      expect(query).toContain('estimate');
      expect(query).toContain('displayAttributes');
    });

    it('should return properly formatted response for successful query', async () => {
      mockGraphQLClient.request.mockResolvedValue(mockApiResponse);

      const result: ApiResponse = await client.getPropertyDetails(validCriteria);

      expect(result).toEqual({
        data: {
          searchForSale: mockApiResponse.searchForSale,
        },
      });

      expect(result.data.searchForSale.totalCount).toBe(1);
      expect(result.data.searchForSale.result).toHaveLength(1);
      expect(result.data.searchForSale.result[0].id).toBe('12345');
      expect(result.data.searchForSale.result[0].objectType).toBe('Lägenhet');
      expect(result.data.searchForSale.result[0].streetAddress).toBe('Storgatan 15');
    });

    it('should handle property with comprehensive details', async () => {
      const comprehensiveProperty = {
        searchForSale: {
          totalCount: 1,
          result: [
            {
              id: '67890',
              objectType: 'Villa',
              streetAddress: 'Villa Street 123',
              descriptiveAreaName: 'Exclusive Area',
              location: {
                region: {
                  municipalityName: 'Göteborg'
                }
              },
              rooms: { formatted: '5 rum' },
              livingArea: { formatted: '150 m²' },
              plotArea: { formatted: '800 m²' },
              constructionYear: 1995,
              floor: '2',
              listPrice: {
                formatted: '8 500 000 kr',
                value: 8500000,
                unit: 'SEK',
                raw: 8500000
              },
              listSqmPrice: { formatted: '56 667 kr/m²' },
              rent: { formatted: '5 000 kr' },
              estimate: {
                price: {
                  formatted: '8 200 000 kr',
                  value: 8200000
                }
              },
              tenureForm: 'Äganderätt',
              daysActive: 42,
              published: '2024-02-01',
              listPricePercentageDiff: -2.5,
              biddingOpen: true,
              upcomingSale: false,
              isNewConstruction: false,
              agency: {
                name: 'Premium Real Estate',
                url: 'https://premium.se',
                thumbnail: 'https://premium.se/logo.png'
              },
              amenities: [
                { key: 'garage', label: 'Garage' },
                { key: 'garden', label: 'Trädgård' }
              ],
              primaryImage: {
                alt: 'Beautiful villa exterior',
                url: 'https://images.booli.se/villa123.jpg'
              },
              blockedImages: false,
              nextShowing: '2024-06-20 14:00',
              displayAttributes: {
                dataPoints: [
                  { value: { plainText: 'Nyligen renoverat' } },
                  { value: { plainText: 'Söderläge' } }
                ]
              },
              url: '/property/67890',
              latitude: 57.7089,
              longitude: 11.9746
            }
          ]
        }
      };

      mockGraphQLClient.request.mockResolvedValue(comprehensiveProperty);

      const result = await client.getPropertyDetails({ propertyId: '67890' });

      expect(result.data.searchForSale.result[0]).toEqual(
        expect.objectContaining({
          id: '67890',
          objectType: 'Villa',
          constructionYear: 1995,
          listPricePercentageDiff: -2.5,
          biddingOpen: true,
          agency: expect.objectContaining({
            name: 'Premium Real Estate',
            thumbnail: 'https://premium.se/logo.png'
          }),
          amenities: expect.arrayContaining([
            { key: 'garage', label: 'Garage' },
            { key: 'garden', label: 'Trädgård' }
          ]),
          primaryImage: expect.objectContaining({
            alt: 'Beautiful villa exterior',
            url: 'https://images.booli.se/villa123.jpg'
          })
        })
      );
    });

    it('should handle different property ID formats', async () => {
      const testCases = [
        { propertyId: '123' },
        { propertyId: '999999' },
        { propertyId: '1234567890' }
      ];

      for (const testCase of testCases) {
        mockGraphQLClient.request.mockResolvedValue({
          searchForSale: {
            totalCount: 1,
            result: [{ id: testCase.propertyId, objectType: 'Test' }]
          }
        });

        await client.getPropertyDetails(testCase);

        const [query] = mockGraphQLClient.request.mock.calls[mockGraphQLClient.request.mock.calls.length - 1];
        expect(query).toContain(`filters: [{ key: "booliId", value: "${testCase.propertyId}" }]`);
      }
    });

    it('should throw error when property is not found', async () => {
      const emptyResponse = {
        searchForSale: {
          totalCount: 0,
          result: []
        }
      };

      mockGraphQLClient.request.mockResolvedValue(emptyResponse);

      await expect(client.getPropertyDetails(validCriteria)).rejects.toThrow(
        'Property with ID 12345 not found'
      );
    });

    it('should handle null or undefined result arrays', async () => {
      const nullResultResponse = {
        searchForSale: {
          totalCount: 0,
          result: null
        }
      };

      mockGraphQLClient.request.mockResolvedValue(nullResultResponse);

      await expect(client.getPropertyDetails(validCriteria)).rejects.toThrow(
        'Property with ID 12345 not found'
      );
    });
  });

  describe('Error Handling', () => {
    const validCriteria: PropertyDetailCriteria = {
      propertyId: '12345'
    };

    it('should throw descriptive error for GraphQL failures', async () => {
      const graphqlError = new Error('GraphQL query failed: Invalid property ID format');
      mockGraphQLClient.request.mockRejectedValue(graphqlError);

      await expect(client.getPropertyDetails(validCriteria)).rejects.toThrow(
        'Failed to get property details: GraphQL query failed: Invalid property ID format'
      );
    });

    it('should throw generic error for unknown failures', async () => {
      mockGraphQLClient.request.mockRejectedValue('Unknown error');

      await expect(client.getPropertyDetails(validCriteria)).rejects.toThrow(
        'Failed to get property details: Unknown error'
      );
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockGraphQLClient.request.mockRejectedValue(timeoutError);

      await expect(client.getPropertyDetails(validCriteria)).rejects.toThrow(
        'Failed to get property details: Request timeout'
      );
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized: 401');
      mockGraphQLClient.request.mockRejectedValue(authError);

      await expect(client.getPropertyDetails(validCriteria)).rejects.toThrow(
        'Failed to get property details: Unauthorized: 401'
      );
    });

    it('should handle malformed response errors', async () => {
      const malformedError = new Error('Invalid JSON response');
      mockGraphQLClient.request.mockRejectedValue(malformedError);

      await expect(client.getPropertyDetails(validCriteria)).rejects.toThrow(
        'Failed to get property details: Invalid JSON response'
      );
    });

    it('should handle server errors', async () => {
      const serverError = new Error('Internal server error: 500');
      mockGraphQLClient.request.mockRejectedValue(serverError);

      await expect(client.getPropertyDetails(validCriteria)).rejects.toThrow(
        'Failed to get property details: Internal server error: 500'
      );
    });
  });

  describe('Query Construction Validation', () => {
    it('should use correct filter key for property ID lookup', async () => {
      mockGraphQLClient.request.mockResolvedValue({
        searchForSale: { totalCount: 1, result: [{ id: '12345' }] }
      });

      await client.getPropertyDetails({ propertyId: '12345' });

      const [query] = mockGraphQLClient.request.mock.calls[0];
      expect(query).toContain('{ key: "booliId", value: "12345" }');
      expect(query).not.toContain('variables');
      expect(query).not.toContain('$propertyId');
    });

    it('should set correct search parameters for single property lookup', async () => {
      mockGraphQLClient.request.mockResolvedValue({
        searchForSale: { totalCount: 1, result: [{ id: '12345' }] }
      });

      await client.getPropertyDetails({ propertyId: '12345' });

      const [query] = mockGraphQLClient.request.mock.calls[0];
      expect(query).toContain('page: 1');
      expect(query).toContain('ascending: false');
      expect(query).toContain('excludeAncestors: true');
    });

    it('should include all necessary fields for comprehensive property details', async () => {
      mockGraphQLClient.request.mockResolvedValue({
        searchForSale: { totalCount: 1, result: [{ id: '12345' }] }
      });

      await client.getPropertyDetails({ propertyId: '12345' });

      const [query] = mockGraphQLClient.request.mock.calls[0];
      
      // Check for essential property fields
      expect(query).toContain('streetAddress');
      expect(query).toContain('descriptiveAreaName');
      expect(query).toContain('location');
      expect(query).toContain('municipalityName');
      expect(query).toContain('constructionYear');
      expect(query).toContain('floor');
      expect(query).toContain('rent');
      
      // Check for listing-specific fields
      expect(query).toContain('listPrice');
      expect(query).toContain('listSqmPrice');
      expect(query).toContain('daysActive');
      expect(query).toContain('published');
      expect(query).toContain('tenureForm');
      expect(query).toContain('estimate');
      expect(query).toContain('agency');
      expect(query).toContain('amenities');
      
      // Check for media and additional fields
      expect(query).toContain('primaryImage');
      expect(query).toContain('blockedImages');
      expect(query).toContain('nextShowing');
      expect(query).toContain('biddingOpen');
      expect(query).toContain('upcomingSale');
      expect(query).toContain('isNewConstruction');
      expect(query).toContain('listPricePercentageDiff');
      expect(query).toContain('displayAttributes');
      expect(query).toContain('dataPoints');
      expect(query).toContain('plainText');
    });

    it('should escape special characters in property ID', async () => {
      // Although property IDs should be numeric, test defensive programming
      const specialCriteria: PropertyDetailCriteria = {
        propertyId: '123"test'
      };

      mockGraphQLClient.request.mockResolvedValue({
        searchForSale: { totalCount: 1, result: [{ id: '123"test' }] }
      });

      await client.getPropertyDetails(specialCriteria);

      const [query] = mockGraphQLClient.request.mock.calls[0];
      expect(query).toContain('{ key: "booliId", value: "123"test" }');
    });
  });

  describe('Response Data Validation', () => {
    it('should handle response with all optional fields present', async () => {
      const completeResponse = {
        searchForSale: {
          totalCount: 1,
          result: [
            {
              id: '1',
              objectType: 'Complete Property',
              streetAddress: 'Complete Address',
              descriptiveAreaName: 'Complete Area',
              location: {
                region: {
                  municipalityName: 'Complete Municipality'
                }
              },
              rooms: { formatted: '5 rum' },
              livingArea: { formatted: '100 m²' },
              plotArea: { formatted: '500 m²' },
              constructionYear: 2000,
              floor: '3',
              listPrice: { formatted: '5 000 000 kr' },
              rent: { formatted: '3 000 kr' },
              agency: { name: 'Complete Agency' },
              amenities: [{ key: 'complete', label: 'Complete Amenity' }],
              primaryImage: { alt: 'Complete Image' },
              latitude: 59.3293,
              longitude: 18.0686,
              url: '/property/1'
            }
          ]
        }
      };

      mockGraphQLClient.request.mockResolvedValue(completeResponse);

      const result = await client.getPropertyDetails({ propertyId: '1' });

      const property = result.data.searchForSale.result[0];
      expect(property.id).toBe('1');
      expect(property.objectType).toBe('Complete Property');
      expect(property.streetAddress).toBe('Complete Address');
      expect(property.descriptiveAreaName).toBe('Complete Area');
      expect(property.location.region.municipalityName).toBe('Complete Municipality');
      expect(property.constructionYear).toBe(2000);
      expect(property.floor).toBe('3');
      expect(property.latitude).toBe(59.3293);
      expect(property.longitude).toBe(18.0686);
    });

    it('should handle response with missing optional fields', async () => {
      const minimalResponse = {
        searchForSale: {
          totalCount: 1,
          result: [
            {
              id: '2',
              objectType: 'Minimal Property'
            }
          ]
        }
      };

      mockGraphQLClient.request.mockResolvedValue(minimalResponse);

      const result = await client.getPropertyDetails({ propertyId: '2' });

      const property = result.data.searchForSale.result[0];
      expect(property.id).toBe('2');
      expect(property.objectType).toBe('Minimal Property');
      expect(property.streetAddress).toBeUndefined();
      expect(property.amenities).toBeUndefined();
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