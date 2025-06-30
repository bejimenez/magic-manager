'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CollectionCard } from '@/packages/shared/src/types';
import { Search, Filter, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CollectionView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const debouncedQuery = useDebounce(searchQuery, 400);
  
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: '20',
    ...(debouncedQuery && { q: debouncedQuery }),
  });

  const { data, error, isLoading } = useSWR(
    `/api/collection/search?${queryParams}`,
    fetcher
  );

  const renderManaSymbols = (manaCost: string) => {
    if (!manaCost) return null;
    
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

  const formatCondition = (condition: string) => {
    return condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search your collection..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Collection Grid */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading collection...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            Failed to load collection. Please try again.
          </div>
        )}

        {data?.data && data.data.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? (
              <>No cards found matching "{searchQuery}".</>
            ) : (
              <>Your collection is empty. Start by searching and adding cards!</>
            )}
          </div>
        )}

        {data?.data && data.data.length > 0 && (
          <>
            <div className="grid gap-4">
              {data.data.map((collectionCard: CollectionCard) => {
                const card = collectionCard.card;
                if (!card) return null;

                return (
                  <Card key={collectionCard.id} className="overflow-hidden">
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
                              <Badge variant="secondary">
                                Qty: {collectionCard.quantity}
                              </Badge>
                              {collectionCard.foil && (
                                <Badge variant="outline">Foil</Badge>
                              )}
                            </div>
                          </div>

                          <div className="text-sm">
                            <p className="font-medium">{card.type_line}</p>
                            {card.oracle_text && (
                              <p className="text-muted-foreground mt-1 line-clamp-2">
                                {card.oracle_text}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{card.set_code?.toUpperCase()}</span>
                            <Badge variant="outline" className="text-xs">
                              {card.rarity}
                            </Badge>
                            <span>{formatCondition(collectionCard.condition)}</span>
                            {card.prices?.usd && (
                              <span>${card.prices.usd}</span>
                            )}
                          </div>

                          {collectionCard.notes && (
                            <div className="text-sm text-muted-foreground italic">
                              "{collectionCard.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {data.pagination && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {data.data.length} of {data.pagination.total} cards
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!data.pagination.hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}