import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

const GlobalModalContext = createContext<any>({ openModal: () => {}, closeModal: () => {} });

export function GlobalModalProvider({ children }: PropsWithChildren) {
  const [modal, setModal] = useState<any>(null);
  return (
    <GlobalModalContext.Provider value={{ modal, openModal: setModal, closeModal: () => setModal(null) }}>
      {children}
    </GlobalModalContext.Provider>
  );
}

export const useGlobalModal = () => useContext(GlobalModalContext);
