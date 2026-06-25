import { createContext, useCallback, useEffect, useState } from 'react';

import { wishlistStorage } from './wishlist.storage';
import { WishlistContextValue, WishlistItem } from './wishlist.types';

// Placeholder for analytics tracking
const trackEvent = (eventName: string, payload: Record<string, unknown>) => {
  // eslint-disable-next-line no-console
  console.log(`[Analytics] ${eventName}:`, payload);
  // CRM Tracking logic goes here
};

// eslint-disable-next-line react-refresh/only-export-components
export const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined,
);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Record<string, WishlistItem>>({});
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load
  useEffect(() => {
    const data = wishlistStorage.get();
    setItems(data.items || {});
    setRecentlyViewed(data.recentlyViewed || []);
    setIsLoaded(true);
  }, []);

  // Sync to storage
  useEffect(() => {
    if (isLoaded) {
      wishlistStorage.set({ items, recentlyViewed });
    }
  }, [items, recentlyViewed, isLoaded]);

  const addToWishlist = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      // Don't modify if it already exists to avoid unnecessary renders
      if (prev[item.id]) return prev;
      return { ...prev, [item.id]: item };
    });
    trackEvent('wishlist_add', { fabricId: item.id });
  }, []);

  const removeFromWishlist = useCallback((id: string) => {
    setItems((prev) => {
      if (!prev[id]) return prev;
      const newItems = { ...prev };
      delete newItems[id];
      return newItems;
    });
  }, []);

  const clearWishlist = useCallback(() => {
    setItems({});
  }, []);

  const addRecentlyViewed = useCallback((id: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => item !== id);
      return [id, ...filtered].slice(0, 10); // Keep max 10
    });
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist: items,
        recentlyViewed,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        addRecentlyViewed,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
