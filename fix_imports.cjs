const fs = require('fs');
const files = [
  'd:/VinhPhatERP_v3/src/features/yarn-catalog/components/StepAdditionalInfo.tsx',
  'd:/VinhPhatERP_v3/src/features/yarn-catalog/components/StepGeneralInfo.tsx',
  'd:/VinhPhatERP_v3/src/features/yarn-catalog/components/StepKnittingEngineering.tsx',
  'd:/VinhPhatERP_v3/src/features/yarn-catalog/components/StepTechnicalSpecs.tsx',
  'd:/VinhPhatERP_v3/src/features/yarn-catalog/components/YarnCatalogMobileCard.tsx',
  'd:/VinhPhatERP_v3/src/features/yarn-catalog/components/YarnEngineeringMatrixModal.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/from '\.\.\/yarn-catalog\.constants';/g, "from '@/features/yarn-catalog/yarn-catalog.constants';");
  fs.writeFileSync(f, content);
});
console.log('Done fix_imports.cjs');
