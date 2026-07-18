const fs = require('fs');

let f1 = 'src/features/fabric-catalog/fabric-catalog.constants.ts';
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  "rfqBtn: 'Yêu cầu báo giá',",
  "rfqBtn: 'Yêu cầu báo giá',\n  rfqRequestLabel: 'Yêu cầu báo giá',\n  downloadPdf: 'Tải PDF',"
);

fs.writeFileSync(f1, c1, 'utf8');

let f2 = 'src/features/fabric-catalog/components/PublicInquiryModal.tsx';
let c2 = fs.readFileSync(f2, 'utf8');

c2 = c2.replace(
  "|| 'Yêu cầu báo giá'",
  "|| LABELS.rfqRequestLabel"
);
c2 = c2.replace(
  ">Tải PDF<",
  ">{LABELS.downloadPdf}<"
);
c2 = c2.replace(
  "Tải PDF",
  "{LABELS.downloadPdf}"
);

fs.writeFileSync(f2, c2, 'utf8');
