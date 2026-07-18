const fs = require('fs');

// 1. FabricHeroGallery.tsx
let f1 = 'src/features/fabric-catalog/components/detail/FabricHeroGallery.tsx';
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  "PUBLIC_PAGE_LABELS as LABELS,",
  "PUBLIC_PAGE_LABELS as LABELS,\n  PUBLIC_COMPONENT_LABELS as COMP_LABELS,"
);
// Fix replace error string|null
c1 = c1.replace(
  "`Màu ${activeColorName} - ${fabric.name}`",
  "COMP_LABELS.HERO_COLOR_NAME.replace('{color}', activeColorName || '').replace('{name}', fabric.name || '')"
);
c1 = c1.replace(
  "Lượt xem: {fabric.view_count ?? 0}",
  "{COMP_LABELS.HERO_VIEWS.replace('{count}', (fabric.view_count ?? 0).toString())}"
);
c1 = c1.replace(
  "{LABELS.noImage}",
  "{LABELS.PREVIEW_NO_IMAGE}"
);
fs.writeFileSync(f1, c1, 'utf8');

// 2. FabricPricingTable.tsx
let f2 = 'src/features/fabric-catalog/components/detail/FabricPricingTable.tsx';
let c2 = fs.readFileSync(f2, 'utf8');

if (!c2.includes('PUBLIC_COMPONENT_LABELS as COMP_LABELS')) {
  c2 = c2.replace(
    "PUBLIC_PAGE_LABELS,",
    "PUBLIC_PAGE_LABELS,\n  PUBLIC_COMPONENT_LABELS as COMP_LABELS,"
  );
}

c2 = c2.replace(
  "suffix={tier.currency === 'USD' ? ' USD' : ' đ'}",
  "suffix={tier.currency === 'USD' ? ' USD' : ` ${COMP_LABELS.CURRENCY_VND}`}"
);
fs.writeFileSync(f2, c2, 'utf8');
