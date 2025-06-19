/**
 * @fileoverview Type definitions and validation schemas for the Booli MCP server.
 * This module defines all the data structures used for property search operations,
 * including Zod schemas for runtime validation and TypeScript interfaces for type safety.
 */

import { z } from 'zod';

/**
 * Zod schema for validating property data from the Booli GraphQL API.
 * Represents a single property with its core attributes.
 * 
 * @property id - Unique identifier for the property
 * @property livingArea - Living area with raw value and formatted display string
 * @property rooms - Number of rooms with raw value and formatted display string
 * @property plotArea - Plot area (for houses) with raw value and formatted display string
 * @property listPrice - List price with raw value and formatted display string
 */
export const PropertySchema = z.object({
  id: z.string(),
  livingArea: z.object({
    value: z.string(),
    formatted: z.string(),
  }).nullable(),
  rooms: z.object({
    value: z.string(),
    formatted: z.string(),
  }).nullable(),
  plotArea: z.object({
    value: z.string(),
    formatted: z.string(),
  }).nullable(),
  listPrice: z.object({
    value: z.string(),
    formatted: z.string(),
  }).nullable(),
});

/**
 * Zod schema for validating search results from the Booli GraphQL API.
 * Contains the total count of matching properties and an array of property results.
 * 
 * @property totalCount - Total number of properties matching the search criteria
 * @property result - Array of property objects matching the search criteria
 */
export const SearchResultSchema = z.object({
  totalCount: z.number(),
  result: z.array(PropertySchema),
});

/**
 * Zod schema for validating the complete API response structure.
 * Represents the top-level response wrapper from the Booli GraphQL API.
 * 
 * @property data - Container object for the actual search results
 * @property data.searchForSale - The search result data structure
 */
export const ResponseSchema = z.object({
  data: z.object({
    searchForSale: SearchResultSchema,
  }),
});

/**
 * TypeScript type derived from PropertySchema.
 * Represents a single property with all its attributes.
 */
export type Property = z.infer<typeof PropertySchema>;

/**
 * TypeScript type derived from SearchResultSchema.
 * Represents the result set from a property search operation.
 */
export type SearchResult = z.infer<typeof SearchResultSchema>;

/**
 * TypeScript type derived from ResponseSchema.
 * Represents the complete API response structure from Booli's GraphQL endpoint.
 */
export type ApiResponse = z.infer<typeof ResponseSchema>;

/**
 * Zod schema for validating location suggestion data from the Booli GraphQL API.
 * Represents a single location suggestion with its attributes.
 * 
 * @property id - Unique identifier for the location/area
 * @property displayName - Human-readable name of the location
 * @property parent - Parent location name (e.g., municipality)
 * @property parentType - Type of parent location (e.g., "Kommun")
 * @property parentDisplayName - Full display name of parent location
 * @property parentTypeDisplayName - Display name for parent type
 * @property parentId - Unique identifier for the parent location
 */
export const LocationSuggestionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  parent: z.string(),
  parentType: z.string(),
  parentDisplayName: z.string(),
  parentTypeDisplayName: z.string(),
  parentId: z.string(),
});

/**
 * Zod schema for validating location search results from the Booli GraphQL API.
 * Contains an array of location suggestions matching the search query.
 * 
 * @property suggestions - Array of location suggestion objects
 */
export const LocationSearchResultSchema = z.object({
  suggestions: z.array(LocationSuggestionSchema),
});

/**
 * Zod schema for validating the complete location search API response structure.
 * Represents the top-level response wrapper from the Booli GraphQL API.
 * 
 * @property data - Container object for the actual location search results
 * @property data.areaSuggestionSearch - The location search result data structure
 */
export const LocationResponseSchema = z.object({
  data: z.object({
    areaSuggestionSearch: LocationSearchResultSchema,
  }),
});

/**
 * TypeScript type derived from LocationSuggestionSchema.
 * Represents a single location suggestion with all its attributes.
 */
export type LocationSuggestion = z.infer<typeof LocationSuggestionSchema>;

/**
 * TypeScript type derived from LocationSearchResultSchema.
 * Represents the result set from a location search operation.
 */
export type LocationSearchResult = z.infer<typeof LocationSearchResultSchema>;

/**
 * TypeScript type derived from LocationResponseSchema.
 * Represents the complete location search API response structure from Booli's GraphQL endpoint.
 */
export type LocationApiResponse = z.infer<typeof LocationResponseSchema>;

/**
 * Interface defining the search criteria for location searches.
 * 
 * @property query - Search query string to find location suggestions
 */
export interface LocationSearchCriteria {
  query: string;
}

/**
 * Interface defining the criteria for property detail retrieval.
 * 
 * @property propertyId - Unique identifier of the property to retrieve details for
 */
export interface PropertyDetailCriteria {
  propertyId: string;
}

/**
 * Interface defining the search criteria for property searches.
 * All properties are optional to allow flexible search combinations.
 * 
 * @property location - Location identifier (area ID or location name)
 * @property minPrice - Minimum list price in SEK
 * @property maxPrice - Maximum list price in SEK
 * @property minRooms - Minimum number of rooms
 * @property maxRooms - Maximum number of rooms
 * @property minArea - Minimum living area in square meters
 * @property maxArea - Maximum living area in square meters
 * @property propertyType - Type of property to search for (apartment or house)
 */
export interface SearchCriteria {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
  minArea?: number;
  maxArea?: number;
  propertyType?: 'apartment' | 'house';
}