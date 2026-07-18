const fs = require('fs');

let f1 = 'src/features/fabric-catalog/components/PublicStickyCTA.tsx';
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  "|| 'Tất cả màu'",
  "|| LABELS.rfqAllColors"
);

fs.writeFileSync(f1, c1, 'utf8');
