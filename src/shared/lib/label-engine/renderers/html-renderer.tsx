import { QRCodeSVG } from 'qrcode.react';

import { AbsoluteNode } from '@/shared/lib/label-engine/ast/types';

type Props = {
  nodes: AbsoluteNode[];
  widthPx: number;
  heightPx: number;
};

export function HtmlRenderer({ nodes, widthPx, heightPx }: Props) {
  return (
    <div
      style={{
        position: 'relative',
        width: widthPx,
        height: heightPx,
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      {nodes.map((node, idx) => {
        const key = `node-${idx}`;

        switch (node.type) {
          case 'absolute-rect':
            return (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: node.height,
                  backgroundColor:
                    node.fill !== 'none' ? node.fill : 'transparent',
                  border:
                    node.stroke !== 'none'
                      ? `${node.strokeWidth || 1}px solid ${node.stroke}`
                      : 'none',
                  borderRadius: node.rx || 0,
                  boxSizing: 'border-box',
                }}
              />
            );

          case 'absolute-text':
            return (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: node.height,
                  fontSize: node.fontSize,
                  fontWeight: node.fontBold ? 'bold' : 'normal',
                  fontFamily: 'Arial, sans-serif',
                  color: '#000',
                  textAlign: node.align || 'left',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {node.text}
              </div>
            );

          case 'absolute-qrcode':
            return (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: node.size,
                  height: node.size,
                }}
              >
                <QRCodeSVG value={node.value} size={node.size} />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
