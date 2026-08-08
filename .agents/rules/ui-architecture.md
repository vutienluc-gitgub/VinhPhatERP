# VinhPhatERP UI Architecture Guard — Zero-Tolerance Enforcement

**Nguyên tắc cốt lõi:**
Mọi UI code phải sử dụng Semantic Design Tokens. Mọi CSS phải tuân thủ Theme Contract. Mọi component lõi phải expose API có kiểm soát. Mọi thay đổi phải vượt qua Static Analysis, Type Safety, Automated Tests và Visual Regression trước khi được phép merge.

## 1. Phân loại className

**Được phép (Composition / Layout):**

- Layout: `flex`, `grid`, `w-full`, `md:w-auto`, `col-span-2`
- Spacing: `gap-2`, `p-4`, `mt-2`
  _(Layout composition không phải là theme customization)_

**Nghiêm cấm (Theme / Visual Override / Forbidden Utilities):**

- Hardcoded colors: `bg-white`, `bg-black`, `text-black`, `text-white`
- Thang màu mặc định: `text-gray-50`, `border-gray-100`, `bg-gray-900`
- Mã màu tĩnh: `bg-[#...]`, `rgb(...)`, `rgba(...)`
  _(Đây là các tiện ích phá vỡ Semantic Styling)_

## 2. Component Encapsulation & Finite State

- Không dùng tuỳ ý các màu cho UI Component, mà phải truyền đạt "ý nghĩa" (ngữ nghĩa).
- Component lõi áp dụng mô hình CVA (Class Variance Authority) để giới hạn trạng thái.
- Ví dụ CVA Button:
  `<Button variant="danger" size="lg" />`
  Tuyệt đối không được phép: `<Button className="bg-red-500 text-white" />`
- Component API cần được kiểm soát chặt chẽ để dev không thể tự do chèn các Forbidden Utilities.

## 3. CSS & Stylelint

- Stylelint đóng vai trò kiểm soát ở tầng `.css`, `.module.css`.
- Cấm mọi khai báo màu HEX/RGB trực tiếp: `color: white;`, `background: #101e34;`
- Bắt buộc dùng Token: `color: var(--foreground);`, `background: var(--surface);`
- **Ngoại lệ có kiểm soát (Controlled Exceptions):** Đối với Brand Asset hoặc Data Visualization, màu tĩnh (HEX) được phép dùng nhưng phải khai báo tường minh qua comment: `/* @architecture-exception: brand-color */`. Không được tự ý disable lint âm thầm.

## 4. Theme Contract Test

- Phải đảm bảo Token tồn tại đối xứng ở cả 2 môi trường (Light / Dark).
- Bắt buộc mọi `--var` khai báo ở `[data-theme="light"]` phải có mặt ở `[data-theme="dark"]`. Không được phép thiếu token.

## 5. Visual Regression Testing

- Áp dụng kiểm thử giao diện phân lớp (Không chạy bừa bãi tránh Flaky và CI chậm).
- **PR:** Test 10-20 critical screens (Light + Dark).
- **Nightly:** Test toàn bộ critical routes.
- **Release:** Test full visual suite.
- Set threshold hợp lý chấp nhận sự khác biệt nhỏ về pixel (do font rendering, browser antialiasing), ignore các vùng animation/dynamic data.
- Bắt lỗi cực nhạy với: background, text, border, layout, spacing, z-index, visibility.

## 6. The CI Iron Gate

- Husky/Pre-push chỉ là công cụ hỗ trợ trải nghiệm của developer. Không phải màng lọc an ninh.
- **GitHub Branch Protection + Required Status Checks** mới là rào chắn kỹ thuật (Architecture Enforcement Boundary).
- Mọi Pull Request phải vượt qua Pipeline khép kín:
  `TypeCheck -> ESLint -> Stylelint -> Unit Test -> Playwright -> Visual Regression -> Build -> Merge`.
