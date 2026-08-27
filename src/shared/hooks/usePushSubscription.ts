import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/features/auth/AuthProvider';
import { getServiceWorkerRegistration } from '@/shared/lib/serviceWorkerRegistration';
import {
  urlBase64ToUint8Array,
  getVapidPublicKey,
} from '@/shared/lib/vapidHelper';
import { PushSubscriptionRepository } from '@/domains/notification/repositories/push-subscription-repository';

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  const KEY = 'vp_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  if (/windows/.test(ua)) return 'windows';
  if (/linux/.test(ua)) return 'linux';
  return 'other';
}

function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  const isStandalone =
    ('standalone' in navigator &&
      (navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches;

  if (isStandalone && /iphone|ipad|ipod/.test(ua)) return 'safari-pwa';
  if (/edg/.test(ua)) return 'edge';
  if (/chrome/.test(ua) && !/edg/.test(ua)) return 'chrome';
  if (/firefox/.test(ua)) return 'firefox';
  if (/safari/.test(ua) && !/chrome/.test(ua)) return 'safari';
  return 'other';
}

export function usePushSubscription() {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const tenantId = profile?.tenant_id;

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check current subscription status on mount
  useEffect(() => {
    if (!isSupported || !userId) return;

    let mounted = true;

    async function checkSubscription() {
      try {
        const reg = await getServiceWorkerRegistration();
        if (!reg) return;
        const sub = await reg.pushManager.getSubscription();
        if (mounted) {
          setIsSubscribed(Boolean(sub));
          setPermission(Notification.permission);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.debug('[usePushSubscription] Check error:', err);
      }
    }

    void checkSubscription();

    return () => {
      mounted = false;
    };
  }, [isSupported, userId]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error(
        'Trình duyệt hoặc thiết bị này không hỗ trợ nhận thông báo đẩy.',
      );
      return false;
    }

    if (!userId) {
      toast.error('Vui lòng đăng nhập để bật thông báo.');
      return false;
    }

    setIsLoading(true);

    try {
      // 1. Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        toast.error('Bạn đã từ chối cấp quyền thông báo trên thiết bị này.');
        setIsLoading(false);
        return false;
      }

      // 2. Get Service Worker
      const reg = await getServiceWorkerRegistration();
      if (!reg) {
        throw new Error('Service Worker chưa sẵn sàng.');
      }

      // 3. Subscribe to Web Push
      const vapidPublicKey = getVapidPublicKey();
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey.buffer as ArrayBuffer,
      });

      const subJson = subscription.toJSON();
      const p256dh = subJson.keys?.p256dh;
      const auth = subJson.keys?.auth;

      if (!p256dh || !auth) {
        throw new Error('Không thể tạo khóa bảo mật Web Push.');
      }

      // 4. Save to Database
      await PushSubscriptionRepository.saveSubscription({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        device_id: getOrCreateDeviceId(),
        device_name: `${detectPlatform()} (${detectBrowser()})`,
        platform: detectPlatform(),
        browser: detectBrowser(),
        user_agent:
          typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        tenant_id: tenantId,
      });

      setIsSubscribed(true);
      toast.success('Đã kích hoạt thông báo đẩy trên thiết bị này!');
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error('[usePushSubscription] Subscribe error:', message);
      toast.error(`Không thể bật thông báo: ${message}`);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, userId, tenantId]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);

    try {
      const reg = await getServiceWorkerRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await PushSubscriptionRepository.revokeSubscription(sub.endpoint);
        }
      }

      setIsSubscribed(false);
      toast.success('Đã tắt thông báo đẩy trên thiết bị này.');
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error('[usePushSubscription] Unsubscribe error:', message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
