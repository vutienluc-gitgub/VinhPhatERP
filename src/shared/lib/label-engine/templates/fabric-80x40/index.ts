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
    const specsString = Array.isArray(data.specs)
      ? data.specs.join(' • ')
      : data.specs || '';

    return {
      type: 'row',
      width: '100%',
      height: '100%',
      padding: 4, // Safe Area offset
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 4,
      rx: 16,
      debug: false, // Set to true to see bounding boxes
      children: [
        // LEFT COLUMN: Dedicated Scan Zone
        {
          type: 'column',
          width: 246,
          height: '100%',
          justify: 'space-evenly',
          align: 'center',
          children: [
            { type: 'qrcode', value: data.qrValue, size: 200 },
            {
              type: 'text',
              text: data.footer || 'Scan for Details',
              fontSize: 18,
              fontBold: true,
            },
          ],
        },

        // VERTICAL DIVIDER
        { type: 'rect', width: 4, height: '100%', fill: '#000000' },

        // RIGHT COLUMN: Centered Details
        {
          type: 'column',
          flex: 1, // Automatically takes remaining 542px width
          height: '100%',
          justify: 'space-evenly',
          align: 'center',
          children: [
            {
              type: 'text',
              text: data.code || 'N/A',
              fontSize: 60,
              fontBold: true,
            },
            { type: 'rect', width: '100%', height: 3, fill: '#000000' },
            {
              type: 'text',
              text: data.name || 'N/A',
              fontSize: 34,
              fontBold: true,
              maxWidth: 500,
              maxLines: 2,
            },
            { type: 'rect', width: '100%', height: 3, fill: '#000000' },
            {
              type: 'text',
              text: specsString || 'N/A',
              fontSize: 30,
              fontBold: true,
              maxWidth: 500,
              maxLines: 2,
            },
          ],
        },
      ],
    };
  },
};
