---
trigger: always_on
---

# 🧩 Clean Code & Architecture Rules (ERP Vĩnh Phát)

## 🎯 Core Principles

- Follow existing project structure
- Do not over-engineer
- Keep code simple, readable, and maintainable
- Optimize for long-term scalability (not short-term speed)

---

## 🏗️ Architecture Level 7 Extension

### 1. Centralized Schema (Level 9 Strict)

> 🔒 Đây là rule QUAN TRỌNG NHẤT

**Tất cả dữ liệu mang tính:**

- Phân loại (enum, status, category)
- Validation (Zod schema)
- Business constraints

👉 **BẮT BUỘC phải đặt tại:**
