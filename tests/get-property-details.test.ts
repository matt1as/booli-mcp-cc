/**
 * @fileoverview Unit tests for the property detail retrieval MCP tool.
 * Tests the getPropertyDetails function with various input scenarios and validates
 * proper error handling, input validation, and response formatting.
 */

import { getPropertyDetails } from '../src/tools/getPropertyDetails';
import { BooliGraphQLClient } from '../src/client/graphql';

// Mock the GraphQL client
jest.mock('../src/client/graphql');
const MockedBooliGraphQLClient = jest.mocked(BooliGraphQLClient);

describe('getPropertyDetails', () => {
  let mockClient: jest.Mocked<BooliGraphQLClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock client instance
    mockClient = {
      getPropertyDetails: jest.fn(),
      searchForSale: jest.fn(),
      searchLocations: jest.fn(),
      buildSearchInput: jest.fn(),
      introspectSchema: jest.fn(),
      testConnection: jest.fn(),
    } as any;

    // Mock the constructor to return our mock client
    MockedBooliGraphQLClient.mockImplementation(() => mockClient);
  });

  describe('Input Validation', () => {
    it('should return error for missing propertyId parameter', async () => {
      const result = await getPropertyDetails({} as any);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Property ID parameter is required');
    });

    it('should return error for non-string propertyId parameter', async () => {
      const result = await getPropertyDetails({ propertyId: 12345 } as any);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Property ID parameter is required');
    });

    it('should return error for empty propertyId string', async () => {
      const result = await getPropertyDetails({ propertyId: '' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Property ID cannot be empty');
    });

    it('should return error for whitespace-only propertyId string', async () => {
      const result = await getPropertyDetails({ propertyId: '   ' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Property ID cannot be empty');
    });

    it('should return error for non-numeric propertyId string', async () => {
      const result = await getPropertyDetails({ propertyId: 'abc123' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Property ID must be a numeric value');
    });

    it('should accept valid numeric propertyId string', async () => {
      const mockResponse = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: '12345',
                objectType: 'Lägenhet',
                streetAddress: 'Test Street 1',
                rooms: { formatted: '2 rum' },
                livingArea: { formatted: '50 m²' },
                listPrice: { formatted: '2 500 000 kr' }
              }
            ]
          }
        }
      };

      mockClient.getPropertyDetails.mockResolvedValue(mockResponse);

      const result = await getPropertyDetails({ propertyId: '12345' });

      expect(result.isError).toBeUndefined();
      expect(mockClient.getPropertyDetails).toHaveBeenCalledWith({ propertyId: '12345' });
    });

    it('should trim whitespace from propertyId parameter', async () => {
      const mockResponse = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: '67890',
                objectType: 'Villa',
                streetAddress: 'Test Villa Street 1'
              }
            ]
          }
        }
      };

      mockClient.getPropertyDetails.mockResolvedValue(mockResponse);

      await getPropertyDetails({ propertyId: '  67890  ' });

      expect(mockClient.getPropertyDetails).toHaveBeenCalledWith({ propertyId: '67890' });
    });
  });

  describe('Successful Property Detail Retrieval', () => {
    const mockPropertyResponse = {
      data: {
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
              plotArea: {
                formatted: '0 m²'
              },
              listPrice: {
                formatted: '4 500 000 kr'
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
              url: '/property/12345',
              latitude: 59.3293,
              longitude: 18.0686
            }
          ]
        }
      }
    };

    it('should return formatted property details for valid property ID', async () => {
      mockClient.getPropertyDetails.mockResolvedValue(mockPropertyResponse);

      const result = await getPropertyDetails({ propertyId: '12345' });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('🏠 Property Details - ID: 12345');
      expect(result.content[0].text).toContain('🏷️  **Type**: Lägenhet');
      expect(result.content[0].text).toContain('📍 **Address**: Storgatan 15, Södermalm (Stockholm)');
      expect(result.content[0].text).toContain('🚪 **Rooms**: 3 rum');
      expect(result.content[0].text).toContain('📐 **Living Area**: 75 m²');
      expect(result.content[0].text).toContain('💵 **List Price**: 4 500 000 kr');
      expect(result.content[0].text).toContain('📊 **Price per m²**: 60 000 kr/m²');
      expect(result.content[0].text).toContain('📋 **Tenure Form**: Bostadsrätt');
      expect(result.content[0].text).toContain('⏰ **Days Active**: 15 days');
      expect(result.content[0].text).toContain('📅 **Published**: 2024-01-15');
      expect(result.content[0].text).toContain('🏢 Real Estate Agency');
      expect(result.content[0].text).toContain('📛 **Name**: Fastighetsbyrån');
      expect(result.content[0].text).toContain('🔗 **Website**: https://fastighetsbyran.se');
      expect(result.content[0].text).toContain('🏖️  Amenities & Features');
      expect(result.content[0].text).toContain('• Balkong');
      expect(result.content[0].text).toContain('• Hiss');
      expect(result.content[0].text).toContain('🗺️  **Coordinates**: 59.3293, 18.0686');
      expect(result.content[0].text).toContain('🔗 **View on Booli**: https://www.booli.se/property/12345');
      expect(result.content[0].text).toContain('💡 Usage Tips');
    });

    it('should handle property with minimal information', async () => {
      const minimalProperty = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: '54321',
                objectType: 'Villa'
              }
            ]
          }
        }
      };

      mockClient.getPropertyDetails.mockResolvedValue(minimalProperty);

      const result = await getPropertyDetails({ propertyId: '54321' });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('🏠 Property Details - ID: 54321');
      expect(result.content[0].text).toContain('🏷️  **Type**: Villa');
      expect(result.content[0].text).toContain('💡 Usage Tips');
    });

    it('should handle property with all optional fields', async () => {
      const completeProperty = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: '99999',
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
                floor: '2',
                constructionYear: 1995,
                listPrice: { formatted: '8 500 000 kr' },
                listSqmPrice: { formatted: '56 667 kr/m²' },
                rent: { formatted: '5 000 kr' },
                estimate: {
                  price: { formatted: '8 200 000 kr' }
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
                  { key: 'garden', label: 'Trädgård' },
                  { key: 'fireplace', label: 'Öppen spis' }
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
                url: '/property/99999',
                latitude: 57.7089,
                longitude: 11.9746
              }
            ]
          }
        }
      };

      mockClient.getPropertyDetails.mockResolvedValue(completeProperty);

      const result = await getPropertyDetails({ propertyId: '99999' });

      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      
      // Check all major sections are present
      expect(text).toContain('🏠 Property Details - ID: 99999');
      expect(text).toContain('🏷️  **Type**: Villa');
      expect(text).toContain('📍 **Address**: Villa Street 123, Exclusive Area (Göteborg)');
      expect(text).toContain('🚪 **Rooms**: 5 rum');
      expect(text).toContain('📐 **Living Area**: 150 m²');
      expect(text).toContain('🌿 **Plot Area**: 800 m²');
      expect(text).toContain('🏢 **Floor**: 2');
      expect(text).toContain('🏗️  **Built**: 1995');
      expect(text).toContain('💰 Pricing Information');
      expect(text).toContain('💵 **List Price**: 8 500 000 kr');
      expect(text).toContain('📊 **Price per m²**: 56 667 kr/m²');
      expect(text).toContain('🏠 **Monthly Rent**: 5 000 kr');
      expect(text).toContain('📈 **Estimated Value**: 8 200 000 kr');
      expect(text).toContain('📋 **Tenure Form**: Äganderätt');
      expect(text).toContain('⏰ **Days Active**: 42 days');
      expect(text).toContain('📉 **Price Change**: -2.5%');
      expect(text).toContain('🔥 **Bidding**: Open');
      expect(text).toContain('🏖️  Amenities & Features');
      expect(text).toContain('• Garage');
      expect(text).toContain('• Trädgård');
      expect(text).toContain('• Öppen spis');
      expect(text).toContain('ℹ️  Additional Details');
      expect(text).toContain('Nyligen renoverat • Söderläge');
      expect(text).toContain('🏢 Real Estate Agency');
      expect(text).toContain('📛 **Name**: Premium Real Estate');
      expect(text).toContain('🔗 **Website**: https://premium.se');
      expect(text).toContain('🖼️  **Logo**: Available');
      expect(text).toContain('👁️  **Next Showing**: 2024-06-20 14:00');
      expect(text).toContain('📸 Images & Media');
      expect(text).toContain('🖼️  **Primary Image**: Beautiful villa exterior');
      expect(text).toContain('🔗 **Image URL**: https://images.booli.se/villa123.jpg');
      expect(text).toContain('✅ **Image Access**: Available');
      expect(text).toContain('🗺️  **Coordinates**: 57.7089, 11.9746');
      expect(text).toContain('🔗 **View on Booli**: https://www.booli.se/property/99999');
      expect(text).toContain('💡 Usage Tips');
    });

    it('should handle positive price change correctly', async () => {
      const priceIncreaseProperty = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: '11111',
                objectType: 'Lägenhet',
                listPricePercentageDiff: 3.2
              }
            ]
          }
        }
      };

      mockClient.getPropertyDetails.mockResolvedValue(priceIncreaseProperty);

      const result = await getPropertyDetails({ propertyId: '11111' });

      expect(result.content[0].text).toContain('📈 **Price Change**: +3.2%');
    });

    it('should handle blocked images correctly', async () => {
      const blockedImagesProperty = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: '22222',
                objectType: 'Lägenhet',
                blockedImages: true
              }
            ]
          }
        }
      };

      mockClient.getPropertyDetails.mockResolvedValue(blockedImagesProperty);

      const result = await getPropertyDetails({ propertyId: '22222' });

      expect(result.content[0].text).toContain('🚫 **Image Access**: Blocked');
    });
  });

  describe('Empty Results', () => {
    it('should handle property not found gracefully', async () => {
      const emptyResponse = {
        data: {
          searchForSale: {
            totalCount: 0,
            result: []
          }
        }
      };

      mockClient.getPropertyDetails.mockResolvedValue(emptyResponse);

      const result = await getPropertyDetails({ propertyId: '99999' });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Property with ID 99999 was not found');
      expect(result.content[0].text).toContain('Please verify the property ID');
    });
  });

  describe('Error Handling', () => {
    it('should handle GraphQL client errors with property not found message', async () => {
      const notFoundError = new Error('Property with ID 12345 not found');
      mockClient.getPropertyDetails.mockRejectedValue(notFoundError);

      const result = await getPropertyDetails({ propertyId: '12345' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Property with ID 12345 was not found');
      expect(result.content[0].text).toContain('Please verify the property ID is correct');
    });

    it('should handle general GraphQL client errors', async () => {
      const errorMessage = 'Failed to get property details: Network error';
      mockClient.getPropertyDetails.mockRejectedValue(new Error(errorMessage));

      const result = await getPropertyDetails({ propertyId: '12345' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error retrieving property details');
      expect(result.content[0].text).toContain(errorMessage);
    });

    it('should handle unknown errors gracefully', async () => {
      mockClient.getPropertyDetails.mockRejectedValue('Unknown error');

      const result = await getPropertyDetails({ propertyId: '12345' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error retrieving property details');
      expect(result.content[0].text).toContain('Unknown error occurred');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockClient.getPropertyDetails.mockRejectedValue(timeoutError);

      const result = await getPropertyDetails({ propertyId: '12345' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error retrieving property details');
      expect(result.content[0].text).toContain('Request timeout');
    });
  });

  describe('Response Format Validation', () => {
    it('should include all required sections in response', async () => {
      const testProperty = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: '88888',
                objectType: 'Lägenhet',
                streetAddress: 'Format Test Street 1'
              }
            ]
          }
        }
      };

      mockClient.getPropertyDetails.mockResolvedValue(testProperty);

      const result = await getPropertyDetails({ propertyId: '88888' });

      const text = result.content[0].text;
      expect(text).toContain('🏠 Property Details - ID: 88888');
      expect(text).toContain('💰 Pricing Information');
      expect(text).toContain('📸 Images & Media');
      expect(text).toContain('💡 Usage Tips');
      expect(text).toContain('Use the Booli link above for photos');
      expect(text).toContain('Contact the listed agency for viewing');
      expect(text).toContain('Check the coordinates for location mapping');
    });

    it('should format address information correctly with all components', async () => {
      const addressProperty = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: '77777',
                streetAddress: 'Test Address 123',
                descriptiveAreaName: 'Test Area',
                location: {
                  region: {
                    municipalityName: 'Test Municipality'
                  }
                }
              }
            ]
          }
        }
      };

      mockClient.getPropertyDetails.mockResolvedValue(addressProperty);

      const result = await getPropertyDetails({ propertyId: '77777' });

      expect(result.content[0].text).toContain('📍 **Address**: Test Address 123, Test Area (Test Municipality)');
    });

    it('should format address information correctly with partial components', async () => {
      const partialAddressProperty = {
        data: {
          searchForSale: {
            totalCount: 1,
            result: [
              {
                id: '66666',
                streetAddress: 'Partial Address 456'
              }
            ]
          }
        }
      };

      mockClient.getPropertyDetails.mockResolvedValue(partialAddressProperty);

      const result = await getPropertyDetails({ propertyId: '66666' });

      expect(result.content[0].text).toContain('📍 **Address**: Partial Address 456');
      expect(result.content[0].text).not.toContain(', undefined');
      expect(result.content[0].text).not.toContain('(undefined)');
    });
  });
});