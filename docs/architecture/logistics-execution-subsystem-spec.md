# 📦 KIẾN TRÚC HỆ THỐNG THỰC THI GIAO VẬN (LOGISTICS EXECUTION SUBSYSTEM & ePOD)

## 🛡️ LES ARCHITECTURE GUARD & TECHNICAL SPECIFICATION (SRS v2.1)

**Hệ thống:** VinhPhatERP (Dệt may & Phụ liệu Vĩnh Phát)  
**Tài liệu:** Production Architecture Guard & Engineering Specification (SRS)  
**Phiên bản:** 2.1 (Enterprise MES / Logistics Tier — Production Grade)  
**Trạng thái:** ACTIVE / FROZEN BASELINE  
**Tác giả:** Tech Lead & Core Architecture Guard  
**Ngày phát hành:** 2026-08-29

---

## 1. TỔNG QUAN & NGUYÊN TẮC THIẾT KẾ (EXECUTIVE SUMMARY)

### 1.1. Sứ mệnh

Nâng cấp toàn bộ luồng giao vận từ một tính năng UI đơn lẻ (_"Driver Portal"_) thành một **Hệ thống Thực thi Giao vận Chặng cuối (Logistics Execution Subsystem - LES)** chuẩn ERP/MES công nghiệp.

Hệ thống quản trị toàn diện vòng đời thực thi giao hàng dệt may: từ lúc xuất kho, lập kế hoạch lộ trình, quản lý phân bổ xe/tài xế, thực thi từng chặng dừng (Delivery Stop), xử lý các lần giao (Delivery Attempt), quản lý ngoại lệ sự cố, cho đến thu thập **Bằng chứng Giao nhận Điện tử (ePOD - Electronic Proof of Delivery)** có chữ ký điện tử, tọa độ GPS và chuỗi băm bảo toàn tính toàn vẹn bằng chứng (Evidence Integrity Hash Chain).

### 1.2. Bảng Chuẩn Hóa Thuật Ngữ Nghiệp Vụ (Domain Terminology)

| Thuật ngữ cũ (UI-centric)    | Thuật ngữ chuẩn v2.1 (Domain-Driven)      | Ý nghĩa nghiệp vụ                                                                 |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| Driver Portal                | **Field Execution / Driver App**          | Bề mặt thao tác di động của tài xế ngoài hiện trường.                             |
| Journey                      | **Delivery Stop & Delivery Attempt**      | Chặng dừng giao hàng và lần thực hiện giao hàng cụ thể.                           |
| Journey Event                | **Domain Event / Journey Event**          | Sự kiện nghiệp vụ bất biến được lưu vào Transactional Outbox.                     |
| Chữ ký số                    | **Electronic Signature (Chữ ký điện tử)** | Chữ ký vẽ tay trên màn hình cảm ứng (không phải PKI/Certificate).                 |
| Signature URL / Photos JSONB | **Evidence Assets**                       | Tài nguyên bằng chứng độc lập có metadata, GPS và mã băm SHA-256.                 |
| Exception Hold               | **Delivery Exception (State riêng)**      | Ngoại lệ giao nhận có vòng đời xử lý độc lập với State Machine của chuyến xe.     |
| `shipment.status`            | **Current Status Projection**             | Trạng thái đọc (Read Model), suy dẫn từ các Stop & Attempt Events.                |
| Trigger → Chat               | **Domain Event → Projection**             | Chat và Push là người tiêu thụ sự kiện (Event Consumers), không sở hữu nghiệp vụ. |
| Global FIFO Sync             | **Per-Aggregate Ordered Sync**            | Đồng bộ ngoại tuyến tuần tự theo từng đơn hàng, không block chéo.                 |
| ePOD Immutable               | **Evidence Integrity & Hash Chain**       | Bảo toàn bằng chứng bằng chuỗi mã băm SHA-256 nối tiếp.                           |

---

## 2. MIỀN NGHIỆP VỤ & PHÂN CẤP THỰC THỂ (DOMAIN ENTITY HIERARCHY)

