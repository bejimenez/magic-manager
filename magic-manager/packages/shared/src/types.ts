import { z } from 'zod';

// Scryfall API types
export interface ScryfallCard {
    id: string;
    name: string;
    mana_cost?: string;
    cmc: number;
    type_line: string;
    oracle_text?: string;
    colors: string[];
    color_identity: string[];
    keywords?: string[];
    power?: string;
    toughness?: string;
    image_uris?: {
        small: string;
        normal: string;
        large: string;
        png: string;
        art_crop: string;
        border_crop: string;
    };
    prices: {
        usd?: string;
        usd_foil?: string;
        eur?: string;
        eur_foil?: string;
        tix?: string;
    };
    legalities: Record<string, string>;
    set: string;
    set_name: string;
    rarity: string;
}

export interface ScryfallSearchResponse {
    object: 'list';
    total_cards: number;
    has_more: boolean;
    data: ScryfallCard[];
}

// Database types
export interface CardCache {
    scryfall_id: string;
    name: string;
    mana_cost?: string;
    cmc: number;
    type_line: string;
    oracle_text?: string;
    colors: string[];
    color_identity: string[];
    keywords?: string[];
    power?: string;
    toughness?: string;
    image_uris?: any;
    local_image_url?: string;
    prices?: any;
    legalities?: any;
    set_code: string;
    rarity: string;
    created_at: string;
    updated_at: string;
}

export interface CollectionCard {
    id: string;
    user_id: string;
    scryfall_id: string;
    quantity: number;
    condition: string;
    foil: boolean;
    notes?: string;
    added_at: string;
    updated_at: string;
    card?: CardCache; // Optional relation to CardCache
}

export interface Deck {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    format?: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface DeckCard {
    id: string;
    deck_id: string;
    scryfall_id: string;
    quantity: number;
    card_type: 'mainboard' | 'sideboard' | 'commander'| 'companion';
    added_at: string;
    card?: CardCache; // Optional relation to CardCache
}

// API request/response types
export const SearchCardsSchema = z.object({
    q: z.string().min(1).max(100),
    page: z.number().min(1).max(10).optional(),
    unique: z.enum(['cards', 'art', 'prints']).optional(),
});

export const AddToCollectionSchema = z.object({
    scryfall_id: z.string().uuid(),
    quantity: z.number().min(1).max(100).default(1),
    condition: z.enum(['mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor']).default('near_mint'),
    foil: z.boolean().default(false),
    notes: z.string().max(500).optional(),
});

export const UpdateCollectionCardSchema = z.object({
    id: z.string().uuid(),
    quantity: z.number().min(0).max(100).optional(),
    condition: z.enum(['mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor']).optional(),
    foil: z.boolean().optional(),
    notes: z.string().max(500).optional(),
});

export const SearchCollectionSchema = z.object({
    q: z.string().optional(),
    colors: z.array(z.string()).optional(),
    types: z.array(z.string()).optional(),
    sets: z.array(z.string()).optional(),
    cmc_min: z.number().min(0).max(20).optional(),
    cmc_max: z.number().min(0).max(20).optional(),
    rarity: z.array(z.enum(['common', 'uncommon', 'rare', 'mythic'])).optional(),
    sort: z.enum(['name', 'cmc', 'rarity', 'set', 'added_at']).default('name'),
    order: z.enum(['asc', 'desc']).default('asc'),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
});

// UI types
export interface CardSearchResult extends CardCache {
    in_collection?: boolean;
    collection_quantity?: number;
}

export interface CollectionStats {
    total_cards: number;
    unique_cards: number;
    total_value?: number;
    color_distribution: Record<string, number>;
    type_distribution: Record<string, number>;
    rarity_distribution: Record<string, number>;
    set_distribution: Record<string, number>;
}

// Filter types
export interface CollectionFilters {
    search?: string;
    colors?: string[];
    types?: string[];
    sets?: string[];
    cmcRange?: [number, number];
    rarity?: string[];
    condition?: string[];
    foil?: boolean;
}

// Constants
export const MTG_COLORS = {
    W: 'White',
    U: 'Blue',
    B: 'Black',
    R: 'Red',
    G: 'Green',
} as const;

export const MTG_RARITIES = ['common', 'uncommon', 'rare', 'mythic'] as const;

export const CARD_CONDITIONS = [
    'mint',
    'near_mint',
    'excellent',
    'good',
    'light_played',
    'played',
    'poor',
] as const;

export const MTG_FORMATS = [
    'Standard',
    'Modern',
    'Legacy',
    'Vintage',
    'Commander',
    'Pioneer',
    'Historic',
    'Brawl',
    'Pauper',
    'Draft',
    'Sealed',
] as const;

// Error types
export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 'NOT_FOUND', 404);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access') {
        super(message, 'UNAUTHORIZED', 401);
    }
}