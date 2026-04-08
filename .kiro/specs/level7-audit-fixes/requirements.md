# Tài liệu Yêu cầu — Level 7 Audit Fixes

## Giới thiệu

Spec này tổng hợp toàn bộ các vấn đề được phát hiện trong kết quả audit Level 7 của dự án VinhPhat ERP v2.
Mục tiêu là đưa codebase về trạng thái: TypeScript build thành công (0 lỗi), test suite xanh hoàn toàn,
tuân thủ coding rules (no-any, Zod validation, no cross-feature imports), và không còn lỗ hổng bảo mật đã biết.

Các yêu cầu được chia thành các mini-task độc lập, sắp xếp theo thứ tự ưu tiên từ CRITICAL đến MINOR.
Mỗi task có thể được thực hiện và review riêng lẻ mà không ảnh hưởng đến các task khác.

---

## Bảng chú giải (Glossary)

- **Module_File**: File `*.module.ts` hoặc `*.module.tsx` trong `src/features/*/`, đóng vai trò barrel export và đăng ký plugin cho feature đó.
- **FormValues_Type**: Kiểu TypeScript được infer từ Zod schema (ví dụ: `z.infer<typeof paymentsSchema>`), dùng làm kiểu dữ liệu cho React Hook Form.
- **FeaturePlugin**: Interface `FeaturePlugin` trong `src/shared/lib/FeatureRegistry.ts`, định nghĩa cấu trúc đăng ký một feature vào hệ thống navigation và routing.
- **Zod_Schema**: Schema định nghĩa bằng thư viện Zod, dùng để validate dữ liệu runtime.
- **API_Layer**: Các file trong `src/api/*.ts`, chịu trách nhiệm giao tiếp với Supabase.
- **TypeScript_Build**: Quá trình chạy `tsc --noEmit -p tsconfig.app.json`, phải hoàn thành với 0 lỗi.
- **Test_Suite**: Toàn bộ test files chạy bằng `vitest run`, phải pass 100%.
- **Cross_Feature_Import**: Việc một feature trong `src/features/A/` import trực tiếp từ `src/features/B/` (vi phạm kiến trúc module).
- **Balance_Due**: Số tiền còn lại phải thu = `total_amount - paid_amount` của một đơn hàng.
- **Overpayment**: Trường hợp số tiền thu (`amount`) vượt quá `balance_due`, vi phạm nghiệp vụ.
- **eslint-plugin-boundaries**: ESLint plugin đã được cài đặt (`devDependencies`) nhưng chưa được cấu hình trong `.eslintrc.cjs`.

---

## Yêu cầu

### Yêu cầu 1 — CRITICAL-01-A: Sửa Missing Exports trong Module Files (TS2614)

**User Story:** Là một developer, tôi muốn TypeScript build thành công, để có thể deploy ứng dụng và CI/CD không bị block.

#### Tiêu chí chấp nhận

1. THE Module_File `payments.module.ts` SHALL export các kiểu `PaymentsFormValues`, `AccountFormValues`, `ExpenseFormValues` (đã được định nghĩa trong `src/schema/payment.schema.ts`).
2. THE Module_File `orders.module.ts` SHALL export kiểu `OrdersFormValues` (infer từ `ordersSchema`).
3. THE Module_File `shipments.module.ts` SHALL export các kiểu `ShipmentsFormValues`, `DeliveryConfirmFormValues` (infer từ các schema tương ứng trong `src/schema/shipment.schema.ts`).
4. THE Module_File `raw-fabric.module.ts` SHALL export các kiểu `RawFabricFormValues`, `BulkInputFormValues`.
5. THE Module_File `finished-fabric.module.ts` SHALL export các kiểu `FinishedFabricFormValues`, `BulkFinishedInputFormValues`.
6. THE Module_File `work-orders.module.ts` SHALL export các kiểu `CreateWorkOrderInput`, `CompleteWorkOrderInput`.
7. THE Module_File `fabric-catalog.module.ts` SHALL export kiểu `FabricCatalogFormValues`.
8. THE Module_File `yarn-catalog.module.ts` SHALL export kiểu `YarnCatalogFormValues`.
9. THE Module_File `yarn-receipts.module.ts` SHALL export kiểu `YarnReceiptsFormValues`.
10. THE Module_File `quotations.module.ts` SHALL export kiểu `QuotationsFormValues`.
11. THE Module_File `shipping-rates.module.ts` SHALL export kiểu `ShippingRateFormValues`.
12. WHEN `tsc --noEmit -p tsconfig.app.json` được chạy sau khi áp dụng các thay đổi trên, THE TypeScript_Build SHALL hoàn thành với 0 lỗi TS2614.

