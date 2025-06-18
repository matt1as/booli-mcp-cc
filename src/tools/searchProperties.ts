/**
 * @fileoverview MCP tool for searching properties on Booli.se.
 * This module provides the main search functionality exposed to MCP clients,
 * handling search parameter validation and result formatting.
 */

import { BooliGraphQLClient } from '../client/graphql';
import { SearchCriteria } from '../types';

/** Singleton GraphQL client instance for property searches */
const client = new BooliGraphQLClient();

/**
 * Searches for properties on Booli.se using the provided search criteria.
 * 
 * This function serves as the main MCP tool entry point for property searches.
 * It accepts flexible search parameters, validates them, performs the search
 * via the GraphQL client, and formats the results for display to users.
 * 
 * The function supports comprehensive search criteria including:
 * - Basic filters: location, price range, rooms, living area, property type
 * - Advanced filters: price per m², plot area, construction year, rent limits
 * - Special filters: days active, amenities, floor preferences, market conditions
 * 
 * Results are formatted with emojis and structured text for optimal readability
 * in chat interfaces and command-line environments.
 * 
 * @param args - Raw search arguments from the MCP client
 * @param args.location - Location identifier (area ID or name)
 * @param args.minPrice - Minimum list price in SEK
 * @param args.maxPrice - Maximum list price in SEK
 * @param args.minRooms - Minimum number of rooms
 * @param args.maxRooms - Maximum number of rooms
 * @param args.minArea - Minimum living area in m²
 * @param args.maxArea - Maximum living area in m²
 * @param args.propertyType - 'apartment' or 'house'
 * @param args.limit - Maximum results to return (default: 10)
 * @param args.minPricePerSqm - Minimum price per square meter
 * @param args.maxPricePerSqm - Maximum price per square meter
 * @param args.minPlotArea - Minimum plot area for houses
 * @param args.maxPlotArea - Maximum plot area for houses
 * @param args.minConstructionYear - Minimum construction year
 * @param args.maxConstructionYear - Maximum construction year
 * @param args.maxRent - Maximum monthly rent for cooperatives
 * @param args.daysActive - Maximum days the listing has been active
 * @param args.amenities - Comma-separated amenities list
 * @param args.floor - Floor preference ('bottomFloor' or 'topFloor')
 * @param args.showOnly - Special filters (e.g., 'priceDecrease,newConstruction')
 * 
 * @returns MCP-formatted response with property listings or error message
 */
