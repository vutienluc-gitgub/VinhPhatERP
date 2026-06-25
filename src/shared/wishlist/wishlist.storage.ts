import { WishlistData } from './wishlist.types';

const STORAGE_KEY = 'vp.fabric-wishlist.v1';

export const wishlistStorage = {
  get(): WishlistData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as WishlistData;
      }
    } catch (error) {
      console.warn('Failed to parse wishlist from storage', error);
    }
    return { items: {}, recentlyViewed: [] };
  },

  set(data: WishlistData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save wishlist to storage', error);
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear wishlist from storage', error);
    }
  },
};
