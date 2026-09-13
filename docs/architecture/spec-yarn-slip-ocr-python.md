# ĐẶC TẢ KỸ THUẬT SẢN XUẤT (PRODUCTION IMPLEMENTATION SPECIFICATION)

## FEAT-YARN-OCR: YARN DOCUMENT INTELLIGENCE PIPELINE

- **Tên dự án:** VinhPhatERP — Yarn Document Intelligence Pipeline
- **Mã tính năng:** `FEAT-YARN-OCR`
- **Tác giả:** Solution Architecture & Tech Lead Team
- **Phiên bản:** 2.0 (Production Implementation Specification — Rating 9/10)
- **Công nghệ nền tảng:** Python 3.11+ (FastAPI, OpenCV, Pydantic, Gemini Vision) + Hono API (Node.js/TypeScript) + PostgreSQL

---

## 1. Tuyên Ngôn Kiến Trúc & Định Hướng Cốt Lõi (Architectural Manifesto)

> [!IMPORTANT]
> **Thay đổi tư duy cốt lõi:**
> Tính năng này **KHÔNG PHẢI** là “AI đọc ảnh ➔ JSON ➔ Tự động nhập kho”.
> Định nghĩa chuẩn mực của hệ thống là:
> **“Hệ thống Vision tự động tạo bản nháp Phiếu Nhập Sợi (Draft Goods Receipt) từ chứng từ hình ảnh, thực hiện kiểm tra tính hợp lệ 3 tầng (Syntax ➔ Semantic/Math ➔ Business/ERP), và yêu cầu người có thẩm quyền phê duyệt trước khi ghi nhận giao dịch vào ERP.”**

### Các nguyên tắc bất di bất dịch (Guiding Principles):

1. **Python là Stateless Input Adapter:** Python OCR Microservice **tuyệt đối không truy cập trực tiếp Database ERP**, không tự ý thực hiện `INSERT yarn_receipts` hay `INSERT yarn_inventory`. Python chỉ trả về `Extraction Result DTO`.
2. **Hono là Boundary Bảo Mật & Nghiệp Vụ:** Backend Hono chịu trách nhiệm: Authentication (JWT/RBAC), Rate Limiting, Audit Trail, Image Storage, Supplier Matching, 3-Tier Validation, và DB Transactions.
3. **Structured Output ≠ Dữ liệu chính xác 100%:** Schema valid không đồng nghĩa với nghiệp vụ đúng. Hệ thống phải phân tách độc lập giữa **Syntax Validity**, **Semantic/Mathematical Validity**, và **Business Validity**.
4. **Không tin tưởng tuyệt đối vào AI (Anti-Hallucination & Provenance):** Mọi trường dữ liệu quan trọng đều phải gắn kèm độ tin cậy (`confidence`) và bằng chứng xuất xứ (`provenance`). Cái gì không nhìn thấy trên ảnh thì trả `null`, cấm suy đoán.
5. **Full Auditability:** Bất kỳ Phiếu Nhập Kho Sợi (`Goods Receipt`) nào được tạo từ OCR đều phải truy ngược được về: Ảnh gốc, Ảnh tiền xử lý, Kết quả AI thô, Sự hiệu chỉnh của con người, và Người bấm phê duyệt.
6. **Ranh Giới 3 Thực Thể Độc Lập (3-Object Separation Boundary):**
   - **`OCR Extraction`** (AI nói gì): Dữ liệu thô từ Vision Provider đề xuất (Untrusted proposal).
   - **`Validated Extraction`** (Hệ thống xác minh gì): Dữ liệu sau khi Hono & Python kiểm tra Syntax, 8-Level Math, Duplicate Hash, và Supplier Alias Matching.
   - **`Approved ERP Document`** (Người dùng quyết định gì): Bản nháp được Thủ kho xác nhận / chỉnh sửa và phê duyệt bằng hành động rõ ràng trước khi ghi vào Database ERP.

---

## 2. Kiến Trúc Tổng Thể & Ranh Giới Hệ Thống (Architecture & Security Boundaries)

