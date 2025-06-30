import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceSupabase, insertCardToCache, getCardFromCache } from '@/packages/database/src/client';
import { ScryfallService } from '@/services/api/src/scryfall';
import { SearchCardsSchema } from '@/packages/shared/src/types';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      q: searchParams.get('q'),
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      unique: searchParams.get('unique') as 'cards' | 'art' | 'prints' | undefined,
    };

    // Validate input
    const validatedParams = SearchCardsSchema.parse(params);

    // Check authentication
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Search Scryfall
    const searchResult = await ScryfallService.searchCards(validatedParams.q, {
      page: validatedParams.page,
      unique: validatedParams.unique,
    });

    // Cache cards in database and check collection status
    const serviceSupabase = createServiceSupabase();
    const enhancedResults = await Promise.all(
      searchResult.data.map(async (card) => {
        try {
          // Try to get from cache first
          let cachedCard;
          try {
            cachedCard = await getCardFromCache(serviceSupabase, card.id);
          } catch (error) {
            // Card not in cache, insert it
            cachedCard = await insertCardToCache(serviceSupabase, card);
          }

          // Check if user has this card in collection
          const { data: collectionCard } = await supabase
            .from('collection_cards')
            .select('quantity')
            .eq('scryfall_id', card.id)
            .single();

          return {
            ...cachedCard,
            in_collection: !!collectionCard,
            collection_quantity: collectionCard?.quantity || 0,
          };
        } catch (error) {
          console.error(`Error processing card ${card.name}:`, error);
          // Return basic card data if caching fails
          return {
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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            in_collection: false,
            collection_quantity: 0,
          };
        }
      })
    );

    return NextResponse.json({
      ...searchResult,
      data: enhancedResults,
    });
  } catch (error) {
    console.error('Search cards API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}