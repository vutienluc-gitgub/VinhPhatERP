const fs = require('fs');

const file = 'src/features/fabric-catalog/components/FabricSampleQRModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { QRPreview } from '@/shared/components/QRPreview';",
  "import { QRPreview } from '@/shared/components/QRPreview';\nimport { PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);

content = content.replace(
  "const labels = {",
  "const labels = {\n    title: COMP_LABELS.QR_MODAL_TITLE,\n    download: COMP_LABELS.QR_MODAL_DOWNLOAD,\n    close: COMP_LABELS.QR_MODAL_CLOSE,\n    printTitlePrefix: COMP_LABELS.QR_MODAL_PRINT_PREFIX,\n    downloadError: COMP_LABELS.QR_MODAL_DOWNLOAD_ERR,\n  };\n  // "
);

content = content.replace(
  "title: 'In Tem Mẫu Vải',",
  ""
);
content = content.replace(
  "download: 'Tải Ảnh',",
  ""
);
content = content.replace(
  "close: 'Đóng',",
  ""
);
content = content.replace(
  "printTitlePrefix: 'Tem Mẫu - ',",
  ""
);
content = content.replace(
  "downloadError: 'Lỗi khi tải ảnh tem mẫu.',",
  ""
);

content = content.replace(
  "⚠️ Mẫu vải này <b>chưa được bật Công khai</b>. Khách hàng quét mã QR",
  "{COMP_LABELS.QR_MODAL_NOT_PUBLIC}"
);
content = content.replace(
  "sẽ không xem được.",
  ""
);

fs.writeFileSync(file, content, 'utf8');
