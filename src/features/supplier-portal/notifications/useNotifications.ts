import { useState, useEffect, useCallback, useRef } from 'react';

import type { NotificationItem, PortalDataEvent } from './types';
import * as store from './notificationStore';
import * as realtime from './RealtimeService';

export interface UseNotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
  isConnectionWarning: boolean;
  markAsRead: () => void;
  clearAll: () => void;
  isSupported: boolean;
}

const STORAGE_KEY = 'vinhphat_supplier_notifications';

export function useNotifications(
  supplierId: string | undefined,
  onDataUpdate?: (event: PortalDataEvent) => void,
): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isConnectionWarning, setIsConnectionWarning] = useState(false);
  const isLoaded = useRef(false);

  // 1. Load from localStorage once
  useEffect(() => {
    if (!supplierId || isLoaded.current) return;
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${supplierId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotifications(store.sortNotifications(parsed));
        }
      }
    } catch (e) {
      console.warn('Failed to load local notifications', e);
    } finally {
      isLoaded.current = true;
    }
  }, [supplierId]);

  // 2. Persist to localStorage whenever notifications change
  useEffect(() => {
    if (!supplierId || !isLoaded.current) return;
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_${supplierId}`,
        JSON.stringify(notifications),
      );
    } catch (e) {
      console.warn('Failed to save local notifications', e);
    }
  }, [notifications, supplierId]);

  // 3. Connect to Supabase Realtime
  useEffect(() => {
    if (!supplierId) return;

    realtime.start({
      supplierId,
      onNotification: (newItem) => {
        setNotifications((prev) => store.addWithCapacity(prev, newItem));
        // You could also trigger a browser toast or sound here
      },
      onDataUpdate: (event) => {
        if (onDataUpdate) onDataUpdate(event);
      },
      onConnectionWarning: (warning) => {
        setIsConnectionWarning(warning);
      },
    });

    return () => {
      realtime.stop();
    };
  }, [supplierId, onDataUpdate]);

  // 4. Expose actions
  const markAsRead = useCallback(() => {
    setNotifications((prev) => store.markAllRead(prev));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount: store.computeUnreadCount(notifications),
    isConnectionWarning,
    markAsRead,
    clearAll,
    isSupported: true,
  };
}
