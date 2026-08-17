# 🛡️ Architecture Standard: Concurrency & State Transition Policy

**Owner:** Enterprise Architecture | **Scope:** Toàn bộ API, Domain Services & UI mutations của VinhPhatERP v3.

---

## 1. Nguyên Tắc 3 Tầng Bảo Vệ (3-Tier Concurrency)

Mọi thao tác thay đổi dữ liệu trong hệ thống BẮT BUỘC phải thuộc 1 trong 3 nhóm bảo vệ sau:

### Tầng 1: Entity CRUD OCC (Optimistic Concurrency Control)

- **Áp dụng**: Cập nhật thông tin entity từ Form (Order, Customer, Supplier, BOM, Fabric Roll,...).
- **Ràng buộc**:
  1. API function phải nhận `expectedUpdatedAt?: string`.
  2. Query phải có `.eq('updated_at', expectedUpdatedAt)`.
  3. Lỗi mismatch phải ném `ConcurrencyConflictError`.

### Tầng 2: Atomic State Transition (Workflow Concurrency)

- **Áp dụng**: Chuyển đổi trạng thái nghiệp vụ (`submit`, `approve`, `reject`, `send`, `confirm`, `complete`, `cancel`).
- **Ràng buộc**:
  1. API function phải kiểm tra trạng thái nguồn hợp lệ: `.eq('status', expectedStatus)` hoặc `.in('status', allowedStatuses)`.
  2. Bắt buộc chuỗi `.select().single()` hoặc gọi RPC để verify đúng 1 dòng được cập nhật.
  3. Khi không có dòng nào được cập nhật, ném `InvalidStateTransitionError`.

### Tầng 3: Multi-Step & Quantitative Transactions

- **Áp dụng**:
  - Thao tác có từ 2 bước ghi DB trở lên (Status + Audit Log + Notification + Stock reservation).
  - Thao tác cộng trừ số lượng kho (`quantity`) và công nợ (`paid_amount`).
- **Ràng buộc**:
  1. 100% phải bọc trong PostgreSQL RPC (Transaction nguyên tử).
  2. Tuyệt đối CẤM tính toán cộng dồn ở client TypeScript rồi gọi `.update()`.

---

## 2. Chuẩn Hóa Chữ Ký Hàm Mutation (API Signature)

Khi số tham số của hàm mutation $\ge 3$, BẮT BUỘC sử dụng **Object Parameter**:

```ts
// ❌ Cấm: List tham số dài dễ nhầm lẫn
export async function approvePO(
  id: string,
  userId: string,
  comment?: string,
  sendImmediately?: boolean,
  expectedUpdatedAt?: string,
);

// ✅ Chuẩn: Object Parameter
export interface ApprovePOParams {
  poId: string;
  userId: string;
  comment?: string;
  sendImmediately?: boolean;
  expectedUpdatedAt?: string;
}
export async function approvePurchaseOrder(
  params: ApprovePOParams,
): Promise<PurchaseOrder>;
```

---

## 3. Quy Tắc Xóa Bản Ghi (DELETE Safety)

- Chỉ cho phép xóa bản ghi khi nó đang ở trạng thái nháp (`status = 'draft'`).
- Không bao giờ cho phép xóa các bản ghi đã phát sinh giao dịch, nhập xuất kho hoặc tài chính.
