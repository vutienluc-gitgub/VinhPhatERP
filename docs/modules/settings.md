# Module Settings

## Vai tro

Module nay quan ly cac cau hinh he thong can thiet cho van hanh, bao gom thong tin cong ty, prefix chung tu, env diagnostics va cac guardrails quan tri.

## Muc tieu

- Quan ly company info co ban
- Quan ly prefix cho don hang, phieu xuat, phieu thu, phieu nhap
- Kiem tra tinh trang env va ket noi he thong
- Danh dau cac cai dat chi admin duoc thay doi

## Du lieu chinh

- Ten cong ty
- Dia chi
- So dien thoai
- Ma so thue
- Don vi tien te
- Order prefix
- Shipment prefix
- Payment prefix
- Receipt prefix

## Man hinh can co

- Trang tong hop settings
- Form company settings
- Khu diagnostics cho env/auth/offline queue

## Phan tich chuc nang chi tiet

### 1. Quan ly thong tin cong ty

- Module nay luu cac thong tin nen dung chung cho toan he thong
- Bao gom ten cong ty, dia chi, so dien thoai, ma so thue va don vi tien te
- Day la du lieu nen de in chung tu, hien thi dashboard va thong nhat nghiep vu

Trang thai hien tai:

- Da co bang `settings` trong database
- Da co seed data mac dinh cho company info
- Chua co form CRUD that tren frontend de cap nhat gia tri nay

### 2. Quan ly prefix chung tu

- Settings dang giu prefix cho don hang, phieu xuat, phieu thu va phieu nhap soi
- Day la tham so nghiep vu quan trong de sinh so chung tu nhat quan

Trang thai hien tai:

- Da co cac key `order_number_prefix`, `shipment_number_prefix`, `payment_number_prefix`, `receipt_number_prefix`
- Chua co logic frontend/backend sinh so chung tu dua tren prefix
- Chua co man hinh de admin thay doi prefix an toan

### 3. Diagnostics he thong

- Settings du kien dong vai tro mot trang health-check co ban
- Hien tai page da kiem tra mot thong tin rat co ban: env Supabase co ton tai hay khong
- Ve sau can mo rong them auth diagnostics, queue diagnostics va rollout checks

Trang thai hien tai:

- `SettingsPage` da hien thi `hasSupabaseEnv()`
- Chua co ket noi den Supabase de kiem tra suc khoe that
- Chua co diagnostics cho auth, queue hay sync

### 4. Quan tri va guardrails

- Module nay la noi tap trung cho cac cai dat nhay cam
- Ve mat nghiep vu, day la khu vuc chi admin nen thao tac
- Settings can giup phat hien cau hinh sai truoc khi di vao van hanh

Trang thai hien tai:

- Database da co policy chi admin moi duoc manage settings
- Frontend chua co route guard that cho `Settings`
- Navigation chua duoc an/hien theo role

### 5. Nguon cau hinh dung chung cho giao dich

- Cac module Orders, Shipments, Payments, Yarn Receipts phu thuoc vao settings de thong nhat prefix va metadata cong ty
- Neu settings sai hoac thieu, du lieu giao dich van co the chay, nhung chung tu se mat tinh nhat quan

Trang thai hien tai:

- Settings da ton tai o DB va co seed data
- Chua co co che load settings vao app shell hoac form giao dich

## Business rules

- Chi `admin` moi duoc sua settings
- Prefix chung tu phai duoc cau hinh ro rang va on dinh
- Neu env hoac ket noi chua san sang, can hien canh bao ro rang
- Settings la nguon du lieu dung chung cho cac module giao dich

## Diem manh

- Da co bang `settings` rieng, phu hop cho cau hinh he thong dung chung
- Da co seed data mac dinh, giup app co gia tri khoi tao ro rang ngay tu dau
- Da co trigger `updated_at`, giup theo doi thay doi cau hinh tot hon
- Da co policy tach rieng cho settings: authenticated duoc doc, chi admin duoc quan ly
- Frontend da co schema Zod cho cac truong cau hinh co ban trong `src/features/settings/settings.module.ts`
- SettingsPage da bat dau dong vai tro diagnostics voi `hasSupabaseEnv()`
- Module da duoc tach khoi nghiep vu giao dich, giup quy tac quan tri ro rang hon

## Diem yeu

- Frontend hien tai chi la scaffold, chua co form load/save settings that
- Chua co route guard that cho admin-only page
- Chua co role-aware navigation de an `Settings` voi user khong du quyen
- Bang `settings` dang dung mo hinh key-value `text`, de linh hoat nhung de gay loi typo va yeu type-safety o tang app
- Chua co validation theo tung key o backend, moi chi co validation mot phan o frontend schema
- Chua co phan loai settings theo nhom: company, numbering, diagnostics, feature flags
- Chua co audit log cho thay doi cau hinh nhay cam
- Chua co health checks that cho auth, queue, sync va database availability

## Cong nghe bao mat dang duoc ap dung

### 1. Row-Level Security (RLS)

- Bang `settings` da bat RLS trong migration
- Day la lop bao mat chinh giup chan user khong du quyen thao tac truc tiep tren du lieu cau hinh

### 2. Role-Based Access Control (RBAC)

- Policy `Admins can manage settings` dua tren `current_user_role()`
- Chi `admin` duoc insert/update/delete settings
- Day la mo hinh phu hop vi settings la du lieu quan tri he thong

### 3. Policy read-only cho authenticated users

- User da dang nhap duoc phep doc settings
- Dieu nay hop ly vi nhieu gia tri trong settings can duoc su dung boi toan bo app

### 4. Input validation bang Zod

- `settingsSchema` da validate company name, phone, currency va cac prefix
- Day la lop validation can thiet truoc khi gui request len backend

### 5. Secret management co ban

- Page settings dang doc tinh trang env thong qua `hasSupabaseEnv()`
- Frontend chi dung `anon key`, khong co dau hieu dung `service_role` key

## Cong nghe bao mat nen bo sung tiep

- Route guard that chi cho `admin` vao `Settings`
- Permission-aware navigation de user thuong khong thay menu settings
- Audit trail cho thay doi config, dac biet la prefix va company info
- Validation theo tung key o service layer hoac backend layer
- Tach diagnostics thanh cac nhom: env, auth, queue, sync, database
- Canh bao thay doi cau hinh nhay cam truoc khi luu

## Danh gia tong the

Module Settings hien co nen backend va policy kha tot cho mot trang quan tri: da co bang rieng, seed data, RLS va admin-only manage policy. Ve huong thiet ke, day la mot diem manh vi cac cau hinh dung chung da duoc dua ve mot noi.

Diem yeu nam o frontend va van hanh: hien tai page moi dung o muc scaffold va diagnostics env rat co ban. Chua co load/save settings that, chua co route guard cho admin, chua co health checks da chieu va chua co audit trail cho thay doi cau hinh.

Neu trien khai tiep dung thu tu, uu tien hop ly la:

1. Load settings tu Supabase vao page
2. Tao form update settings cho admin
3. Them route guard va an/hien menu theo role
4. Tach diagnostics thanh env, auth, queue, sync
5. Bo sung audit trail cho cac thay doi nhay cam

## Phu thuoc

- Auth
- Orders
- Shipments
- Payments
- Yarn Receipts

## File lien quan

- src/features/settings/SettingsPage.tsx
- src/features/settings/settings.module.ts
- src/services/supabase/client.ts
- src/app/layouts/AppShell.tsx
