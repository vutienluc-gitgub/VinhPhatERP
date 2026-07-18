const fs = require('fs');

let f1 = 'src/features/fabric-catalog/fabric-catalog.constants.ts';
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  "requestSampleDesc:",
  "validationMissingFields: 'Vui lòng nhập đầy đủ các trường bắt buộc.',\n  sampleSubmitFailed: 'Gửi yêu cầu thất bại:',\n  samplePlaceholderAddress: 'Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố',\n  requestSampleDesc:"
);

fs.writeFileSync(f1, c1, 'utf8');
