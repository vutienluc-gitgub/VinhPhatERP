import { QRCodeSVG } from 'qrcode.react';

import { Fabric80x40Model } from '@/features/fabric-catalog/label/model';

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

export function HtmlView({ data }: { data: Fabric80x40Model }) {
  return (
    <div
      className="label label-container"
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
        style={{ width: '28mm', ...STYLES.flexCenter }}
      >
        <QRCodeSVG
          value={data.qrValue}
          size={95} // ~25mm
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '25mm',
            maxHeight: '25mm',
            display: 'block',
          }}
        />
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
          {data.code}
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
          {data.name}
        </div>
        {data.specs && (
          <div
            className="specs"
            style={{
              fontSize: '10px',
              marginTop: '1.5mm',
              color: '#444444',
              ...STYLES.truncateText,
            }}
          >
            {data.specs}
          </div>
        )}
        <div
          className="footer"
          style={{
            fontSize: '9px',
            marginTop: '3mm',
            color: '#666',
            fontWeight: 600,
            ...STYLES.truncateText,
          }}
        >
          {data.footer}
        </div>
      </div>
    </div>
  );
}