```text
                           CLIENT LAYER
                    ┌─────────────────────────┐
                    │ React Mobile/Web        │
                    │ "Scan Workspace"        │
                    └────────────┬────────────┘
                                 │
                   HTTPS :443    │ 1. Multipart Upload (with JWT)
                                 ▼
                     INFRASTRUCTURE / GATEWAY
                    ┌─────────────────────────┐
                    │ Nginx Reverse Proxy     │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    APPLICATION / BFF LAYER (VPS)
                    ┌─────────────────────────┐
                    │ Hono API Server (:3000) │
                    │ - Auth & RBAC Guard     │
                    │ - Image Storage & Hash  │
                    │ - Job Lifecycle Manager │
                    └────────────┬────────────┘
                                 │
      Internal Auth HTTP         │ 2. POST /internal/v1/vision/yarn-slip
      (127.0.0.1:8000 only)      │    X-Internal-Service-Key + Correlation-ID
                                 ▼
                     VISION PROCESSING ENGINE
                 ┌────────────────────────────────┐
                 │ Python FastAPI Service (:8000) │
                 │                                │
                 │ ── Gate 0: Image Quality Gate  │
                 │ ── Step 1: OpenCV Deskew/CLAHE │
                 │ ── Step 2: Vision Adapter      │
                 │ ── Step 3: Pydantic Validation │
                 └───────────────┬────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            Gemini 2.5 Flash            PaddleOCR-v4
           (Primary - SOTA)         (Phase 2: Fallback)
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ▼ 3. Extraction DTO (Syntax Valid)
                    ┌─────────────────────────┐
                    │ Hono Validation Layer   │
                    │                         │
                    │ - Tier 2: 8-Level Math  │
                    │ - Tier 3: Supplier Match│
                    │ - Duplicate Detection   │
                    │ - PO Cross-Check        │
                    └────────────┬────────────┘
                                 │
                                 ▼ 4. Create Draft & Notify User
                    ┌─────────────────────────┐
                    │ Human Approval Gate     │
                    │ (Thủ kho kiểm tra & ký) │
                    └────────────┬────────────┘
                                 │ 5. POST /yarn-receipts/:id/approve
                                 ▼
                    ┌─────────────────────────┐
                    │ ERP Domain Transaction  │
                    │ - yarn_receipts (Insert)│
                    │ - inventory (Movement)  │
                    │ - audit_logs (Recorded) │
                    └─────────────────────────┘
```

---

## 3. Ranh Giới Bảo Mật & Chính Sách Tệp Tin (Security & File Policy)

### 3.1. Internal Service Security

- Python FastAPI lắng nghe duy nhất tại `127.0.0.1:8000` (không bind `0.0.0.0`, không mở ra Internet).
- Giao tiếp giữa Hono và Python được xác thực bằng header nội bộ:
  ```text
  X-Internal-Service-Key: <HMAC_GENERATED_SECRET>
  X-Correlation-ID: req_01J...
  ```
- Nginx chặn toàn bộ truy cập từ bên ngoài vào port 8000.

### 3.2. File Upload Hardening Policy

Trước khi tệp tin chạm tới AI model, Hono API thực thi kiểm tra an ninh nghiêm ngặt:

1. **MIME Validation:** Chỉ chấp nhận `image/jpeg`, `image/png`, `image/webp` (Magic Bytes check, không tin cậy extension).
2. **Dung lượng tối đa:** `10 MB`.
3. **Kích thước ảnh tối đa:** `20 Megapixels` (ngăn chặn Image Decompression Bomb / DoS).
4. **Sanitization:** Tự động loại bỏ metadata nhạy cảm (EXIF GPS location, device serials).
5. **Storage Retention:**
   - Lưu ảnh gốc vào thư mục an toàn: `/var/data/vinhphat/ocr/originals/{YYYY}/{MM}/{job_id}.jpg`.
   - File nháp chưa duyệt tự động xóa sau 30 ngày nếu bị `REJECTED`.
   - File đã `APPROVED` lưu trữ tối thiểu 5 năm phục vụ kiểm toán thuế & đối soát sợi.

---

## 4. Quản Lý Vòng Đời: Bảng `ocr_jobs` & State Machine

Mỗi lần quét ảnh là một **OCR Job** có định danh duy nhất và theo dõi tiến trình qua state machine:

### 4.1. Sơ đồ Trạng thái (State Machine)

