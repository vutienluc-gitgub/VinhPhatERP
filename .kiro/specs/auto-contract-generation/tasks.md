# Kế Hoạch Triển Khai: Tự Động Tạo Hợp Đồng (Auto Contract Generation)

## Tổng Quan

Triển khai module theo kiến trúc feature-based của dự án (React + TypeScript + Supabase). Các bước được sắp xếp theo thứ tự: database → service layer → Edge Functions → UI components → tích hợp với các module khác.

## Tasks

- [x] 1. Tạo migration database và cấu hình settings
  - Tạo file migration trong `supabase/migrations/` với các bảng: `contract_templates`, `contracts`, `contract_order_links`, `contract_audit_logs`
  - Thêm các settings keys mới vào bảng `settings`: `contract_sale_prefix`, `contract_purchase_prefix`, `company_representative`, `company_representative_title`, `company_bank_account`, `company_bank_name`
  - Tạo RLS policies cho từng bảng (authenticated users đọc được, chỉ admin mới sửa template)
  - Tạo index trên `contracts(contract_number)`, `contracts(party_a_id)`, `contracts(status)`, `contract_order_links(order_id)`
  - _Requirements: 1.4, 3.5, 7.1_

- [ ] 2. Định nghĩa types, schemas và service layer
  - [x] 2.1 Tạo `src/features/contracts/contracts.module.ts`
    - Định nghĩa Zod schemas cho `Contract`, `ContractTemplate`, `ContractOrderLink`, `ContractAuditLog`
    - Định nghĩa TypeScript types: `ContractStatus`, `ContractType`, `PartyAType`, `CreateContractInput`, `UpdateContractInput`
    - Định nghĩa hàm `formatContractNumber(seq, year, type)` trả về chuỗi đúng định dạng
    - Định nghĩa hàm `renderTemplate(content, data)` thay thế tất cả `{{placeholder}}` bằng dữ liệu thực
    - _Requirements: 1.4, 3.4, 7.2_

  - [ ]\* 2.2 Viết property test cho `formatContractNumber`
    - **Property 4: Contract_Number luôn đúng định dạng và duy nhất**
    - **Validates: Requirements 1.4, 7.1, 7.2**
    - Dùng fast-check, kiểm tra output match `/^\d{3}\/\d{4}\/HĐNT–\w+\/TKS$/` với mọi `seq` và `year` hợp lệ

  - [ ]\* 2.3 Viết property test cho `renderTemplate`
    - **Property 6: Template placeholder được render đầy đủ**
    - **Validates: Requirements 3.4**
    - Dùng fast-check, kiểm tra output không còn chuỗi `{{...}}` nào sau khi render với dữ liệu hợp lệ

  - [x] 2.4 Tạo `src/features/contracts/contracts.service.ts`
    - Implement `getContracts(filters)`, `getContractById(id)`, `updateContract(id, data)`, `updateContractStatus(id, status, meta)`, `linkOrderToContract(contractId, orderId)`, `unlinkOrderFromContract(contractId, orderId)`
    - Implement `getContractsByOrderId(orderId)`, `getOrdersByContractId(contractId)`
    - _Requirements: 4.2, 4.3, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3, 8.4_

  - [ ]\* 2.5 Viết unit tests cho `contracts.service.ts`
    - Test `updateContractStatus` với các transition hợp lệ và không hợp lệ
    - Test `linkOrderToContract` bị chặn khi contract đã `signed`
    - _Requirements: 6.1, 8.4_

- [x] 3. Checkpoint — Đảm bảo tất cả tests pass, hỏi người dùng nếu có thắc mắc.

