export interface InquiryCartItem {
  id: string; // fabricId
  code: string;
  name: string;
  color_name?: string;
  image_url?: string;
}

export interface InquiryCartData {
  items: Record<string, InquiryCartItem>;
  recentlyViewed: string[]; // List of fabric IDs recently viewed
}

export interface InquiryCartContextValue {
  inquiryCart: Record<string, InquiryCartItem>;
  recentlyViewed: string[];
  addToInquiryCart: (item: InquiryCartItem) => void;
  removeFromInquiryCart: (id: string) => void;
  clearInquiryCart: () => void;
  addRecentlyViewed: (id: string) => void;
}