Mô hình phân cấp thực thể giải quyết triệt để bài toán giao nhiều điểm (Multi-stop Route), giao lại (Re-delivery), giao một phần (Partial Delivery), đổi tài xế/xe giữa chuyến và chuyển hoàn về xưởng:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LOGISTICS EXECUTION DOMAIN                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [ SALES ORDER / WAREHOUSE ]                                               │
│            │                                                                │
│            ▼                                                                │
│   [ SHIPMENT ] (Chứng từ xuất kho & Danh mục kiện/cuộn vải)                 │
│            │                                                                │
│            ▼                                                                │
│   [ DELIVERY ORDER / ROUTE ] (Lộ trình vận chuyển tổng thể)                 │
│            │                                                                │
│            ├── 1. DRIVER ASSIGNMENT (Ai giao? Xe nào? Đơn vị ngoài hay nhà?)│
│            │        ├── Driver Identity (Employee / 3PL Carrier)            │
│            │        ├── Vehicle Info (Biển số xe, tải trọng)                │
│            │        └── Assignment History & Re-dispatch Audit              │
│            │                                                                │
│            └── 2. DELIVERY STOP (Điểm giao hàng cụ thể #1, #2, #N)          │
│                     │                                                       │
│                     ├── Customer / Delivery Address & Contact               │
│                     ├── Target Items (Danh sách cuộn vải giao tại Stop này) │
│                     │                                                       │
│                     └── 3. DELIVERY ATTEMPTS (Lần thực hiện giao #1, #2...) │
│                              │                                              │
│                              ├── Journey State Machine                      │
│                              │     (PENDING_PICKUP ➔ ARRIVED ➔ DELIVERED)   │
│                              │                                              │
│                              ├── 4. ePOD EVIDENCE ASSETS                    │
│                              │     ├── Receiver Identity (Tên, SĐT)         │
│                              │     ├── Electronic Signature Asset           │
│                              │     ├── Evidence Photo Assets                │
│                              │     ├── Telemetry (Lat, Lng, Accuracy, Time) │
│                              │     └── SHA-256 Evidence Hash Chain          │
│                              │                                              │
│                              └── 5. DELIVERY EXCEPTIONS                     │
│                                    ├── Exception Type & Reason Detail       │
│                                    ├── Exception State (OPEN ➔ RESOLVED)    │
│                                    └── Resolution (RETRY / RETURN_WAREHOUSE)│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. STATE MACHINES & TERMINAL STATES

### 3.1. Delivery Attempt State Machine

Mỗi lần giao hàng (`Delivery Attempt`) tuân thủ nghiêm ngặt cỗ máy trạng thái với các Terminal States rõ ràng:

```text
                    ┌─────────────────────────┐
                    │        ASSIGNED         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     PENDING_PICKUP      │
                    └────────────┬────────────┘
                                 │ (Tài xế xác nhận nhận hàng tại kho)
                                 ▼
                    ┌─────────────────────────┐
                    │        PICKED_UP        │
                    └────────────┬────────────┘
                                 │ (Xe bắt đầu di chuyển)
                                 ▼
                    ┌─────────────────────────┐
                    │       IN_TRANSIT        │ ◄─────────────────────────┐
                    └────────────┬────────────┘                           │
                                 │                                        │
                    ┌────────────┴────────────┐                           │
                    ▼                         ▼                           │
        ┌───────────────────────┐ ┌───────────────────────┐               │
        │        ARRIVED        │ │   DELIVERY_EXCEPTION  │               │
        └───────────┬───────────┘ └───────────┬───────────┘               │
                    │                         │ (Khách hẹn lại giờ)       │
             ┌──────┴──────┐                  └───────────────────────────┤
             ▼             ▼                                              │
┌───────────────────────┐ ┌───────────────────────┐                       │
│       DELIVERED       │ │     FAILED_ATTEMPT    │ ──────────────────────┘
└───────────┬───────────┘ └───────────┬───────────┘
            │                         │
            ▼                         ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│     [ COMPLETED ]     │ │     [ RETURNED ]      │ │     [ CANCELLED ]     │
│   (Terminal State)    │ │   (Terminal State)    │ │   (Terminal State)    │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

### 3.2. Bảng Chuyển Trạng Thái & Điều Kiện Kiểm Tra (Transitions & Concurrency Guards)

| Trạng thái hiện tại    | Sự kiện kích hoạt  | Trạng thái tiếp theo | Concurrency Guard & Điều kiện kiểm tra                                            |
| ---------------------- | ------------------ | -------------------- | --------------------------------------------------------------------------------- |
| `assigned`             | `ACCEPT_DISPATCH`  | `pending_pickup`     | `expected_state = 'assigned'` AND `actor_id = assigned_driver_id`.                |
| `pending_pickup`       | `CONFIRM_PICKUP`   | `picked_up`          | `expected_state = 'pending_pickup'` AND Kiểm đếm đủ số cuộn vải.                  |
| `picked_up`            | `START_TRANSIT`    | `in_transit`         | `expected_state = 'picked_up'` AND Ghi nhận GPS xuất phát.                        |
| `in_transit`           | `REPORT_ARRIVED`   | `arrived`            | `expected_state = 'in_transit'` AND Tọa độ GPS cách điểm giao ≤ 500m.             |
| `arrived`              | `SUBMIT_EPOD`      | `delivered`          | `expected_state = 'arrived'` AND Bắt buộc có: Chữ ký + ≥ 1 ảnh + Tên người nhận.  |
| `arrived`              | `REPORT_EXCEPTION` | `failed_attempt`     | `expected_state = 'arrived'` AND Mở bản ghi `Delivery Exception` (status=`OPEN`). |
| `delivered`            | `VERIFY_COMPLETE`  | `completed`          | Toàn bộ Stops thuộc Route đã giao thành công.                                     |
| `failed_attempt`       | `RETURN_WAREHOUSE` | `returned`           | Hàng đã nhập kho hoàn trả tại Vĩnh Phát.                                          |
| Bất kỳ state chưa giao | `CANCEL_DISPATCH`  | `cancelled`          | Chỉ Quản trị viên/Điều phối có quyền hủy.                                         |

---

## 4. TÍNH TOÀN VẸN DỮ LIỆU & BẢO VỆ CONCURRENCY (IDEMPOTENCY & INTEGRITY)

### 4.1. Nguyên Tắc Idempotency Bắt Buộc (P0 Requirement)

Mọi lệnh (`Command`) phát đi từ thiết bị di động của tài xế bắt buộc phải kèm theo một `command_id` (UUIDv4 hoặc ULID) được sinh ra tại Client trước khi gửi request.

```text
Mobile Client (Tài xế bấm "Xác nhận giao")
  │
  ├── 1. Sinh command_id: "01J9X8K2..."
  ├── 2. Gọi RPC: rpc_submit_delivery_epod(..., command_id)
  │
  ▼
Database Layer
  ├── Kiểm tra bảng `logistics_command_idempotency`
  ├── Nếu command_id ĐÃ TỒN TẠI ➔ Trả về ngay kết quả đã xử lý (NO-OP, HTTP 200)
  └── Nếu command_id CHƯA TỒN TẠI:
        ├── Ghi nhận command_id trong cùng Transaction
        ├── Xử lý cập nhật State & Bằng chứng ePOD
        └── Ghi Transactional Outbox Event
```

### 4.2. Concurrency Control (Optimistic Concurrency Guard)

Ngăn chặn triệt để xung đột khi Admin trên Web và Tài xế trên Mobile cùng cập nhật một chuyến hàng:

```sql
-- Ví dụ mẫu Concurrency Guard trong RPC
UPDATE public.delivery_attempts
SET
  state = p_target_state,
  updated_at = NOW()
WHERE id = p_attempt_id
  AND state = p_expected_state; -- Concurrency Guard

IF NOT FOUND THEN
  RAISE EXCEPTION 'CONCURRENCY_CONFLICT: Trạng thái hiện tại không khớp với kỳ vọng (expected=%)', p_expected_state;
END IF;
```

### 4.3. Bảo Toàn Bằng Chứng Pháp Lý Bằng Chuỗi Mã Băm (Evidence Hash Chain)

Mỗi bản ghi `shipment_epod_evidences` được gắn mã băm SHA-256 bất biến tính toán từ toàn bộ dữ liệu bằng chứng và nối tiếp với bằng chứng trước đó:

$$\text{EvidenceHash} = \text{SHA-256}(\text{AttemptID} + \text{ReceiverName} + \text{SignatureHash} + \text{PhotosHashes} + \text{GPS} + \text{Timestamp} + \text{PrevHash})$$

Điều này đảm bảo không một ai (kể cả Database Administrator) có thể chỉnh sửa dữ liệu chữ ký hoặc ảnh giao hàng trong quá khứ mà không làm đứt gãy chuỗi băm.

---

## 5. THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN PRODUCTION (DATABASE DDL)

### 5.1. Bảng Quản Lý Idempotency (`public.logistics_command_idempotency`)

```sql
CREATE TABLE public.logistics_command_idempotency (
  command_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  command_name VARCHAR(100) NOT NULL,
  aggregate_id UUID NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_command_idempotency_lookup ON public.logistics_command_idempotency(tenant_id, command_name, aggregate_id);
```

### 5.2. Bảng Chặng Dừng Giao Hàng (`public.delivery_stops`)

```sql
CREATE TABLE public.delivery_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  stop_sequence INTEGER NOT NULL DEFAULT 1,            -- Thứ tự giao: 1, 2, 3...
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  delivery_address TEXT NOT NULL,
  contact_person VARCHAR(150),
  contact_phone VARCHAR(20),
  target_items JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{ item_id, roll_code, quantity, unit }]
  status VARCHAR(30) NOT NULL DEFAULT 'pending',       -- 'pending', 'in_progress', 'delivered', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_stops_shipment ON public.delivery_stops(shipment_id, stop_sequence);
```

### 5.3. Bảng Lần Giao Hàng & Hành Trình (`public.delivery_attempts`)

```sql
CREATE TABLE public.delivery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  stop_id UUID NOT NULL REFERENCES public.delivery_stops(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,           -- Lần giao thứ: 1, 2...
  driver_id UUID REFERENCES public.profiles(id),
  vehicle_plate VARCHAR(20),
  state VARCHAR(30) NOT NULL DEFAULT 'assigned',       -- 'assigned', 'pending_pickup', 'picked_up', 'in_transit', 'arrived', 'delivered', 'failed_attempt', 'completed', 'returned', 'cancelled'
  correlation_id VARCHAR(100) NOT NULL,                -- Mã luồng giao vận (VD: 'DELIVERY-2026-0829-001')
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_attempts_lookup ON public.delivery_attempts(stop_id, attempt_number, state);
```

### 5.4. Bảng Bằng Chứng Bất Biến (`public.shipment_epod_evidences`) & Assets

```sql
CREATE TABLE public.shipment_epod_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  attempt_id UUID NOT NULL REFERENCES public.delivery_attempts(id) ON DELETE CASCADE,
  receiver_name VARCHAR(150) NOT NULL,
  receiver_phone VARCHAR(20),
  receiver_identity_type VARCHAR(20),                  -- 'cccd', 'driver_license', 'employee_badge' (Optional)
  receiver_identity_value VARCHAR(50),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  accuracy_meters NUMERIC(6, 2),
  device_id VARCHAR(100) NOT NULL,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence_hash VARCHAR(64) NOT NULL,                  -- SHA-256 Hash bảo toàn tính toàn vẹn
  previous_evidence_hash VARCHAR(64),                  -- Nối chuỗi bằng chứng trước đó
  verification_status VARCHAR(20) DEFAULT 'verified',  -- 'verified', 'disputed'
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_epod_attempt ON public.shipment_epod_evidences(attempt_id);

-- Bảng lưu trữ từng asset bằng chứng (chữ ký, ảnh toàn cảnh, ảnh tem mác)
CREATE TABLE public.epod_evidence_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  evidence_id UUID NOT NULL REFERENCES public.shipment_epod_evidences(id) ON DELETE CASCADE,
  asset_type VARCHAR(30) NOT NULL,                     -- 'electronic_signature', 'goods_overview', 'roll_label', 'defect_proof'
  storage_path TEXT NOT NULL,                          -- Path trong Supabase Storage Bucket 'epod-evidence'
  file_size_bytes INTEGER NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,                   -- SHA-256 của file ảnh gốc
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  telemetry_lat NUMERIC(10, 7),
  telemetry_lng NUMERIC(10, 7),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_evidence_assets ON public.epod_evidence_assets(evidence_id, asset_type);
```

### 5.5. Bảng Ngoại Lệ Giao Nhận (`public.delivery_exceptions`)

```sql
CREATE TABLE public.delivery_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  attempt_id UUID NOT NULL REFERENCES public.delivery_attempts(id) ON DELETE CASCADE,
  exception_type VARCHAR(50) NOT NULL,                 -- 'CUSTOMER_ABSENT', 'WRONG_ADDRESS', 'REJECTED_DEFECT', 'FORCE_MAJEURE'
  reason_detail TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',          -- 'OPEN', 'RESOLVED', 'ABANDONED'
  reported_by UUID NOT NULL REFERENCES public.profiles(id),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolution_action VARCHAR(50),                       -- 'RETRY_NEXT_DAY', 'RETURN_WAREHOUSE', 'REDISPATCH'
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ
);
```

### 5.6. Bảng Transactional Outbox Events (`public.logistics_outbox_events`)

```sql
CREATE TABLE public.logistics_outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  event_type VARCHAR(100) NOT NULL,                    -- 'DELIVERY.ATTEMPT_STARTED', 'DELIVERY.EPOD_SUBMITTED', 'DELIVERY.EXCEPTION_OCCURRED'
  aggregate_type VARCHAR(50) NOT NULL,                 -- 'delivery_attempt', 'shipment', 'epod'
  aggregate_id UUID NOT NULL,
  correlation_id VARCHAR(100) NOT NULL,
  causation_id UUID,                                   -- command_id hoặc event_id gây ra sự kiện này
  schema_version INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',       -- 'pending', 'dispatched', 'failed'
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dispatched_at TIMESTAMPTZ
);

CREATE INDEX idx_logistics_outbox_pending ON public.logistics_outbox_events(status, created_at ASC);
```

---

## 6. KIẾN TRÚC EVENT-DRIVEN & TRANSACTIONAL OUTBOX (EDA ENVELOPE)

### 6.1. Cấu Trúc Chuẩn Của Event Envelope

Mọi sự kiện Domain Event được phát tán tuân thủ định dạng chuẩn sau:

```typescript
export interface DomainEventEnvelope<T = Record<string, unknown>> {
  event_id: string; // UUID duy nhất của sự kiện
  event_type: string; // e.g. 'DELIVERY.EPOD_SUBMITTED'
  aggregate_type: 'shipment' | 'delivery_stop' | 'delivery_attempt';
  aggregate_id: string; // ID của thực thể
  tenant_id: string;
  actor_id: string; // ID người thực hiện hành động
  occurred_at: string; // ISO 8601 Timestamp
  correlation_id: string; // Trace ID toàn chuỗi
  causation_id: string; // Command ID gây ra event này
  schema_version: number; // e.g. 1
  payload: T; // Dữ liệu nghiệp vụ chi tiết
}
```

### 6.2. Luồng Xử Lý Transactional Outbox (Guaranteed Delivery)

```text
               Tài xế bấm hoàn tất ký ePOD
                            │
                            ▼
              ┌───────────────────────────┐
              │ DATABASE ATOMIC TX        │
              │ 1. Check Idempotency Key  │
              │ 2. Insert EPOD Evidence   │
              │ 3. Update Attempt = DELIV │
              │ 4. Insert OUTBOX EVENT    │
              └─────────────┬─────────────┘
                            │ (Commit thành công)
                            ▼
              ┌───────────────────────────┐
              │ OUTBOX EVENT DISPATCHER   │
              │ (pg_net / Edge Worker)    │
              └─────────────┬─────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ CHAT CHANNEL │     │ WEB PUSH     │     │ ACCOUNTING   │
│ PROJECTION   │     │ DISPATCHER   │     │ CONNECTOR    │
│              │     │              │     │              │
│ Tạo tin nhắn │     │ Bắn Push Lock│     │ Đánh dấu đơn │
│ banner xanh  │     │ Screen cho   │     │ hàng sẵn sàng│
│ trong Chat   │     │ Khách hàng   │     │ xuất Hóa đơn │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 7. CHIẾN LƯỢC NGOẠI TUYẾN (PER-AGGREGATE ORDERED OFFLINE SYNC)

### 7.1. Cấu Trúc IndexedDB Outbox Tại Client

Client duy trì hàng đợi ngoại tuyến lưu trữ từng command độc lập:

```typescript
export interface OfflineOutboxItem {
  id: string; // Local IndexedDB Key
  command_id: string; // UUID sinh tại client
  aggregate_type: string; // 'delivery_attempt'
  aggregate_id: string; // ID của chuyến hàng
  command_type: string; // 'CONFIRM_PICKUP' | 'REPORT_ARRIVED' | 'SUBMIT_EPOD'
  payload: Record<string, unknown>;
  created_at: string;
  attempt_count: number;
  last_error?: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  synced_at?: string;
}
```

### 7.2. Đồng Bộ Tuần Tự Theo Từng Đơn Hàng (Per-Aggregate Ordering)

- **Quy tắc:** Các lệnh thuộc **cùng một `aggregate_id`** bắt buộc phải được gửi tuần tự theo thời gian (`created_at ASC`). Nếu một lệnh gặp lỗi (e.g. timeout), các lệnh tiếp theo của đơn hàng đó sẽ tạm hoãn để bảo toàn tính logic của State Machine.
- Các đơn hàng khác nhau (`Aggregate A`, `Aggregate B`) được phép đồng bộ song song độc lập, không block lẫn nhau.

---

## 8. ĐỐI SOÁT & TỰ ĐỘNG PHÁT HIỆN LỖI (LOGISTICS RECONCILIATION ENGINE)

Hệ thống bổ sung tiến trình **Reconciliation Job** chạy định kỳ (hoặc kích hoạt theo yêu cầu) để phát hiện và cảnh báo các bất thường (Invariant Violations):

| Điều kiện bất thường (Invariant Violation)                                                          | Mức độ nghiêm trọng | Hành động tự động sửa đổi / Cảnh báo                                                  |
| --------------------------------------------------------------------------------------------------- | :-----------------: | ------------------------------------------------------------------------------------- |
| `delivery_attempts.state = 'delivered'` nhưng không có bản ghi `shipment_epod_evidences` tương ứng. |   🔴 **CRITICAL**   | Đổi trạng thái attempt thành `investigating`, gửi cảnh báo tới Trưởng nhóm Logistics. |
| `shipments.status = 'delivered'` nhưng còn Stop chưa hoàn tất.                                      |   🔴 **CRITICAL**   | Tự động hạ trạng thái Shipment về `partially_delivered`.                              |
| Outbox event có `status = 'pending'` quá 15 phút không được dispatch.                               |   🟡 **WARNING**    | Tự động kích hoạt Edge Function Dispatcher re-try với Exponential Backoff.            |
| Sự kiện Chat thiếu liên kết `correlation_id` của chuyến giao.                                       |     🟢 **INFO**     | Bổ sung `correlation_id` vào metadata phòng chat.                                     |

---

## 9. 10 NGUYÊN TẮC BẤT BIẾN (NON-NEGOTIABLE ARCHITECTURE GUARDS)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                 LES ARCHITECTURE GUARD — 10 ĐIỀU TUYỆT ĐỐI                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 01. TUYỆT ĐỐI không cho UI tự quyết định chuyển đổi trạng thái nghiệp vụ.   │
│ 02. TUYỆT ĐỐI không dùng Chat làm nguồn sự thật (Source of Truth) Logistics.│
│ 03. TUYỆT ĐỐI không UPDATE / DELETE dữ liệu bằng chứng pháp lý (ePOD).       │
│ 04. MỌI LỆNH TỪ MOBILE bắt buộc phải có `command_id` để đảm bảo Idempotency.│
│ 05. MỌI STATE TRANSITION bắt buộc phải có Concurrency Guard (`expected`).   │
│ 06. MỌI DOMAIN EVENT bắt buộc phải có Event Envelope chuẩn hóa 10 trường.   │
│ 07. GHI TRANSACTIONAL OUTBOX trong cùng Database Transaction với mutation.  │
│ 08. KHÔNG lưu trữ Asset bằng chứng như một mảng JSONB phẳng không metadata. │
│ 09. KHÔNG đồng nhất Chữ ký điện tử (Electronic Sig) với Chữ ký số (PKI).    │
│ 10. TẤT CẢ AGGREGATES bắt buộc phải hỗ trợ Reconciliation định kỳ.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. LỘ TRÌNH TRIỂN KHAI PHÂN KỲ (PHASED ROADMAP)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   LỘ TRÌNH NÂNG CẤP HỆ THỐNG GIAO VẬN v2.1                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [ PHASE 1: NỀN TẢNG FIELD APP & CHAT REALTIME ] ───────────► [ HOÀN TẤT ]  │
│  - Xây dựng DriverPortal Layout & Shipment Card                             │
│  - Phân định vị trí tin nhắn thông minh (Trái / Phải theo role)             │
│  - Web Push Lock Screen và tối ưu hóa Realtime Chat Zalo-Speed              │
│                                                                             │
│  [ PHASE 2: CORE LES DOMAIN, IDEMPOTENCY & OUTBOX ] ────────► [ KẾ HOẠCH ]  │
│  - Áp dụng Migration DDL v2.1: `delivery_stops`, `delivery_attempts`,       │
│    `shipment_epod_evidences`, `epod_evidence_assets`, `logistics_outbox`    │
│  - Xây dựng RPC `rpc_submit_delivery_epod` với Idempotency & SHA-256 Hash   │
│  - Triển khai Transactional Outbox Dispatcher kết nối Chat & Push           │
│                                                                             │
│  [ PHASE 3: MULTI-STOP ROUTE & EXCEPTION WORKFLOW ] ────────► [ TƯƠNG LAI ] │
│  - Hỗ trợ 1 chuyến xe giao nhiều điểm (Multi-Stop Route)                    │
│  - Quản trị vòng đời Delivery Exceptions (Khách vắng mặt, hoàn hàng xưởng) │
│  - Đồng bộ ngoại tuyến Per-Aggregate IndexedDB Outbox                       │
│                                                                             │
│  [ PHASE 4: RECONCILIATION ENGINE & LIVE TRACKING ] ────────► [ TƯƠNG LAI ] │
│  - Triển khai Background Reconciliation Job tự động quét Invariant Viols   │
│  - Cổng Khách hàng Live Tracking vị trí xe theo thời gian thực              │
│  - Xuất file PDF Biên bản Bàn giao Điện tử có mã băm xác thực pháp lý       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. KẾT LUẬN

Tài liệu Đặc tả Kỹ thuật v2.1 chính thức đóng băng thiết kế kiến trúc cho **Logistics Execution Subsystem**. Mọi mã nguồn phát triển và cơ sở dữ liệu trong các Phase tiếp theo bắt buộc phải tuân thủ nghiêm ngặt 10 Điều Tuyệt Đối của **LES Architecture Guard**.
