import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

export const PreferencesContext = createContext<any>({ theme: 'light', setTheme: () => {} });


export function PreferencesProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState('light');
  return (
    <PreferencesContext.Provider value={{ theme, setTheme }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const useUserPreferences = () => useContext(PreferencesContext);
