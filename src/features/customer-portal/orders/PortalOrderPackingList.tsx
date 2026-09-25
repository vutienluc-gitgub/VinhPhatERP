import React, { useMemo } from 'react';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import { computeRollsTotalWeight } from '@/domain/portal/portal-payment.utils';
import type { FabricRollBreakdownItem } from '@/domain/portal/types';
import { FabricRollMatrixTable } from '@/shared/components/fabric-roll/FabricRollMatrixTable';

import { PORTAL_ORDER_DETAIL_TEXT } from './orders.constants';

interface PortalOrderPackingListProps {
  rolls: FabricRollBreakdownItem[];
}

export const PortalOrderPackingList: React.FC<PortalOrderPackingListProps> = ({
  rolls,
}) => {
  const totalWeight = useMemo(() => computeRollsTotalWeight(rolls), [rolls]);

  const packingRolls: FabricRollPackingItem[] = useMemo(
    () =>
      rolls.map((r) => ({
        id: r.id,
        roll_code: r.roll_code,
        roll_sequence: r.display_index,
        weight_kg: r.weight_kg,
        length_meters: r.length_m,
      })),
    [rolls],
  );

  if (rolls.length === 0) {
    return null;
  }

  return (
    <div className="portal-table-wrap">
      <div className="portal-card-header">
        <div>
          <span>{PORTAL_ORDER_DETAIL_TEXT.PACKING_LIST_TITLE}</span>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 400,
              color: 'var(--muted-foreground)',
              marginTop: '0.2rem',
            }}
          >
            {PORTAL_ORDER_DETAIL_TEXT.PACKING_LIST_SUBTITLE} (Ma trận 10
            cây/dòng)
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="portal-badge portal-badge--confirmed">
            {rolls.length} {PORTAL_ORDER_DETAIL_TEXT.UNIT_ROLLS}
          </span>
          <span className="portal-badge portal-badge--in-progress">
            {totalWeight.toFixed(1)} {PORTAL_ORDER_DETAIL_TEXT.UNIT_KG}
          </span>
        </div>
      </div>

      <div className="portal-card-body">
        {/* Decade Matrix Table (10 rolls per row) */}
        <FabricRollMatrixTable
          rolls={packingRolls}
          rollsPerRow={10}
          showSubtotal={true}
          interactive={true}
        />

        {/* Summary Footer Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.25rem',
            padding: '0.85rem 1.25rem',
            background: 'var(--surface-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <span
                style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}
              >
                {PORTAL_ORDER_DETAIL_TEXT.TOTAL_ROLLS}{' '}
              </span>
              <strong
                style={{ fontSize: '0.95rem', color: 'var(--foreground)' }}
              >
                {rolls.length} {PORTAL_ORDER_DETAIL_TEXT.UNIT_ROLLS}
              </strong>
            </div>
            <div>
              <span
                style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}
              >
                {PORTAL_ORDER_DETAIL_TEXT.TOTAL_WEIGHT}{' '}
              </span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>
                {totalWeight.toFixed(1)} {PORTAL_ORDER_DETAIL_TEXT.UNIT_KG}
              </strong>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted-foreground)',
              fontStyle: 'italic',
            }}
          >
            Quy cách thực cân điện tử Vĩnh Phát — Chuẩn phiếu A5 4 liên
          </span>
        </div>
      </div>
    </div>
  );
};
