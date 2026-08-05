import React, { createContext, useContext, useMemo } from 'react';

export type Density = 'compact' | 'comfortable' | 'touch';
export type Theme = 'light' | 'dark' | 'system';
export type MotionPreference = 'standard' | 'reduced';

interface InteractionEnvironment {
  density: Density;
  theme: Theme;
  motionPreference: MotionPreference;
}

const InteractionContext = createContext<InteractionEnvironment>({
  density: 'comfortable',
  theme: 'system',
  motionPreference: 'standard',
});

interface InteractionProviderProps extends Partial<InteractionEnvironment> {
  children: React.ReactNode;
}

export function InteractionProvider({
  children,
  density = 'comfortable',
  theme = 'system',
  motionPreference = 'standard',
}: InteractionProviderProps) {
  const value = useMemo(
    () => ({ density, theme, motionPreference }),
    [density, theme, motionPreference],
  );

  return (
    <InteractionContext.Provider value={value}>
      {children}
    </InteractionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInteractionEnvironment() {
  return useContext(InteractionContext);
}
