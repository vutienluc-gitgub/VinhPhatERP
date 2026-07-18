const fs = require('fs');

let f1 = 'src/features/fabric-catalog/components/detail/FabricHeroGallery.tsx';
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  "PUBLIC_PAGE_LABELS as LABELS,",
  "LABELS as GLOBAL_LABELS,"
);

c1 = c1.replace(
  "{LABELS.PREVIEW_NO_IMAGE}",
  "{GLOBAL_LABELS.PREVIEW_NO_IMAGE}"
);

fs.writeFileSync(f1, c1, 'utf8');
