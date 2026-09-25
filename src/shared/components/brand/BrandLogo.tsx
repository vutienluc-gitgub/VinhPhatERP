import React from 'react';

import {
  BRAND_COLORS,
  BRAND_INFO,
  type LogoLayout,
  type LogoVariant,
  type MonochromeTone,
  VP_SYMBOL_PATH_DATA,
  getBrandAssetUrl,
} from '@/shared/constants/brand';
import { cn } from '@/shared/utils/cn';

export interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Cấu trúc hiển thị: full (đầy đủ + slogan), compact (rút gọn), symbol (chỉ icon) */
  layout?: LogoLayout;
  /** Hướng bố cục: row (ngang) hoặc col (dọc) */
  orientation?: 'row' | 'col';
  /** Biến thể màu: positive (nền sáng), negative (nền tối), monochrome (đơn sắc) */
  variant?: LogoVariant;
  /** Tông màu đơn sắc khi variant = monochrome: black (mặc định) hoặc white */
  monochromeTone?: MonochromeTone;
  /** Chế độ vẽ: vector (inline SVG tối ưu, không giật mạng) hoặc img (thẻ img tải SVG asset) */
  renderMode?: 'vector' | 'img';
  /** Tự động ẩn text trên màn hình nhỏ (< sm), chỉ hiển thị icon */
  responsiveText?: boolean;
  /** Tự động bổ sung padding vùng an toàn 1x */
  clearSpace?: boolean;
  /** Chiều cao hiển thị tùy chỉnh (pixel hoặc rem/em) */
  size?: number | string;
  /** Kèm tiêu đề truy cập a11y */
  alt?: string;
}

export const BrandLogo = React.memo(function BrandLogo({
  layout = 'compact',
  orientation = 'row',
  variant = 'positive',
  monochromeTone = 'black',
  renderMode = 'vector',
  clearSpace = false,
  responsiveText = false,
  size,
  className,
  alt = 'Logo Dệt May Vĩnh Phát',
  ...restProps
}: BrandLogoProps) {
  // Xác định màu sắc biểu tượng icon theo quy chuẩn v3.0
  const iconColor = React.useMemo(() => {
    if (variant === 'monochrome') {
      return monochromeTone === 'white'
        ? BRAND_COLORS.WHITE
        : BRAND_COLORS.BLACK;
    }
    return BRAND_COLORS.PRIMARY; // Đỏ Viettel #EE0033
  }, [variant, monochromeTone]);

  // Xác định màu sắc chữ tên công ty
  const textColorClass = React.useMemo(() => {
    if (variant === 'negative') {
      return 'text-inverse-foreground';
    }
    if (variant === 'monochrome' && monochromeTone === 'white') {
      return 'text-inverse-foreground';
    }
    return 'text-foreground';
  }, [variant, monochromeTone]);

  // Xác định màu sắc chữ slogan
  const sloganColorClass = React.useMemo(() => {
    if (variant === 'negative') {
      return 'text-inverse-foreground/80';
    }
    if (variant === 'monochrome' && monochromeTone === 'white') {
      return 'text-inverse-foreground/70';
    }
    if (variant === 'monochrome') {
      return 'text-foreground/80';
    }
    return 'text-muted';
  }, [variant, monochromeTone]);

  // Khi dùng thẻ img để load file asset ngoại vi
  if (renderMode === 'img') {
    const assetUrl = getBrandAssetUrl(layout, variant, monochromeTone);
    return (
      <div
        className={cn(
          'inline-flex items-center select-none',
          clearSpace && 'p-2',
          className,
        )}
        style={size ? { height: size } : undefined}
        {...restProps}
      >
        <img
          src={assetUrl}
          alt={alt}
          className="h-full w-auto max-h-full object-contain"
          loading="eager"
        />
      </div>
    );
  }

  // Render Vector Inline SVG: Không delay mạng, sắc nét mọi độ phân giải
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 select-none leading-none shrink-0',
        orientation === 'col' ? 'flex-col text-center' : 'flex-row',
        clearSpace && 'p-2',
        className,
      )}
      style={size ? { height: size } : undefined}
      role="img"
      aria-label={alt}
      {...restProps}
    >
      {/* Khối Biểu tượng Icon VP */}
      <svg
        viewBox="0 0 2400 2400"
        className={cn(
          'aspect-square shrink-0',
          layout === 'symbol'
            ? 'h-full w-auto'
            : orientation === 'col'
              ? 'h-12 w-12'
              : 'h-8 w-8',
        )}
        aria-hidden="true"
        focusable="false"
      >
        <path d={VP_SYMBOL_PATH_DATA} fill={iconColor} fillRule="evenodd" />
      </svg>

      {/* Tên công ty & Slogan nếu không phải dạng chỉ icon */}
      {layout !== 'symbol' && (
        <div
          className={cn(
            'flex flex-col justify-center min-w-0',
            orientation === 'col' && 'items-center',
            responsiveText && 'hidden sm:flex',
          )}
        >
          <span
            className={cn(
              'font-black tracking-tight uppercase whitespace-nowrap',
              layout === 'full'
                ? 'text-base sm:text-lg'
                : 'text-sm sm:text-base',
              textColorClass,
            )}
          >
            {BRAND_INFO.COMPANY_NAME}
          </span>

          {layout === 'full' && (
            <span
              className={cn(
                'text-xs tracking-normal font-medium mt-0.5 whitespace-nowrap',
                sloganColorClass,
              )}
            >
              {BRAND_INFO.SLOGAN}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

BrandLogo.displayName = 'BrandLogo';
