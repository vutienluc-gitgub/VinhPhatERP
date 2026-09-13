# Hướng Dẫn Gán Nhãn & Tạo Dữ Liệu Chuẩn (Ground Truth Labeling Guide)

**Dự án:** VinhPhatERP — `FEAT-YARN-OCR`  
**Dataset:** `vinhphat-yarn-slip-v1`  
**Phiên bản:** 1.0.0

---

## 1. Nguyên Tắc Cốt Lõi (Golden Rules of Labeling)

1. **Người Thật Xác Thực 100%:** Ground Truth tuyệt đối **không được sinh bằng Gemini hay bất kỳ mô hình AI nào**. Mọi giá trị số và ký tự phải do chuyên viên/thủ kho đọc mắt thường và đối chiếu từ bản giấy gốc.
2. **Trung Thực Với Văn Bản Gốc:**
   - Phiếu in/viết cái gì thì ghi đúng cái đó.
   - Nếu phiếu **không có** trường (ví dụ không có biển số xe `vehicle_plate`, không có `cone_count`), ghi `null`. **Tuyệt đối không tự suy diễn hoặc điền bừa**.
3. **Chuẩn Hóa Số Liệu:**
   - Dấu phân cách thập phân trong JSON **bắt buộc là dấu chấm (`.`)**, ví dụ `1052.5` (không dùng phẩy `1052,5`).
   - Khối lượng lưu theo đơn vị chuẩn `kg`.
   - Giữ nguyên số chữ số thập phân thực tế của phiếu (thường là 1 chữ số thập phân cho cân sợi công nghiệp, ví dụ `52.6`).

---

## 2. Phân Loại 10 Nhóm Mẫu (40 Phiếu Đề Xuất)

Để đảm bảo hệ thống chịu tải tốt trong thực tế xưởng sản xuất, bộ 40 mẫu cần phân bổ theo 10 kịch bản:

| Mã Danh mục (`category`) | Tên kịch bản                     | Số lượng | Đặc điểm nhận diện                                      |
| :----------------------- | :------------------------------- | :------- | :------------------------------------------------------ |
| `dot_matrix_clear`       | In kim rõ nét                    | 5        | In máy in kim (Epson LQ310) giấy liên 2-3, chữ đậm rõ   |
| `dot_matrix_faded`       | In kim mờ / ruy-băng cạn         | 5        | Mực in kim nhạt, đứt nét chấm (dot matrix)              |
| `thermal_print`          | In nhiệt / Hóa đơn cân nhỏ       | 5        | Giấy in nhiệt trạm cân, font chữ đậm co cụm             |
| `handwritten_clear`      | Viết tay rõ nét                  | 5        | Phiếu viết tay nét bút bi rõ ràng, ngay ngắn            |
| `handwritten_difficult`  | Viết tay khó đọc / nguệch ngoạc  | 5        | Chữ bác sĩ, nét mờ, số dễ nhầm (0 vs 6, 1 vs 7, 3 vs 8) |
| `skewed_distorted`       | Nghiêng / Méo góc / Phối cảnh    | 3        | Chụp chéo góc $15^\circ - 30^\circ$, xoay ngang dọc     |
| `poor_glare_lighting`    | Ánh sáng kém / Chói bóng đèn     | 3        | Bị bóng đổ tay chụp, hoặc chói lóa đèn trần xưởng       |
| `crossed_corrected`      | Có gạch / Xóa / Chỉnh sửa tay    | 3        | Có nét bút gạch số cũ ghi đè số mới                     |
| `multi_row_table`        | Bảng nhiều dòng (15 - 30 kiện)   | 3        | Phiếu chi tiết từng kiện xếp thành 2-3 cột dày đặc      |
| `abnormal_discrepancy`   | Phiếu bất thường / Lệch toán học | 3        | Phiếu thực tế NCC ghi nhầm số (Gross - Tare $\neq$ Net) |

---

## 3. Quy Ước Đặt Tên File (Naming Convention)

