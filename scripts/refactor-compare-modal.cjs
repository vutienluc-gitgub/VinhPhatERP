const fs = require('fs');

let f1 = 'src/features/fabric-catalog/components/PublicCompareModal.tsx';
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  ">Thông số</th>",
  ">{LABELS.specs}</th>"
);
c1 = c1.replace(
  ">Thành phần</td>",
  ">{LABELS.composition}</td>"
);
c1 = c1.replace(
  ">Khổ rộng</td>",
  ">{LABELS.width}</td>"
);
c1 = c1.replace(
  ">Định lượng</td>",
  ">{LABELS.gsm}</td>"
);
c1 = c1.replace(
  ">Co giãn</td>",
  ">{LABELS.stretch}</td>"
);
c1 = c1.replace(
  ">Độ dày</td>",
  ">{LABELS.thickness}</td>"
);
c1 = c1.replace(
  ">Thời gian giao</td>",
  ">{LABELS.leadTime}</td>"
);
c1 = c1.replace(
  ">Xóa</button>",
  ">{LABELS.DELETE}</button>"
);
c1 = c1.replace(
  "toast.success('Đã bỏ so sánh.')",
  "toast.success(LABELS.removeCompareSuccess)"
);
c1 = c1.replace(
  ">Đóng</Button>",
  ">{LABELS.close}</Button>"
);

fs.writeFileSync(f1, c1, 'utf8');
