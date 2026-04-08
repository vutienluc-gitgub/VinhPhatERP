import { bomTemplateSchema } from './src/features/bom/bom.module';

const validBom = {
  code: 'BOM-001',
  name: 'Test BOM',
  target_fabric_id: 'fabric-id',
  standard_loss_pct: 5,
  bom_yarn_items: [
    {
      yarn_catalog_id: 'yarn-1',
      ratio_pct: 60,
      consumption_kg_per_m: 0.3,
    },
    {
      yarn_catalog_id: 'yarn-2',
      ratio_pct: 40,
      consumption_kg_per_m: 0.2,
    },
  ],
};

const invalidRatioBom = {
  ...validBom,
  bom_yarn_items: [
    {
      yarn_catalog_id: 'yarn-1',
      ratio_pct: 60,
      consumption_kg_per_m: 0.3,
    },
    {
      yarn_catalog_id: 'yarn-2',
      ratio_pct: 30,
      consumption_kg_per_m: 0.2,
    },
  ],
};

const emptyItemsBom = {
  ...validBom,
  bom_yarn_items: [],
};

console.log('Testing Valid BOM...');
try {
  bomTemplateSchema.parse(validBom);
  console.log('✅ Valid BOM passed');
} catch (e) {
  console.error('❌ Valid BOM failed', e.errors);
}

console.log('\nTesting Invalid Ratio BOM (90%)...');
try {
  bomTemplateSchema.parse(invalidRatioBom);
  console.log('❌ Invalid Ratio BOM passed (SHOULD FAIL)');
} catch (e) {
  console.log('✅ Invalid Ratio BOM failed as expected:', e.errors[0].message);
}

console.log('\nTesting Empty Items BOM...');
try {
  bomTemplateSchema.parse(emptyItemsBom);
  console.log('❌ Empty Items BOM passed (SHOULD FAIL)');
} catch (e) {
  console.log('✅ Empty Items BOM failed as expected:', e.errors[0].message);
}