- [ ] 4. Triển khai Edge Function `generate-contract`
  - [x] 4.1 Tạo `supabase/functions/generate-contract/index.ts`
    - Nhận input: `{ source_type: 'order' | 'customer' | 'supplier', source_id, type, effective_date, expiry_date, payment_term, notes }`
    - Validate nguồn: từ chối nếu Order `cancelled` hoặc Customer/Supplier `inactive`
    - Cảnh báo (không chặn) nếu Order đã có Contract liên kết
    - Lấy thông tin Party_A từ bảng tương ứng
    - Lấy thông tin Party_B từ bảng `settings`
    - Lấy template active phù hợp với `type`
    - Đánh số hợp đồng atomic bằng `SELECT MAX(seq) ... FOR UPDATE` trong transaction
    - Render template với dữ liệu thực (thay thế tất cả placeholders)
    - Insert vào `contracts` với `status = 'draft'`
    - Insert vào `contract_order_links` nếu `source_type = 'order'`
    - Insert vào `contract_audit_logs` với `action = 'created'`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 3.4, 4.1, 7.1, 7.2, 7.3_

  - [ ]\* 4.2 Viết property test cho logic validate nguồn trong Edge Function
    - **Property 5: Từ chối tạo Contract từ nguồn không hợp lệ**
    - **Validates: Requirements 1.6, 1.7, 2.5**
    - Dùng fast-check, kiểm tra mọi order `cancelled` hoặc customer/supplier `inactive` đều trả về lỗi và không tạo bản ghi

  - [ ]\* 4.3 Viết property test cho Party_A mapping
    - **Property 1: Party_A luôn khớp với nguồn dữ liệu**
    - **Validates: Requirements 1.1, 2.1, 2.2**
    - Dùng fast-check, kiểm tra `party_a_name`, `party_a_tax_code`, `party_a_address` trong Contract khớp với nguồn

  - [ ]\* 4.4 Viết property test cho Party_B mapping
    - **Property 2: Party_B luôn là thông tin công ty từ settings**
    - **Validates: Requirements 1.2, 3.5**
    - Dùng fast-check, kiểm tra các trường Party_B khớp với giá trị trong `settings` tại thời điểm tạo

  - [ ]\* 4.5 Viết property test cho trạng thái draft khi tạo mới
    - **Property 3: Contract mới tạo luôn có trạng thái draft**
    - **Validates: Requirements 4.1**
    - Dùng fast-check, kiểm tra mọi Contract được tạo thành công đều có `status = 'draft'`

  - [ ]\* 4.6 Viết unit tests cho `generate-contract`
    - Test tạo từ Order đầy đủ dữ liệu → kiểm tra tất cả fields
    - Test tạo từ Customer không có Order → `source_order_id = null`, quy cách để trống
    - Test tạo từ Supplier → `type = 'purchase'`
    - Test Order đã có Contract → trả về warning, vẫn tạo được
    - _Requirements: 1.1–1.7, 2.1–2.5_

- [ ] 5. Triển khai Edge Function `export-contract-pdf`
  - [x] 5.1 Tạo `supabase/functions/export-contract-pdf/index.ts`
    - Nhận input: `{ contract_id }`
    - Lấy Contract từ database, render HTML content
    - Tạo PDF từ HTML (dùng thư viện phù hợp với Deno runtime, ví dụ puppeteer hoặc html-pdf-node)
    - Upload PDF lên Supabase Storage bucket `contract-pdfs/`
    - Cập nhật `contracts.pdf_url` và `contracts.pdf_generated_at`
    - Insert audit log `action = 'pdf_exported'`
    - Nếu thất bại: trả về lỗi cụ thể, KHÔNG thay đổi `status` của Contract
    - Timeout sau 10 giây
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]\* 5.2 Viết property test cho PDF export không thay đổi trạng thái khi thất bại
    - **Property 10: PDF export không thay đổi trạng thái Contract khi thất bại**
    - **Validates: Requirements 5.5**
    - Kiểm tra `status` Contract giữ nguyên sau khi export thất bại với mọi trạng thái ban đầu

  - [ ]\* 5.3 Viết unit tests cho `export-contract-pdf`
    - Test export thành công → `pdf_url` được cập nhật
    - Test export thất bại → `status` không thay đổi
    - _Requirements: 5.4, 5.5_

- [x] 6. Checkpoint — Đảm bảo tất cả tests pass, hỏi người dùng nếu có thắc mắc.

