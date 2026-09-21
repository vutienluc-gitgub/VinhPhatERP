import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

const InquiryCartContext = createContext<any>({ items: [], addItem: () => {}, removeItem: () => {} });

export function InquiryCartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState([]);
  return (
    <InquiryCartContext.Provider value={{ items, addItem: (item: any) => setItems((prev: any) => [...prev, item]), removeItem: () => {} }}>
      {children}
    </InquiryCartContext.Provider>
  );
}

export const useInquiryCart = () => useContext(InquiryCartContext);