```text
[UPLOADED] ──► [QUALITY_CHECK] ──► (Fail) ──► [REJECTED_QUALITY]
                      │
                   (Pass)
                      ▼
               [PROCESSING_VISION]
                      │
                      ▼
               [EXTRACTED_RAW]
                      │
                      ▼
               [VALIDATING] ─────► (Math/Supplier issue) ──► [NEEDS_REVIEW]
                      │                                             │
               (Tất cả pass 100%)                                   │
                      │                                             ▼
                      └───────────────────────────────────► [READY_FOR_APPROVAL]
                                                                    │
                                                     ┌──────────────┴──────────────┐
                                                     ▼                             ▼
                                                [APPROVED]                    [REJECTED]
                                                     │
                                                     ▼
                                          [GOODS_RECEIPT_CREATED]
```

### 4.2. Database Schema: `ocr_jobs` & `ocr_job_events`

```sql
-- Migration: Create OCR Jobs Audit System
CREATE TABLE public.ocr_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL DEFAULT 'YARN_WEIGHING_SLIP',
  status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',

  -- File References
  original_image_url TEXT NOT NULL,
  preprocessed_image_url TEXT,
  image_hash VARCHAR(64) NOT NULL, -- SHA-256 chống duplicate

  -- Processing Telemetry
  correlation_id VARCHAR(64) NOT NULL,
  engine VARCHAR(30) NOT NULL DEFAULT 'gemini-2.5-flash',
  processing_ms INTEGER,

  -- Extraction Results (Full Provenance)
  extraction_raw_json JSONB,
  validated_data_json JSONB,
  user_corrections_json JSONB,
  final_approved_json JSONB,

  -- Quality & Flags
  needs_manual_review BOOLEAN NOT NULL DEFAULT true,
  review_reasons JSONB DEFAULT '[]',
  duplicate_warning JSONB,

  -- Foreign Key Linkage
  created_receipt_id UUID REFERENCES public.yarn_receipts(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  approved_at TIMESTAMPTZ
);

CREATE TABLE public.ocr_job_events (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.ocr_jobs(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  duration_ms INTEGER,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_ocr_jobs_status ON public.ocr_jobs(status);
CREATE INDEX idx_ocr_jobs_image_hash ON public.ocr_jobs(image_hash);
CREATE INDEX idx_ocr_jobs_created_at ON public.ocr_jobs(created_at DESC);
```

---

## 5. Cổng Kiểm Tra Chất Lượng Ảnh (Gate 0: Image Quality Gate)

Trước khi gửi ảnh qua LLM Vision (gây tốn token và có nguy cơ hallucination), Python OpenCV thực thi kiểm tra nhanh (< 150ms):

1. **Kiểm tra độ phân giải:** Chiều rộng và chiều cao tối thiểu $\ge 800\text{ px}$.
2. **Kiểm tra độ nhòe (Blur Detection via Laplacian Variance):**
   $$\text{Var}(\Delta I) = \frac{1}{N} \sum (L(x, y) - \mu)^2$$
   Nếu $\text{Score} < 100.0$: Ảnh bị mờ ➔ Trả ngay `REJECTED_IMAGE_QUALITY`.
3. **Kiểm tra độ chênh lệch sáng (Brightness & Contrast Check):**
   Nếu ảnh quá tối (Mean Pixel Value $< 40$) hoặc cháy sáng (Mean Pixel Value $> 240$) ➔ Từ chối.
4. **Phản hồi lỗi rõ ràng cho Thủ kho:**
   ```json
   {
     "status": "REJECTED_IMAGE_QUALITY",
     "warnings": [
       "Ảnh bị nhòe nét (Blur score: 62.4 < 100)",
       "Vui lòng giữ chắc tay và chụp lại đủ sáng để bảo đảm số cân chính xác"
     ]
   }
   ```

---

## 6. Tiền Xử Lý Ảnh OpenCV (Image Pre-processing)

Nếu vượt qua Gate 0, ảnh đi qua pipeline tiền xử lý:

1. **Perspective Correction (Deskew & Flatting):**
   Tìm đường bao mép giấy (`cv2.findContours` + `cv2.approxPolyDP`), thực hiện phép biến đổi phối cảnh 4 điểm (`cv2.getPerspectiveTransform`) để kéo phẳng phiếu thành hình chữ nhật chuẩn góc $90^\circ$.
