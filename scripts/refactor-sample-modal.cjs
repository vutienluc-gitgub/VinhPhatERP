const fs = require('fs');

let f1 = 'src/features/fabric-catalog/fabric-catalog.constants.ts';
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  "requestSampleDesc: 'Vui lòng cung cấp thông tin để chúng tôi gửi mẫu vải đến bạn.',",
  "requestSampleDesc: 'Vui lòng cung cấp thông tin để chúng tôi gửi mẫu vải đến bạn.',\n  validationMissingFields: 'Vui lòng nhập đầy đủ các trường bắt buộc.',\n  sampleSubmitFailed: 'Gửi yêu cầu thất bại:',\n  samplePlaceholderAddress: 'Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố',"
);

fs.writeFileSync(f1, c1, 'utf8');

let f2 = 'src/features/fabric-catalog/components/PublicSampleModal.tsx';
let c2 = fs.readFileSync(f2, 'utf8');

c2 = c2.replace(
  "'Vui lòng nhập đầy đủ các trường bắt buộc.'",
  "LABELS.validationMissingFields"
);
c2 = c2.replace(
  "|| 'Tất cả màu'",
  "|| LABELS.rfqAllColors"
);
c2 = c2.replace(
  "|| 'Tất cả màu'",
  "|| LABELS.rfqAllColors"
);
c2 = c2.replace(
  "MẪU VẢI ĐĂNG KÝ:",
  "{LABELS.rfqFabricRequested}"
);
c2 = c2.replace(
  "placeholder=\"VD: Nguyễn Văn A\"",
  "placeholder={LABELS.rfqPlaceholderName}"
);
c2 = c2.replace(
  "placeholder=\"Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố\"",
  "placeholder={LABELS.samplePlaceholderAddress}"
);
c2 = c2.replace(
  "placeholder=\"VD: Thời trang Tân Phát\"",
  "placeholder={LABELS.rfqPlaceholderCompany}"
);
c2 = c2.replace(
  "`Gửi yêu cầu thất bại: ${msg}`",
  "`${LABELS.sampleSubmitFailed} ${msg}`"
);

fs.writeFileSync(f2, c2, 'utf8');
