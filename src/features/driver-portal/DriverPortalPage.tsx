import { useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { Icon } from '@/shared/components';
// eslint-disable-next-line boundaries/dependencies
import { ChatDrawer } from '@/features/chat/ChatDrawer';
import {
  useMyDriverEmployee,
  useDriverShipments,
} from '@/application/shipments';

import type { DriverShipment } from './types';
import { DRIVER_PORTAL_MESSAGES } from './constants';
import { ShipmentCard } from './components/ShipmentCard';
import { ShipmentSkeleton } from './components/ShipmentSkeleton';

export function DriverPortalPage() {
  const { profile } = useAuth();
  const { data: myEmployee, isLoading: loadingEmployee } = useMyDriverEmployee(
    profile?.id,
  );
  const employeeId = myEmployee?.id;
  const {
    data: shipments = [],
    isLoading,
    error,
  } = useDriverShipments(employeeId);
  const [chatShipment, setChatShipment] = useState<DriverShipment | null>(null);

  if (loadingEmployee || (!myEmployee && !employeeId)) {
    if (loadingEmployee) {
      return (
        <div className="text-center p-12 text-[var(--muted-foreground)]">
          <Icon name="Loader2" size={32} className="animate-spin mx-auto" />
          <p className="mt-2 text-sm">
            {DRIVER_PORTAL_MESSAGES.PAGE.LOADING_DRIVER}
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <Icon
          name="UserX"
          size={48}
          className="text-[var(--muted-foreground)]"
        />
        <p className="font-bold text-base text-[var(--foreground)]">
          {DRIVER_PORTAL_MESSAGES.EMPTY_STATE.NO_LINKED_ACCOUNT_TITLE}
        </p>
        <p className="text-sm text-[var(--surface-subtle)]">
          {DRIVER_PORTAL_MESSAGES.EMPTY_STATE.NO_LINKED_ACCOUNT_DESC}
        </p>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <Icon
          name="UserX"
          size={48}
          className="text-[var(--muted-foreground)]"
        />
        <p className="font-bold text-base text-[var(--foreground)]">
          {DRIVER_PORTAL_MESSAGES.EMPTY_STATE.NO_LINKED_ACCOUNT_TITLE}
        </p>
        <p className="text-sm text-[var(--surface-subtle)]">
          {DRIVER_PORTAL_MESSAGES.EMPTY_STATE.NO_LINKED_ACCOUNT_DESC}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
          {DRIVER_PORTAL_MESSAGES.PAGE.TITLE}
        </p>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)] mt-1 mb-0.5 mx-0">
          {DRIVER_PORTAL_MESSAGES.PAGE.HEADING}
        </h1>
        <p className="text-sm text-[var(--surface-subtle)]">
          {DRIVER_PORTAL_MESSAGES.PAGE.GREETING},{' '}
          {profile?.full_name ?? DRIVER_PORTAL_MESSAGES.PAGE.DEFAULT_NAME}
        </p>
      </div>

      {/* Loading */}
      {isLoading && <ShipmentSkeleton />}

      {/* Error */}
      {error && (
        <p className="error-inline">
          {error instanceof Error ? error.message : String(error)}
        </p>
      )}

      {/* Empty state */}
      {!isLoading && shipments.length === 0 && (
        <div className="text-center py-12 px-4 text-[var(--muted-foreground)] bg-[var(--surface)] rounded-xl border-2 border-dashed border-[var(--border)]">
          <Icon name="PackageCheck" size={40} className="mx-auto" />
          <p className="font-bold mt-3 text-[var(--foreground)]">
            {DRIVER_PORTAL_MESSAGES.EMPTY_STATE.NO_SHIPMENTS_TITLE}
          </p>
          <p className="text-sm mt-1 text-[var(--surface-subtle)]">
            {DRIVER_PORTAL_MESSAGES.EMPTY_STATE.NO_SHIPMENTS_DESC}
          </p>
        </div>
      )}

      {/* Shipment list */}
      {!isLoading &&
        shipments.map((shipment) => (
          <ShipmentCard
            key={shipment.id}
            shipment={shipment}
            employeeId={employeeId}
            onOpenChat={setChatShipment}
          />
        ))}

      {/* Chat Drawer */}
      {chatShipment ? (
        <ChatDrawer
          open
          onClose={() => setChatShipment(null)}
          entityType="shipment"
          entityId={chatShipment.id}
          title={`Chat ${chatShipment.shipment_number}`}
          subtitle={chatShipment.customers?.name ?? undefined}
        />
      ) : null}
    </div>
  );
}
