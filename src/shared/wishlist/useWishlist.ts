import { useContext } from 'react';

import { WishlistContext } from './WishlistProvider';
import { WishlistContextValue } from './wishlist.types';

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
