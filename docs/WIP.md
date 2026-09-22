# WIP Registry — Phân chia việc giữa Người và AI

> **Mục đích:** một nguồn sự thật duy nhất trả lời _"việc này ai đang làm?"_ và _"có đang bị đụng trùng không?"_.
> Không có file này, hai bên dễ cùng sửa một module, hoặc cùng chờ nhau.
>
> Cập nhật file này **trước khi** bắt đầu một việc, không phải sau.

---

## 1. Quy ước nhận biết việc của AI

Cột `author` trên GitHub luôn hiện chủ token đã push, nên **không** dùng nó để phân biệt. Dùng 3 dấu hiệu sau:

| Dấu hiệu       | Giá trị của AI                                        |
| -------------- | ----------------------------------------------------- |
| Label PR       | `ai:openhands`                                        |
| Tiền tố branch | `ai/`                                                 |
| Commit trailer | `Co-authored-by: openhands <openhands@all-hands.dev>` |
| Commit author  | `openhands <openhands@all-hands.dev>`                 |

Lọc nhanh:

```bash
gh pr list --label ai:openhands        # mọi PR do AI mở
gh pr list --label wip                 # việc AI đang làm dở, chưa merge-ready
```

---

## 2. Quy tắc vùng sở hữu (Ownership)

Một module tại một thời điểm **chỉ có một chủ**. Chủ sở hữu là bên đang có branch mở đụng module đó.

| Vùng                                                             | Chủ                | Ghi chú                                                                         |
| ---------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------- |
| `src/features/chat/**`                                           | AI                 | Module chat. Đang trong giai đoạn củng cố Zero Message Loss.                    |
| `src/application/chat/**`, `src/api/chat.api.ts`                 | AI                 | Tầng application/API của chat.                                                  |
| `src/shared/lib/chat-*.ts`                                       | AI                 | Offline queue, typing indicator của chat.                                       |
| `supabase/migrations/**`                                         | **Người**          | Migration không sửa file đã push. AI chỉ tạo file mới khi được yêu cầu.         |
| `.github/workflows/**`, `.husky/**`                              | **Người**          | Hạ tầng CI. AI không đưa vào commit tính năng (xem `AGENT.md`).                 |
| `AI_WORKFLOW.md`, `.erp-rules.md`, `AI_CHECKLIST.md`, `AGENT.md` | **Cần thoả thuận** | Bộ tài liệu governance nền tảng. Sửa qua PR `chore(workflow)` riêng, không gộp. |
| `src/features/auth/**`                                           | **Người**          | Refactor `AuthPage` là việc của người.                                          |
| Các module còn lại trong `src/features/`                         | **Chưa đăng ký**   | Ai bắt đầu thì đăng ký vào §3 trước.                                            |

**Nếu bắt đầu việc đụng vùng đã có chủ:** dừng lại, để chủ cũ xử lý, hoặc đăng ký chuyển chủ vào §3.

---

## 3. Việc đang làm

| Việc                    | Chủ | Branch                 | Trạng thái | PR  |
| ----------------------- | --- | ---------------------- | ---------- | --- |
| Registry phân chia việc | AI  | `ai/docs-wip-registry` | đang làm   | —   |

> Điền vào bảng này trước khi tạo branch. Xoá dòng khi PR đã merge.

---

## 4. Việc đang chờ Gate

Trạng thái `wip` + `draft` nghĩa là **chưa merge-ready**. Gate chỉ mở bằng token chính xác trong `AI_WORKFLOW.md` §1.1.

| PR  | Việc | Chủ | Gate đang chờ | Token cần |
| --- | ---- | --- | ------------- | --------- |
| —   | —    | —   | —             | —         |

---

## 5. Đã xong (lưu ngắn hạn)

Chỉ giữ các mục gần đây; phần lịch sử xa nằm ở git log.

| Việc                                    | Chủ | PR                                                             | Merge commit |
| --------------------------------------- | --- | -------------------------------------------------------------- | ------------ |
| Fix chat: trạng thái `failed` giữ retry | AI  | [#12](https://github.com/vutienluc-gitgub/VinhPhatERP/pull/12) | `5c24abe`    |
| Cảnh báo stale-snapshot CI (AGENT.md)   | AI  | [#3](https://github.com/vutienluc-gitgub/VinhPhatERP/pull/3)   | `13bb8ae`    |

---

## 6. Rủi ro chưa xử lý

| Rủi ro                                           | Mức | Ghi chú                                                                                                                                                        |
| ------------------------------------------------ | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` không được bảo vệ                         | Cao | `protected: false`. Không required checks, không cấm force-push. Cần bật ở Settings → Branches.                                                                |
| `rpc:check` không được enforce                   | Vừa | Local cần `DATABASE_URL`; job CI `rpc-sync` bị `skipped` theo cấu hình. Guard tồn tại nhưng không chạy.                                                        |
| PR #2 (`perf(chat)` của bot `google-labs-jules`) | Vừa | Conflict với `main` ở `server/src/index.ts`, `AI_WORKFLOW.md`, `src/application/chat/useChat.ts`. Đụng vùng chat do AI sở hữu → cần AI review trước khi merge. |

---

## 7. Cách dùng file này

**Trước khi bắt đầu việc:**

1. Đọc §2 — vùng mình định đụng có chủ chưa?
2. Có rồi → liên hệ chủ cũ, hoặc đề xuất chuyển chủ.
3. Chưa có → thêm dòng vào §3, ghi rõ branch.

**Khi mở PR:** chuyển dòng từ §3 sang §4 (nếu chờ Gate) hoặc §5 (khi đã merge). Không để dòng mồ côi.

**Khi phát hiện rủi ro:** thêm vào §6. Rủi ro không xử lý được ngay vẫn phải được ghi lại — im lặng là cách nó biến thành sự cố.
