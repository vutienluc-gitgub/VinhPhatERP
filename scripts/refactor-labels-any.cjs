const fs = require('fs');

function fixLabelsSafe(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix imports
  if (content.includes('PUBLIC_TAB_LABELS as TAB_LABELS,')) {
    content = content.replace(
      'PUBLIC_TAB_LABELS as TAB_LABELS,',
      'PUBLIC_PAGE_LABELS as PAGE_LABELS,\n  PUBLIC_TAB_LABELS as TAB_LABELS,'
    );
  } else if (content.includes('PUBLIC_TAB_LABELS as TAB_LABELS }')) {
    content = content.replace(
      'PUBLIC_TAB_LABELS as TAB_LABELS }',
      'PUBLIC_PAGE_LABELS as PAGE_LABELS,\n  PUBLIC_TAB_LABELS as TAB_LABELS,\n  PUBLIC_COMPONENT_LABELS as COMP_LABELS\n}'
    );
  }

  if (!content.includes('PUBLIC_COMPONENT_LABELS as COMP_LABELS')) {
    content = content.replace(
      'PUBLIC_TAB_LABELS as TAB_LABELS,',
      'PUBLIC_TAB_LABELS as TAB_LABELS,\n  PUBLIC_COMPONENT_LABELS as COMP_LABELS,'
    );
  }

  // Fix the actual LABELS assignment
  content = content.replace(
    'const LABELS = TAB_LABELS;',
    'const LABELS = { ...PAGE_LABELS, ...TAB_LABELS, ...COMP_LABELS } as any;'
  );
  
  if (file.includes('FabricPublicPreview')) {
    // FabricPublicPreview originally had LABELS imported and used as PAGE_LABELS!
    // Oh wait, in the untainted version of FabricPublicPreview, what was the import?
    // Let me check if `const LABELS = TAB_LABELS;` was in my first refactor script!
    // Yes, my first refactor script replaced the import and added `const LABELS = TAB_LABELS;`.
  }

  fs.writeFileSync(file, content, 'utf8');
}

fixLabelsSafe('src/features/fabric-catalog/components/public-tab-sections/FabricPublicPreview.tsx');
fixLabelsSafe('src/features/fabric-catalog/components/public-tab-sections/FabricPublicPricingSection.tsx');
fixLabelsSafe('src/features/fabric-catalog/components/public-tab-sections/FabricPublicStatusSection.tsx');