2. **CLAHE (Contrast Limited Adaptive Histogram Equalization):**
   Cân bằng sáng cục bộ để làm nổi bật các nét in kim chấm li ti hoặc nét mực bút bi xanh bị mờ.
3. **Loại bỏ bóng đổ (Shadow Removal):**
   Dùng phép trừ nền làm phẳng ánh sáng (Background subtraction with morphological closing).

---

## 7. AI Vision Prompt Engineering & Anti-Hallucination Rules

### 7.1. Cấu trúc Prompt Tiêu Chuẩn Sản Xuất

```text
You are a deterministic, zero-hallucination Textile Document Extraction Engine for VinhPhatERP.
Analyze the provided Yarn Weighing Slip / Delivery Note and output strictly structured data matching the schema.

STRICT EXTRACTION RULES:
1. VISUAL GROUNDING ONLY: Extract values that are explicitly, visually printed or written on the document.
2. NO INFERENCE / NO GUESSING: If a field (e.g. vehicle_plate, cone_count) is missing, cropped, or unreadable, set it to null. NEVER invent or extrapolate numbers.
3. NO MATH SYNTHESIS: Extract "declared_net_kg" exactly as written on the paper. Do NOT compute Gross - Tare yourself in this step.
4. NUMERIC NORMALIZATION:
   - Vietnamese notation uses commas (,) or periods (.) for decimals (e.g. "1.052,5" or "1052.5"). Normalize all numbers to standard float format (1052.5).
   - Preserve exact decimal precision as shown on the scale.
5. FIELD-LEVEL CONFIDENCE: For every extracted entity, rate your visual recognition certainty from 0.00 to 1.00 based on clarity, contrast, and font completeness.
6. PACKAGE MATRIX:
   - If individual package/bale rows exist, extract them sequentially.
   - Do NOT duplicate rows.
   - If package numbers are missing, assign sequential indices starting from 1.
7. TERMINOLOGY ANCHORS (VIETNAMESE TEXTILE):
   - "Loại sợi" / "Chi số" -> yarn_type (e.g., Ne 30/1, CVC 40/1, TC 65/35, Cotton CM)
   - "Số lô" / "Lot" -> yarn_lot
   - "Số kiện" / "Số bao" / "Số thùng" -> package_count
   - "Trọng lượng gộp" / "Cả bì" / "Gross" -> gross_weight_kg
   - "Bì" / "Tare" -> tare_weight_kg
   - "Trọng lượng tịnh" / "Thực tế" / "Net" -> declared_net_weight_kg
```

---

## 8. Đặc Tả Dữ Liệu: Provenance & Field-Level Confidence

Toàn bộ phản hồi trích xuất từ Python Vision Microservice tuân thủ Schema Pydantic sau:

```json
{
  "document": {
    "document_type": "YARN_WEIGHING_SLIP",
    "supplier_raw_name": {
      "value": "CTY CP DET MAY DONG NAM",
      "confidence": 0.99
    },
    "document_number": { "value": "PC-2026/09-1142", "confidence": 0.97 },
    "document_date": { "value": "2026-09-12", "confidence": 0.98 },
    "vehicle_plate": { "value": "51C-889.24", "confidence": 0.91 }
  },
  "summary": {
    "yarn_type": { "value": "CVC 40/1", "confidence": 0.96 },
    "yarn_lot": { "value": "L2609-CVC", "confidence": 0.95 },
    "package_count": { "value": 20, "confidence": 0.98 },
    "cone_count": { "value": 480, "confidence": 0.89 },
    "gross_weight_kg": { "value": 1052.5, "confidence": 0.99 },
    "tare_weight_kg": { "value": 52.5, "confidence": 0.94 },
    "declared_net_weight_kg": { "value": 1000.0, "confidence": 0.98 }
  },
  "packages": [
    {
      "package_index": 1,
      "package_code": null,
      "cone_count": 24,
      "gross_kg": 52.6,
      "tare_kg": 2.6,
      "net_kg": 50.0,
      "confidence": 0.97
    }
  ],
  "engine_telemetry": {
    "engine": "gemini-2.5-flash",
    "model_version": "2026-flash-vision",
    "processing_duration_ms": 1380,
    "quality_metrics": {
      "blur_score": 340.2,
      "brightness_mean": 182.1,
      "deskew_angle_degrees": -1.45
    }
  }
}
```

