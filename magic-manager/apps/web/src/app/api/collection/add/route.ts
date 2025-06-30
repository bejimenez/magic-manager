import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/packages/database/src/client';
import { AddToCollectionSchema } from '@/packages/shared/src/types';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = AddToCollectionSchema.parse(body);

    // Check authentication
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if card exists in cache
    const { data: cardExists, error: cardError } = await supabase
      .from('cards_cache')
      .select('scryfall_id')
      .eq('scryfall_id', validatedData.scryfall_id)
      .single();

    if (cardError || !cardExists) {
      return NextResponse.json(
        { error: 'Card not found in database' },
        { status: 404 }
      );
    }

    // Check if user already has this card in collection
    const { data: existingCard, error: existingError } = await supabase
      .from('collection_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('scryfall_id', validatedData.scryfall_id)
      .eq('condition', validatedData.condition)
      .eq('foil', validatedData.foil)
      .single();

    let result;

    if (existingCard) {
      // Update existing card quantity
      const newQuantity = existingCard.quantity + validatedData.quantity;
      
      const { data: updatedCard, error: updateError } = await supabase
        .from('collection_cards')
        .update({ 
          quantity: newQuantity,
          notes: validatedData.notes || existingCard.notes,
        })
        .eq('id', existingCard.id)
        .select(`
          *,
          card:cards_cache(*)
        `)
        .single();

      if (updateError) {
        throw new Error(`Failed to update collection card: ${updateError.message}`);
      }

      result = updatedCard;
    } else {
      // Insert new card to collection
      const { data: newCard, error: insertError } = await supabase
        .from('collection_cards')
        .insert({
          user_id: user.id,
          scryfall_id: validatedData.scryfall_id,
          quantity: validatedData.quantity,
          condition: validatedData.condition,
          foil: validatedData.foil,
          notes: validatedData.notes,
        })
        .select(`
          *,
          card:cards_cache(*)
        `)
        .single();

      if (insertError) {
        throw new Error(`Failed to add card to collection: ${insertError.message}`);
      }

      result = newCard;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Add to collection API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}