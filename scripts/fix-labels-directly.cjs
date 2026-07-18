const fs = require('fs');

function replaceLabels(f) {
  let c = fs.readFileSync(f, 'utf8');
  // First, remove the LABELS merging variable
  c = c.replace(/  const LABELS(.*)\n/g, '');
  
  // Replace all LABELS. with PAGE_LABELS.
  c = c.replace(/LABELS\./g, 'PAGE_LABELS.');
  
  // Some labels are in COMP_LABELS instead of PAGE_LABELS!
  // Let's replace the specific ones:
  c = c.replace(/PAGE_LABELS\.PUBLIC_TITLE/g, 'COMP_LABELS.PUBLIC_TITLE');
  c = c.replace(/PAGE_LABELS\.PUBLIC_DESC/g, 'COMP_LABELS.PUBLIC_DESC');
  c = c.replace(/PAGE_LABELS\.VIEW_PUBLIC_PAGE/g, 'COMP_LABELS.VIEW_PUBLIC_PAGE');

  // Add import for COMP_LABELS if missing
  if (!c.includes('COMP_LABELS')) {
    c = c.replace(
      /\} from '@\/features\/fabric-catalog\/fabric-catalog\.constants';/g,
      "  PUBLIC_COMPONENT_LABELS as COMP_LABELS,\n} from '@/features/fabric-catalog/fabric-catalog.constants';"
    );
  }
  fs.writeFileSync(f, c, 'utf8');
}

replaceLabels('src/features/fabric-catalog/components/public-tab-sections/FabricPublicPreview.tsx');
replaceLabels('src/features/fabric-catalog/components/public-tab-sections/FabricPublicPricingSection.tsx');
replaceLabels('src/features/fabric-catalog/components/public-tab-sections/FabricPublicStatusSection.tsx');
