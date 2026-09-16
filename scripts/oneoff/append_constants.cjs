const fs = require('fs');
let content = fs.readFileSync('src/features/fabric-catalog/fabric-catalog.constants.ts', 'utf-8');
const optionsCode = `
import { FABRIC_CATALOG_STATUS_LABELS } from '@/schema/fabric-catalog.schema';

export const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'm', label: 'mét (m)' },
  { value: 'cuộn', label: 'cuộn' },
];

export const STATUS_OPTIONS = (['active', 'inactive'] as const).map((s) => ({
  value: s,
  label: FABRIC_CATALOG_STATUS_LABELS[s],
}));

export const TECHNIQUE_OPTIONS = [
  { value: 'Single Jersey', label: 'Single Jersey' },
  { value: 'Interlock', label: 'Interlock' },
  { value: 'Rib', label: 'Rib' },
  { value: 'Pique', label: 'Pique' },
  { value: 'French Terry', label: 'French Terry' },
  { value: 'Fleece', label: 'Fleece' },
  { value: 'Polar Fleece', label: 'Polar Fleece' },
  { value: 'Waffle', label: 'Waffle' },
  { value: 'Jacquard', label: 'Jacquard' },
];
`;
fs.writeFileSync('src/features/fabric-catalog/fabric-catalog.constants.ts', optionsCode + content);
console.log('Appended');