export async function searchProperties(args: any) {
  try {
    // Build comprehensive search criteria from MCP arguments
    // Combines base SearchCriteria interface with extended properties
    const criteria: SearchCriteria & Record<string, any> = {
      // Basic search criteria
      location: args.location,
      minPrice: args.minPrice,
      maxPrice: args.maxPrice,
      minRooms: args.minRooms,
      maxRooms: args.maxRooms,
      minArea: args.minArea,
      maxArea: args.maxArea,
      propertyType: args.propertyType,
      
      // Extended search criteria
      minPricePerSqm: args.minPricePerSqm,
      maxPricePerSqm: args.maxPricePerSqm,
      minPlotArea: args.minPlotArea,
      maxPlotArea: args.maxPlotArea,
      minConstructionYear: args.minConstructionYear,
      maxConstructionYear: args.maxConstructionYear,
      maxRent: args.maxRent,
      daysActive: args.daysActive,
      amenities: args.amenities,
      floor: args.floor,
      showOnly: args.showOnly,
    };

    // Apply result limit with default value
    const limit = args.limit || 10;
    
    // Execute property search via GraphQL client
    const response = await client.searchForSale(criteria);

    // Handle empty results
    if (!response.data.searchForSale.result.length) {
      return {
        content: [
          {
            type: 'text',
            text: `No properties found matching your criteria in ${criteria.location || 'the specified area'}.`,
          },
        ],
      };
    }

    // Extract and limit results for display
    const properties = response.data.searchForSale.result.slice(0, limit);
    const totalCount = response.data.searchForSale.totalCount;

    // Build search result summary
    let summary = `Found ${totalCount} properties`;
    if (criteria.location) {
      summary += ` in ${criteria.location}`;
    }
    if (limit < totalCount) {
      summary += ` (showing first ${limit})`;
    }
    summary += ':\n\n';

    // Format each property for display with comprehensive information
    const propertyList = properties
      .map((property: any, index: number) => {
        let description = `${index + 1}. ${property.objectType || 'Property'} - ID: ${property.id}`;
        
        // Address and location information
        if (property.streetAddress) {
          description += `\n   📍 Address: ${property.streetAddress}`;
        }
        if (property.descriptiveAreaName) {
          description += `\n   🏘️  Area: ${property.descriptiveAreaName}`;
        }
        if (property.location?.region?.municipalityName) {
          description += ` (${property.location.region.municipalityName})`;
        }

        // Basic property characteristics
        if (property.rooms?.formatted) {
          description += `\n   🏠 Rooms: ${property.rooms.formatted}`;
        }
        if (property.livingArea?.formatted) {
          description += `\n   📐 Living Area: ${property.livingArea.formatted}`;
        }
        if (property.plotArea?.formatted) {
          description += `\n   🌿 Plot Area: ${property.plotArea.formatted}`;
        }

        // Pricing information
        if (property.listPrice?.formatted) {
          description += `\n   💰 List Price: ${property.listPrice.formatted}`;
        }
        if (property.listSqmPrice?.formatted) {
          description += `\n   📊 Price per m²: ${property.listSqmPrice.formatted}`;
        }
        if (property.estimate?.price?.formatted) {
          description += `\n   📈 Estimated Value: ${property.estimate.price.formatted}`;
        }

        // Listing lifecycle information
        if (property.daysActive !== undefined) {
          description += `\n   ⏰ Days Active: ${property.daysActive}`;
        }
        if (property.published) {
          description += `\n   📅 Published: ${property.published}`;
        }
        
        // Property legal and construction details
        if (property.tenureForm) {
          description += `\n   📋 Tenure: ${property.tenureForm}`;
        }
        if (property.constructionYear) {
          description += `\n   🏗️  Built: ${property.constructionYear}`;
        }
        if (property.isNewConstruction) {
          description += `\n   ✨ New Construction`;
        }

        // Property amenities and features
        if (property.amenities && property.amenities.length > 0) {
          const amenitiesList = property.amenities.map((a: any) => a.label).join(', ');
          description += `\n   🏖️  Amenities: ${amenitiesList}`;
        }

        // Additional display attributes from API
        if (property.displayAttributes?.dataPoints && property.displayAttributes.dataPoints.length > 0) {
          const additionalInfo = property.displayAttributes.dataPoints
            .map((dp: any) => dp.value?.plainText)
            .filter((text: string) => text)
            .join(' • ');
          if (additionalInfo) {
            description += `\n   ℹ️  Details: ${additionalInfo}`;
          }
        }

        // Price change information
        if (property.listPricePercentageDiff !== null && property.listPricePercentageDiff !== undefined) {
          const changeIcon = property.listPricePercentageDiff > 0 ? '📈' : '📉';
          description += `\n   ${changeIcon} Price Change: ${property.listPricePercentageDiff > 0 ? '+' : ''}${property.listPricePercentageDiff}%`;
        }

        // Bidding status
        if (property.biddingOpen) {
          description += `\n   🔥 Bidding Open`;
        }
        if (property.upcomingSale) {
          description += `\n   ⏳ Upcoming Sale`;
        }

        // Image information
        if (property.primaryImage) {
          description += `\n   📸 Image: ${property.primaryImage.alt || 'Available'}`;
        }
        if (property.blockedImages === false) {
          description += `\n   🖼️  Images: Available`;
        } else if (property.blockedImages === true) {
          description += `\n   🚫 Images: Blocked`;
        }

        // Real estate agency information with links
        if (property.agency?.name) {
          description += `\n   🏢 Agency: ${property.agency.name}`;
          if (property.agency.url) {
            description += `\n   🔗 Agency: ${property.agency.url}`;
          }
          if (property.agency.thumbnail) {
            description += `\n   🖼️  Agency Logo: Available`;
          }
        }

        // Viewing information
        if (property.nextShowing) {
          description += `\n   👁️  Next Showing: ${property.nextShowing}`;
        }

        // External links for more details
        if (property.url) {
          description += `\n   🔗 View Property: https://www.booli.se${property.url}`;
        }

        // Geographic coordinates for mapping
        if (property.latitude && property.longitude) {
          description += `\n   🗺️  Coordinates: ${property.latitude}, ${property.longitude}`;
        }

        return description;
      })
      .join('\n\n');

    // Return formatted search results
    return {
      content: [
        {
          type: 'text',
          text: summary + propertyList,
        },
      ],
    };
  } catch (error) {
    // Handle and log search errors
    console.error('Property search failed:', error);
    
    return {
      content: [
        {
          type: 'text',
          text: `Error searching for properties: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
      isError: true,
    };
  }
}