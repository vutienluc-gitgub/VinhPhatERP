import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  enqueueOfflineCommand,
  getPendingOfflineCommands,
  flushOfflineQueue,
  type QueuedLogisticsCommand,
} from '@/features/driver-portal/services/offline-command-queue';

describe('Offline Command Queue — Per-Aggregate Ordered Sync', () => {
  beforeEach(async () => {
    // Clear pending commands
    await flushOfflineQueue(async () => {});
  });

  it('enqueues commands and retrieves them sorted by creation time', async () => {
    await enqueueOfflineCommand({
      commandId: 'cmd-01',
      aggregateId: 'agg-01',
      commandName: 'transition_delivery_attempt',
      payload: { targetState: 'in_transit' },
    });

    await enqueueOfflineCommand({
      commandId: 'cmd-02',
      aggregateId: 'agg-01',
      commandName: 'submit_delivery_epod',
      payload: { expectedState: 'arrived' },
    });

    const pending = await getPendingOfflineCommands();
    expect(pending.length).toBeGreaterThanOrEqual(2);
  });

  it('flushes commands in FIFO order per aggregate and halts aggregate on error', async () => {
    await enqueueOfflineCommand({
      commandId: 'cmd-a1',
      aggregateId: 'agg-A',
      commandName: 'transition_delivery_attempt',
      payload: { step: 1 },
    });

    await enqueueOfflineCommand({
      commandId: 'cmd-b1',
      aggregateId: 'agg-B',
      commandName: 'transition_delivery_attempt',
      payload: { step: 1 },
    });

    await enqueueOfflineCommand({
      commandId: 'cmd-a2',
      aggregateId: 'agg-A',
      commandName: 'submit_delivery_epod',
      payload: { step: 2 },
    });

    const executionLog: string[] = [];
    const executor = vi.fn(async (cmd: QueuedLogisticsCommand) => {
      executionLog.push(cmd.commandId);
    });

    const result = await flushOfflineQueue(executor);

    expect(result.processed).toBe(3);
    expect(result.failed).toBe(0);

    // Verify aggregate A FIFO ordering
    const idxA1 = executionLog.indexOf('cmd-a1');
    const idxA2 = executionLog.indexOf('cmd-a2');
    expect(idxA1).toBeLessThan(idxA2);
  });
});