---

### Yêu cầu 2 — CRITICAL-01-B: Sửa Implicit Any trong Callbacks (TS7006)

**User Story:** Là một developer, tôi muốn không còn lỗi `implicit any`, để tuân thủ coding rule "không dùng `any`" và TypeScript strict mode.

#### Tiêu chí chấp nhận

1. THE file `useOrders.ts` SHALL khai báo kiểu tường minh cho tất cả các tham số callback (`.map()`, `.filter()`, `.find()`, v.v.) thay vì để TypeScript infer là `any`.
2. THE file `useShipments.ts` SHALL khai báo kiểu tường minh cho tất cả các tham số callback.
3. THE file `useYarnReceipts.ts` SHALL khai báo kiểu tường minh cho tất cả các tham số callback.
4. THE file `WorkOrderYarnTable.tsx` SHALL khai báo kiểu tường minh cho tất cả các tham số callback.
5. THE file `FinishedFabricBulkForm.tsx` SHALL khai báo kiểu tường minh cho tất cả các tham số callback.
6. THE file `RawFabricBulkForm.tsx` SHALL khai báo kiểu tường minh cho tất cả các tham số callback.
7. THE file `OrderForm.tsx` SHALL khai báo kiểu tường minh cho tất cả các tham số callback.
8. THE file `ShipmentForm.tsx` SHALL khai báo kiểu tường minh cho tất cả các tham số callback.
9. THE file `YarnReceiptForm.tsx` SHALL khai báo kiểu tường minh cho tất cả các tham số callback.
10. THE file `useQuotations.ts` SHALL khai báo kiểu tường minh cho tất cả các tham số callback.
11. THE file `useCreateOrderV2.ts` SHALL khai báo kiểu tường minh cho tất cả các tham số callback.
12. WHEN `tsc --noEmit -p tsconfig.app.json` được chạy sau khi áp dụng các thay đổi, THE TypeScript_Build SHALL hoàn thành với 0 lỗi TS7006.

---

### Yêu cầu 3 — CRITICAL-01-C: Sửa Type Mismatch và Duplicate Exports (TS2322)

**User Story:** Là một developer, tôi muốn không còn lỗi type mismatch, để TypeScript build thành công và hệ thống routing hoạt động đúng.

#### Tiêu chí chấp nhận

1. THE Module_File `customers.module.tsx` SHALL sử dụng giá trị `group` hợp lệ theo union type của `FeaturePlugin['group']` (các giá trị hợp lệ: `'sales' | 'production' | 'master-data' | 'system'`). Giá trị `'partners'` hiện tại SHALL được thay thế bằng giá trị phù hợp.
2. THE Module_File `reports.module.ts` SHALL sử dụng giá trị `group` hợp lệ. Giá trị `'admin'` hiện tại SHALL được thay thế bằng giá trị phù hợp.
3. THE Module_File `settings.module.ts` SHALL sử dụng giá trị `group` hợp lệ. Giá trị `'admin'` hiện tại SHALL được thay thế bằng giá trị phù hợp.
4. THE Module_File `orders.module.ts` SHALL export component đúng kiểu `() => Promise<{ default: React.ComponentType }>` theo yêu cầu của `FeaturePlugin.component`.
5. THE file `FeatureScaffoldPage.tsx` SHALL xử lý trường hợp `highlights` và `resources` có thể là `undefined` trước khi render, tránh lỗi TS2322.
6. THE file `order-progress/index.ts` SHALL không có duplicate exports — mỗi symbol chỉ được export một lần.
7. THE file `payments/index.ts` SHALL không có duplicate exports cho `Payment`, `Expense`, `PaymentAccount` — mỗi symbol chỉ được export một lần.
8. WHEN `tsc --noEmit -p tsconfig.app.json` được chạy sau khi áp dụng các thay đổi, THE TypeScript_Build SHALL hoàn thành với 0 lỗi TS2322.

