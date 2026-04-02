# Lệnh chạy dự án

## Chạy lần đầu

```powershell
cd d:\hoa-luc\vinhphat-app-v2
npm install
npm run dev
```

## Giải thích ngắn gọn

- `cd d:\hoa-luc\vinhphat-app-v2`: di chuyển terminal vào đúng thư mục dự án.
- `npm install`: cài đặt toàn bộ thư viện được khai báo trong `package.json`.
- `npm run dev`: khởi động Vite development server để xem giao diện local.

## Sau khi chạy

- Terminal sẽ hiện một đường dẫn như `http://localhost:5173/`.
- Mở đường dẫn đó trong trình duyệt để xem giao diện.

## Những lần chạy sau

Nếu đã cài thư viện rồi, chỉ cần chạy:

```powershell
cd d:\hoa-luc\vinhphat-app-v2
npm run dev
```

### Tóm tắt 4 lệnh database

| Lệnh                           | Ý nghĩa                                  |
| ------------------------------ | ---------------------------------------- |
| `npm run db:new ten_migration` | Tạo file migration mới                   |
| `npm run db:push`              | Đẩy migration lên Supabase/Postgres thật |
| `npm run db:reload`            | Cập nhật lại schema cache cho API        |
| `npm run db:status`            | Kiểm tra migration đã chạy chưa          |

## Một số lệnh hữu ích khác

```powershell
npm run build
npm run preview
npm run test
npm run test:watch
npm run typecheck
npm run lint
```

- `npm run build`: build bản production.
- `npm run preview`: chạy bản build để xem gần giống production.
- `npm run test`: chạy toàn bộ frontend test một lần.
- `npm run test:watch`: chạy test ở watch mode trong lúc code.
- `npm run typecheck`: kiểm tra lỗi TypeScript.
- `npm run lint`: kiểm tra lỗi code style và rule ESLint.

## Quy trình test sau mỗi lần coding

Nếu chỉ sửa frontend:

```powershell
npm run test
npm run typecheck
npm run lint
npm run build
```

Nếu có sửa backend trong `server`:

```powershell
npm run typecheck:server
npm run build:server
```
