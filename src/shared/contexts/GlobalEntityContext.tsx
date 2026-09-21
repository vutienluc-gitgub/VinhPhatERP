import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

const GlobalEntityContext = createContext<any>({});

export function GlobalEntityProvider({ children }: PropsWithChildren) {
  const [entities, setEntities] = useState({});
  return (
    <GlobalEntityContext.Provider value={{ entities, setEntities }}>
      {children}
    </GlobalEntityContext.Provider>
  );
}

export const useGlobalEntity = () => useContext(GlobalEntityContext);