---

## 9. Chiến Lược Kiểm Tra Hợp Lệ 3 Tầng (3-Tier Validation Hierarchy)

Sau khi nhận `Extraction DTO` từ Python, Hono Application Layer thực thi bộ lọc 3 tầng trước khi tạo bản nháp:

```text
               ┌─────────────────────────────────────┐
               │ TẦNG 1: SYNTAX VALIDATION           │
               │ (Zod Schema / Type Safety)          │
               └──────────────────┬──────────────────┘
                                  │ Pass
                                  ▼
               ┌─────────────────────────────────────┐
               │ TẦNG 2: SEMANTIC & MATH INTEGRITY   │
               │ (8-Level Mathematical Verification) │
               └──────────────────┬──────────────────┘
                                  │ Pass
                                  ▼
               ┌─────────────────────────────────────┐
               │ TẦNG 3: BUSINESS & ERP RULES        │
               │ (Supplier, Duplicate, PO Matching)  │
               └──────────────────┬──────────────────┘
                                  │
                                  ▼
                     DRAFT GOODS RECEIPT
```

### 9.1. Tầng 1: Syntax Validation (Zod)

- Định dạng UUID, date regex `YYYY-MM-DD`.
- Kiểm tra miền giá trị: $\text{weight} > 0$, $\text{package\_count} \ge 1$.

### 9.2. Tầng 2: 8-Level Mathematical Integrity Verification

Hệ thống tính toán `calculated_net_weight_kg = gross_weight_kg - tare_weight_kg` và áp dụng dung sai linh hoạt từ cấu hình doanh nghiệp:

```yaml
weight_validation:
  scale_precision_kg: 0.10 # Bước nhảy cân bàn
  document_tolerance_kg: 0.15 # Sai số cho phép trên tổng phiếu
  package_tolerance_kg: 0.05 # Sai số cho phép trên từng bao
```

| Cấp độ      | Tên quy tắc toán học    | Công thức kiểm tra                                                                 | Hành vi khi vi phạm            |
| :---------- | :---------------------- | :--------------------------------------------------------------------------------- | :----------------------------- |
| **Level 1** | Summary Net Consistency | $\mid (\text{Gross} - \text{Tare}) - \text{DeclaredNet} \mid \le \text{tolerance}$ | Bật cờ `MATH_DISCREPANCY` (Đỏ) |
| **Level 2** | Sum of Package Nets     | $\mid \sum \text{pkg.net} - \text{Summary.DeclaredNet} \mid \le \text{tolerance}$  | Cảnh báo sai tổng kiện         |
| **Level 3** | Sum of Package Gross    | $\mid \sum \text{pkg.gross} - \text{Summary.Gross} \mid \le \text{tolerance}$      | Cảnh báo sai gộp               |
| **Level 4** | Sum of Package Tares    | $\mid \sum \text{pkg.tare} - \text{Summary.Tare} \mid \le \text{tolerance}$        | Cảnh báo sai bì                |
| **Level 5** | Package Count Match     | $\text{count}(\text{packages}) == \text{summary.package\_count}$                   | Báo thiếu kiện trong danh sách |
| **Level 6** | Unique Package Index    | $\text{unique}(\text{package\_index}) == \text{length}$                            | Báo trùng lặp dòng kiện        |
| **Level 7** | Non-negative Bounds     | $\text{Gross} \ge \text{Net} > 0$ và $\text{Tare} \ge 0$                           | Từ chối bản ghi phi lý         |
| **Level 8** | Cone Count Integrity    | $\sum \text{pkg.cone\_count} == \text{summary.cone\_count}$ (nếu có)               | Cảnh báo kiểm đếm búp sợi      |

### 9.3. Tầng 3: Business & ERP Validation

#### A. Thuật toán Ghép Nhà Cung Cấp Xác Định (Deterministic Supplier Matcher)

Python **chỉ đọc** `supplier_raw_name`. Việc ghép nhà cung cấp do Hono thực hiện với cơ chế xếp hạng ứng viên (Candidate Ranking):

