# Requirements Document — Module Purchase Order (PO)

## Introduction

Module Purchase Order (PO) là nền tảng kiểm soát đầu vào nguyên liệu cho hệ thống ERP dệt may VinhPhat. Module giải quyết 4 vấn đề cốt lõi: (1) chuẩn hóa giá mua thành single source of truth, (2) ràng buộc nhập kho theo PO — không cho nhập tự do, (3) kiểm soát công nợ nhà cung cấp, (4) tạo nền dữ liệu cho costing (giá vốn sản xuất).

Module bao gồm hai luồng chính: tạo và duyệt Purchase Order, và nhập kho từ PO đã duyệt (Goods Receipt). Module tích hợp với bảng `suppliers` hiện có và thay thế luồng nhập kho tự do hiện tại.

Để đảm bảo tính toàn vẹn dữ liệu, toàn bộ thao tác ghi của Goods Receipt được thực thi trong một RPC function duy nhất (`rpc_create_goods_receipt`) với cơ chế row-level locking chống race condition và idempotency key chống double submit. Mọi hành động quan trọng trên PO đều được ghi vào audit trail (`po_audit_logs`) trong cùng transaction, phục vụ truy vết và tuân thủ.

---

## Glossary

- **PO_System**: Hệ thống quản lý Purchase Order trong ERP VinhPhat
- **PurchaseOrder**: Đơn đặt hàng mua nguyên liệu (sợi, vải mộc) từ nhà cung cấp
- **PO_Item**: Dòng hàng trong một PurchaseOrder, chứa thông tin nguyên liệu, số lượng và đơn giá
- **GoodsReceipt**: Phiếu nhập kho được tạo từ một PurchaseOrder đã duyệt
- **GoodsReceiptItem**: Dòng hàng trong một GoodsReceipt, ghi nhận số lượng thực nhận
- **Purchasing_Staff**: Nhân viên bộ phận mua hàng — có quyền tạo PO
- **Approver**: Nhân viên kế toán hoặc admin — có quyền duyệt PO
- **Warehouse_Staff**: Thủ kho — có quyền tạo GoodsReceipt từ PO đã duyệt
- **Supplier**: Nhà cung cấp nguyên liệu, đã tồn tại trong bảng `suppliers`
- **Material**: Nguyên liệu (sợi hoặc vải mộc) được đặt mua trong PO
- **ordered_qty**: Số lượng đặt mua trong PO_Item
- **received_qty**: Tổng số lượng đã nhập kho tích lũy cho một PO_Item
- **remaining_qty**: Số lượng còn lại chưa nhập = `ordered_qty - received_qty`
- **unit_price**: Đơn giá thống nhất từ PO, là nguồn sự thật duy nhất cho giá nhập kho
- **po_code**: Mã PO duy nhất, định dạng `PO-YYYYMM-NNNN`
- **receipt_code**: Mã phiếu nhập kho duy nhất
- **draft**: Trạng thái PO mới tạo, chưa duyệt
- **approved**: Trạng thái PO đã được Approver duyệt, cho phép nhập kho
- **partial_received**: Trạng thái PO đã nhập kho một phần (received_qty < ordered_qty cho ít nhất một item)
- **completed**: Trạng thái PO đã nhập kho đủ toàn bộ item (received_qty = ordered_qty cho tất cả item)
- **cancelled**: Trạng thái PO bị hủy, không cho phép nhập kho
- **rejected**: Trạng thái PO bị từ chối bởi Approver, cần Purchasing_Staff chỉnh sửa và gửi lại
- **v_po_status**: DB view tổng hợp SUM(ordered_qty) và SUM(received_qty) theo PO để hiển thị tiến độ
- **client_request_id**: UUID do client sinh ra, dùng để đảm bảo idempotency khi submit GoodsReceipt
- **rpc_create_goods_receipt**: PostgreSQL RPC function thực hiện toàn bộ goods receipt transaction trong một BEGIN/COMMIT
- **po_audit_logs**: Bảng ghi lịch sử thay đổi của PO và GoodsReceipt
- **supplier_name_snapshot**: Tên nhà cung cấp được lưu tại thời điểm tạo PO
- **uom**: Đơn vị tính của nguyên liệu (kg, cây, mét, cuộn)

---

