import { FabricCatalog } from '@/features/fabric-catalog/types';
import { buildQRPayload } from '@/shared/lib/identifier.service';

import { Fabric80x40Model } from './model';

export function mapCatalogToFabricLabel(
  catalog: FabricCatalog,
): Fabric80x40Model {
  const specs: string[] = [];
  if (catalog.composition) specs.push(catalog.composition);

  const dimensionalParts = [];
  if (catalog.target_width_cm)
    dimensionalParts.push(`${catalog.target_width_cm}cm`);
  if (catalog.target_gsm) dimensionalParts.push(`${catalog.target_gsm} GSM`);

  if (dimensionalParts.length > 0) {
    specs.push(dimensionalParts.join(' • '));
  }

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