- **Ảnh gốc:** `datasets/yarn-slip/v1/images/YS-0001.jpg`, `YS-0002.jpg`, ...
- **Ground Truth JSON:** `datasets/yarn-slip/v1/ground-truth/YS-0001.json`, `YS-0002.json`, ...
- Định dạng ảnh khuyến nghị: `.jpg` hoặc `.png`, kích thước chụp thực tế từ điện thoại (tối thiểu 1080p, tối đa 4000x3000).

---

## 4. Cấu Trúc File Ground Truth JSON Mẫu

```json
{
  "sample_id": "YS-0001",
  "document_type": "YARN_WEIGHING_SLIP",
  "category": "dot_matrix_clear",
  "image_filename": "YS-0001.jpg",
  "image_metadata": {
    "original_resolution": "2400x3200",
    "lighting": "good",
    "skew_angle_deg": 1.2,
    "quality_gate_passed": true
  },
  "ground_truth": {
    "supplier": {
      "raw_text": "CÔNG TY CP DỆT MAY ĐÔNG NAM",
      "canonical_name": "CÔNG TY CỔ PHẦN DỆT MAY ĐÔNG NAM",
      "short_name": "ĐÔNG NAM"
    },
    "document_number": "PC-2026/09-1142",
    "document_date": "2026-09-12",
    "vehicle_plate": "51C-889.24",
    "yarn_type": "Cotton Compact 100% Ne 30/1",
    "yarn_lot": "L260901",
    "warehouse_destination": "Kho Sợi Vĩnh Phát - Nhà máy 1",
    "summary": {
      "package_count": 20,
      "cone_count": 480,
      "gross_weight_kg": 1052.5,
      "tare_weight_kg": 52.5,
      "declared_net_weight_kg": 1000.0,
      "calculated_net_weight_kg": 1000.0
    },
    "packages": [
      {
        "package_index": 1,
        "package_code": "K-01",
        "cone_count": 24,
        "gross_kg": 52.6,
        "tare_kg": 2.6,
        "net_kg": 50.0
      }
    ]
  },
  "verification": {
    "verified_by": "Thủ kho Trưởng - Nguyễn Văn A",
    "verified_at": "2026-09-12T14:30:00+07:00",
    "verification_method": "HUMAN_PHYSICAL_SLIP_CHECK",
    "notes": "Phiếu in kim rõ ràng, không gạch xóa."
  }
}
```

---

## 5. Tiêu Chuẩn Nghiệm Thu Benchmark (Acceptance Criteria)

Khi chạy script benchmark so sánh kết quả trích xuất của Engine với Ground Truth:

| Chỉ số                              | Ngưỡng tối thiểu | Ý nghĩa nghiệp vụ                                              |
| :---------------------------------- | :--------------- | :------------------------------------------------------------- |
| **`net_weight` accuracy**           | **$\ge 99.0\%$** | Khối lượng tịnh nhập kho sai lệch sẽ làm sai giá thành vải     |
| **`document_number` accuracy**      | **$\ge 98.0\%$** | Chống trùng lặp phiếu cân, khớp hóa đơn tài chính              |
| **`supplier` accuracy**             | **$\ge 98.0\%$** | Gán đúng công nợ NCC                                           |
| **`gross_weight` accuracy**         | **$\ge 98.0\%$** | Trọng lượng xe/bao thô                                         |
| **`tare_weight` accuracy**          | **$\ge 98.0\%$** | Bì bao bì/lõi ống sợi                                          |
| **Document-Level Accuracy**         | **$\ge 95.0\%$** | Toàn bộ các trường cốt lõi của phiếu đúng hoàn hảo             |
| **False Auto-Approval Rate (FAAR)** | **$= 0.0\%$**    | **Tuyệt đối không bao giờ được tự động duyệt phiếu có số sai** |

> **Nguyên tắc an toàn:** Thà để 10% phiếu bị gắn cờ `needs_manual_review = true` để thủ kho liếc mắt kiểm tra lại, còn hơn để 1 phiếu sai lọt tự động vào cơ sở dữ liệu tồn kho ERP!
