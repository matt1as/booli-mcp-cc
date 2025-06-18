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