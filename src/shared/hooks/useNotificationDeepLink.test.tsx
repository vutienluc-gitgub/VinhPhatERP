import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

import { useNotificationDeepLink } from './useNotificationDeepLink';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('useNotificationDeepLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('routes and clears query parameters when launched from push notification link', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter
        initialEntries={[
          '/?notif_entity=purchase_order&notif_id=PO-2026-88&notif_action=approve',
        ]}
      >
        {children}
      </MemoryRouter>
    );

    renderHook(() => useNotificationDeepLink(), { wrapper });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/admin/purchasing/orders?action=approve&id=PO-2026-88',
    );
  });

  it('routes on Service Worker postMessage event when tab is active', () => {
    let swMessageHandler: ((event: MessageEvent) => void) | null = null;

    const mockAddEventListener = vi.fn((event, handler) => {
      if (event === 'message') swMessageHandler = handler;
    });
    const mockRemoveEventListener = vi.fn();

    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          addEventListener: mockAddEventListener,
          removeEventListener: mockRemoveEventListener,
        },
      },
      writable: true,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
    );

    const { unmount } = renderHook(() => useNotificationDeepLink(), {
      wrapper,
    });

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );

    // Simulate SW sending a message
    if (swMessageHandler) {
      (swMessageHandler as (e: unknown) => void)({
        data: {
          type: 'NAVIGATE_FROM_NOTIFICATION',
          payload: {
            entity_type: 'rfq',
            entity_id: 'RFQ-333',
          },
        },
      });
    }

    expect(mockNavigate).toHaveBeenCalledWith(
      '/admin/purchasing/rfq?id=RFQ-333',
    );

    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
  });
});
