/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react';
import { createElement } from 'react';

import type { NotificationItem } from './types';
import {
  addWithCapacity,
  computeUnreadCount,
  markAllRead,
} from './notificationStore';

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  connectionWarning: boolean;
}

type Action =
  | { type: 'ADD'; item: NotificationItem }
  | { type: 'MARK_ALL_READ' }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_CONNECTION_WARNING'; value: boolean };

function reducer(state: NotificationState, action: Action): NotificationState {
  switch (action.type) {
    case 'ADD': {
      const items = addWithCapacity(state.items, action.item);
      return {
        ...state,
        items,
        unreadCount: computeUnreadCount(items),
      };
    }
    case 'MARK_ALL_READ': {
      const items = markAllRead(state.items);
      return {
        ...state,
        items,
        unreadCount: 0,
      };
    }
    case 'CLEAR_ALL':
      return {
        ...state,
        items: [],
        unreadCount: 0,
      };
    case 'SET_CONNECTION_WARNING':
      return {
        ...state,
        connectionWarning: action.value,
      };
    default:
      return state;
  }
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  connectionWarning: false,
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface NotificationContextValue extends NotificationState {
  addNotification: (item: NotificationItem) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  setConnectionWarning: (value: boolean) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function NotificationProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addNotification = useCallback((item: NotificationItem) => {
    dispatch({
      type: 'ADD',
      item,
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const setConnectionWarning = useCallback((value: boolean) => {
    dispatch({
      type: 'SET_CONNECTION_WARNING',
      value,
    });
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      ...state,
      addNotification,
      markAllAsRead,
      clearAll,
      setConnectionWarning,
    }),
    [state, addNotification, markAllAsRead, clearAll, setConnectionWarning],
  );

  return createElement(NotificationContext.Provider, { value }, children);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      'useNotifications phải dùng bên trong <NotificationProvider>',
    );
  return ctx;
}
