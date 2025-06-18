/**
 * @fileoverview Unit tests for location search type definitions and Zod schemas.
 * Tests the validation schemas for location suggestions, search results, and API responses
 * to ensure proper data validation and type safety.
 */

import {
  LocationSuggestionSchema,
  LocationSearchResultSchema,
  LocationResponseSchema,
  LocationSearchCriteria,
  LocationSuggestion,
  LocationSearchResult,
  LocationApiResponse
} from '../src/types';

describe('Location Type Validation', () => {
  describe('LocationSuggestionSchema', () => {
    const validLocationSuggestion = {
      id: '509',
      displayName: 'Ektorp',
      parent: 'Nacka',
      parentType: 'Kommun',
      parentDisplayName: 'Nacka kommun',
      parentTypeDisplayName: 'Kommun',
      parentId: '76'
    };

    it('should validate a complete location suggestion', () => {
      const result = LocationSuggestionSchema.safeParse(validLocationSuggestion);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('509');
        expect(result.data.displayName).toBe('Ektorp');
        expect(result.data.parent).toBe('Nacka');
        expect(result.data.parentType).toBe('Kommun');
        expect(result.data.parentDisplayName).toBe('Nacka kommun');
        expect(result.data.parentTypeDisplayName).toBe('Kommun');
        expect(result.data.parentId).toBe('76');
      }
    });

    it('should reject location suggestion with missing required fields', () => {
      const invalidSuggestion = {
        id: '509',
        displayName: 'Ektorp',
        // Missing other required fields
      };

      const result = LocationSuggestionSchema.safeParse(invalidSuggestion);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues.some(issue => issue.path.includes('parent'))).toBe(true);
      }
    });

    it('should reject location suggestion with wrong field types', () => {
      const invalidSuggestion = {
        id: 509, // Should be string
        displayName: 'Ektorp',
        parent: 'Nacka',
        parentType: 'Kommun',
        parentDisplayName: 'Nacka kommun',
        parentTypeDisplayName: 'Kommun',
        parentId: 76 // Should be string
      };

      const result = LocationSuggestionSchema.safeParse(invalidSuggestion);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('id') && issue.code === 'invalid_type'
        )).toBe(true);
        expect(result.error.issues.some(issue => 
          issue.path.includes('parentId') && issue.code === 'invalid_type'
        )).toBe(true);
      }
    });

    it('should accept location suggestion with empty string fields', () => {
      const suggestionWithEmptyFields = {
        id: '509',
        displayName: 'Ektorp',
        parent: '',
        parentType: '',
        parentDisplayName: '',
        parentTypeDisplayName: '',
        parentId: ''
      };

      const result = LocationSuggestionSchema.safeParse(suggestionWithEmptyFields);
      
      expect(result.success).toBe(true);
    });

    it('should handle location suggestions with special characters', () => {
      const suggestionWithSpecialChars = {
        id: '12345',
        displayName: 'Södermalm/Östermalm',
        parent: 'Stockholm',
        parentType: 'Kommun',
        parentDisplayName: 'Stockholms kommun',
        parentTypeDisplayName: 'Kommun',
        parentId: '1'
      };

      const result = LocationSuggestionSchema.safeParse(suggestionWithSpecialChars);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.displayName).toBe('Södermalm/Östermalm');
      }
    });
  });

  describe('LocationSearchResultSchema', () => {
    const validSearchResult = {
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
    };

    it('should validate search result with multiple suggestions', () => {
      const result = LocationSearchResultSchema.safeParse(validSearchResult);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.suggestions).toHaveLength(2);
        expect(result.data.suggestions[0].id).toBe('509');
        expect(result.data.suggestions[1].id).toBe('99592');
      }
    });

    it('should validate search result with empty suggestions array', () => {
      const emptyResult = {
        suggestions: []
      };

      const result = LocationSearchResultSchema.safeParse(emptyResult);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.suggestions).toHaveLength(0);
      }
    });

    it('should validate search result with single suggestion', () => {
      const singleResult = {
        suggestions: [validSearchResult.suggestions[0]]
      };

      const result = LocationSearchResultSchema.safeParse(singleResult);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.suggestions).toHaveLength(1);
      }
    });

    it('should reject search result with invalid suggestion format', () => {
      const invalidResult = {
        suggestions: [
          {
            id: '509',
            // Missing required fields
          }
        ]
      };

      const result = LocationSearchResultSchema.safeParse(invalidResult);
      
      expect(result.success).toBe(false);
    });

    it('should reject search result without suggestions field', () => {
      const invalidResult = {
        // Missing suggestions array
      };

      const result = LocationSearchResultSchema.safeParse(invalidResult);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('suggestions')
        )).toBe(true);
      }
    });
  });

  describe('LocationResponseSchema', () => {
    const validApiResponse = {
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
            }
          ]
        }
      }
    };

    it('should validate complete API response', () => {
      const result = LocationResponseSchema.safeParse(validApiResponse);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.areaSuggestionSearch.suggestions).toHaveLength(1);
        expect(result.data.data.areaSuggestionSearch.suggestions[0].id).toBe('509');
      }
    });

    it('should validate API response with empty suggestions', () => {
      const emptyResponse = {
        data: {
          areaSuggestionSearch: {
            suggestions: []
          }
        }
      };

      const result = LocationResponseSchema.safeParse(emptyResponse);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.areaSuggestionSearch.suggestions).toHaveLength(0);
      }
    });

    it('should reject API response with missing data field', () => {
      const invalidResponse = {
        // Missing data field
        areaSuggestionSearch: {
          suggestions: []
        }
      };

      const result = LocationResponseSchema.safeParse(invalidResponse);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('data')
        )).toBe(true);
      }
    });

    it('should reject API response with missing areaSuggestionSearch field', () => {
      const invalidResponse = {
        data: {
          // Missing areaSuggestionSearch field
        }
      };

      const result = LocationResponseSchema.safeParse(invalidResponse);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('areaSuggestionSearch')
        )).toBe(true);
      }
    });

    it('should reject API response with wrong structure', () => {
      const invalidResponse = {
        data: {
          areaSuggestionSearch: {
            suggestions: "not an array" // Should be array
          }
        }
      };

      const result = LocationResponseSchema.safeParse(invalidResponse);
      
      expect(result.success).toBe(false);
    });
  });

  describe('TypeScript Type Inference', () => {
    it('should infer correct types from schemas', () => {
      // This test ensures that TypeScript types are correctly inferred from Zod schemas
      const suggestion: LocationSuggestion = {
        id: '1',
        displayName: 'Test Location',
        parent: 'Test Parent',
        parentType: 'Test Type',
        parentDisplayName: 'Test Parent Display',
        parentTypeDisplayName: 'Test Type Display',
        parentId: '2'
      };

      const searchResult: LocationSearchResult = {
        suggestions: [suggestion]
      };

      const apiResponse: LocationApiResponse = {
        data: {
          areaSuggestionSearch: searchResult
        }
      };

      const criteria: LocationSearchCriteria = {
        query: 'test'
      };

      // These assignments should compile without errors
      expect(suggestion.id).toBe('1');
      expect(searchResult.suggestions).toHaveLength(1);
      expect(apiResponse.data.areaSuggestionSearch.suggestions).toHaveLength(1);
      expect(criteria.query).toBe('test');
    });

    it('should enforce required fields at compile time', () => {
      // This test ensures that TypeScript enforces required fields
      // The following should cause compilation errors if uncommented:
      
      // const invalidSuggestion: LocationSuggestion = {
      //   id: '1',
      //   // Missing required fields
      // };

      // const invalidCriteria: LocationSearchCriteria = {
      //   // Missing required query field
      // };

      // Instead, we verify that valid objects compile correctly
      const validSuggestion: LocationSuggestion = {
        id: '1',
        displayName: 'Test',
        parent: 'Parent',
        parentType: 'Type',
        parentDisplayName: 'Parent Display',
        parentTypeDisplayName: 'Type Display',
        parentId: '2'
      };

      const validCriteria: LocationSearchCriteria = {
        query: 'test'
      };

      expect(validSuggestion.id).toBe('1');
      expect(validCriteria.query).toBe('test');
    });
  });

  describe('Schema Edge Cases', () => {
    it('should handle very long field values', () => {
      const longString = 'a'.repeat(10000);
      const suggestionWithLongValues = {
        id: longString,
        displayName: longString,
        parent: longString,
        parentType: longString,
        parentDisplayName: longString,
        parentTypeDisplayName: longString,
        parentId: longString
      };

      const result = LocationSuggestionSchema.safeParse(suggestionWithLongValues);
      
      expect(result.success).toBe(true);
    });

    it('should handle unicode characters in all fields', () => {
      const unicodeSuggestion = {
        id: '🏠123',
        displayName: '测试地点 🏠',
        parent: 'Тест родитель',
        parentType: 'עיר',
        parentDisplayName: 'مدينة الاختبار',
        parentTypeDisplayName: 'Тип города',
        parentId: '🌍456'
      };

      const result = LocationSuggestionSchema.safeParse(unicodeSuggestion);
      
      expect(result.success).toBe(true);
    });

    it('should handle numeric strings as IDs', () => {
      const numericIdSuggestion = {
        id: '123456789',
        displayName: 'Numeric ID Location',
        parent: 'Parent',
        parentType: 'Type',
        parentDisplayName: 'Parent Display',
        parentTypeDisplayName: 'Type Display',
        parentId: '987654321'
      };

      const result = LocationSuggestionSchema.safeParse(numericIdSuggestion);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe('string');
        expect(typeof result.data.parentId).toBe('string');
      }
    });
  });
});