---

### Yêu cầu 4 — CRITICAL-01-D: Sửa Missing Properties trên CreateOrderInput (TS2339)

**User Story:** Là một developer, tôi muốn `useCreateOrderV2.ts` compile thành công, để tính năng tạo đơn hàng v2 hoạt động đúng.

#### Tiêu chí chấp nhận

1. THE type `CreateOrderInput` (hoặc interface tương đương được dùng trong `useCreateOrderV2.ts`) SHALL bao gồm tất cả các properties mà `useCreateOrderV2.ts` đang truy cập.
2. IF `CreateOrderInput` thiếu properties, THEN THE developer SHALL thêm các properties còn thiếu vào type definition thay vì dùng type assertion `as`.
3. WHEN `tsc --noEmit -p tsconfig.app.json` được chạy sau khi áp dụng các thay đổi, THE TypeScript_Build SHALL hoàn thành với 0 lỗi TS2339 liên quan đến `useCreateOrderV2.ts`.

---

### Yêu cầu 5 — CRITICAL-02-A: Sửa Test Failures do `createModule is not a function`

**User Story:** Là một developer, tôi muốn test suite chạy xanh hoàn toàn, để có thể phát hiện regression sớm và CI/CD không bị block.

#### Tiêu chí chấp nhận

1. THE Test_Suite file `orders.module.test.ts` SHALL pass hoàn toàn khi chạy `vitest run`.
2. THE Test_Suite file `quotations.module.test.ts` SHALL pass hoàn toàn khi chạy `vitest run`.
3. THE Test_Suite file `raw-fabric.module.test.ts` SHALL pass hoàn toàn khi chạy `vitest run`.
4. THE Test_Suite file `suppliers.module.test.ts` SHALL pass hoàn toàn khi chạy `vitest run`.
5. IF `createModule` được import trong test environment và gây lỗi `TypeError: createModule is not a function`, THEN THE fix SHALL đảm bảo `createModule` được export đúng cách từ `src/core/registry/moduleRegistry.ts` và có thể được mock hoặc sử dụng trong Vitest environment.
6. WHEN `vitest run` được chạy, THE Test_Suite SHALL báo cáo 0 failures cho 4 test files trên.

---

### Yêu cầu 6 — CRITICAL-02-B: Sửa Test `ProtectedRoute.test.tsx` — Mock sai AuthContextValue

**User Story:** Là một developer, tôi muốn test `ProtectedRoute` phản ánh đúng interface thực tế, để test có giá trị và không bị false positive.

#### Tiêu chí chấp nhận

1. THE test file `ProtectedRoute.test.tsx` SHALL sử dụng mock `AuthContextValue` đúng với interface hiện tại trong `src/features/auth/AuthProvider.tsx`.
2. THE mock object SHALL bao gồm tất cả các properties bắt buộc của `AuthContextValue` bao gồm `profile`, `isBlocked` (và loại bỏ `isAdmin`, `isManager`, `isStaff` nếu không tồn tại trong interface thực tế).
3. WHEN `vitest run` được chạy, THE test file `ProtectedRoute.test.tsx` SHALL pass hoàn toàn.

---

### Yêu cầu 7 — CRITICAL-02-C: Sửa Test `DashboardPage.test.tsx` — Heading không khớp

**User Story:** Là một developer, tôi muốn test `DashboardPage` kiểm tra đúng nội dung component render ra, để test có giá trị thực sự.

#### Tiêu chí chấp nhận

