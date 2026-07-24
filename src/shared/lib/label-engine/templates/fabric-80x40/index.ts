import { Fabric80x40Model } from '@/features/fabric-catalog/label/model';
import { LabelTemplate } from '@/shared/lib/label-engine/core/types';
import { LayoutNode } from '@/shared/lib/label-engine/ast/types';

export const fabric80x40Template: LabelTemplate<Fabric80x40Model> = {
  id: 'fabric-80x40',
  name: 'Tem Mẫu Vải 80x40mm',
  widthMm: 80,
  heightMm: 40,
  widthPx: 800, // 10 dot/mm
  heightPx: 400,
  buildLayout: (data: Fabric80x40Model): LayoutNode => {
    // We map data to a Flexbox-like AST Tree
    const specNodes: LayoutNode[] = [];

    if (Array.isArray(data.specs)) {
      for (const spec of data.specs) {
        specNodes.push({
          type: 'text',
          text: spec,
          fontSize: 20,
        });
      }
    } else if (data.specs) {
      specNodes.push({
        type: 'text',
        text: data.specs,
        fontSize: 20,
      });
    }

    return {
      type: 'row',
      width: '100%',
      height: '100%',
      padding: 8,
      fill: '#ffffff',
      stroke: '#e2e8f0',
      strokeWidth: 4,
      rx: 16,
      children: [
        {
          type: 'row',
          width: '100%',
          height: '100%',
          gap: 30, // Distance between QR and Text block
          padding: 7, // padding to align QR correctly
          children: [
            // Left Column: QR Code
            {
              type: 'column',
              width: 250,
              padding: 60, // Shift QR down a bit
              children: [
                {
                  type: 'qrcode',
                  value: data.qrValue,
                  size: 250,
                },
              ],
            },
            // Right Column: Details
            {
              type: 'column',
              width: 500, // Remaining width
              gap: 15,
              padding: 95, // Shift text block down
              children: [
                {
                  type: 'text',
                  text: data.code,
                  fontSize: 38,
                  fontBold: true,
                },
                {
                  type: 'text',
                  text: data.name || '',
                  fontSize: 24,
                  maxWidth: 450,
                  maxLines: 2,
                },
                ...specNodes,
                // Add an empty text node to act as a spacer to push footer down
                { type: 'text', text: ' ', fontSize: 10 },
                {
                  type: 'text',
                  text: data.footer,
                  fontSize: 18,
                  fontBold: true,
                },
              ],
            },
          ],
        },
      ],
    };
  },
};
