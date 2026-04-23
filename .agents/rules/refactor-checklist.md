---
trigger: always_on
---

# 🧠 ERP Refactor Checklist (STRICT - PRODUCTION LEVEL)

## 🚨 GLOBAL RULE

- Nếu bất kỳ mục nào vi phạm → ❌ INVALID
- BẮT BUỘC refactor ngay
- KHÔNG được phép "để sau"
- Code chưa refactor = chưa hoàn thành

---

# 1. Duplicate Code

- Có đoạn code lặp > 10 dòng không?
- Có logic giống nhau ở nhiều file không?
- Có copy-paste component không?

✅ Action:

- Extract thành function / hook / component

❌ INVALID nếu không xử lý

---

# 2. String Reuse (Text / Tiếng Việt)

- Có text lặp lại ≥ 2 lần không?
- Có label / message bị hardcode không?

✅ Action:

- Đưa vào constants (MESSAGES, LABELS)

❌ INVALID nếu còn lặp

---

# 3. Business Logic in UI

- UI có chứa:
  - tính toán?
  - transform data?
  - filter / map phức tạp?
  - validation?

✅ Action:

- Di chuyển sang:
  - service
  - hook (useSomething)

❌ INVALID nếu UI còn logic

---

# 4. Validation

- Có validate kiểu:
  - if (!value)
  - length check
  - manual validation?

✅ Action:

- Dùng schema (Zod)
- Centralized schema

❌ INVALID nếu còn manual validation

---

# 5. Naming

- Có biến kiểu:
  - data, data1, tmp, test, abc

✅ Action:

- Rename theo domain:
  - weavingRoll
  - fabricBatch
  - supplierInvoice

❌ INVALID nếu còn tên generic

---

# 6. Database Safety (CRITICAL)

- Có dùng supabase.insert trực tiếp không?
- Có generate ID bằng Date.now() không?
- Có khả năng duplicate không?

✅ Action:

- Dùng safeUpsert
- Đảm bảo idempotent
- Không duplicate

❌ INVALID nếu unsafe

---

# 7. Error Handling

- Có chỗ nào không xử lý lỗi không?
- Có console.log thay vì throw không?

✅ Action:

- try/catch
- throw error rõ ràng
- user feedback

❌ INVALID nếu thiếu error handling

---

# 8. Async / Await

- Có thiếu await không?
- Có promise chưa handle không?

✅ Action:

- await đầy đủ
- tránh race condition

❌ INVALID nếu sai async

---

# 9. State Management

- Có state dư thừa không?
- Có state trùng không?
- Có prop drilling sâu không?

✅ Action:

- custom hook
- lift state
- tối ưu state

❌ INVALID nếu state lộn xộn

---

# 10. Side Effects

- Có logic nặng trong useEffect không?
- Có gọi API trực tiếp trong component không?

✅ Action:

- Tách ra service / hook

❌ INVALID nếu side-effect bẩn

---

# 11. Component Structure

- Component > 300 dòng?
- Có nhiều trách nhiệm?

✅ Action:

- Tách component
- container / presentational

❌ INVALID nếu component quá lớn

---

# 12. Reusability

- Có logic có thể reuse không?
- Có viết lại thay vì dùng lại không?

✅ Action:

- Tạo shared module

❌ INVALID nếu không reuse

---

# 13. Performance

- Có render thừa không?
- Có loop nặng không?

✅ Action:

- memo / debounce / lazy

❌ INVALID nếu performance kém

---

# 14. Type Safety

- Có dùng any không?
- Có thiếu type không?

✅ Action:

- dùng interface / type

❌ INVALID nếu dùng any

---

# 15. File Structure

- File đặt sai module không?
- Không theo feature structure?

✅ Action:

- move đúng structure

❌ INVALID nếu sai kiến trúc

---

# 16. Import / Dependency

- Có circular dependency không?
- Import sai layer không?

✅ Action:

- fix dependency

❌ INVALID nếu vi phạm

---

# 17. Hardcode

- Có hardcode:
  - URL
  - config
  - magic number

✅ Action:

- đưa vào config/constants

❌ INVALID nếu hardcode

---

# 18. Logging

- Có log debug còn sót không?

✅ Action:

- remove hoặc dùng logger

❌ INVALID nếu log bừa

---

# 19. Security (Basic)

- Có validate input không?
- Có lộ data nhạy cảm không?

✅ Action:

- validate + sanitize

❌ INVALID nếu không an toàn

---

# 20. UX / Feedback

- Có loading state không?
- Có error message không?

✅ Action:

- loading + error UI

❌ INVALID nếu UX kém

---

# 🧾 REQUIRED OUTPUT (MANDATORY)

AI MUST output:

## ✅ Refactor Report

- Each section MUST include:
  - Found: YES / NO
  - Evidence: file + location
  - Action: what was done

---

# 💣 FINAL RULE

- "Code chạy được" ≠ "Code đúng"
- "Không lỗi" ≠ "Production-ready"

👉 ONLY clean, structured, safe code is acceptable
