# 📋 KẾ HOẠCH MINI TASKS — LOGISTICS EXECUTION SUBSYSTEM (LES v2.1)

**Hệ thống:** VinhPhatERP  
**Tài liệu:** Mini Tasks Execution Plan  
**Tham chiếu kiến trúc:** [docs/architecture/logistics-execution-subsystem-spec.md](file:///d:/VinhPhatERP_v3/docs/architecture/logistics-execution-subsystem-spec.md)  
**Phiên bản:** v2.1 (Enterprise Production Grade)

---

## 🎯 DANH SÁCH SPRINT & MINI TASKS

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   LOGISTICS EXECUTION SUBSYSTEM — 4 SPRINTS                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  SPRINT 1: Database Migration DDL & Core Domain Types (Tầng Nền Tảng)       │
│  SPRINT 2: Backend Atomic RPC, Idempotency & Transactional Outbox (Backend) │
│  SPRINT 3: Client Application Layer, Offline Outbox & Driver UI (Frontend)  │
│  SPRINT 4: Unit Testing, Reconciliation Engine & Verification (Kiểm Thử)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 SPRINT 1: DATABASE MIGRATION DDL & CORE DOMAIN TYPES

### 📌 Task 1.1: Migration DDL v2.1 — Schema & Indexes

- **Mục tiêu:** Tạo các bảng nghiệp vụ cốt lõi theo chuẩn LES v2.1.
- **Tập tin tạo:** `supabase/migrations/20260830000001_logistics_execution_subsystem_v2_1.sql`
- **Nội dung thực hiện:**
  - [ ] Bảng `public.logistics_command_idempotency` (`command_id`, `command_name`, `aggregate_id`).
  - [ ] Bảng `public.delivery_stops` (`shipment_id`, `stop_sequence`, `customer_id`, `target_items`, `status`).
  - [ ] Bảng `public.delivery_attempts` (`stop_id`, `attempt_number`, `driver_id`, `state`, `correlation_id`).
  - [ ] Bảng `public.shipment_epod_evidences` (`attempt_id`, `receiver_name`, `evidence_hash`, `previous_evidence_hash`).
  - [ ] Bảng `public.epod_evidence_assets` (`evidence_id`, `asset_type`, `storage_path`, `content_hash`).
  - [ ] Bảng `public.delivery_exceptions` (`attempt_id`, `exception_type`, `status`, `reason_detail`).
  - [ ] Bảng `public.logistics_outbox_events` (`event_type`, `aggregate_id`, `correlation_id`, `payload`, `status`).
  - [ ] Thiết lập đầy đủ Indexes, RLS Policies (Tài xế chỉ xem/sửa chuyến được giao).
- **Tiêu chí nghiệm thu:** `npx supabase db push` thành công, không lỗi khóa ngoại hoặc syntax.

---

### 📌 Task 1.2: Core Domain Types & State Machine

- **Mục tiêu:** Định nghĩa các TypeScript Domain Models độc lập (Pure TypeScript, không phụ thuộc React/Supabase).
- **Tập tin tạo:**
  - `src/domain/logistics/stop/delivery-stop.types.ts`
  - `src/domain/logistics/attempt/delivery-attempt.types.ts`
  - `src/domain/logistics/attempt/delivery-attempt.state-machine.ts`
  - `src/domain/logistics/epod/epod.types.ts`
  - `src/domain/logistics/epod/epod-hash.ts`
  - `src/domain/logistics/exception/delivery-exception.types.ts`
  - `src/domain/logistics/events/logistics-events.types.ts`
- **Nội dung thực hiện:**
  - [ ] Định nghĩa `DeliveryAttemptState`: `'assigned' | 'pending_pickup' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered' | 'failed_attempt' | 'completed' | 'returned' | 'cancelled'`.
  - [ ] Hàm thuần túy `canTransitionAttemptState(currentState, event)` kiểm tra guards.
  - [ ] Hàm `computeEvidenceHash(payload, previousHash)` tính toán SHA-256.
  - [ ] Định nghĩa `DomainEventEnvelope<T>` 10 trường chuẩn hóa.
- **Tiêu chí nghiệm thu:** 0 lỗi TypeScript, có Unit Test cho State Machine.

---

## ⚡ SPRINT 2: BACKEND ATOMIC RPC, IDEMPOTENCY & TRANSACTIONAL OUTBOX

### 📌 Task 2.1: Atomic RPCs với Idempotency & OCC Concurrency Guard

- **Mục tiêu:** Cung cấp các hàm RPC giao dịch đảm bảo an toàn tuyệt đối khi mạng chập chờn.
- **Tập tin tạo:** `supabase/migrations/20260830000002_logistics_execution_rpcs.sql`
- **Nội dung thực hiện:**
  - [ ] Hàm `rpc_transition_delivery_attempt`:
    - Kiểm tra `command_id` trong `logistics_command_idempotency`.
    - Kiểm tra `state = p_expected_state` (OCC Guard).
    - Cập nhật `delivery_attempts.state`.
    - Ghi bản ghi vào `public.logistics_outbox_events`.
  - [ ] Hàm `rpc_submit_delivery_epod`:
    - Kiểm tra `command_id`.
    - Kiểm tra `state = 'arrived'`.
    - Thêm `shipment_epod_evidences` & `epod_evidence_assets`.
    - Cập nhật `state = 'delivered'`.
    - Ghi Outbox Event `DELIVERY.EPOD_SUBMITTED`.
  - [ ] Hàm `rpc_report_delivery_exception`:
    - Ghi nhận sự cố `delivery_exceptions` với status `OPEN`.
    - Cập nhật attempt `state = 'failed_attempt'`.
- **Tiêu chí nghiệm thu:** `npm run rpc:check` đạt 0 issues, kiểm tra idempotency retry 2 lần trả về cùng 1 kết quả.

---

### 📌 Task 2.2: Transactional Outbox Dispatcher (Chat & Web Push Consumer)

- **Mục tiêu:** Tự động phát tán sự kiện từ Outbox tới Chat và Web Push mà không làm nghẽn Database.
- **Tập tin tạo:** `supabase/functions/dispatch-logistics-event/index.ts`
- **Nội dung thực hiện:**
  - [ ] Trigger trên `public.logistics_outbox_events` gọi Edge Function qua `pg_net`.
  - [ ] Dispatcher đọc `event_type`:
    - `DELIVERY.DRIVER_ARRIVED` ➔ Tạo Chat System Message `"Tài xế đã đến điểm giao"` + Bắn Push tới Khách hàng.
    - `DELIVERY.EPOD_SUBMITTED` ➔ Tạo Chat Banner `system_epod` (màu xanh lá) kèm link xem biên bản bàn giao.
    - `DELIVERY.EXCEPTION_OCCURRED` ➔ Bắn Push cảnh báo Điều phối viên.
  - [ ] Cập nhật `logistics_outbox_events.status = 'dispatched'`.
- **Tiêu chí nghiệm thu:** Gửi thử nghiệm và nhận đúng thông báo trên Web Push và Chat Room của chuyến hàng.

---

## 📱 SPRINT 3: APPLICATION LAYER, OFFLINE OUTBOX & DRIVER APP UI

### 📌 Task 3.1: API Client & Application Hooks

- **Mục tiêu:** Xây dựng tầng truy vấn dữ liệu chuẩn mực cho Frontend.
- **Tập tin tạo:**
  - `src/api/logistics/delivery-stop.api.ts`
  - `src/api/logistics/delivery-attempt.api.ts`
  - `src/api/logistics/epod.api.ts`
  - `src/application/logistics/useDeliveryExecution.ts`
  - `src/application/logistics/useEPODSubmission.ts`
- **Nội dung thực hiện:**
  - [ ] Tích hợp React Query với optimistic caching.
  - [ ] Quản lý trạng thái mutation kèm toast feedback Tiếng Việt chuẩn.
- **Tiêu chí nghiệm thu:** 0 `any`, type safe 100%.

---

### 📌 Task 3.2: Per-Aggregate Ordered Offline Outbox (IndexedDB)

- **Mục tiêu:** Hỗ trợ tài xế thao tác khi mất mạng và tự động đồng bộ khi có kết nối lại.
- **Tập tin tạo:**
  - `src/shared/lib/offline-outbox/logisticsOutboxStorage.ts`
  - `src/shared/lib/offline-outbox/useLogisticsOutboxSync.ts`
- **Nội dung thực hiện:**
  - [ ] Lưu trữ command ngoại tuyến vào IndexedDB (`id`, `command_id`, `aggregate_id`, `command_type`, `payload`).
  - [ ] Bộ điều phối `syncLogisticsOutbox()`: Duyệt tuần tự theo từng `aggregate_id` (FIFO per aggregate), gửi song song giữa các aggregate khác nhau.
  - [ ] Lắng nghe sự kiện trình duyệt `window.addEventListener('online', ...)`.
- **Tiêu chí nghiệm thu:** Thử nghiệm tắt mạng trên DevTools, bấm giao hàng ➔ Bật mạng lại ➔ Dữ liệu tự động đồng bộ thành công.

---

### 📌 Task 3.3: Field Execution Driver UI Components

- **Mục tiêu:** Nâng cấp giao diện Driver Portal thành ứng dụng thực thi hiện trường tối ưu 1 tay.
- **Tập tin cập nhật / tạo mới:**
  - `src/features/driver-portal/DriverPortalPage.tsx`
  - `src/features/driver-portal/components/JourneyTimeline.tsx` (Lộ trình trực quan các Stop & Attempt)
  - `src/features/driver-portal/components/SignaturePad.tsx` (Canvas ký tên điện tử, có nút xóa và preview)
  - `src/features/driver-portal/components/EvidenceCamera.tsx` (Chụp ảnh & tự động nén WebP ≤ 300KB)
  - `src/features/driver-portal/components/ReportExceptionModal.tsx` (Báo cáo sự cố có lý do & ảnh)
- **Nội dung thực hiện:**
  - [ ] Nút bấm to bản (chiều cao ≥ 48px), màu sắc semantic token chuẩn Stylelint.
  - [ ] Thu thập tọa độ GPS `navigator.geolocation.getCurrentPosition()` khi ký nhận hoặc đổi trạng thái.
- **Tiêu chí nghiệm thu:** `npm run lint:css` đạt 0 lỗi, responsive mượt mà trên mobile view (375px - 430px).

---

## 🧪 SPRINT 4: UNIT TESTS, RECONCILIATION ENGINE & VERIFICATION

### 📌 Task 4.1: Unit & Integration Tests

- **Mục tiêu:** Đảm bảo toàn bộ logic cốt lõi có kiểm thử tự động.
- **Tập tin tạo:**
  - `src/domain/logistics/__tests__/delivery-attempt.state-machine.test.ts`
  - `src/domain/logistics/__tests__/epod-hash.test.ts`
  - `src/shared/lib/offline-outbox/__tests__/logisticsOutboxStorage.test.ts`
- **Tiêu chí nghiệm thu:** `npx vitest run` 100% tests passed.

---

### 📌 Task 4.2: Logistics Reconciliation Engine

- **Mục tiêu:** Kịch bản kiểm tra bất thường dữ liệu và tự động báo cáo.
- **Tập tin tạo:** `scripts/logistics-reconciliation.ts`
- **Nội dung thực hiện:**
  - [ ] Quét các chuyến hàng có `state = 'delivered'` nhưng thiếu `epod_evidences`.
  - [ ] Quét các Outbox Event bị kẹt quá 15 phút.
  - [ ] Xuất báo cáo tổng kết tình trạng toàn vẹn dữ liệu.
- **Tiêu chí nghiệm thu:** Chạy thử nghiệm thành công qua `npx tsx scripts/logistics-reconciliation.ts`.

---

### 📌 Task 4.3: Full System Verification Loop

- **Mục tiêu:** Chạy đầy đủ 4 cổng gác chất lượng của VinhPhatERP Architecture Guard.
- **Lệnh kiểm tra bắt buộc:**
  ```bash
  npm run rpc:check                  # 0 issues
  npm run typecheck                  # 0 errors
  npm run lint -- --max-warnings=0   # 0 warnings
  npm run lint:css                   # 0 CSS errors
  ```
- **Tiêu chí nghiệm thu:** Cả 4 lệnh đều đạt 100% xanh lá (0 errors, 0 warnings).

---

## 📊 BẢNG THEO DÕI TIẾN ĐỘ (TASK PROGRESS TRACKER)

| Task ID   | Tên Mini Task                               |  Sprint  | Độ phức tạp |   Trạng thái    |
| --------- | ------------------------------------------- | :------: | :---------: | :-------------: |
| **T-1.1** | Migration DDL & Table Schemas v2.1          | Sprint 1 |   🔴 High   |   ⏳ Sẵn sàng   |
| **T-1.2** | Core Domain Models & State Machine          | Sprint 1 |  🟡 Medium  |   ⏳ Sẵn sàng   |
| **T-2.1** | Atomic RPCs với Idempotency & OCC Guard     | Sprint 2 |   🔴 High   |  ⏳ Chờ T-1.1   |
| **T-2.2** | Transactional Outbox Dispatcher (Chat/Push) | Sprint 2 |  🟡 Medium  |  ⏳ Chờ T-2.1   |
| **T-3.1** | API Client & Application Hooks Layer        | Sprint 3 |  🟡 Medium  |  ⏳ Chờ T-2.1   |
| **T-3.2** | Per-Aggregate Ordered Offline Outbox        | Sprint 3 |   🔴 High   |  ⏳ Chờ T-3.1   |
| **T-3.3** | Field Execution Driver UI Components        | Sprint 3 |  🟡 Medium  |  ⏳ Chờ T-3.2   |
| **T-4.1** | Vitest Unit Tests for Core Domain           | Sprint 4 |   🟢 Low    | ⏳ Chờ Sprint 3 |
| **T-4.2** | Logistics Reconciliation Engine Script      | Sprint 4 |  🟡 Medium  | ⏳ Chờ Sprint 3 |
| **T-4.3** | Full Verification Loop (4 Checks)           | Sprint 4 |   🟢 Low    |  ⏳ Bước cuối   |
