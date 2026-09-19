import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ Lỗi: Chưa tìm thấy GEMINI_API_KEY trong file .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

/**
 * Hàm bóc tách dữ liệu từ file ảnh (JPG, PNG) hoặc file PDF phiếu xuất kho
 * @param {string} filePath Đường dẫn đến file ảnh hoặc PDF
 */
export async function extractPhieuXuat(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Không tìm thấy file: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  let mimeType = 'application/pdf';
  if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
  else if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.webp') mimeType = 'image/webp';

  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');

  const prompt = `Bạn là một trợ lý AI chuyên trích xuất dữ liệu từ Phiếu xuất kho của CÔNG TY TNHH SX TM DET MAY VINH PHAT.
Hãy đọc tệp đính kèm (ảnh hoặc PDF) và trích xuất các thông tin sau thành một đối tượng JSON chuẩn:
- "ngayChungTu": (Chuỗi) Ngày chứng từ
- "soPhieuXuat": (Chuỗi) Số phiếu xuất
- "hoTenNguoiNhan": (Chuỗi) Họ tên người nhận
- "diaChiBoPhan": (Chuỗi) Địa chỉ / Bộ phận
- "lyDoXuatKho": (Chuỗi) Lý do xuất kho
- "xuatTaiKho": (Chuỗi) Xuất tại kho
- "bienSoXe": (Chuỗi) Biển số xe
- "tenQuyCachVTHH": (Chuỗi) Tên, quy cách VTHH (vật tư hàng hóa)
- "donViTinh": (Chuỗi) Đơn vị tính
- "soLuongThucXuat": (Số) Số lượng thực xuất
- "tongKgTho": (Số) Tổng Kg thô
- "tongKgThucTe": (Số) Tổng Kg thực tế
- "ghiChuChiTiet": (Chuỗi) Ghi chú chi tiết

Nếu không có dữ liệu cho trường nào, hãy điền chuỗi rỗng "" hoặc 0 (cho số).`;

  console.log(`⏳ Đang gửi file [${path.basename(filePath)}] tới Gemini AI...`);

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
    },
  });

  const resultJson = JSON.parse(response.text);
  return resultJson;
}

// Chạy trực tiếp từ dòng lệnh: node scripts/extract-phieu-xuat.mjs <duong-dan-file>
const targetFile = process.argv[2];
if (targetFile) {
  extractPhieuXuat(targetFile)
    .then((data) => {
      console.log('✅ KẾT QUẢ BÓC TÁCH:');
      console.dir(data, { depth: null, colors: true });
    })
    .catch((err) => {
      console.error('❌ Thất bại:', err.message);
    });
} else {
  console.log('ℹ️ Hướng dẫn sử dụng:');
  console.log('node scripts/extract-phieu-xuat.mjs <duong_dan_file_anh_hoac_pdf>');
}
