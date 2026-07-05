import {
  createContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';

import { trackLeadEvent } from '@/shared/services/analytics';

import { inquiryCartStorage } from './inquiry-cart.storage';
import { InquiryCartContextValue, InquiryCartItem } from './inquiry-cart.types';

const MAX_RECENTLY_VIEWED = 10;

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
    trackLeadEvent('inquiry_cart_add', { fabricId: item.id });
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
      return [id, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      inquiryCart: items,
      recentlyViewed,
      addToInquiryCart,
      removeFromInquiryCart,
      clearInquiryCart,
      addRecentlyViewed,
    }),
    [
      items,
      recentlyViewed,
      addToInquiryCart,
      removeFromInquiryCart,
      clearInquiryCart,
      addRecentlyViewed,
    ],
  );

  return (
    <InquiryCartContext.Provider value={contextValue}>
      {children}
    </InquiryCartContext.Provider>
  );
}
