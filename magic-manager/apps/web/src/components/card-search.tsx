'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardSearchResult } from '../../../../packages/shared/src/types';
import { Search, Plus, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CardSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [addingCards, setAddingCards] = useState<Set<string>>(new Set());
  
  const debouncedQuery = useDebounce(searchQuery, 400);
  
  const { data, error, isLoading } = useSWR(
    debouncedQuery.length >= 2 ? `/api/cards/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher
  );

  const handleAddToCollection = useCallback(async (card: CardSearchResult) => {
    setAddingCards(prev => new Set(prev).add(card.scryfall_id));
    
    try {
      const response = await fetch('/api/collection/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scryfall_id: card.scryfall_id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add card');
      }

      toast.success('Card added', {
        description: `${card.name} has been added to your collection.`,
      });
      
      // Update the card's collection status in the data
      if (data?.data) {
        const updatedData = data.data.map((c: CardSearchResult) => 
          c.scryfall_id === card.scryfall_id 
            ? { ...c, in_collection: true, collection_quantity: (c.collection_quantity || 0) + 1 }
            : c
        );
        // Note: In a real app, you'd want to mutate the SWR cache here
      }
    } catch (error: any) {
      toast.error('Failed to add card', {
        description: error.message || 'An error occurred while adding the card.',
      });
    } finally {
      setAddingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(card.scryfall_id);
        return newSet;
      });
    }
  }, [data]);

  const renderManaSymbols = (manaCost: string) => {
    if (!manaCost) return null;
    
    // Simple mana symbol rendering - in a real app you'd use actual mana symbol images
    const symbols = manaCost.replace(/[{}]/g, '').split('');
    return (
      <div className="flex gap-1">
        {symbols.map((symbol, index) => (
          <span
            key={index}
            className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-gray-200 dark:bg-gray-700"
          >
            {symbol}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for Magic cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {isLoading && debouncedQuery && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Searching cards...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            Failed to search cards. Please try again.
          </div>
        )}

        {data?.data && data.data.length === 0 && debouncedQuery && (
          <div className="text-center py-8 text-muted-foreground">
            No cards found for "{debouncedQuery}". Try a different search term.
          </div>
        )}

        {data?.data && data.data.length > 0 && (
          <div className="grid gap-4">
            {data.data.map((card: CardSearchResult) => (
              <Card key={card.scryfall_id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Card Image */}
                    <div className="flex-shrink-0">
                      {card.image_uris?.small ? (
                        <img
                          src={card.image_uris.small}
                          alt={card.name}
                          className="w-20 h-28 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-28 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Card Details */}
                    <div className="flex-grow space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{card.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {renderManaSymbols(card.mana_cost || '')}
                            <span>CMC {card.cmc}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {card.in_collection && (
                            <Badge variant="secondary">
                              In Collection ({card.collection_quantity})
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleAddToCollection(card)}
                            disabled={addingCards.has(card.scryfall_id)}
                          >
                            {addingCards.has(card.scryfall_id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : card.in_collection ? (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Add More
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Add to Collection
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="font-medium">{card.type_line}</p>
                        {card.oracle_text && (
                          <p className="text-muted-foreground mt-1 line-clamp-3">
                            {card.oracle_text}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{card.set_code?.toUpperCase()}</span>
                        <Badge variant="outline" className="text-xs">
                          {card.rarity}
                        </Badge>
                        {card.prices?.usd && (
                          <span>${card.prices.usd}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {data?.total_cards && data.total_cards > data.data?.length && (
          <div className="text-center py-4 text-muted-foreground">
            Showing {data.data?.length} of {data.total_cards} results
          </div>
        )}
      </div>
    </div>
  );
}