1. THE test file `DashboardPage.test.tsx` SHALL kiểm tra heading hoặc text mà `DashboardPage` thực sự render ra (dựa trên source code hiện tại của component).
2. IF `DashboardPage` không render heading `"Dashboard"`, THEN THE test SHALL được cập nhật để tìm đúng text/heading mà component render.
3. IF `DashboardPage` cần render heading `"Dashboard"` theo thiết kế, THEN THE component SHALL được cập nhật để render heading đó.
4. WHEN `vitest run` được chạy, THE test file `DashboardPage.test.tsx` SHALL pass hoàn toàn.

---

### Yêu cầu 8 — MAJOR-01: Thêm Zod Validation cho Supabase API Responses

**User Story:** Là một developer, tôi muốn mọi dữ liệu từ Supabase đều được validate qua Zod schema, để phát hiện sớm data corruption và tuân thủ coding rule "luôn validate dữ liệu từ bên ngoài bằng Zod".

#### Tiêu chí chấp nhận

1. THE API_Layer SHALL không sử dụng pattern `as unknown as Type[]` để ép kiểu dữ liệu trả về từ Supabase mà không qua validation.
2. WHEN Supabase trả về data cho một query, THE API_Layer SHALL gọi `schema.parse(data)` hoặc `schema.array().parse(data)` trước khi return.
3. IF Supabase trả về data không khớp với Zod schema, THEN THE API_Layer SHALL throw một lỗi có thông điệp rõ ràng thay vì trả về dữ liệu sai kiểu.
4. THE Zod_Schema dùng để parse response SHALL được định nghĩa trong file schema tương ứng của feature (ví dụ: `src/schema/payment.schema.ts`), không được định nghĩa inline trong API file.
5. THE implementation SHALL ưu tiên các API files có lưu lượng cao nhất trước: `payments.api.ts`, `orders.api.ts`, `shipments.api.ts`, `customers.api.ts`.
6. WHEN `tsc --noEmit` được chạy sau khi áp dụng thay đổi, THE TypeScript_Build SHALL không có lỗi mới phát sinh từ việc thêm Zod parsing.

---

### Yêu cầu 9 — MAJOR-02: Loại bỏ Cross-Feature Imports và Cấu hình eslint-plugin-boundaries

**User Story:** Là một developer, tôi muốn các features không import chéo lẫn nhau, để kiến trúc module được bảo vệ và dễ maintain.

#### Tiêu chí chấp nhận

1. THE file `work-orders/WorkOrderForm.tsx` SHALL không import trực tiếp từ `src/features/bom/`, `src/features/orders/`, hoặc `src/features/suppliers/`. Dữ liệu cần thiết SHALL được truyền qua props hoặc lấy từ shared layer (`src/shared/`, `src/api/`, `src/models/`).
2. THE file `raw-fabric/RawFabricBulkForm.tsx` SHALL không import trực tiếp từ `src/features/fabric-catalog/`. Dữ liệu cần thiết SHALL được truyền qua props hoặc lấy từ shared layer.
3. THE file `shipments/ShipmentForm.tsx` SHALL không import trực tiếp từ `src/features/shipping-rates/`. Dữ liệu cần thiết SHALL được truyền qua props hoặc lấy từ shared layer.
4. THE file `weaving-invoices/WeavingInvoiceForm.tsx` SHALL không import trực tiếp từ `src/features/fabric-catalog/`. Dữ liệu cần thiết SHALL được truyền qua props hoặc lấy từ shared layer.
5. THE file `.eslintrc.cjs` SHALL được cấu hình để kích hoạt `eslint-plugin-boundaries` với rules ngăn chặn Cross_Feature_Import giữa các thư mục trong `src/features/`.
6. WHEN `npm run lint` được chạy sau khi cấu hình, THE ESLint SHALL báo lỗi (error, không phải warning) khi phát hiện Cross_Feature_Import mới.
7. WHEN `npm run lint` được chạy trên codebase đã được fix, THE ESLint SHALL không báo lỗi boundaries nào.