1. **Bước 1: Chuẩn hóa xâu (Normalization):** Bỏ dấu tiếng Việt, loại bỏ tiền tố công ty (`CÔNG TY`, `CP`, `TNHH`, `TỔNG CÔNG TY`).
2. **Bước 2: Exact Alias Match:** Khớp với bảng phụ `supplier_aliases` trong DB (ví dụ: _"DỆT ĐÔNG NAM"_ ➔ `sup_dongnam_01`).
3. **Bước 3: Fuzzy Scoring (Levenshtein + Token Sort Ratio):**
   - Nếu `Candidate #1 Score >= 92%` VÀ `(Score #1 - Score #2) >= 10%`: Tự động gắn đề xuất `matched_supplier_id`.
   - Nếu `Score #1` và `Score #2` chênh lệch $< 5\%$ (ví dụ: _"Đông Nam"_ 94% vs _"Đông Nam Á"_ 92%): **BẮT BUỘC ĐỂ TRỐNG** và hiển thị danh sách để con người chọn thủ công.

#### B. Cơ Chế Chống Trùng Lặp Chứng Từ (Duplicate Document Guard)

1. **Image Hash Check:** Tính `image_hash = SHA256(raw_bytes)`. Nếu trùng với ảnh đã quét trong 30 ngày ➔ Cảnh báo `POSSIBLE_DUPLICATE_IMAGE`.
2. **Document Signature Check:** Truy vấn trong DB theo bộ 3:
   $$(\text{supplier\_id}, \text{document\_number}, \text{document\_date})$$
   Nếu đã tồn tại trong `yarn_receipts` ➔ Bật cờ cảnh báo `DUPLICATE_RECEIPT_NUMBER` (ngăn chặn nhập 2 lần cùng một phiếu cân).

---

## 10. Tiêu Chí Tin Cậy Theo Trường (Field-Specific Confidence Policy)

Không sử dụng một ngưỡng trung bình chung. Các trường được phân hạng kiểm duyệt nghiêm ngặt:

| Hạng mục          | Danh sách các trường                                                                                 | Ngưỡng tin cậy bắt buộc | Hành động khi dưới ngưỡng                                                   |
| :---------------- | :--------------------------------------------------------------------------------------------------- | :---------------------- | :-------------------------------------------------------------------------- |
| **Critical**      | `supplier`, `document_number`, `document_date`, `gross_weight`, `tare_weight`, `declared_net_weight` | **$\ge 0.95$**          | Tự động bật `needs_manual_review = true`, viền vàng/cam cảnh báo tại ô nhập |
| **Important**     | `yarn_type`, `yarn_lot`, `package_count`, `vehicle_plate`                                            | **$\ge 0.85$**          | Gắn nhãn khuyến cáo kiểm tra                                                |
| **Informational** | `cone_count`, `notes`, `destination`                                                                 | **$\ge 0.70$**          | Chấp nhận giá trị dự phòng                                                  |

---

## 11. Thiết Kế Giao Diện: Mobile-First "Scan Workspace"

Không đóng khung trong một Modal chật hẹp. Giao diện được thiết kế chuyên biệt cho thủ kho cầm thiết bị di động tại trạm cân xưởng:

### 11.1. Luồng Thao Tác 3 Bước

```text
[Màn hình 1: Chụp/Tải ảnh] ──► [Màn hình 2: Quét & Đối chiếu] ──► [Màn hình 3: Hoàn tất]
- Live camera viewport        - 2 Cột song song:             - Sinh phiếu nhập #GR-xxx
- Hướng dẫn căn khung vuông    + Ảnh gốc (Zoom/Pan)           - In mã vạch kiện sợi
- Nút bấm chụp nhanh           + Form dữ liệu bóc tách        - Cập nhật tồn kho
                               - Trạng thái màu trực quan:
                                 🟢 Xanh: Khớp 100%
                                 🟡 Vàng: Cần đối chiếu
                                 🔴 Đỏ: Lỗi toán học
```

### 11.2. Trạng Thái Thị Giác Chuẩn Enterprise (UI States)

- **Neutral (Bình thường):** Dữ liệu tin cậy cao, phép tính chuẩn xác.
- **Warning (Cảnh báo - Viền vàng hổ phách):** Độ tin cậy $< 0.95$ hoặc nhà cung cấp ghép mờ. Thủ kho chạm vào ô để xem vùng cắt ảnh phóng to tương ứng.
- **Error (Lỗi nghiêm trọng - Viền đỏ):** Phát hiện sai số cân gộp trừ bì lệch cân tịnh, hoặc trùng lặp số phiếu. **Nút "Duyệt Nhập Kho" bị vô hiệu hóa** cho đến khi thủ kho sửa lại số đúng thực tế.

