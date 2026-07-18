const fs = require('fs');

let f1 = 'src/features/fabric-catalog/components/detail/FabricHeroGallery.tsx';
let c1 = fs.readFileSync(f1, 'utf8');

// Revert COMP_LABELS.PREVIEW_NO_IMAGE back to LABELS.PREVIEW_NO_IMAGE
c1 = c1.replace(
  "{COMP_LABELS.PREVIEW_NO_IMAGE}",
  "{LABELS.PREVIEW_NO_IMAGE}"
);

fs.writeFileSync(f1, c1, 'utf8');
