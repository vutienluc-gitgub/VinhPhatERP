import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { usePushSubscription } from '@/shared/hooks/usePushSubscription';

import { PushNotificationBanner } from './PushNotificationBanner';

vi.mock('@/shared/hooks/usePushSubscription');

describe('PushNotificationBanner Component', () => {
  const mockSubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure Notification object is present in global window for jsdom
    if (!('Notification' in window)) {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });
    }
  });

  it('renders banner when permission is default and user is not subscribed', () => {
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      permission: 'default' as NotificationPermission,
      isSubscribed: false,
      isLoading: false,
      subscribe: mockSubscribe,
      unsubscribe: vi.fn(),
    });

    render(<PushNotificationBanner />);

    expect(screen.getByText(/Bật thông báo đẩy:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bật thông báo/i })).toBeInTheDocument();
  });

  it('does NOT render banner when permission is already granted', () => {
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      permission: 'granted' as NotificationPermission,
      isSubscribed: true,
      isLoading: false,
      subscribe: mockSubscribe,
      unsubscribe: vi.fn(),
    });

    const { container } = render(<PushNotificationBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('triggers subscribe function when user clicks "Bật thông báo"', () => {
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      permission: 'default' as NotificationPermission,
      isSubscribed: false,
      isLoading: false,
      subscribe: mockSubscribe,
      unsubscribe: vi.fn(),
    });

    render(<PushNotificationBanner />);

    const button = screen.getByRole('button', { name: /Bật thông báo/i });
    fireEvent.click(button);

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it('hides banner when user clicks dismiss button', () => {
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      permission: 'default' as NotificationPermission,
      isSubscribed: false,
      isLoading: false,
      subscribe: mockSubscribe,
      unsubscribe: vi.fn(),
    });

    render(<PushNotificationBanner />);

    const dismissButton = screen.getByRole('button', { name: /Ẩn thông báo/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByText(/Bật thông báo đẩy:/i)).not.toBeInTheDocument();
  });
});
