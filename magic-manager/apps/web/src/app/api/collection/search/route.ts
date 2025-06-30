import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/packages/database/src/client';
import { SearchCollectionSchema } from '@/packages/shared/src/types';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const params = {
      q: searchParams.get('q') || undefined,
      colors: searchParams.get('colors')?.split(',').filter(Boolean) || undefined,
      types: searchParams.get('types')?.split(',').filter(Boolean) || undefined,
      sets: searchParams.get('sets')?.split(',').filter(Boolean) || undefined,
      cmc_min: searchParams.get('cmc_min') ? parseInt(searchParams.get('cmc_min')!) : undefined,
      cmc_max: searchParams.get('cmc_max') ? parseInt(searchParams.get('cmc_max')!) : undefined,
      rarity: searchParams.get('rarity')?.split(',').filter(Boolean) as any || undefined,
      sort: searchParams.get('sort') as any || 'name',
      order: searchParams.get('order') as any || 'asc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    };

    // Validate input
    const validatedParams = SearchCollectionSchema.parse(params);

    // Check authentication
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build the query
    let query = supabase
      .from('collection_cards')
      .select(`
        *,
        card:cards_cache(*)
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (validatedParams.q) {
      query = query.or(`card.name.ilike.%${validatedParams.q}%,card.oracle_text.ilike.%${validatedParams.q}%,card.type_line.ilike.%${validatedParams.q}%`);
    }

    if (validatedParams.colors && validatedParams.colors.length > 0) {
      query = query.overlaps('card.colors', validatedParams.colors);
    }

    if (validatedParams.types && validatedParams.types.length > 0) {
      const typeConditions = validatedParams.types.map(type => 
        `card.type_line.ilike.%${type}%`
      ).join(',');
      query = query.or(typeConditions);
    }

    if (validatedParams.sets && validatedParams.sets.length > 0) {
      query = query.in('card.set_code', validatedParams.sets);
    }

    if (validatedParams.cmc_min !== undefined) {
      query = query.gte('card.cmc', validatedParams.cmc_min);
    }

    if (validatedParams.cmc_max !== undefined) {
      query = query.lte('card.cmc', validatedParams.cmc_max);
    }

    if (validatedParams.rarity && validatedParams.rarity.length > 0) {
      query = query.in('card.rarity', validatedParams.rarity);
    }

    // Apply sorting
    const sortColumn = validatedParams.sort === 'name' ? 'card.name' :
                      validatedParams.sort === 'cmc' ? 'card.cmc' :
                      validatedParams.sort === 'rarity' ? 'card.rarity' :
                      validatedParams.sort === 'set' ? 'card.set_code' :
                      validatedParams.sort === 'added_at' ? 'added_at' :
                      'card.name';

    query = query.order(sortColumn, { ascending: validatedParams.order === 'asc' });

    // Apply pagination
    const offset = (validatedParams.page - 1) * validatedParams.limit;
    query = query.range(offset, offset + validatedParams.limit - 1);

    const { data: cards, error } = await query;

    if (error) {
      throw new Error(`Failed to search collection: ${error.message}`);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('collection_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Apply the same filters for count
    if (validatedParams.q) {
      countQuery = countQuery.or(`card.name.ilike.%${validatedParams.q}%,card.oracle_text.ilike.%${validatedParams.q}%,card.type_line.ilike.%${validatedParams.q}%`);
    }

    if (validatedParams.colors && validatedParams.colors.length > 0) {
      countQuery = countQuery.overlaps('card.colors', validatedParams.colors);
    }

    if (validatedParams.types && validatedParams.types.length > 0) {
      const typeConditions = validatedParams.types.map(type => 
        `card.type_line.ilike.%${type}%`
      ).join(',');
      countQuery = countQuery.or(typeConditions);
    }

    if (validatedParams.sets && validatedParams.sets.length > 0) {
      countQuery = countQuery.in('card.set_code', validatedParams.sets);
    }

    if (validatedParams.cmc_min !== undefined) {
      countQuery = countQuery.gte('card.cmc', validatedParams.cmc_min);
    }

    if (validatedParams.cmc_max !== undefined) {
      countQuery = countQuery.lte('card.cmc', validatedParams.cmc_max);
    }

    if (validatedParams.rarity && validatedParams.rarity.length > 0) {
      countQuery = countQuery.in('card.rarity', validatedParams.rarity);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting collection count:', countError);
    }

    return NextResponse.json({
      data: cards || [],
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: count || 0,
        hasMore: (count || 0) > (validatedParams.page * validatedParams.limit),
      },
    });
  } catch (error) {
    console.error('Search collection API error:', error);
    
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