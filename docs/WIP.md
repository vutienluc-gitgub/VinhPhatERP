# WIP Registry â€” PhÃ¢n chia viá»‡c giá»¯a NgÆ°á»i vÃ  AI

> **Má»¥c Ä‘Ã­ch:** má»™t nguá»“n sá»± tháº­t duy nháº¥t tráº£ lá»i _"viá»‡c nÃ y ai Ä‘ang lÃ m?"_ vÃ  _"cÃ³ Ä‘ang bá»‹ Ä‘á»¥ng trÃ¹ng khÃ´ng?"_.
> KhÃ´ng cÃ³ file nÃ y, hai bÃªn dá»… cÃ¹ng sá»­a má»™t module, hoáº·c cÃ¹ng chá» nhau.
>
> Cáº­p nháº­t file nÃ y **trÆ°á»›c khi** báº¯t Ä‘áº§u má»™t viá»‡c, khÃ´ng pháº£i sau.

---

## 1. Quy Æ°á»›c nháº­n biáº¿t viá»‡c cá»§a AI

Cá»™t `author` trÃªn GitHub luÃ´n hiá»‡n chá»§ token Ä‘Ã£ push, nÃªn **khÃ´ng** dÃ¹ng nÃ³ Ä‘á»ƒ phÃ¢n biá»‡t. DÃ¹ng 3 dáº¥u hiá»‡u sau:

| Dáº¥u hiá»‡u      | GiÃ¡ trá»‹ cá»§a AI                                   |
| ----------------- | ----------------------------------------------------- |
| Label PR          | `ai:openhands`                                        |
| Tiá»n tá»‘ branch | `ai/`                                                 |
| Commit trailer    | `Co-authored-by: openhands <openhands@all-hands.dev>` |
| Commit author     | `openhands <openhands@all-hands.dev>`                 |

Lá»c nhanh:

```bash
gh pr list --label ai:openhands        # má»i PR do AI má»Ÿ
gh pr list --label wip                 # viá»‡c AI Ä‘ang lÃ m dá»Ÿ, chÆ°a merge-ready
```

---

## 2. Quy táº¯c vÃ¹ng sá»Ÿ há»¯u (Ownership)

Má»™t module táº¡i má»™t thá»i Ä‘iá»ƒm **chá»‰ cÃ³ má»™t chá»§**. Chá»§ sá»Ÿ há»¯u lÃ  bÃªn Ä‘ang cÃ³ branch má»Ÿ Ä‘á»¥ng module Ä‘Ã³.

| VÃ¹ng                                                            | Chá»§                    | Ghi chÃº                                                                                      |
| ---------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `src/features/chat/**`                                           | AI                       | Module chat. Äang trong giai Ä‘oáº¡n cá»§ng cá»‘ Zero Message Loss.                           |
| `src/application/chat/**`, `src/api/chat.api.ts`                 | AI                       | Táº§ng application/API cá»§a chat.                                                            |
| `src/shared/lib/chat-*.ts`                                       | AI                       | Offline queue, typing indicator cá»§a chat.                                                   |
| `supabase/migrations/**`                                         | **NgÆ°á»i**              | Migration khÃ´ng sá»­a file Ä‘Ã£ push. AI chá»‰ táº¡o file má»›i khi Ä‘Æ°á»£c yÃªu cáº§u.     |
| `.github/workflows/**`, `.husky/**`                              | **NgÆ°á»i**              | Háº¡ táº§ng CI. AI khÃ´ng Ä‘Æ°a vÃ o commit tÃ­nh nÄƒng (xem `AGENT.md`).                     |
| `AI_WORKFLOW.md`, `.erp-rules.md`, `AI_CHECKLIST.md`, `AGENT.md` | **Cáº§n thoáº£ thuáº­n** | Bá»™ tÃ i liá»‡u governance ná»n táº£ng. Sá»­a qua PR `chore(workflow)` riÃªng, khÃ´ng gá»™p. |
| `src/features/auth/**`                                           | **AI** (Táº¡m thá»i)     | ÄÃ£ má»Ÿ Gate 2 (APPROVE PHASE 3): Triá»ƒn khai Passkeys / WebAuthn UI & Hook.                |
| CÃ¡c module cÃ²n láº¡i trong `src/features/`                     | **ChÆ°a Ä‘Äƒng kÃ½**     | Ai báº¯t Ä‘áº§u thÃ¬ Ä‘Äƒng kÃ½ vÃ o Â§3 trÆ°á»›c.                                            |

**Náº¿u báº¯t Ä‘áº§u viá»‡c Ä‘á»¥ng vÃ¹ng Ä‘Ã£ cÃ³ chá»§:** dá»«ng láº¡i, Ä‘á»ƒ chá»§ cÅ© xá»­ lÃ½, hoáº·c Ä‘Äƒng kÃ½ chuyá»ƒn chá»§ vÃ o Â§3.

