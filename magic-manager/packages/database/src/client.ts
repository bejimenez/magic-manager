import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client (for use in React components)
export const createClientSupabase = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Server-side Supabase client (for use in Server Components and API routes)
export const createServerSupabase = () => {
  const cookieStore = cookies();
  
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

// Service role client (for administrative operations)
export const createServiceSupabase = () => {
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Default client for general use
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Storage helpers
export const STORAGE_BUCKETS = {
  CARD_IMAGES: 'card-images',
} as const;

export const getStorageUrl = (bucket: string, path: string) => {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
};

export const uploadCardImage = async (
  supabaseClient: ReturnType<typeof createServiceSupabase>,
  scryfallId: string,
  imageBuffer: ArrayBuffer,
  contentType: string = 'image/jpeg'
) => {
  const path = `cards/${scryfallId}.jpg`;
  
  const { data, error } = await supabaseClient.storage
    .from(STORAGE_BUCKETS.CARD_IMAGES)
    .upload(path, imageBuffer, {
      contentType,
      upsert: true,
      cacheControl: '31536000', // 1 year cache
    });

  if (error) {
    throw new Error(`Failed to upload card image: ${error.message}`);
  }

  return getStorageUrl(STORAGE_BUCKETS.CARD_IMAGES, path);
};

// Database helper functions
export const withErrorHandling = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> => {
  const { data, error } = await operation();
  
  if (error) {
    console.error('Database operation failed:', error);
    throw new Error(error.message || 'Database operation failed');
  }
  
  if (!data) {
    throw new Error('No data returned from operation');
  }
  
  return data;
};

export const getCardFromCache = async (
  supabaseClient: ReturnType<typeof createServerSupabase> | ReturnType<typeof createServiceSupabase>,
  scryfallId: string
) => {
  return withErrorHandling(() =>
    supabaseClient
      .from('cards_cache')
      .select('*')
      .eq('scryfall_id', scryfallId)
      .single()
  );
};

export const insertCardToCache = async (
  supabaseClient: ReturnType<typeof createServiceSupabase>,
  card: any
) => {
  return withErrorHandling(() =>
    supabaseClient
      .from('cards_cache')
      .upsert({
        scryfall_id: card.id,
        name: card.name,
        mana_cost: card.mana_cost,
        cmc: card.cmc,
        type_line: card.type_line,
        oracle_text: card.oracle_text,
        colors: card.colors,
        color_identity: card.color_identity,
        keywords: card.keywords,
        power: card.power,
        toughness: card.toughness,
        image_uris: card.image_uris,
        prices: card.prices,
        legalities: card.legalities,
        set_code: card.set,
        rarity: card.rarity,
      })
      .select()
      .single()
  );
};