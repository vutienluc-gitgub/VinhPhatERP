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
  tenant_id?: string | null;
  user_id: string;
  domain: NotificationDomain;
  type: string;
  priority: NotificationPriority;
  title: string;
  body: string;
  entity_type: string;
  entity_id: string;
  action?: string;
  metadata?: Record<string, unknown>;
  read_at?: string | null;
  archived_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  domain: NotificationDomain;
  type: string;
  priority?: NotificationPriority;
  title: string;
  body: string;
  entity_type: string;
  entity_id: string;
  action?: string;
  metadata?: Record<string, unknown>;
  tenant_id?: string | null;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  domain: NotificationDomain;
  event_type: string;
  in_app_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}
