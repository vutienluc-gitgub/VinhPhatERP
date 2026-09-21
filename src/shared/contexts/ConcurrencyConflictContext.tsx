import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

const ConcurrencyConflictContext = createContext<{ conflict: any; resolve: () => void }>({ conflict: null, resolve: () => {} });

export function ConcurrencyConflictProvider({ children }: PropsWithChildren) {
  const [conflict, setConflict] = useState(null);
  return (
    <ConcurrencyConflictContext.Provider value={{ conflict, resolve: () => setConflict(null) }}>
      {children}
    </ConcurrencyConflictContext.Provider>
  );
}

export const useConcurrencyConflict = () => useContext(ConcurrencyConflictContext);
