import React, { useMemo } from 'react';

import {
  computeRollsTotalWeight,
  splitRollsIntoColumns,
} from '@/domain/portal/portal-payment.utils';
import type { FabricRollBreakdownItem } from '@/domain/portal/types';

import { PORTAL_ORDER_DETAIL_TEXT } from './orders.constants';

interface PortalOrderPackingListProps {
  rolls: FabricRollBreakdownItem[];
}

export const PortalOrderPackingList: React.FC<PortalOrderPackingListProps> = ({
  rolls,
}) => {
  const columns = useMemo(() => splitRollsIntoColumns(rolls, 2), [rolls]);
  const totalWeight = useMemo(() => computeRollsTotalWeight(rolls), [rolls]);

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
            {PORTAL_ORDER_DETAIL_TEXT.PACKING_LIST_SUBTITLE}
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
        {/* 2-column Roll Breakdown Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {columns.map((column, colIdx) => (
            <div
              key={`col-${colIdx}`}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <table className="portal-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '45px', textAlign: 'center' }}>
                      {PORTAL_ORDER_DETAIL_TEXT.COL_INDEX}
                    </th>
                    <th>{PORTAL_ORDER_DETAIL_TEXT.COL_ROLL_CODE}</th>
                    <th className="right">
                      {PORTAL_ORDER_DETAIL_TEXT.COL_WEIGHT}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {column.map((roll) => (
                    <tr key={roll.id}>
                      <td
                        style={{
                          textAlign: 'center',
                          color: 'var(--muted-foreground)',
                          fontWeight: 500,
                        }}
                      >
                        {roll.display_index}
                      </td>
                      <td
                        style={{ fontWeight: 600, color: 'var(--foreground)' }}
                      >
                        {roll.roll_code}
                      </td>
                      <td
                        className="right"
                        style={{ fontWeight: 600, color: 'var(--primary)' }}
                      >
                        {roll.weight_kg.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

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
            Quy cách thực cân điện tử Vĩnh Phát
          </span>
        </div>
      </div>
    </div>
  );
};