---

### Yêu cầu 10 — MAJOR-03: Validate Overpayment trong Payment Schema và Form

**User Story:** Là một kế toán, tôi muốn hệ thống ngăn chặn việc nhập số tiền thu vượt quá số tiền còn nợ, để tránh sai lệch sổ sách và vi phạm nghiệp vụ.

#### Tiêu chí chấp nhận

1. THE `paymentsSchema` trong `src/schema/payment.schema.ts` SHALL validate rằng `amount` phải lớn hơn 0 VÀ không được vượt quá `balanceDue` khi `balanceDue` được cung cấp.
2. WHEN `balanceDue` được truyền vào schema validation context, THE `paymentsSchema` SHALL reject bất kỳ `amount` nào lớn hơn `balanceDue` với thông báo lỗi rõ ràng bằng tiếng Việt.
3. THE `PaymentForm.tsx` SHALL hiển thị thông báo lỗi validation khi người dùng nhập `amount` vượt quá `balanceDue`.
4. THE `PaymentForm.tsx` SHALL set giá trị mặc định của trường `amount` bằng `balanceDue` (giữ nguyên behavior hiện tại).
5. IF `balanceDue` bằng 0 hoặc âm (đơn hàng đã thanh toán đủ), THEN THE `PaymentForm.tsx` SHALL hiển thị thông báo cho người dùng biết đơn hàng đã được thanh toán đầy đủ và không cho phép tạo phiếu thu mới.
6. THE database SHALL có constraint hoặc trigger ngăn chặn việc insert một payment record có `amount > (total_amount - paid_amount)` của order tương ứng. (Lưu ý: thay đổi DB cần được confirm trước khi thực hiện theo rule `no-db-change-without-confirm`.)
7. WHEN một payment hợp lệ được tạo (amount ≤ balanceDue), THE system SHALL xử lý bình thường như hiện tại.

---

### Yêu cầu 11 — MINOR-01: Vá Lỗ Hổng Bảo Mật trong Dependencies

**User Story:** Là một developer, tôi muốn không còn known vulnerabilities trong dependencies, để tuân thủ security policy của dự án.

#### Tiêu chí chấp nhận

1. THE project SHALL không có moderate hoặc high severity vulnerabilities trong `npm audit` output liên quan đến `esbuild <=0.24.2`.
2. THE project SHALL không có moderate hoặc high severity vulnerabilities trong `npm audit` output liên quan đến `brace-expansion <1.1.13`.
3. WHEN `npm audit` được chạy sau khi update, THE output SHALL báo cáo 0 moderate/high/critical vulnerabilities.
4. WHEN `npm run build` được chạy sau khi update dependencies, THE build SHALL hoàn thành thành công.
5. WHEN `vitest run` được chạy sau khi update dependencies, THE Test_Suite SHALL không có test failures mới phát sinh từ việc update.

---

### Yêu cầu 12 — MINOR-02: Xử lý ESLint Warnings

**User Story:** Là một developer, tôi muốn không còn ESLint warnings trong codebase, để code sạch và dễ phát hiện vấn đề thực sự.

#### Tiêu chí chấp nhận

1. THE file `customers.module.tsx` SHALL không có unused imports (`lazy`, `LazyPage`) — các import không được sử dụng SHALL được xóa.
2. THE codebase SHALL không có `no-unused-vars` warnings cho các biến/import không được sử dụng trong tất cả các files được liệt kê trong audit.
3. THE codebase SHALL tuân thủ `import/order` rule — các import SHALL được sắp xếp theo thứ tự: builtin → external → internal, với newline phân cách giữa các nhóm.
4. THE codebase SHALL không có `react-refresh/only-export-components` warnings không cần thiết.
5. WHEN `npm run lint` được chạy sau khi áp dụng các thay đổi, THE ESLint SHALL báo cáo 0 warnings cho các files đã được fix.
6. THE fix SHALL không tắt ESLint rules bằng `// eslint-disable` comment mà không có lý do ghi rõ.
