import { cn } from '@/shared/utils/cn';
import {
  normalizePhone,
  formatPhoneNumber,
  isVietnamPhone,
  toTelHref,
  toZaloHref,
} from '@/shared/utils/phone';

import { Icon } from './Icon';

export interface PhoneContactProps {
  phone: string | null | undefined;
  /** Whether to show the Zalo link button for valid Vietnam numbers (default: true) */
  showZalo?: boolean;
  /** Whether to render the phone number as a clickable tel link (default: true) */
  clickable?: boolean;
  /** Whether to show the phone number text (default: true) */
  showCall?: boolean;
  className?: string;
  fallback?: string;
}

export function PhoneContact({
  phone,
  showZalo = true,
  clickable = true,
  showCall = true,
  className,
  fallback = '—',
}: PhoneContactProps) {
  if (!phone) return <span className="text-muted-foreground">{fallback}</span>;

  const normalized = normalizePhone(phone);
  const isVN = isVietnamPhone(normalized);
  const formatted = formatPhoneNumber(normalized);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showCall &&
        (clickable ? (
          <a
            href={toTelHref(normalized)}
            className="hover:text-foreground hover:underline transition-colors font-semibold truncate"
            title="Gọi điện thoại"
            aria-label={`Gọi ${normalized}`}
          >
            {formatted}
          </a>
        ) : (
          <span className="font-semibold truncate">{formatted}</span>
        ))}

      {showZalo && isVN && (
        <a
          href={toZaloHref(normalized)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-zalo bg-brand-zalo/10 hover:opacity-80 transition-opacity flex items-center justify-center rounded-full w-5 h-5 shrink-0"
          title="Nhắn tin Zalo"
          aria-label={`Nhắn Zalo ${normalized}`}
        >
          <Icon name="MessageCircle" size={12} />
        </a>
      )}
    </div>
  );
}
