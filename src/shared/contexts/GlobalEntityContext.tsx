// Context files co-export provider + hook by convention
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

import type { EntityType } from '@/shared/constants/entity.constants';

export type { EntityType };

export interface PreviewEntity {
  type: EntityType;
  id: string;
}

interface GlobalEntityContextValue {
  previewEntity: PreviewEntity | null;
  openEntity: (type: EntityType, id: string) => void;
  closeEntity: () => void;
}

const GlobalEntityContext = createContext<GlobalEntityContextValue | undefined>(
  undefined,
);

export function GlobalEntityProvider({ children }: { children: ReactNode }) {
  const [previewEntity, setPreviewEntity] = useState<PreviewEntity | null>(
    null,
  );

  const openEntity = useCallback((type: EntityType, id: string) => {
    setPreviewEntity({ type, id });
  }, []);

  const closeEntity = useCallback(() => {
    setPreviewEntity(null);
  }, []);

  return (
    <GlobalEntityContext.Provider
      value={{ previewEntity, openEntity, closeEntity }}
    >
      {children}
    </GlobalEntityContext.Provider>
  );
}

export function useGlobalEntity() {
  const context = useContext(GlobalEntityContext);
  if (context === undefined) {
    throw new Error(
      'useGlobalEntity must be used within a GlobalEntityProvider',
    );
  }
  return context;
}
