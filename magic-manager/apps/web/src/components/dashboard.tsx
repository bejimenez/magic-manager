'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardSearch } from './card-search';
import { CollectionView } from './collection-view';
import { CollectionStats } from './collection-stats';
import { ThemeToggle } from './theme-toggle';
import { 
  Search, 
  Library, 
  BarChart3, 
  LogOut, 
  Sparkles,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('search');

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'Successfully signed out of your account.',
      });
    } catch (error: any) {
      toast({
        title: 'Sign out failed',
        description: error.message || 'Failed to sign out.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold">Magic Collection Manager</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {user?.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Search Cards
            </TabsTrigger>
            <TabsTrigger value="collection" className="gap-2">
              <Library className="h-4 w-4" />
              My Collection
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Search Cards</h2>
              <p className="text-muted-foreground">
                Search for Magic cards and add them to your collection
              </p>
            </div>
            <CardSearch />
          </TabsContent>

          <TabsContent value="collection" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">My Collection</h2>
              <p className="text-muted-foreground">
                Browse and manage your Magic card collection
              </p>
            </div>
            <CollectionView />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Collection Statistics</h2>
              <p className="text-muted-foreground">
                Insights and analytics about your collection
              </p>
            </div>
            <CollectionStats />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}