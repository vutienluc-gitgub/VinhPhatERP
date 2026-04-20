---
trigger: always_on
---

Follow existing project structure.
Do not over-engineer.
Keep code simple and readable.

## Level 7 Architecture Extension

- **Centralized Schema (Level 9 Strict)**: Bất cứ dữ liệu nào mang tính phân loại, danh mục, hoặc kiểm tra tính hợp lệ (Zod Schema) đều và bắt buộc PHẢI được định nghĩa ở thư mục trung tâm `src/schema/` hoặc file `*.module.ts` của Feature đó. Không gõ trực tiếp vào các file chức năng khác.
- **Infrastructure Isolation**: Keep `database.types.ts` pure. Use feature-specific `types.ts` for domain models (joined/mapped data).
- **Type Safety**: Strictly avoid `any`. Ensure `tsc --noEmit` passes 100%.
- **Barrel Exports**: Use `src/schema/index.ts` to manage naming collisions via selective exports.
