import React from 'react';
import { Phone } from 'lucide-react';
export function PhoneContact({ phone }: { phone: string }) {
  return (
    <a href={'tel:' + phone} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm font-medium">
      <Phone size={14} />
      <span>{phone}</span>
    </a>
  );
}
