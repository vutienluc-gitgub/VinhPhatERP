import React from 'react';
export function QRCodeDisplay({ value }: { value: string }) {
  return <div className="p-2 border rounded bg-white inline-block text-xs font-mono">{value}</div>;
}
