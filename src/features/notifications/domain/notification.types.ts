export type NotificationDomain =
  | 'purchasing'
  | 'approval'
  | 'inventory'
  | 'finance'
  | 'production'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AppNotification {
  id: string;
  user_id: string;
  domain: NotificationDomain;
  type: string;
  priority: NotificationPriority;
  title: string;
  body: string;
  entity_type?: string;
  entity_id?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  domain: NotificationDomain;
  type: string;
  priority?: NotificationPriority;
  title: string;
  body: string;
  entity_type?: string;
  entity_id?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionRecord {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_id?: string;
  platform?: 'ios' | 'android' | 'desktop' | 'unknown';
  browser?: 'safari' | 'chrome' | 'firefox' | 'edge' | 'unknown';
  user_agent?: string;
  is_standalone?: boolean;
  last_seen_at?: string;
  created_at?: string;
  revoked_at?: string | null;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  domain: NotificationDomain;
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  sound_enabled: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformCapabilities {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
  hasAppBadging: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isFullySupported: boolean;
}
