/**
 * Seed print templates for VinhPhatERP Print Platform.
 * Split per document family so each file stays under the Rule 11 size ratchet.
 */

import type { PrintTemplateEntity } from './types';
import { SHIPMENT_TEMPLATES } from './template-seed.shipment';
import { PACKING_LIST_TEMPLATES } from './template-seed.packing-list';
import { LABEL_AND_RECEIPT_TEMPLATES } from './template-seed.others';

export { SHIPMENT_TEMPLATES } from './template-seed.shipment';
export { PACKING_LIST_TEMPLATES } from './template-seed.packing-list';
export { LABEL_AND_RECEIPT_TEMPLATES } from './template-seed.others';

export const DEFAULT_PRINT_TEMPLATES_SEED: PrintTemplateEntity[] = [
  ...SHIPMENT_TEMPLATES,
  ...PACKING_LIST_TEMPLATES,
  ...LABEL_AND_RECEIPT_TEMPLATES,
];
