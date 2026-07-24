import { Fabric80x40Model } from '@/features/fabric-catalog/label/model';
import { LabelTemplate } from '@/shared/lib/label-engine/core/types';

import { HtmlView } from './HtmlView';
import { renderFabric80x40Svg } from './svg-render';

export const fabric80x40Template: LabelTemplate<Fabric80x40Model> = {
  id: 'fabric-80x40',
  name: 'Tem Mẫu Vải 80x40mm',
  widthMm: 80,
  heightMm: 40,
  renderHTML: (data) => <HtmlView data={data} />,
  renderSVG: renderFabric80x40Svg,
};
