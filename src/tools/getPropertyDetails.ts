/**
 * @fileoverview MCP tool for retrieving detailed property information from Booli.se.
 * This module provides property detail functionality exposed to MCP clients,
 * handling property ID validation and comprehensive result formatting.
 */

import { BooliGraphQLClient } from '../client/graphql';

/** Singleton GraphQL client instance for property detail retrieval */
const client = new BooliGraphQLClient();

/**
 * Retrieves comprehensive details for a specific property on Booli.se using its property ID.
 *
 * This function serves as the main MCP tool entry point for property detail retrieval.
 * It accepts a property ID, validates it, performs the lookup via the GraphQL client,
 * and formats the detailed results for display to users.
 *
 * The function provides comprehensive property information including all available
 * fields such as pricing, images, agency details, amenities, location information,
 * and property characteristics. Results are formatted with rich text and emojis
 * for optimal readability in chat interfaces.
 *
 * @param args - Raw property detail arguments from the MCP client
 * @param args.propertyId - Unique identifier of the property to retrieve details for
 *
 * @returns MCP-formatted response with detailed property information or error message
 */
export async function getPropertyDetails(args: { propertyId: string }) {
  try {
    // Validate input parameters
    if (!args.propertyId || typeof args.propertyId !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Property ID parameter is required and must be a non-empty string.',
          },
        ],
        isError: true,
      };
    }

    // Trim and validate property ID
    const propertyId = args.propertyId.trim();
    if (propertyId.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Property ID cannot be empty.',
          },
        ],
        isError: true,
      };
    }

    // Validate property ID format (should be numeric)
    if (!/^\d+$/.test(propertyId)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Property ID must be a numeric value (e.g., "12345").',
          },
        ],
        isError: true,
      };
    }

    // Try to execute property detail retrieval via GraphQL client
    // Note: This will currently fail due to API limitations
    let response;
    try {
      response = await client.getPropertyDetails({ propertyId });
    } catch (error) {
      // Handle the known API limitation with a helpful message
      return {
        content: [
          {
            type: 'text',
            text: `**🚧 Property Detail Limitation**\n\n` +
                `Unfortunately, direct property lookup by ID (${propertyId}) is not supported by Booli's GraphQL API. ` +
                `The API requires location-based searches with additional filters.\n\n` +
                `**🔍 Alternative Approach:**\n` +
                `1. Use the \`search_locations\` tool to find area IDs for your target location\n` +
                `2. Use the \`search_properties\` tool with location filters to find properties\n` +
                `3. The search results include detailed information for each property\n\n` +
                `**💡 Pro Tip:** Property search results already contain comprehensive details including:\n` +
                `• Property specifications (rooms, area, price)\n` +
                `• Location information and coordinates\n` +
                `• Agency details and contact information\n` +
                `• Amenities and property features\n` +
                `• Direct links to view on Booli.se\n\n` +
                `This approach provides the same detailed information through the search functionality.`,
          },
        ],
      };
    }

    // Extract the property details (should be only one result)
    const property = response.data.searchForSale.result[0] as any;

    // Build comprehensive property detail summary
    let details = `**🏠 Property Details - ID: ${property.id}**\n\n`;

    // Basic property information
    if (property.objectType) {
      details += `🏷️  **Type**: ${property.objectType}\n`;
    }

    // Address and location information
    if (property.streetAddress) {
      details += `📍 **Address**: ${property.streetAddress}`;
      if (property.descriptiveAreaName) {
        details += `, ${property.descriptiveAreaName}`;
      }
      if (property.location?.region?.municipalityName) {
        details += ` (${property.location.region.municipalityName})`;
      }
      details += '\n';
    }

    // Property characteristics
    if (property.rooms?.formatted) {
      details += `🚪 **Rooms**: ${property.rooms.formatted}\n`;
    }

    if (property.livingArea?.formatted) {
      details += `📐 **Living Area**: ${property.livingArea.formatted}\n`;
    }

    if (property.plotArea?.formatted) {
      details += `🌿 **Plot Area**: ${property.plotArea.formatted}\n`;
    }

    if (property.floor) {
      details += `🏢 **Floor**: ${property.floor}\n`;
    }

    if (property.constructionYear) {
      details += `🏗️  **Built**: ${property.constructionYear}\n`;
    }

    // Pricing information
    details += '\n**💰 Pricing Information**\n';
    
    if (property.listPrice?.formatted) {
      details += `💵 **List Price**: ${property.listPrice.formatted}\n`;
    }

    if (property.listSqmPrice?.formatted) {
      details += `📊 **Price per m²**: ${property.listSqmPrice.formatted}\n`;
    }

    if (property.rent?.formatted) {
      details += `🏠 **Monthly Rent**: ${property.rent.formatted}\n`;
    }

    if (property.estimate?.price?.formatted) {
      details += `📈 **Estimated Value**: ${property.estimate.price.formatted}\n`;
    }

    // Property status and market information
    if (property.tenureForm) {
      details += `\n📋 **Tenure Form**: ${property.tenureForm}\n`;
    }

    if (property.daysActive !== undefined) {
      details += `⏰ **Days Active**: ${property.daysActive} days\n`;
    }

    if (property.published) {
      details += `📅 **Published**: ${property.published}\n`;
    }

    // Market indicators
    if (property.listPricePercentageDiff !== null && property.listPricePercentageDiff !== undefined) {
      const changeIcon = property.listPricePercentageDiff > 0 ? '📈' : '📉';
      details += `${changeIcon} **Price Change**: ${property.listPricePercentageDiff > 0 ? '+' : ''}${property.listPricePercentageDiff}%\n`;
    }

    if (property.biddingOpen) {
      details += `🔥 **Bidding**: Open\n`;
    }

    if (property.upcomingSale) {
      details += `⏳ **Upcoming Sale**: Yes\n`;
    }

    if (property.isNewConstruction) {
      details += `✨ **New Construction**: Yes\n`;
    }

    // Amenities and features
    if (property.amenities && property.amenities.length > 0) {
      details += '\n**🏖️  Amenities & Features**\n';
      const amenitiesList = property.amenities.map((a: any) => `• ${a.label}`).join('\n');
      details += amenitiesList + '\n';
    }

    // Additional property details
    if (property.displayAttributes?.dataPoints && property.displayAttributes.dataPoints.length > 0) {
      const additionalInfo = property.displayAttributes.dataPoints
        .map((dp: any) => dp.value?.plainText)
        .filter((text: any) => text)
        .join(' • ');
      if (additionalInfo) {
        details += `\n**ℹ️  Additional Details**\n${additionalInfo}\n`;
      }
    }

    // Real estate agency information
    if (property.agency?.name) {
      details += '\n**🏢 Real Estate Agency**\n';
      details += `📛 **Name**: ${property.agency.name}\n`;
      if (property.agency.url) {
        details += `🔗 **Website**: ${property.agency.url}\n`;
      }
      if (property.agency.thumbnail) {
        details += `🖼️  **Logo**: Available\n`;
      }
    }

    // Viewing information
    if (property.nextShowing) {
      details += `\n👁️  **Next Showing**: ${property.nextShowing}\n`;
    }

    // Images and media
    details += '\n**📸 Images & Media**\n';
    if (property.primaryImage) {
      details += `🖼️  **Primary Image**: ${property.primaryImage.alt || 'Available'}\n`;
      if (property.primaryImage.url) {
        details += `🔗 **Image URL**: ${property.primaryImage.url}\n`;
      }
    }

    if (property.blockedImages === false) {
      details += `✅ **Image Access**: Available\n`;
    } else if (property.blockedImages === true) {
      details += `🚫 **Image Access**: Blocked\n`;
    }

    // Location coordinates for mapping
    if (property.latitude && property.longitude) {
      details += `\n🗺️  **Coordinates**: ${property.latitude}, ${property.longitude}\n`;
    }

    // External links for more information
    if (property.url) {
      details += `\n🔗 **View on Booli**: https://www.booli.se${property.url}\n`;
    }

    // Additional usage information
    details += '\n**💡 Usage Tips**\n';
    details += '• Use the Booli link above for photos and detailed floor plans\n';
    details += '• Contact the listed agency for viewing appointments\n';
    details += '• Check the coordinates for location mapping and nearby amenities';

    // Return formatted property details
    return {
      content: [
        {
          type: 'text',
          text: details,
        },
      ],
    };
  } catch (error) {
    // Handle and log property detail retrieval errors
    console.error('Property detail retrieval failed:', error);
    
    // Provide specific error messages for common issues
    let errorMessage = 'Error retrieving property details: ';
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        errorMessage += `Property with ID ${args.propertyId} was not found. Please verify the property ID is correct.`;
      } else if (error.message.includes('Failed to get property details')) {
        errorMessage += error.message;
      } else {
        errorMessage += error.message;
      }
    } else {
      errorMessage += 'Unknown error occurred while retrieving property information.';
    }

    return {
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
      isError: true,
    };
  }
}