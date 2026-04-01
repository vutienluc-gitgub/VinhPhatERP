# Module Auth

## Vai tro

Module nay quan ly dang nhap, session, profile nguoi dung va phan quyen truy cap trong toan bo he thong.

## Muc tieu

- Dang nhap va dang xuat
- Khoi phuc session sau khi refresh
- Quan ly role theo `profiles`
- Bao ve route va dieu huong theo quyen

## Du lieu chinh

- Email
- Mat khau
- Session
- Profile
- Role
- Trang thai active/inactive

## Man hinh can co

- Man hinh dang nhap
- Trang thai unauthorized
- Trang thong tin tai khoan co ban

## Phan tich chuc nang chi tiet

### 1. Dang nhap

- Nguoi dung dang nhap bang email va mat khau
- Input dang nhap da duoc mo hinh hoa bang Zod schema trong `src/features/auth/auth.module.ts`
- Co truong `rememberMe` de ho tro session dai hon tren trinh duyet

Trang thai hien tai:

- Da co schema validate email va password
- Chua co form login that
- Chua goi Supabase Auth de dang nhap

### 2. Quan ly session

- Session du kien duoc quan ly boi Supabase Auth
- App can co kha nang khoi phuc session sau khi refresh trang
- App can co auth state listener de cap nhat UI theo session hien tai

Trang thai hien tai:

- Da co route `/auth`
- Chua co Supabase browser client that
- Chua co `getSession()` hoac `onAuthStateChange()` trong `AppProviders`

### 3. Quan ly profile va role

- He thong tach rieng `auth.users` va bang `profiles`
- `profiles` chua thong tin nghiep vu: `full_name`, `role`, `phone`, `avatar_url`, `is_active`
- Role duoc dung de xac dinh quyen truy cap vao kho, ban hang va cai dat

Trang thai hien tai:

- Da co bang `profiles` trong migration
- Da co trigger tu tao profile khi auth user duoc tao
- Chua co flow tai profile sau khi dang nhap o frontend

### 4. Phan quyen va bao ve route

- Auth can bao ve cac route nghiep vu khoi truy cap trai phep
- Auth can an/hien menu theo role
- Auth can co man hinh unauthorized khi user khong du quyen

Trang thai hien tai:

- Da co metadata route va navigation cho auth
- Chua co route guard that
- Chua co role-aware navigation trong `AppShell`
- Chua co man hinh unauthorized that

### 5. Khoa tai khoan noi bo

- Truong `is_active` cho phep khoa user o tang nghiep vu ma khong can xoa tai khoan auth
- Day la co che can thiet voi he thong noi bo doanh nghiep

Trang thai hien tai:

- Da co cot `is_active` trong `profiles`
- Chua co logic frontend/backend de chan user inactive su dung he thong

## Business rules

- Nguoi dung phai dang nhap truoc khi vao module nghiep vu
- Role lay tu bang `profiles`, khong hardcode o frontend
- `viewer` chi duoc xem
- `staff` duoc thao tac nghiep vu kho va ban hang
- `manager` va `admin` co them quyen quan tri
- Tai khoan inactive khong duoc truy cap he thong

## Diem manh

- Thiet ke tach dung giua xac thuc va ho so nghiep vu: `auth.users` dung cho danh tinh, `profiles` dung cho role va thong tin noi bo
- Da co enum `user_role` trong database, giup role nhat quan va tranh hardcode tuy tien
- Da co trigger tu dong tao profile khi user moi duoc tao, giam nguy co lech du lieu
- Da co validate dau vao bang Zod cho email, password va `rememberMe`
- Da bat Row-Level Security tren toan bo bang lien quan
- Da co ham `current_user_role()` de database tu quyet dinh quyen thay vi tin vao frontend
- Da co policies cho `profiles` va `settings`, va generic policies cho cac bang nghiep vu
- Da co huong thiet ke ro rang cho route guard va permission-aware navigation

## Diem yeu

- Frontend auth hien tai moi la scaffold, chua co login/logout that
- Chua co Supabase browser client trong `src/services/supabase/client.ts`
- Chua co session bootstrap va auth state listener trong `src/app/providers/AppProviders.tsx`
- Chua co route guard that trong `src/app/router/routes.tsx`
- Chua co an/hien navigation theo role trong `src/app/layouts/AppShell.tsx`
- Chua co unauthorized page that de xu ly truy cap sai quyen
- Chua co logic chan tai khoan `is_active = false`
- Chua co audit log cho su kien dang nhap, doi role, khoa tai khoan
- Policy `Users can view all profiles` la rong, co the can siet lai neu muon giam lo thong tin noi bo

## Cong nghe bao mat dang duoc ap dung

### 1. Supabase Auth

- Duoc chon lam nen tang xac thuc cho he thong
- Phu hop voi email/password auth va session management

### 2. Row-Level Security (RLS)

- Da duoc bat cho `profiles`, `customers`, `suppliers`, `orders`, `payments`, `settings` va cac bang nghiep vu khac
- Day la lop bao mat quan trong nhat o tang database
- RLS giup backend tu chan truy cap trai phep, khong phu thuoc vao frontend

### 3. Role-Based Access Control (RBAC)

- Dung enum `user_role` gom `admin`, `manager`, `staff`, `viewer`
- Role duoc lay tu bang `profiles`
- Policies duoc quyet dinh bang `current_user_role()`

### 4. Policy dua tren `auth.uid()`

- User chi duoc sua profile cua chinh minh
- Day la co che kiem soat truy cap theo danh tinh user dang dang nhap

### 5. Security definer functions

- `handle_new_user()` tu dong tao profile sau khi co auth user moi
- `current_user_role()` lay role cua user hien tai de dung trong policy

### 6. Input validation bang Zod

- Email duoc validate dung dinh dang
- Password co rang buoc toi thieu 8 ky tu
- Giam loi input sai truoc khi gui request len backend

### 7. Secret management co ban

- Frontend chi dung `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY`
- Khong co dau hieu dung `service_role` key o frontend

## Cong nghe bao mat nen bo sung tiep

- Supabase auth state listener trong `AppProviders`
- Route guard that cho cac route nghiep vu
- Permission-aware navigation trong `AppShell`
- Kiem tra `is_active` ngay sau khi lay `profiles`
- Unauthorized page ro rang cho user khong du quyen
- Audit trail cho login, logout, doi role, khoa tai khoan
- Co che gioi han hien thi profile neu muon siet du lieu noi bo

## Danh gia tong the

Module Auth hien co nen tang backend va schema bao mat kha tot, dac biet la phan `profiles`, RLS va RBAC. Day la phan kho nhat va quan trong nhat trong thiet ke, va du an da di dung huong.

Diem con thieu nam o frontend: chua co login that, chua co session restore, chua co route guard va chua co role-aware UI. Nghia la ve mat thiet ke bao mat, module nay manh o tang database, nhung ve mat trai nghiem va enforcement o client thi van dang o giai doan scaffold.

Neu trien khai tiep dung thu tu, uu tien hop ly la:

1. Tao Supabase client that
2. Them login/logout va session restore
3. Tai profile sau dang nhap
4. Them route guard va unauthorized state
5. An/hien navigation theo role

## Phu thuoc

- Supabase Auth
- Profiles
- App Router
- App Shell
- Settings

## File lien quan

- src/features/auth/AuthPage.tsx
- src/features/auth/auth.module.ts
- src/app/providers/AppProviders.tsx
- src/app/router/routes.tsx
- src/app/layouts/AppShell.tsx
- src/services/supabase/client.ts
