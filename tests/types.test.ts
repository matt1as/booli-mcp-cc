import { describe, it, expect } from '@jest/globals';
import { PropertySchema, SearchResultSchema, ResponseSchema, SearchCriteria } from '../src/types';

describe('Property Schema Validation', () => {
  const validProperty = {
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
  };

  it('should validate a complete property object', () => {
    const result = PropertySchema.safeParse(validProperty);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("5750842");
      expect(result.data.livingArea?.value).toBe("29,5");
      expect(result.data.rooms?.formatted).toBe("1 rum");
    }
  });

  it('should validate property with null values', () => {
    const propertyWithNulls = {
      id: "12345",
      livingArea: null,
      rooms: null,
      plotArea: null,
      listPrice: null
    };
    
    const result = PropertySchema.safeParse(propertyWithNulls);
    expect(result.success).toBe(true);
  });

  it('should reject property without required id field', () => {
    const invalidProperty = {
      livingArea: {
        value: "50",
        formatted: "50 m²"
      }
    };
    
    const result = PropertySchema.safeParse(invalidProperty);
    expect(result.success).toBe(false);
  });

  it('should reject property with invalid area structure', () => {
    const invalidProperty = {
      id: "12345",
      livingArea: {
        value: "50"
        // missing formatted field
      }
    };
    
    const result = PropertySchema.safeParse(invalidProperty);
    expect(result.success).toBe(false);
  });

  it('should validate property with partial data', () => {
    const minimalProperty = {
      id: "67890",
      livingArea: {
        value: "75",
        formatted: "75 m²"
      },
      rooms: null,
      plotArea: null,
      listPrice: {
        value: "2 500 000",
        formatted: "2 500 000 kr"
      }
    };
    
    const result = PropertySchema.safeParse(minimalProperty);
    expect(result.success).toBe(true);
  });
});

describe('Search Result Schema Validation', () => {
  const validSearchResult = {
    totalCount: 1,
    result: [{
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
    }]
  };

  it('should validate complete search result', () => {
    const result = SearchResultSchema.safeParse(validSearchResult);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
      expect(result.data.result).toHaveLength(1);
    }
  });

  it('should validate empty search result', () => {
    const emptyResult = {
      totalCount: 0,
      result: []
    };
    
    const result = SearchResultSchema.safeParse(emptyResult);
    expect(result.success).toBe(true);
  });

  it('should validate multiple properties in result', () => {
    const multipleResults = {
      totalCount: 2,
      result: [
        {
          id: "1",
          livingArea: null,
          rooms: null,
          plotArea: null,
          listPrice: null
        },
        {
          id: "2",
          livingArea: { value: "50", formatted: "50 m²" },
          rooms: { value: "2", formatted: "2 rum" },
          plotArea: null,
          listPrice: { value: "3000000", formatted: "3 000 000 kr" }
        }
      ]
    };
    
    const result = SearchResultSchema.safeParse(multipleResults);
    expect(result.success).toBe(true);
  });

  it('should reject result with invalid totalCount', () => {
    const invalidResult = {
      totalCount: "not-a-number",
      result: []
    };
    
    const result = SearchResultSchema.safeParse(invalidResult);
    expect(result.success).toBe(false);
  });

  it('should reject result with invalid property in array', () => {
    const invalidResult = {
      totalCount: 1,
      result: [{
        // missing id field
        livingArea: null,
        rooms: null,
        plotArea: null,
        listPrice: null
      }]
    };
    
    const result = SearchResultSchema.safeParse(invalidResult);
    expect(result.success).toBe(false);
  });
});

describe('Response Schema Validation', () => {
  const validResponse = {
    data: {
      searchForSale: {
        totalCount: 1,
        result: [{
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
        }]
      }
    }
  };

  it('should validate complete API response', () => {
    const result = ResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it('should reject response with missing data field', () => {
    const invalidResponse = {
      searchForSale: {
        totalCount: 1,
        result: []
      }
    };
    
    const result = ResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it('should reject response with missing searchForSale field', () => {
    const invalidResponse = {
      data: {
        otherField: "value"
      }
    };
    
    const result = ResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });
});

describe('Search Criteria Interface', () => {
  it('should accept valid search criteria with all fields', () => {
    const criteria: SearchCriteria = {
      location: "Stockholm",
      minPrice: 1000000,
      maxPrice: 5000000,
      minRooms: 1,
      maxRooms: 3,
      minArea: 30,
      maxArea: 100,
      propertyType: 'apartment'
    };
    
    expect(criteria.location).toBe("Stockholm");
    expect(criteria.propertyType).toBe('apartment');
  });

  it('should accept empty search criteria', () => {
    const criteria: SearchCriteria = {};
    expect(Object.keys(criteria)).toHaveLength(0);
  });

  it('should accept partial search criteria', () => {
    const criteria: SearchCriteria = {
      location: "Göteborg",
      maxPrice: 3000000
    };
    
    expect(criteria.location).toBe("Göteborg");
    expect(criteria.minPrice).toBeUndefined();
  });

  it('should enforce property type enum values', () => {
    const apartmentCriteria: SearchCriteria = {
      propertyType: 'apartment'
    };
    const houseCriteria: SearchCriteria = {
      propertyType: 'house'
    };
    
    expect(apartmentCriteria.propertyType).toBe('apartment');
    expect(houseCriteria.propertyType).toBe('house');
  });
});