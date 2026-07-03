import { createContext, useCallback, useEffect, useState } from 'react';

import { inquiryCartStorage } from './inquiry-cart.storage';
import { InquiryCartContextValue, InquiryCartItem } from './inquiry-cart.types';

// Placeholder for analytics tracking
const trackEvent = (eventName: string, payload: Record<string, unknown>) => {
  // eslint-disable-next-line no-console
  console.log(`[Analytics] ${eventName}:`, payload);
  // CRM Tracking logic goes here
};

// eslint-disable-next-line react-refresh/only-export-components
export const InquiryCartContext = createContext<
  InquiryCartContextValue | undefined
>(undefined);

export function InquiryCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<Record<string, InquiryCartItem>>({});
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load
  useEffect(() => {
    const data = inquiryCartStorage.get();
    setItems(data.items || {});
    setRecentlyViewed(data.recentlyViewed || []);
    setIsLoaded(true);
  }, []);

  // Sync to storage
  useEffect(() => {
    if (isLoaded) {
      inquiryCartStorage.set({ items, recentlyViewed });
    }
  }, [items, recentlyViewed, isLoaded]);

  const addToInquiryCart = useCallback((item: InquiryCartItem) => {
    setItems((prev) => {
      // Don't modify if it already exists to avoid unnecessary renders
      if (prev[item.id]) return prev;
      return { ...prev, [item.id]: item };
    });
    trackEvent('inquiry_cart_add', { fabricId: item.id });
  }, []);

  const removeFromInquiryCart = useCallback((id: string) => {
    setItems((prev) => {
      if (!prev[id]) return prev;
      const newItems = { ...prev };
      delete newItems[id];
      return newItems;
    });
  }, []);

  const clearInquiryCart = useCallback(() => {
    setItems({});
  }, []);

  const addRecentlyViewed = useCallback((id: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => item !== id);
      return [id, ...filtered].slice(0, 10); // Keep max 10
    });
  }, []);

  return (
    <InquiryCartContext.Provider
      value={{
        inquiryCart: items,
        recentlyViewed,
        addToInquiryCart,
        removeFromInquiryCart,
        clearInquiryCart,
        addRecentlyViewed,
      }}
    >
      {children}
    </InquiryCartContext.Provider>
  );
}
