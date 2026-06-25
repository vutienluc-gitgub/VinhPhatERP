export interface WishlistItem {
  id: string; // fabricId
  code: string;
  name: string;
  color_name?: string;
  image_url?: string;
}

export interface WishlistData {
  items: Record<string, WishlistItem>;
  recentlyViewed: string[]; // List of fabric IDs recently viewed
}

export interface WishlistContextValue {
  wishlist: Record<string, WishlistItem>;
  recentlyViewed: string[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
  addRecentlyViewed: (id: string) => void;
}
