import { InquiryCartData } from './inquiry-cart.types';

const STORAGE_KEY = 'vp.fabric-inquiry-cart.v1';
const OLD_STORAGE_KEY = 'vp.fabric-wishlist.v1';

export const inquiryCartStorage = {
  get(): InquiryCartData {
    try {
      // Try new key first
      let data = localStorage.getItem(STORAGE_KEY);

      // Migration from old wishlist
      if (!data) {
        data = localStorage.getItem(OLD_STORAGE_KEY);
        if (data) {
          localStorage.setItem(STORAGE_KEY, data);
          localStorage.removeItem(OLD_STORAGE_KEY);
        }
      }

      if (data) {
        return JSON.parse(data) as InquiryCartData;
      }
    } catch (error) {
      console.warn('Failed to parse inquiry cart from storage', error);
    }
    return { items: {}, recentlyViewed: [] };
  },

  set(data: InquiryCartData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save inquiry cart to storage', error);
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear inquiry cart from storage', error);
    }
  },
};
