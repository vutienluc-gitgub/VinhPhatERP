import { useEffect, useRef, useState } from 'react';

import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';

type QRFabricLabelProps = {
  code: string;
  name: string;
  qrValue: string;
  domain?: string;
  qrSize?: number;
  className?: string;
};

export function QRFabricLabel({
  code,
  name,
  qrValue,
  domain,
  qrSize = 128,
  className = '',
}: QRFabricLabelProps) {
  const displayDomain =
    domain ||
    (typeof window !== 'undefined'
      ? window.location.host
      : 'detmayvinhphat.com');

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
      className={`label-container ${className}`}
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'left',
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
        <div
          className="domain"
          style={{
            fontSize: '8px',
            marginTop: '3mm',
            color: '#666',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'left',
          }}
        >
          {displayDomain}
        </div>
      </div>
    </div>
  );
}