## Requirements

### Requirement 1: Tạo Purchase Order

**User Story:** As a Purchasing_Staff, I want to create a PurchaseOrder with multiple PO_Items, so that I can formally record the intent to purchase materials from a Supplier at agreed prices.

#### Acceptance Criteria

1. THE PO_System SHALL generate a unique `po_code` in the format `PO-YYYYMM-NNNN` for each new PurchaseOrder.
2. WHEN a Purchasing_Staff submits a new PurchaseOrder, THE PO_System SHALL save the PurchaseOrder with status `draft`.
3. THE PO_System SHALL require `supplier_id`, `order_date`, `expected_date`, and at least one PO_Item before saving a PurchaseOrder.
4. THE PO_System SHALL require each PO_Item to have `material_id`, `ordered_qty` greater than 0, and `unit_price` greater than or equal to 0.
5. THE PO_System SHALL calculate and store `total_amount` as the sum of (`ordered_qty * unit_price`) across all PO_Items.
6. WHEN a Purchasing_Staff saves a PurchaseOrder, THE PO_System SHALL record `created_by` as the authenticated user's ID.
7. IF a Supplier with the given `supplier_id` does not exist or has status `inactive`, THEN THE PO_System SHALL reject the PurchaseOrder creation and return a descriptive error message.
8. IF a PO_Item has `ordered_qty` less than or equal to 0, THEN THE PO_System SHALL reject the submission and return a descriptive validation error.
9. THE PO_System SHALL allow a PurchaseOrder to contain multiple PO_Items referencing different materials.
10. WHERE the Purchasing_Staff role is assigned, THE PO_System SHALL allow creating PurchaseOrders.
11. WHEN a PurchaseOrder is created, THE PO_System SHALL store `supplier_name_snapshot` (the supplier's name at time of PO creation) on the PurchaseOrder record, so that historical POs display the correct supplier name even if the supplier's name changes later.
12. THE PO_System SHALL require each PO_Item to have a `uom` (unit of measure) field, with allowed values: `kg`, `cây`, `mét`, `cuộn`.
13. THE PO_System SHALL display `uom` alongside quantities in all PO and GoodsReceipt views.

---

### Requirement 2: Duyệt Purchase Order

**User Story:** As an Approver, I want to approve a PurchaseOrder in `draft` status, so that the Warehouse_Staff can proceed with goods receipt against the approved order.

#### Acceptance Criteria

1. WHEN an Approver approves a PurchaseOrder, THE PO_System SHALL change the PurchaseOrder status from `draft` to `approved`.
2. IF a PurchaseOrder is not in `draft` status, THEN THE PO_System SHALL reject the approval request and return a descriptive error.
3. WHERE the Approver role is assigned, THE PO_System SHALL allow approving PurchaseOrders.
4. WHEN a PurchaseOrder is approved, THE PO_System SHALL record the approval timestamp and the Approver's user ID.
5. THE PO_System SHALL prevent Purchasing_Staff from approving their own PurchaseOrders.
6. WHEN a PurchaseOrder is approved, THE PO_System SHALL lock `unit_price` and `ordered_qty` on all PO_Items — these fields SHALL NOT be modifiable after approval, even if no GoodsReceipt has been created yet.
7. IF a user attempts to modify `unit_price` or `ordered_qty` on an approved PurchaseOrder, THE PO_System SHALL reject the request and return a descriptive error.
8. WHEN an Approver rejects a PurchaseOrder, THE PO_System SHALL change the status to `rejected` and record the rejection reason and the Approver's user ID.
9. WHEN a PurchaseOrder has status `rejected`, THE PO_System SHALL allow the Purchasing_Staff to edit and resubmit it, which SHALL change the status back to `draft`.
10. THE PO_System SHALL display the rejection reason on the PO detail view.

---

### Requirement 3: Ràng buộc nhập kho theo PO

**User Story:** As a system administrator, I want all goods receipts to be linked to an approved PurchaseOrder, so that no materials can be received without a formal purchase authorization.

#### Acceptance Criteria

1. WHEN a Warehouse_Staff attempts to create a GoodsReceipt, THE PO_System SHALL require a valid `po_id` referencing an existing PurchaseOrder.
2. IF the referenced PurchaseOrder has status other than `approved` or `partial_received`, THEN THE PO_System SHALL reject the GoodsReceipt creation and return a descriptive error.
3. THE PO_System SHALL not provide any UI path for creating a GoodsReceipt without selecting a PurchaseOrder.
4. WHEN a Warehouse_Staff selects a PurchaseOrder for goods receipt, THE PO_System SHALL display only PO_Items with `remaining_qty` greater than 0.
5. THE PO_System SHALL auto-populate `unit_price` in each GoodsReceiptItem from the corresponding PO_Item's `unit_price`.
6. THE PO_System SHALL not allow Warehouse_Staff to modify `unit_price` in the GoodsReceipt UI.

---

### Requirement 4: Nhập kho từ PO (Goods Receipt)

**User Story:** As a Warehouse_Staff, I want to record the actual quantities received against a PurchaseOrder, so that inventory is updated accurately and partially delivered orders are tracked.

#### Acceptance Criteria

1. WHEN a Warehouse_Staff submits a GoodsReceipt, THE PO_System SHALL generate a unique `receipt_code` and save the GoodsReceipt with `received_date` and `created_by`.
2. THE PO_System SHALL require at least one GoodsReceiptItem with `received_qty` greater than 0 before saving a GoodsReceipt.
3. IF a GoodsReceiptItem's `received_qty` would cause the cumulative `received_qty` for the corresponding PO_Item to exceed `ordered_qty`, THEN THE PO_System SHALL reject the submission and return a descriptive error indicating the maximum allowable quantity.
4. WHEN a GoodsReceipt is saved, THE PO_System SHALL atomically update `purchase_order_items.received_qty` by adding the new `received_qty` for each corresponding PO_Item.
5. WHEN a GoodsReceipt is saved, THE PO_System SHALL insert a record into `GoodsReceipt` and all corresponding `GoodsReceiptItem` records in a single atomic transaction.
6. THE PO_System SHALL allow multiple GoodsReceipts against the same PurchaseOrder to support partial deliveries.
7. WHEN a Warehouse_Staff selects a PO_Item for receipt, THE PO_System SHALL display `ordered_qty`, cumulative `received_qty`, and `remaining_qty` for that item.
8. WHERE the Warehouse_Staff role is assigned, THE PO_System SHALL allow creating GoodsReceipts.
9. THE PO_System SHALL execute all GoodsReceipt write operations (insert goods_receipt, insert goods_receipt_items, update purchase_order_items.received_qty, update purchase_orders.status) within a SINGLE database RPC call named `rpc_create_goods_receipt`.
10. THE PO_System SHALL NOT allow frontend code or multiple sequential API calls to perform these operations — the entire transaction MUST be atomic at the database level.
11. IF any step within `rpc_create_goods_receipt` fails, THE PO_System SHALL rollback ALL changes and return a descriptive error.
12. WHEN `rpc_create_goods_receipt` executes, THE PO_System SHALL acquire a row-level lock (`SELECT ... FOR UPDATE`) on all affected `purchase_order_items` rows before checking `remaining_qty`, to prevent concurrent over-receipt.
13. IF two concurrent GoodsReceipt submissions target the same PO_Item, THE PO_System SHALL serialize them — the second transaction SHALL wait for the first to complete before proceeding.
14. THE PO_System SHALL require a `client_request_id` (UUID generated client-side) on each GoodsReceipt submission.
15. THE PO_System SHALL enforce a UNIQUE constraint on `client_request_id` in the `goods_receipts` table.
16. IF a GoodsReceipt submission is received with a `client_request_id` that already exists, THE PO_System SHALL return the existing GoodsReceipt record without creating a duplicate.

---

### Requirement 5: Cập nhật trạng thái PO tự động

**User Story:** As a Purchasing_Staff, I want the PurchaseOrder status to update automatically after each goods receipt, so that I can track delivery progress without manual intervention.

#### Acceptance Criteria

1. WHEN a GoodsReceipt is saved and all PO_Items have `received_qty` equal to `ordered_qty`, THE PO_System SHALL update the PurchaseOrder status to `completed`.
2. WHEN a GoodsReceipt is saved and at least one PO_Item has `received_qty` less than `ordered_qty`, THE PO_System SHALL update the PurchaseOrder status to `partial_received`.
3. THE PO_System SHALL update the PurchaseOrder status in the same atomic transaction as the GoodsReceipt save.
4. WHILE a PurchaseOrder has status `completed`, THE PO_System SHALL prevent creation of additional GoodsReceipts against that PurchaseOrder.
5. WHILE a PurchaseOrder has status `cancelled`, THE PO_System SHALL prevent creation of GoodsReceipts against that PurchaseOrder.

---

### Requirement 6: Bảo vệ tính toàn vẹn dữ liệu PO sau khi nhập kho

**User Story:** As a system administrator, I want to prevent modifications to a PurchaseOrder after goods have been received, so that the audit trail and price integrity are preserved.

#### Acceptance Criteria

1. WHILE a PurchaseOrder has status `partial_received` or `completed`, THE PO_System SHALL prevent editing of PO_Item `unit_price`, `ordered_qty`, and `material_id`.
2. WHILE a PurchaseOrder has status `partial_received` or `completed`, THE PO_System SHALL prevent adding or removing PO_Items.
3. IF a user attempts to edit a locked PurchaseOrder, THEN THE PO_System SHALL return a descriptive error indicating the PO cannot be modified after goods receipt.
4. WHILE a PurchaseOrder has status `approved`, `partial_received`, or `completed`, THE PO_System SHALL prevent cancellation of the PurchaseOrder.
5. THE PO_System SHALL allow editing a PurchaseOrder only when its status is `draft` or `rejected`.

---

### Requirement 7: Chuẩn hóa giá mua (Single Source of Truth)

**User Story:** As an accountant, I want all goods receipt prices to be derived exclusively from the approved PurchaseOrder, so that there is a single authoritative source for material costs used in costing calculations.

#### Acceptance Criteria

1. THE PO_System SHALL store `unit_price` on each PO_Item at the time of PO creation and SHALL NOT allow modification after the PO is approved.
2. WHEN a GoodsReceiptItem is created, THE PO_System SHALL copy `unit_price` from the corresponding PO_Item and store it on the GoodsReceiptItem.
3. THE PO_System SHALL not expose a UI field for editing `unit_price` on GoodsReceiptItem.
4. FOR ALL GoodsReceiptItems linked to the same PO_Item, THE PO_System SHALL ensure `unit_price` equals the PO_Item's `unit_price` (round-trip price integrity property).
5. THE PO_System SHALL use `GoodsReceiptItem.unit_price` as the authoritative cost basis for inventory valuation and costing calculations.

---

### Requirement 8: Hiển thị danh sách và tiến độ PO

**User Story:** As a Purchasing_Staff, I want to view a list of all PurchaseOrders with their delivery progress, so that I can monitor outstanding orders and follow up with suppliers.

#### Acceptance Criteria

1. THE PO_System SHALL display a PO list showing `po_code`, Supplier name, `status`, `total_amount`, `order_date`, and delivery progress percentage for each PurchaseOrder.
2. THE PO_System SHALL calculate delivery progress as `SUM(received_qty) / SUM(ordered_qty) * 100` using the `v_po_status` view.
3. THE PO_System SHALL allow filtering the PO list by `status` and by Supplier.
4. THE PO_System SHALL allow searching the PO list by `po_code` or Supplier name.
5. WHEN a user selects a PurchaseOrder from the list, THE PO_System SHALL display the PO detail view.

---

### Requirement 9: Hiển thị chi tiết PO và lịch sử nhập kho

**User Story:** As a Purchasing_Staff or Warehouse_Staff, I want to view the full detail of a PurchaseOrder including all goods receipts, so that I can track exactly what has been received and when.

#### Acceptance Criteria

1. THE PO_System SHALL display PO detail including header information (`po_code`, Supplier, dates, status, `total_amount`) and a list of all PO_Items with `ordered_qty`, cumulative `received_qty`, `remaining_qty`, and `unit_price`.
2. THE PO_System SHALL display a timeline of all GoodsReceipts linked to the PurchaseOrder, showing `receipt_code`, `received_date`, and quantities received per item.
3. THE PO_System SHALL display a progress indicator per PO_Item showing the ratio of `received_qty` to `ordered_qty`.
4. WHEN a PurchaseOrder has status `approved` or `partial_received`, THE PO_System SHALL display an action button for Warehouse_Staff to initiate a new GoodsReceipt.

---

### Requirement 10: Phân quyền truy cập

**User Story:** As a system administrator, I want role-based access control on all PO operations, so that only authorized personnel can perform each action.

#### Acceptance Criteria

1. THE PO_System SHALL restrict PurchaseOrder creation to users with the `purchasing` role.
2. THE PO_System SHALL restrict PurchaseOrder approval to users with the `accounting` or `admin` role.
3. THE PO_System SHALL restrict GoodsReceipt creation to users with the `warehouse` role.
4. THE PO_System SHALL allow users with `accounting`, `admin`, or `purchasing` roles to view PurchaseOrders.
5. THE PO_System SHALL allow users with `warehouse` role to view approved and partial_received PurchaseOrders.
6. IF a user without the required role attempts a restricted action, THEN THE PO_System SHALL return a permission denied error and not perform the action.
7. THE PO_System SHALL enforce role-based access at both the API layer and the database layer via Row Level Security policies.

---

### Requirement 11: Tích hợp với hệ thống kho hiện tại

**User Story:** As a system administrator, I want the GoodsReceipt to integrate with the existing inventory system, so that stock levels are updated consistently when materials are received.

#### Acceptance Criteria

1. WHEN a GoodsReceipt is saved, THE PO_System SHALL insert records into `GoodsReceipt` and `GoodsReceiptItem` tables and update `purchase_order_items.received_qty` in a single atomic RPC call.
2. THE PO_System SHALL use the `safeUpsert` pattern or atomic RPC for all multi-table write operations, consistent with the existing `db-guard` coding standard.
3. THE PO_System SHALL expose a `v_po_status` database view that aggregates `SUM(ordered_qty)` and `SUM(received_qty)` grouped by `po_id` for use in progress display.
4. THE PO_System SHALL use Zod schemas for all input validation at the API layer before any database write.
5. THE PO_System SHALL use React Query for all server state management in the UI layer.
6. THE PO_System SHALL define `rpc_create_goods_receipt(p_po_id, p_items[])` as the single entry point for all goods receipt writes, executing as a single BEGIN/COMMIT transaction in PostgreSQL.
7. THE PO_System SHALL expose a `v_po_detail_full` database view joining `purchase_orders`, `suppliers`, and aggregated item/receipt counts for use in PO list and detail screens.
8. THE PO_System SHALL expose a `v_po_item_status` database view showing per-item `ordered_qty`, cumulative `received_qty`, and computed `remaining_qty` for use in GoodsReceipt creation flow.

---

### Requirement 12: Hủy Purchase Order

**User Story:** As a Purchasing_Staff or Approver, I want to cancel a PurchaseOrder that is no longer needed, so that it does not appear as an outstanding order.

#### Acceptance Criteria

1. WHEN an authorized user cancels a PurchaseOrder with status `draft`, THE PO_System SHALL update the status to `cancelled`.
2. IF a PurchaseOrder has status `approved` and no GoodsReceipts have been created against it, THEN THE PO_System SHALL allow an Approver to cancel it and update the status to `cancelled`.
3. IF a PurchaseOrder has status `partial_received` or `completed`, THEN THE PO_System SHALL reject the cancellation request and return a descriptive error.
4. WHILE a PurchaseOrder has status `cancelled`, THE PO_System SHALL display it as read-only with no action buttons.

---

### Requirement 13: Audit Log — Lịch sử thay đổi PO

**User Story:** As a system administrator, I want all critical PO actions to be logged in an audit trail, so that I can trace who did what and when for compliance and dispute resolution.

#### Acceptance Criteria

1. THE PO_System SHALL insert a record into `po_audit_logs` for each of the following events: PO created, PO approved, PO rejected, PO cancelled, GoodsReceipt created.
2. Each `po_audit_logs` record SHALL contain: `entity_type` (purchase_order or goods_receipt), `entity_id`, `action` (created/approved/rejected/cancelled/receipt_created), `actor_id`, `timestamp`, and `snapshot` (JSON of the entity state at time of action).
3. THE PO_System SHALL write audit log entries within the same atomic transaction as the triggering action.
4. THE PO_System SHALL NOT allow deletion or modification of `po_audit_logs` records by any application role.