---

## 12. Đặc Tả API Contracts

### 12.1. Hono BFF Endpoint (Client gọi)

- **URL:** `POST /api/v1/yarn-receipts/scan`
- **Auth:** Bearer JWT (Role: `warehouse`, `admin`, `manager`)
- **Body:** `multipart/form-data` (field: `file`)
- **Response `202 Accepted`:**
  ```json
  {
    "job_id": "8fa8d36b-5c21-4f0b-99d1-81f123456789",
    "status": "EXTRACTED",
    "data": { ... },
    "validation": {
      "passed": false,
      "reasons": ["MATH_DISCREPANCY: Net weight is off by 0.2kg"]
    }
  }
  ```

### 12.2. Python Microservice Endpoint (Nội bộ VPS)

- **URL:** `POST http://127.0.0.1:8000/internal/v1/vision/yarn-slip`
- **Headers:** `X-Internal-Service-Key: <SECRET>`, `X-Correlation-ID: req_01J...`
- **Healthchecks:**
  - `GET /health`: Liveness probe (trả về `{ "status": "ok" }`).
  - `GET /ready`: Readiness probe (kiểm tra kết nối Gemini API / mô hình PaddleOCR sẵn sàng).

---

## 13. Kế Hoạch Triển Khai Thực Tế 7 Giai Đoạn (Phased Roadmap)

```text
PHASE 0: Dataset & Ground Truth Benchmark (30 - 50 mẫu thực tế)
   ↓
   ├── Benchmark không đạt ➔ Tinh chỉnh Prompt / Quality Filter / Preprocessing
   └── Benchmark đạt tiêu chuẩn
        ↓
PHASE 1: Python Core Vision Engine (Clean Architecture: VisionProvider Adapter)
   ↓
PHASE 2: FastAPI Microservice (Health/Ready, Internal Secret Auth, systemd / Docker)
   ↓
PHASE 3: Hono BFF Integration (Auth, Audit, 3-Tier Validation, Supplier Matcher)
   ↓
PHASE 4: Domain Transaction Integration (Draft Goods Receipt & Stock Movement)
   ↓
PHASE 5: React Mobile-First "Scan Workspace" UI
   ↓
PHASE 6: Production Hardening (Duplicate Guard, PaddleOCR fallback, Accuracy Telemetry)
```

---

### 13.1. Chi Tiết Phase 0 — Dataset & Ground Truth Benchmark Contract

> [!IMPORTANT]
> **Nguyên tắc tiên quyết:** Tuyệt đối **không viết code Engine** khi chưa có Dataset thực tế và Ground Truth được con người xác thực. Engine phải được xây dựng dựa trên đặc thù chứng từ thực tế của Vĩnh Phát, không dựa trên các giả định lý thuyết.

#### 1. Cấu Trúc Lưu Trữ Dataset

```text
datasets/
  yarn-slip/
    v1/
      images/
        YS-0001.jpg
        YS-0002.jpg
        ...
      ground-truth/
        YS-0001.json
        YS-0002.json
        ...
      manifest.json
      LABELING_GUIDE.md
```

#### 2. Phân Bổ 40 Mẫu Thực Tế Theo 10 Danh Mục Khắc Nghiệt:

| Danh mục                | Số mẫu | Mục đích kiểm thử                                     |
| :---------------------- | :----- | :---------------------------------------------------- |
| `dot_matrix_clear`      | 5      | Khả năng đọc font in kim chuẩn giấy than 3 liên       |
| `dot_matrix_faded`      | 5      | Thử thách mực in kim mờ, đứt đoạn pixel               |
| `thermal_print`         | 5      | Phiếu in nhiệt khổ nhỏ trạm cân xe tải                |
| `handwritten_clear`     | 5      | Nét chữ viết tay chuẩn của thủ kho                    |
| `handwritten_difficult` | 5      | Chữ viết tay tháu, dễ nhầm lẫn số (0 vs 6, 1 vs 7)    |
| `skewed_distorted`      | 3      | Kiểm thử thuật toán nắn phẳng góc nghiêng (Deskew)    |
| `poor_glare_lighting`   | 3      | Kiểm thử bộ cân bằng sáng CLAHE khi bị bóng / lóa đèn |
| `crossed_corrected`     | 3      | Phát hiện và xử lý số bị gạch đè chỉnh sửa            |
| `multi_row_table`       | 3      | Bóc tách chính xác bảng 20–30 kiện không bị lệch dòng |
| `abnormal_discrepancy`  | 3      | Xác nhận hệ thống bắt được sai số toán học thực tế    |
| **Tổng cộng**           | **40** | **Đủ độ đa dạng cho Production Benchmark**            |

