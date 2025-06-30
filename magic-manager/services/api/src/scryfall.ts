// services/api/src/scryfall.ts
import type { ScryfallCard, ScryfallSearchResponse } from '@/packages/shared/src/types';

const SCRYFALL_API_BASE = 'https://api.scryfall.com';
const REQUEST_DELAY = 100; // 100ms delay between requests to respect rate limits

// Rate limiting utility
let lastRequestTime = 0;

const rateLimitedFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'MagicCollectionManager/1.0',
      'Accept': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited, wait and retry once
      await new Promise(resolve => setTimeout(resolve, 1000));
      return rateLimitedFetch(url, options);
    }
    
    throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`);
  }
  
  return response;
};

export class ScryfallService {
  /**
   * Search for cards using Scryfall's fuzzy search
   */
  static async searchCards(
    query: string,
    options: {
      unique?: 'cards' | 'art' | 'prints';
      page?: number;
      include_extras?: boolean;
      include_multilingual?: boolean;
    } = {}
  ): Promise<ScryfallSearchResponse> {
    const params = new URLSearchParams({
      q: query,
      unique: options.unique || 'cards',
      ...(options.page && { page: options.page.toString() }),
      ...(options.include_extras !== undefined && { 
        include_extras: options.include_extras.toString() 
      }),
      ...(options.include_multilingual !== undefined && { 
        include_multilingual: options.include_multilingual.toString() 
      }),
    });

    const url = `${SCRYFALL_API_BASE}/cards/search?${params}`;
    
    try {
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      
      if (data.object === 'error') {
        if (data.code === 'not_found') {
          // No cards found, return empty result
          return {
            object: 'list',
            total_cards: 0,
            has_more: false,
            data: [],
          };
        }
        throw new Error(data.details || 'Unknown Scryfall error');
      }
      
      return data;
    } catch (error) {
      console.error('Scryfall fuzzy name search error:', error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions for card names
   */
  static async getAutocomplete(query: string): Promise<string[]> {
    const params = new URLSearchParams({ q: query });
    const url = `${SCRYFALL_API_BASE}/cards/autocomplete?${params}`;
    
    try {
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      
      if (data.object === 'error') {
        return [];
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Scryfall autocomplete error:', error);
      return [];
    }
  }

  /**
   * Download card image
   */
  static async downloadCardImage(imageUrl: string): Promise<ArrayBuffer> {
    try {
      const response = await rateLimitedFetch(imageUrl);
      return await response.arrayBuffer();
    } catch (error) {
      console.error('Failed to download card image:', error);
      throw error;
    }
  }

  /**
   * Get sets information
   */
  static async getSets(): Promise<any[]> {
    const url = `${SCRYFALL_API_BASE}/sets`;
    
    try {
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      
      if (data.object === 'error') {
        throw new Error(data.details || 'Failed to fetch sets');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Scryfall sets error:', error);
      throw error;
    }
  }

  /**
   * Advanced search with complex queries
   */
  static async advancedSearch(
    filters: {
      name?: string;
      colors?: string[];
      colorIdentity?: string[];
      types?: string[];
      text?: string;
      manaValue?: { min?: number; max?: number };
      power?: { min?: number; max?: number };
      toughness?: { min?: number; max?: number };
      sets?: string[];
      rarity?: string[];
      format?: string;
      banned?: boolean;
      legal?: boolean;
    },
    options: {
      page?: number;
      unique?: 'cards' | 'art' | 'prints';
      sort?: string;
      direction?: 'asc' | 'desc';
    } = {}
  ): Promise<ScryfallSearchResponse> {
    const queryParts: string[] = [];

    // Build the search query
    if (filters.name) {
      queryParts.push(`name:"${filters.name}"`);
    }

    if (filters.colors && filters.colors.length > 0) {
      queryParts.push(`c:${filters.colors.join('')}`);
    }

    if (filters.colorIdentity && filters.colorIdentity.length > 0) {
      queryParts.push(`id:${filters.colorIdentity.join('')}`);
    }

    if (filters.types && filters.types.length > 0) {
      const typeQuery = filters.types.map(type => `t:"${type}"`).join(' OR ');
      queryParts.push(`(${typeQuery})`);
    }

    if (filters.text) {
      queryParts.push(`o:"${filters.text}"`);
    }

    if (filters.manaValue?.min !== undefined) {
      queryParts.push(`cmc>=${filters.manaValue.min}`);
    }

    if (filters.manaValue?.max !== undefined) {
      queryParts.push(`cmc<=${filters.manaValue.max}`);
    }

    if (filters.power?.min !== undefined) {
      queryParts.push(`pow>=${filters.power.min}`);
    }

    if (filters.power?.max !== undefined) {
      queryParts.push(`pow<=${filters.power.max}`);
    }

    if (filters.toughness?.min !== undefined) {
      queryParts.push(`tou>=${filters.toughness.min}`);
    }

    if (filters.toughness?.max !== undefined) {
      queryParts.push(`tou<=${filters.toughness.max}`);
    }

    if (filters.sets && filters.sets.length > 0) {
      const setQuery = filters.sets.map(set => `s:"${set}"`).join(' OR ');
      queryParts.push(`(${setQuery})`);
    }

    if (filters.rarity && filters.rarity.length > 0) {
      const rarityQuery = filters.rarity.map(rarity => `r:"${rarity}"`).join(' OR ');
      queryParts.push(`(${rarityQuery})`);
    }

    if (filters.format) {
      if (filters.legal) {
        queryParts.push(`f:${filters.format}`);
      } else if (filters.banned) {
        queryParts.push(`banned:${filters.format}`);
      }
    }

    const query = queryParts.join(' ');

    return this.searchCards(query, {
      page: options.page,
      unique: options.unique,
    });
  }
}Scryfall search error:', error);
      throw error;
    }
  }

  /**
   * Get a specific card by Scryfall ID
   */
  static async getCard(scryfallId: string): Promise<ScryfallCard> {
    const url = `${SCRYFALL_API_BASE}/cards/${scryfallId}`;
    
    try {
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      
      if (data.object === 'error') {
        throw new Error(data.details || 'Card not found');
      }
      
      return data;
    } catch (error) {
      console.error('Scryfall get card error:', error);
      throw error;
    }
  }

  /**
   * Get a specific card by name (exact match)
   */
  static async getCardByName(name: string, set?: string): Promise<ScryfallCard> {
    const params = new URLSearchParams({ exact: name });
    if (set) {
      params.append('set', set);
    }

    const url = `${SCRYFALL_API_BASE}/cards/named?${params}`;
    
    try {
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      
      if (data.object === 'error') {
        throw new Error(data.details || 'Card not found');
      }
      
      return data;
    } catch (error) {
      console.error('Scryfall get card by name error:', error);
      throw error;
    }
  }

  /**
   * Get card by name with fuzzy matching
   */
  static async getCardByFuzzyName(name: string): Promise<ScryfallCard> {
    const params = new URLSearchParams({ fuzzy: name });
    const url = `${SCRYFALL_API_BASE}/cards/named?${params}`;
    
    try {
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      
      if (data.object === 'error') {
        throw new Error(data.details || 'Card not found');
      }
      
      return data;
    } catch (error) {
      console.error('