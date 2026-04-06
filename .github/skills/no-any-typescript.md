# Skill: Không dùng any trong TypeScript

- Không được dùng any trong mọi tình huống.
- Nếu không rõ kiểu, phải xác định lại model hoặc hỏi user.
- Ưu tiên dùng các type đã có trong models hoặc schema.
- Nếu gặp dữ liệu động, dùng Record<string, unknown> hoặc unknown, sau đó validate bằng schema (Zod, Yup...).
- Trước khi báo hoàn thành, luôn kiểm tra eslint --max-warnings 0 và sửa hết lỗi.
- Không dùng // eslint-disable hoặc @ts-ignore để lách luật.
- Code sinh ra phải pass strict mode của TypeScript và eslint.