#### 3. Tiêu Chuẩn Nghiệm Thu Benchmark (Acceptance Criteria):

- **Độ chính xác từng trường cốt lõi (Field Accuracy):**
  - Tên Nhà Cung Cấp (`supplier`): $\ge 98.0\%$
  - Số Phiếu Cân (`document_number`): $\ge 98.0\%$
  - Ngày Chứng Từ (`document_date`): $\ge 98.0\%$
  - Khối lượng gộp (`gross_weight`): $\ge 98.0\%$
  - Khối lượng bì (`tare_weight`): $\ge 98.0\%$
  - Khối lượng tịnh (`net_weight`): $\ge 99.0\%$
- **Độ chính xác toàn phiếu (Document-Level Accuracy):** $\ge 95.0\%$
- **Tỷ lệ phê duyệt sai tự động (False Auto-Approval Rate - FAAR):** **$\mathbf{0.0\%}$**
  > **Bảo vệ rủi ro:** Nếu AI trích xuất sai bất kỳ trường trọng yếu nào hoặc phát hiện sai số toán học, hệ thống **bắt buộc phải bật `needs_manual_review = true`**. Thà bắt thủ kho kiểm tra tay 10% số phiếu còn hơn để 1 phiếu sai lọt tự động vào tồn kho ERP.
- **Hiệu năng xử lý:** $P50 < 2.5\text{ s}$, $P95 < 5.0\text{ s}$.

---

### 13.2. Chi Tiết Phase 1 — Kiến Trúc Module Python (Clean Architecture)

Để tránh một file khổng lồ `ocr_engine.py` khó bảo trì, tầng Core Vision Engine được tổ chức theo chuẩn Clean Architecture:

```text
server/python/
└── vision/
    ├── __init__.py
    ├── config.py              # Biến môi trường, threshold, tolerances
    ├── schemas.py             # Pydantic DTOs (Syntax Validity)
    ├── exceptions.py          # Custom domain exceptions
    │
    ├── image/
    │   ├── quality.py         # Gate 0: Laplacian variance blur & brightness check
    │   ├── preprocess.py      # OpenCV Deskew, Auto-crop, CLAHE
    │   └── geometry.py        # Bounding box & perspective math
    │
    ├── extraction/
    │   ├── base.py            # VisionProvider (Abstract Base Class - Adapter Interface)
    │   ├── gemini.py          # GeminiVisionProvider (Primary implementation)
    │   └── paddle.py          # PaddleOCRProvider (Phase 2 fallback implementation)
    │
    ├── validation/
    │   ├── schema.py          # Pydantic schema validation
    │   ├── weights.py         # 8-Level Math integrity validation engine
    │   └── confidence.py      # Field-level & document-level confidence evaluator
    │
    └── pipeline.py            # DocumentIntelligencePipeline (Orchestrator)
```

#### Nguyên Tắc Adapter (VisionProvider Pattern):

`pipeline.py` **không bao giờ gọi trực tiếp SDK `google.genai`**. Pipeline chỉ phụ thuộc vào interface trừu tượng `VisionProvider`:

```python
class VisionProvider(ABC):
    @abstractmethod
    async def extract(self, image_bytes: bytes, mime_type: str) -> RawExtractionResult:
        """Trích xuất dữ liệu từ ảnh - độc lập hoàn toàn với nhà cung cấp AI."""
        pass
```

Nhờ đó, sau này việc thay đổi Gemini sang Claude Vision, OpenAI, hoặc PaddleOCR hoàn toàn trong suốt với toàn bộ hệ thống ERP.
