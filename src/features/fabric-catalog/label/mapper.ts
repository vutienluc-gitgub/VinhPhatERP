import { FabricCatalog } from '@/features/fabric-catalog/types';
import { buildQRPayload } from '@/shared/lib/identifier.service';

import { Fabric80x40Model } from './model';

export function mapCatalogToFabricLabel(
  catalog: FabricCatalog,
): Fabric80x40Model {
  const specsParts = [];
  if (catalog.composition) specsParts.push(catalog.composition);
  if (catalog.target_width_cm) specsParts.push(`${catalog.target_width_cm}cm`);
  if (catalog.target_gsm) specsParts.push(`${catalog.target_gsm} GSM`);
  const specs = specsParts.join(' • ');

  const qrData = buildQRPayload('fabric_catalog', catalog.slug || catalog.id, {
    code: catalog.code,
    name: catalog.name,
  });

  return {
    code: catalog.code || 'N/A',
    name: catalog.name || 'N/A',
    specs,
    footer: 'Scan for Details',
    qrValue: qrData,
  };
}
