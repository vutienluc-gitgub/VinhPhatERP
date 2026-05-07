/**
 * useTradingStock
 *
 * Application hooks for trading order stock management:
 * - Fetch available stock by product category
 * - Fetch yarn lots for lot-level tracking
 * - Confirm trading order (with stock deduction)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchTradingYarnStock,
  fetchTradingYarnLots,
  fetchTradingRawFabricRolls,
  fetchTradingFinishedFabricRolls,
} from '@/api/trading-stock.api';
import type {
  TradingYarnStock,
  TradingYarnLot,
  TradingFabricRoll,
} from '@/api/trading-stock.api';
import { confirmTradingOrder, cancelTradingOrder } from '@/api/orders.api';

export type { TradingYarnStock, TradingYarnLot, TradingFabricRoll };

// ─── Yarn Stock ───────────────────────────────────────────────────────────────

/** Danh sach soi kha dung (tong hop theo yarn_catalog) */
export function useTradingYarnStock() {
  return useQuery({
    queryKey: ['trading-stock', 'yarn'],
    queryFn: fetchTradingYarnStock,
  });
}

/** Chi tiet lot cua 1 loai soi cu the */
export function useTradingYarnLots(yarnCatalogId: string) {
  return useQuery({
    queryKey: ['trading-stock', 'yarn-lots', yarnCatalogId],
    queryFn: () => fetchTradingYarnLots(yarnCatalogId),
    enabled: !!yarnCatalogId,
  });
}

// ─── Fabric Rolls ─────────────────────────────────────────────────────────────

/** Cuon vai moc kha dung (in_stock) */
export function useTradingRawFabricRolls() {
  return useQuery({
    queryKey: ['trading-stock', 'raw-fabric'],
    queryFn: fetchTradingRawFabricRolls,
  });
}

/** Cuon vai thanh pham kha dung (in_stock, chua reserved) */
export function useTradingFinishedFabricRolls() {
  return useQuery({
    queryKey: ['trading-stock', 'finished-fabric'],
    queryFn: fetchTradingFinishedFabricRolls,
  });
}

// ─── Confirm Trading Order ────────────────────────────────────────────────────

/** Xac nhan don trading — tru kho atomic */
export function useConfirmTradingOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => confirmTradingOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['trading-stock'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] });
    },
  });
}

// ─── Cancel Trading Order ─────────────────────────────────────────────────────

/** Huy don trading — reverse tru kho */
export function useCancelTradingOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => cancelTradingOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['trading-stock'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] });
    },
  });
}
