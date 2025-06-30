'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Library, Coins, Palette, Sparkles } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CollectionStats() {
  const { data, error, isLoading } = useSWR('/api/collection/stats', fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Failed to load collection statistics.
      </div>
    );
  }

  // Mock data for now - you'll implement the actual API endpoint
  const stats = data || {
    total_cards: 0,
    unique_cards: 0,
    total_value: 0,
    color_distribution: {},
    type_distribution: {},
    rarity_distribution: {},
    set_distribution: {},
  };

  const colorNames = {
    W: 'White',
    U: 'Blue',
    B: 'Black',
    R: 'Red',
    G: 'Green',
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Value</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.total_value?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current market prices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.unique_cards > 0 ? ((stats.total_value || 0) / stats.unique_cards).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per unique card
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Color Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.color_distribution || {}).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.color_distribution).map(([color, count]) => (
                  <div key={color} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          color === 'W' ? 'bg-yellow-200' :
                          color === 'U' ? 'bg-blue-500' :
                          color === 'B' ? 'bg-gray-800' :
                          color === 'R' ? 'bg-red-500' :
                          color === 'G' ? 'bg-green-500' :
                          'bg-gray-400'
                        }`} 
                      />
                      <span className="text-sm">{colorNames[color as keyof typeof colorNames] || color}</span>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No color data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rarity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rarity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.rarity_distribution || {}).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.rarity_distribution).map(([rarity, count]) => (
                  <div key={rarity} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          rarity === 'common' ? 'bg-gray-400' :
                          rarity === 'uncommon' ? 'bg-green-500' :
                          rarity === 'rare' ? 'bg-yellow-500' :
                          rarity === 'mythic' ? 'bg-red-500' :
                          'bg-gray-400'
                        }`} 
                      />
                      <span className="text-sm capitalize">{rarity}</span>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No rarity data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.type_distribution || {}).length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(stats.type_distribution)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 10)
                  .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{type}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(stats.type_distribution).length > 10 && (
                  <div className="text-xs text-muted-foreground">
                    ... and {Object.keys(stats.type_distribution).length - 10} more
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No type data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Set Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top Sets</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.set_distribution || {}).length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(stats.set_distribution)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 10)
                  .map(([set, count]) => (
                  <div key={set} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{set.toUpperCase()}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(stats.set_distribution).length > 10 && (
                  <div className="text-xs text-muted-foreground">
                    ... and {Object.keys(stats.set_distribution).length - 10} more sets
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No set data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.total_cards === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Cards in Collection</h3>
              <p className="text-muted-foreground mb-4">
                Start building your collection by searching for cards and adding them.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_cards.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Physical cards in collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Cards</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unique_cards.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Different card names
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between