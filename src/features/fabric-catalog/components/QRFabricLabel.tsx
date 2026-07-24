import { useEffect, useRef, useState } from 'react';

import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';

type QRFabricLabelProps = {
  code: string;
  name: string;
  specs?: string;
  footer?: string;
  qrValue: string;
  qrSize?: number;
  className?: string;
};

// Reusable styling objects to prevent inline style duplication (Coding Standards Rule 21)
const STYLES = {
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  truncateText: {
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    textAlign: 'left' as const,
  } as const,
};

export function QRFabricLabel({
  code,
  name,
  specs,
  footer = 'Scan for Details',
  qrValue,
  qrSize = 128,
  className = '',
}: QRFabricLabelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrImgUrl, setQrImgUrl] = useState<string>('');

  useEffect(() => {
    // Convert the rendered canvas to a static image URL so it survives innerHTML copy for printing
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      setQrImgUrl(canvas.toDataURL('image/png'));
    }
  }, [qrValue, qrSize]);

  return (
    <div
      ref={containerRef}
      className={`label label-container ${className}`} // Added "label" to match print-template.css selector
      style={{
        width: '80mm',
        height: '40mm',
        boxSizing: 'border-box',
        padding: '2mm',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        className="label-left"
        style={{
          width: '28mm',
          ...STYLES.flexCenter,
        }}
      >
        {/* Hidden canvas used for image downloader */}
        <div style={{ display: 'none' }}>
          <QRCodeDisplay value={qrValue} size={qrSize} />
        </div>
        {/* Visible image tag that is copied to the print window */}
        {qrImgUrl ? (
          <img
            src={qrImgUrl}
            alt="QR Code"
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '25mm',
              maxHeight: '25mm',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{ width: '25mm', height: '25mm', background: '#f3f4f6' }}
          />
        )}
      </div>
      <div
        className="label-right"
        style={{
          flex: 1,
          paddingLeft: '3mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: 0,
        }}
      >
        <div
          className="code"
          style={{
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '2mm',
            color: '#000000',
            ...STYLES.truncateText,
          }}
        >
          {code}
        </div>
        <div
          className="name line-clamp-2"
          style={{
            fontSize: '11px',
            lineHeight: 1.2,
            color: '#333333',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
            textAlign: 'left',
          }}
        >
          {name}
        </div>
        {specs && (
          <div
            className="specs"
            style={{
              fontSize: '10px',
              marginTop: '1.5mm',
              color: '#444444',
              ...STYLES.truncateText,
            }}
          >
            {specs}
          </div>
        )}
        <div
          className="domain footer"
          style={{
            fontSize: '9px',
            marginTop: '3mm',
            color: '#666',
            fontWeight: 600,
            ...STYLES.truncateText,
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}