---

## 3. Viá»‡c Ä‘ang lÃ m

| Viá»‡c                                             | Chá»§ | Branch                     | Tráº¡ng thÃ¡i        | PR  |
| -------------------------------------------------- | ----- | -------------------------- | -------------------- | --- |
| Registry phÃ¢n chia viá»‡c                         | AI    | `ai/docs-wip-registry`     | Ä‘ang lÃ m           | â€” |
| Passkeys / WebAuthn tá»± lÆ°u trá»¯ (Phase 2 Core) | AI    | `ai/passkey-webauthn-auth` | Ä‘ang lÃ m (Phase 2) | â€” |

> Äiá»n vÃ o báº£ng nÃ y trÆ°á»›c khi táº¡o branch. XoÃ¡ dÃ²ng khi PR Ä‘Ã£ merge.

---

## 4. Viá»‡c Ä‘ang chá» Gate

Tráº¡ng thÃ¡i `wip` + `draft` nghÄ©a lÃ  **chÆ°a merge-ready**. Gate chá»‰ má»Ÿ báº±ng token chÃ­nh xÃ¡c trong `AI_WORKFLOW.md` Â§1.1.

| PR  | Viá»‡c | Chá»§ | Gate Ä‘ang chá» | Token cáº§n |
| --- | ------ | ----- | --------------- | ----------- |
| â€” | â€”    | â€”   | â€”             | â€”         |

---

## 5. ÄÃ£ xong (lÆ°u ngáº¯n háº¡n)

Chá»‰ giá»¯ cÃ¡c má»¥c gáº§n Ä‘Ã¢y; pháº§n lá»‹ch sá»­ xa náº±m á»Ÿ git log.

| Viá»‡c                                       | Chá»§ | PR                                                             | Merge commit |
| -------------------------------------------- | ----- | -------------------------------------------------------------- | ------------ |
| Fix chat: tráº¡ng thÃ¡i `failed` giá»¯ retry | AI    | [#12](https://github.com/vutienluc-gitgub/VinhPhatERP/pull/12) | `5c24abe`    |
| Cáº£nh bÃ¡o stale-snapshot CI (AGENT.md)     | AI    | [#3](https://github.com/vutienluc-gitgub/VinhPhatERP/pull/3)   | `13bb8ae`    |

---

## 6. Rá»§i ro chÆ°a xá»­ lÃ½

| Rá»§i ro                                           | Má»©c | Ghi chÃº                                                                                                                                                                         |
| -------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` khÃ´ng Ä‘Æ°á»£c báº£o vá»‡                  | Cao   | `protected: false`. KhÃ´ng required checks, khÃ´ng cáº¥m force-push. Cáº§n báº­t á»Ÿ Settings â†’ Branches.                                                                      |
| `rpc:check` khÃ´ng Ä‘Æ°á»£c enforce                | Vá»«a | Local cáº§n `DATABASE_URL`; job CI `rpc-sync` bá»‹ `skipped` theo cáº¥u hÃ¬nh. Guard tá»“n táº¡i nhÆ°ng khÃ´ng cháº¡y.                                                           |
| PR #2 (`perf(chat)` cá»§a bot `google-labs-jules`) | Vá»«a | Conflict vá»›i `main` á»Ÿ `server/src/index.ts`, `AI_WORKFLOW.md`, `src/application/chat/useChat.ts`. Äá»¥ng vÃ¹ng chat do AI sá»Ÿ há»¯u â†’ cáº§n AI review trÆ°á»›c khi merge. |

---

## 7. CÃ¡ch dÃ¹ng file nÃ y

**TrÆ°á»›c khi báº¯t Ä‘áº§u viá»‡c:**

1. Äá»c Â§2 â€” vÃ¹ng mÃ¬nh Ä‘á»‹nh Ä‘á»¥ng cÃ³ chá»§ chÆ°a?
2. CÃ³ rá»“i â†’ liÃªn há»‡ chá»§ cÅ©, hoáº·c Ä‘á» xuáº¥t chuyá»ƒn chá»§.
3. ChÆ°a cÃ³ â†’ thÃªm dÃ²ng vÃ o Â§3, ghi rÃµ branch.

**Khi má»Ÿ PR:** chuyá»ƒn dÃ²ng tá»« Â§3 sang Â§4 (náº¿u chá» Gate) hoáº·c Â§5 (khi Ä‘Ã£ merge). KhÃ´ng Ä‘á»ƒ dÃ²ng má»“ cÃ´i.

**Khi phÃ¡t hiá»‡n rá»§i ro:** thÃªm vÃ o Â§6. Rá»§i ro khÃ´ng xá»­ lÃ½ Ä‘Æ°á»£c ngay váº«n pháº£i Ä‘Æ°á»£c ghi láº¡i â€” im láº·ng lÃ  cÃ¡ch nÃ³ biáº¿n thÃ nh sá»± cá»‘.