- [ ] 7. Xây dựng UI quản lý Contract
  - [x] 7.1 Tạo `src/features/contracts/ContractStatusBadge.tsx`
    - Hiển thị badge màu theo từng trạng thái: `draft`, `sent`, `signed`, `expired`, `cancelled`
    - _Requirements: 6.1_

  - [x] 7.2 Tạo `src/features/contracts/ContractsPage.tsx`
    - Danh sách hợp đồng với bộ lọc: trạng thái, loại, khách hàng/nhà cung cấp, khoảng thời gian tạo
    - Mỗi row hiển thị: số hợp đồng, loại, Party_A, trạng thái, ngày tạo, actions
    - Nút "Tạo hợp đồng mới" mở `ContractForm`
    - _Requirements: 6.6_

  - [x] 7.3 Tạo `src/features/contracts/ContractPreview.tsx`
    - Render HTML content của Contract trong iframe hoặc div styled
    - Hiển thị đúng định dạng hợp đồng (A4-like preview)
    - _Requirements: 4.4_

  - [x] 7.4 Tạo `src/features/contracts/ContractForm.tsx`
    - Form tạo hợp đồng: chọn nguồn (Order / Customer / Supplier), loại hợp đồng, ngày hiệu lực, ngày hết hạn, điều khoản thanh toán, ghi chú
    - Khi submit: gọi Edge Function `generate-contract`
    - Hiển thị cảnh báo nếu Order đã có Contract liên kết
    - Sau khi tạo thành công: chuyển sang `ContractDetailPage`
    - _Requirements: 1.1–1.7, 2.1–2.5_

  - [-] 7.5 Tạo `src/features/contracts/ContractDetailPage.tsx`
    - Hiển thị thông tin Contract, `ContractPreview`, danh sách Orders liên kết
    - Actions theo trạng thái: Chỉnh sửa (draft/sent), Gửi, Ký, Huỷ, Xuất PDF
    - Form inline chỉnh sửa các trường nội dung (chỉ khi `draft` hoặc `sent`)
    - Nút "Xuất PDF" gọi Edge Function `export-contract-pdf`
    - Nút "Link/Unlink Order" (chỉ khi chưa `signed`)
    - _Requirements: 4.1–4.5, 5.1–5.5, 6.1–6.5, 8.1–8.4_

  - [ ]\* 7.6 Viết unit tests cho ContractDetailPage
    - Test form chỉnh sửa bị disabled khi `status = 'signed'`
    - Test nút Huỷ yêu cầu nhập lý do
    - _Requirements: 4.2, 4.3, 6.5_

- [ ] 8. Xây dựng UI quản lý Contract Template (Admin)
  - [~] 8.1 Tạo `src/features/contract-templates/contract-templates.module.ts`
    - Zod schema và types cho `ContractTemplate`
    - Service functions: `getTemplates()`, `getTemplateById(id)`, `updateTemplate(id, data)`
    - _Requirements: 3.1, 3.2, 3.3_

  - [~] 8.2 Tạo `src/features/contract-templates/TemplateEditor.tsx`
    - Textarea/rich editor cho nội dung template HTML
    - Hiển thị danh sách placeholders có sẵn để tham khảo
    - Nút lưu với xác nhận "Thay đổi chỉ áp dụng cho hợp đồng mới"
    - _Requirements: 3.2, 3.3, 3.4_

  - [~] 8.3 Tạo `src/features/contract-templates/ContractTemplatesPage.tsx`
    - Danh sách templates (sale, purchase)
    - Mở `TemplateEditor` khi chọn template
    - Chỉ hiển thị cho Admin
    - _Requirements: 3.1, 3.2_

  - [ ]\* 8.4 Viết property test cho template immutability
    - **Property 7: Thay đổi template không ảnh hưởng Contract cũ**
    - **Validates: Requirements 3.3**
    - Kiểm tra `content` của Contract đã tạo không thay đổi sau khi Admin cập nhật template

- [ ] 9. Tích hợp với module Orders, Customers, Suppliers
  - [~] 9.1 Thêm nút "Tạo hợp đồng" vào `OrderDetailPage`
    - Nút mở `ContractForm` với `source_type = 'order'` và `source_id` đã điền sẵn
    - Hiển thị danh sách Contracts đã liên kết với Order
    - _Requirements: 8.2_

  - [~] 9.2 Thêm nút "Tạo hợp đồng" vào `CustomerDetailPage`
    - Nút mở `ContractForm` với `source_type = 'customer'` và `source_id` đã điền sẵn
    - _Requirements: 2.1_

  - [~] 9.3 Thêm nút "Tạo hợp đồng" vào `SupplierDetailPage`
    - Nút mở `ContractForm` với `source_type = 'supplier'` và `source_id` đã điền sẵn
    - _Requirements: 2.2_

  - [~] 9.4 Thêm route và navigation cho module Contracts
    - Thêm route `/contracts` và `/contracts/:id` vào router
    - Thêm link "Hợp đồng" vào sidebar navigation
    - _Requirements: 6.6_

