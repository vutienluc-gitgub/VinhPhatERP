// Trace chain logic moved to useFinishedFabric + finished-fabric.api.ts
// Re-export for backward compatibility
export {
  useTraceChain,
  type TraceChainData,
  type TraceRawRoll,
  type TraceYarnReceipt,
} from './useFinishedFabric';
