/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { createElement } from 'react';

// ---------------------------------------------------------------------------
// Modal type registry — add new modal types here
// ---------------------------------------------------------------------------

export interface ModalPayloadMap {
  PAYMENT_FORM: {
    orderId: string;
    customerId: string;
    orderNumber: string;
    balanceDue: number;
  };
  SHIPMENT_FORM: {
    orderId: string;
    customerId: string;
    orderNumber: string;
  };
}

export type ModalType = keyof ModalPayloadMap;

type ModalState<T extends ModalType = ModalType> = {
  type: T;
  payload: ModalPayloadMap[T];
} | null;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface GlobalModalContextValue {
  modal: ModalState;
  openModal: <T extends ModalType>(
    type: T,
    payload: ModalPayloadMap[T],
  ) => void;
  closeModal: () => void;
}

const GlobalModalContext = createContext<GlobalModalContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function GlobalModalProvider({ children }: PropsWithChildren) {
  const [modal, setModal] = useState<ModalState>(null);

  const openModal = useCallback(
    <T extends ModalType>(type: T, payload: ModalPayloadMap[T]) => {
      setModal({
        type,
        payload,
      } as ModalState);
    },
    [],
  );

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const value = useMemo<GlobalModalContextValue>(
    () => ({
      modal,
      openModal,
      closeModal,
    }),
    [modal, openModal, closeModal],
  );

  return createElement(GlobalModalContext.Provider, { value }, children);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGlobalModal(): GlobalModalContextValue {
  const ctx = useContext(GlobalModalContext);
  if (!ctx)
    throw new Error('useGlobalModal phải dùng bên trong <GlobalModalProvider>');
  return ctx;
}
