import { lazy, Suspense } from 'react';

import type { ModalPayloadMap } from '@/shared/hooks/useGlobalModal';
import { useGlobalModal } from '@/shared/hooks/useGlobalModal';

// Lazy-load each modal form — only loaded when actually opened
const PaymentForm = lazy(() =>
  import('@/features/payments/PaymentForm').then((m) => ({
    default: m.PaymentForm,
  })),
);

const ShipmentForm = lazy(() =>
  import('@/features/shipments/ShipmentForm').then((m) => ({
    default: m.ShipmentForm,
  })),
);

function renderModal(
  type: keyof ModalPayloadMap,
  payload: ModalPayloadMap[keyof ModalPayloadMap],
  onClose: () => void,
) {
  switch (type) {
    case 'PAYMENT_FORM': {
      const p = payload as ModalPayloadMap['PAYMENT_FORM'];
      return (
        <PaymentForm
          orderId={p.orderId}
          customerId={p.customerId}
          orderNumber={p.orderNumber}
          balanceDue={p.balanceDue}
          onClose={onClose}
        />
      );
    }
    case 'SHIPMENT_FORM': {
      const p = payload as ModalPayloadMap['SHIPMENT_FORM'];
      return (
        <ShipmentForm
          orderId={p.orderId}
          customerId={p.customerId}
          orderNumber={p.orderNumber}
          onClose={onClose}
        />
      );
    }
    default:
      return null;
  }
}

/**
 * Renders the currently active global modal.
 * Mount once at app root — listens to GlobalModalStore.
 */
export function GlobalModalDispatcher() {
  const { modal, closeModal } = useGlobalModal();

  if (!modal) return null;

  return (
    <Suspense fallback={null}>
      {renderModal(modal.type, modal.payload, closeModal)}
    </Suspense>
  );
}