- [ ] 10. Triển khai logic vòng đời và auto-expiry
  - [~] 10.1 Implement state machine validation trong `contracts.service.ts`
    - Hàm `validateStatusTransition(currentStatus, newStatus)` trả về `true/false`
    - Các transition hợp lệ: `draft→sent`, `draft→cancelled`, `sent→signed`, `sent→cancelled`, `sent→expired`
    - Từ chối mọi transition không hợp lệ với thông báo lỗi rõ ràng
    - _Requirements: 6.1_

  - [ ]\* 10.2 Viết property test cho state machine
    - **Property 11: Vòng đời trạng thái hợp lệ**
    - **Validates: Requirements 6.1**
    - Dùng fast-check, kiểm tra mọi transition hợp lệ được chấp nhận và mọi transition không hợp lệ bị từ chối

  - [~] 10.3 Implement metadata ghi nhận khi chuyển trạng thái
    - Khi `→ sent`: ghi `sent_at`, `sent_by`
    - Khi `→ signed`: ghi `signed_at`, `signed_by`, cho phép upload `signed_file_url`
    - Khi `→ cancelled`: yêu cầu `cancel_reason`, ghi `cancelled_at`, `cancelled_by`
    - _Requirements: 6.2, 6.3, 6.5_

  - [ ]\* 10.4 Viết property test cho metadata transition
    - **Property 12: Transition sang sent/signed ghi nhận metadata**
    - **Validates: Requirements 6.2, 6.3**
    - Kiểm tra `sent_at`/`sent_by` và `signed_at`/`signed_by` luôn được ghi khi chuyển trạng thái tương ứng

  - [ ]\* 10.5 Viết property test cho cancel yêu cầu lý do
    - **Property 14: Huỷ hợp đồng yêu cầu lý do**
    - **Validates: Requirements 6.5**
    - Kiểm tra mọi yêu cầu huỷ không có `cancel_reason` đều bị từ chối

  - [~] 10.6 Tạo Supabase scheduled function hoặc cron job cho auto-expiry
    - Query contracts có `expiry_date < CURRENT_DATE` và `status NOT IN ('signed', 'cancelled')`
    - Cập nhật `status = 'expired'` và ghi audit log
    - _Requirements: 6.4_

  - [ ]\* 10.7 Viết property test cho auto-expiry
    - **Property 13: Auto-expiry đúng điều kiện**
    - **Validates: Requirements 6.4**
    - Kiểm tra mọi Contract có `expiry_date < CURRENT_DATE` và status không phải `signed`/`cancelled` đều được cập nhật thành `expired`

- [ ] 11. Triển khai audit log
  - [~] 11.1 Implement hàm `writeAuditLog(contractId, action, oldValues, newValues, performedBy)` trong `contracts.service.ts`
    - Gọi hàm này sau mọi thao tác chỉnh sửa nội dung và chuyển trạng thái
    - _Requirements: 4.5_

  - [ ]\* 11.2 Viết property test cho audit log
    - **Property 9: Mọi thay đổi nội dung đều có audit log**
    - **Validates: Requirements 4.5**
    - Kiểm tra mọi thao tác chỉnh sửa thành công đều tạo ít nhất một entry trong `contract_audit_logs` với đúng `contract_id` và `performed_by`

- [ ] 12. Triển khai logic link/unlink Contract–Order
  - [~] 12.1 Implement `linkOrderToContract` và `unlinkOrderFromContract` với validation
    - Từ chối nếu Contract có `status = 'signed'`
    - Ghi audit log khi link/unlink
    - _Requirements: 8.1, 8.4_

  - [ ]\* 12.2 Viết property test cho link/unlink bị chặn khi đã ký
    - **Property 15: Liên kết Contract–Order bị chặn khi đã ký**
    - **Validates: Requirements 8.4**
    - Kiểm tra mọi thao tác link/unlink trên Contract `signed` đều bị từ chối; trên Contract chưa `signed` đều thành công

- [~] 13. Checkpoint cuối — Đảm bảo tất cả tests pass, hỏi người dùng nếu có thắc mắc.

## Ghi Chú

- Tasks đánh dấu `*` là optional, có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Property tests dùng thư viện [fast-check](https://github.com/dubzzz/fast-check), chạy tối thiểu 100 iterations mỗi property
- Unit tests dùng Vitest
- Tag format cho property tests: `// Feature: auto-contract-generation, Property {N}: {property_text}`
