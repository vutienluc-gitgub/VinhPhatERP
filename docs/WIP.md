# WIP Registry Ã¢â‚¬â€ PhÃƒÂ¢n chia viÃ¡Â»â€¡c giÃ¡Â»Â¯a NgÃ†Â°Ã¡Â»Âi vÃƒÂ  AI

> **MÃ¡Â»Â¥c Ã„â€˜ÃƒÂ­ch:** mÃ¡Â»â„¢t nguÃ¡Â»â€œn sÃ¡Â»Â± thÃ¡ÂºÂ­t duy nhÃ¡ÂºÂ¥t trÃ¡ÂºÂ£ lÃ¡Â»Âi _"viÃ¡Â»â€¡c nÃƒÂ y ai Ã„â€˜ang lÃƒÂ m?"_ vÃƒÂ  _"cÃƒÂ³ Ã„â€˜ang bÃ¡Â»â€¹ Ã„â€˜Ã¡Â»Â¥ng trÃƒÂ¹ng khÃƒÂ´ng?"_.
> KhÃƒÂ´ng cÃƒÂ³ file nÃƒÂ y, hai bÃƒÂªn dÃ¡Â»â€¦ cÃƒÂ¹ng sÃ¡Â»Â­a mÃ¡Â»â„¢t module, hoÃ¡ÂºÂ·c cÃƒÂ¹ng chÃ¡Â»Â nhau.
>
> CÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t file nÃƒÂ y **trÃ†Â°Ã¡Â»â€ºc khi** bÃ¡ÂºÂ¯t Ã„â€˜Ã¡ÂºÂ§u mÃ¡Â»â„¢t viÃ¡Â»â€¡c, khÃƒÂ´ng phÃ¡ÂºÂ£i sau.

---

## 1. Quy Ã†Â°Ã¡Â»â€ºc nhÃ¡ÂºÂ­n biÃ¡ÂºÂ¿t viÃ¡Â»â€¡c cÃ¡Â»Â§a AI

CÃ¡Â»â„¢t `author` trÃƒÂªn GitHub luÃƒÂ´n hiÃ¡Â»â€¡n chÃ¡Â»Â§ token Ã„â€˜ÃƒÂ£ push, nÃƒÂªn **khÃƒÂ´ng** dÃƒÂ¹ng nÃƒÂ³ Ã„â€˜Ã¡Â»Æ’ phÃƒÂ¢n biÃ¡Â»â€¡t. DÃƒÂ¹ng 3 dÃ¡ÂºÂ¥u hiÃ¡Â»â€¡u sau:

| DÃ¡ÂºÂ¥u hiÃ¡Â»â€¡u      | GiÃƒÂ¡ trÃ¡Â»â€¹ cÃ¡Â»Â§a AI                          |
| ------------------------ | ----------------------------------------------------- |
| Label PR                 | `ai:openhands`                                        |
| TiÃ¡Â»Ân tÃ¡Â»â€˜ branch | `ai/`                                                 |
| Commit trailer           | `Co-authored-by: openhands <openhands@all-hands.dev>` |
| Commit author            | `openhands <openhands@all-hands.dev>`                 |

LÃ¡Â»Âc nhanh:

```bash
gh pr list --label ai:openhands        # mÃ¡Â»Âi PR do AI mÃ¡Â»Å¸
gh pr list --label wip                 # viÃ¡Â»â€¡c AI Ã„â€˜ang lÃƒÂ m dÃ¡Â»Å¸, chÃ†Â°a merge-ready
```

---

## 2. Quy tÃ¡ÂºÂ¯c vÃƒÂ¹ng sÃ¡Â»Å¸ hÃ¡Â»Â¯u (Ownership)

MÃ¡Â»â„¢t module tÃ¡ÂºÂ¡i mÃ¡Â»â„¢t thÃ¡Â»Âi Ã„â€˜iÃ¡Â»Æ’m **chÃ¡Â»â€° cÃƒÂ³ mÃ¡Â»â„¢t chÃ¡Â»Â§**. ChÃ¡Â»Â§ sÃ¡Â»Å¸ hÃ¡Â»Â¯u lÃƒÂ  bÃƒÂªn Ã„â€˜ang cÃƒÂ³ branch mÃ¡Â»Å¸ Ã„â€˜Ã¡Â»Â¥ng module Ã„â€˜ÃƒÂ³.

| VÃƒÂ¹ng                                                          | ChÃ¡Â»Â§                          | Ghi chÃƒÂº                                                                                                                  |
| ---------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/features/chat/**`                                           | AI                                | Module chat. Ã„Âang trong giai Ã„â€˜oÃ¡ÂºÂ¡n cÃ¡Â»Â§ng cÃ¡Â»â€˜ Zero Message Loss.                                          |
| `src/application/chat/**`, `src/api/chat.api.ts`                 | AI                                | TÃ¡ÂºÂ§ng application/API cÃ¡Â»Â§a chat.                                                                                    |
| `src/shared/lib/chat-*.ts`                                       | AI                                | Offline queue, typing indicator cÃ¡Â»Â§a chat.                                                                              |
| `supabase/migrations/**`                                         | **NgÃ†Â°Ã¡Â»Âi**                  | Migration khÃƒÂ´ng sÃ¡Â»Â­a file Ã„â€˜ÃƒÂ£ push. AI chÃ¡Â»â€° tÃ¡ÂºÂ¡o file mÃ¡Â»â€ºi khi Ã„â€˜Ã†Â°Ã¡Â»Â£c yÃƒÂªu cÃ¡ÂºÂ§u. |
| `.github/workflows/**`, `.husky/**`                              | **NgÃ†Â°Ã¡Â»Âi**                  | HÃ¡ÂºÂ¡ tÃ¡ÂºÂ§ng CI. AI khÃƒÂ´ng Ã„â€˜Ã†Â°a vÃƒÂ o commit tÃƒÂ­nh nÃ„Æ’ng (xem `AGENT.md`).                                |
| `AI_WORKFLOW.md`, `.erp-rules.md`, `AI_CHECKLIST.md`, `AGENT.md` | **CÃ¡ÂºÂ§n thoÃ¡ÂºÂ£ thuÃ¡ÂºÂ­n** | BÃ¡Â»â„¢ tÃƒÂ i liÃ¡Â»â€¡u governance nÃ¡Â»Ân tÃ¡ÂºÂ£ng. SÃ¡Â»Â­a qua PR `chore(workflow)` riÃƒÂªng, khÃƒÂ´ng gÃ¡Â»â„¢p.    |
| `src/features/auth/**`                                           | **AI** (TÃ¡ÂºÂ¡m thÃ¡Â»Âi)        | Ã„ÂÃƒÂ£ mÃ¡Â»Å¸ Gate 2 (APPROVE PHASE 3): TriÃ¡Â»Æ’n khai Passkeys / WebAuthn UI & Hook.                                    |
| CÃƒÂ¡c module cÃƒÂ²n lÃ¡ÂºÂ¡i trong `src/features/`              | **ChÃ†Â°a Ã„â€˜Ã„Æ’ng kÃƒÂ½**     | Ai bÃ¡ÂºÂ¯t Ã„â€˜Ã¡ÂºÂ§u thÃƒÂ¬ Ã„â€˜Ã„Æ’ng kÃƒÂ½ vÃƒÂ o Ã‚Â§3 trÃ†Â°Ã¡Â»â€ºc.                                              |

**NÃ¡ÂºÂ¿u bÃ¡ÂºÂ¯t Ã„â€˜Ã¡ÂºÂ§u viÃ¡Â»â€¡c Ã„â€˜Ã¡Â»Â¥ng vÃƒÂ¹ng Ã„â€˜ÃƒÂ£ cÃƒÂ³ chÃ¡Â»Â§:** dÃ¡Â»Â«ng lÃ¡ÂºÂ¡i, Ã„â€˜Ã¡Â»Æ’ chÃ¡Â»Â§ cÃ…Â© xÃ¡Â»Â­ lÃƒÂ½, hoÃ¡ÂºÂ·c Ã„â€˜Ã„Æ’ng kÃƒÂ½ chuyÃ¡Â»Æ’n chÃ¡Â»Â§ vÃƒÂ o Ã‚Â§3.

---

## 3. ViÃ¡Â»â€¡c Ã„â€˜ang lÃƒÂ m

| ViÃ¡Â»â€¡c                                                 | ChÃ¡Â»Â§ | Branch                     | TrÃ¡ÂºÂ¡ng thÃƒÂ¡i        | PR      |
| ---------------------------------------------------------- | -------- | -------------------------- | ------------------------- | ------- |
| Registry phÃƒÂ¢n chia viÃ¡Â»â€¡c                           | AI       | `ai/docs-wip-registry`     | Ã„â€˜ang lÃƒÂ m           | Ã¢â‚¬â€ |
| Passkeys / WebAuthn tÃ¡Â»Â± lÃ†Â°u trÃ¡Â»Â¯ (Phase 2 Core) | AI       | `ai/passkey-webauthn-auth` | Ã„â€˜ang lÃƒÂ m (Phase 2) | Ã¢â‚¬â€ |

> Ã„ÂiÃ¡Â»Ân vÃƒÂ o bÃ¡ÂºÂ£ng nÃƒÂ y trÃ†Â°Ã¡Â»â€ºc khi tÃ¡ÂºÂ¡o branch. XoÃƒÂ¡ dÃƒÂ²ng khi PR Ã„â€˜ÃƒÂ£ merge.

---

## 4. ViÃ¡Â»â€¡c Ã„â€˜ang chÃ¡Â»Â Gate

TrÃ¡ÂºÂ¡ng thÃƒÂ¡i `wip` + `draft` nghÃ„Â©a lÃƒÂ  **chÃ†Â°a merge-ready**. Gate chÃ¡Â»â€° mÃ¡Â»Å¸ bÃ¡ÂºÂ±ng token chÃƒÂ­nh xÃƒÂ¡c trong `AI_WORKFLOW.md` Ã‚Â§1.1.

| PR      | ViÃ¡Â»â€¡c | ChÃ¡Â»Â§ | Gate Ã„â€˜ang chÃ¡Â»Â | Token cÃ¡ÂºÂ§n |
| ------- | ---------- | -------- | --------------------- | -------------- |
| Ã¢â‚¬â€ | Ã¢â‚¬â€    | Ã¢â‚¬â€  | Ã¢â‚¬â€               | Ã¢â‚¬â€        |

---

## 5. Ã„ÂÃƒÂ£ xong (lÃ†Â°u ngÃ¡ÂºÂ¯n hÃ¡ÂºÂ¡n)

ChÃ¡Â»â€° giÃ¡Â»Â¯ cÃƒÂ¡c mÃ¡Â»Â¥c gÃ¡ÂºÂ§n Ã„â€˜ÃƒÂ¢y; phÃ¡ÂºÂ§n lÃ¡Â»â€¹ch sÃ¡Â»Â­ xa nÃ¡ÂºÂ±m Ã¡Â»Å¸ git log.

| ViÃ¡Â»â€¡c                                           | ChÃ¡Â»Â§ | PR                                                             | Merge commit |
| ---------------------------------------------------- | -------- | -------------------------------------------------------------- | ------------ |
| Fix chat: trÃ¡ÂºÂ¡ng thÃƒÂ¡i `failed` giÃ¡Â»Â¯ retry | AI       | [#12](https://github.com/vutienluc-gitgub/VinhPhatERP/pull/12) | `5c24abe`    |
| CÃ¡ÂºÂ£nh bÃƒÂ¡o stale-snapshot CI (AGENT.md)        | AI       | [#3](https://github.com/vutienluc-gitgub/VinhPhatERP/pull/3)   | `13bb8ae`    |

---

## 6. RÃ¡Â»Â§i ro chÃ†Â°a xÃ¡Â»Â­ lÃƒÂ½

| RÃ¡Â»Â§i ro                                           | MÃ¡Â»Â©c | Ghi chÃƒÂº                                                                                                                                                                                                         |
| ----------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `main` khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c bÃ¡ÂºÂ£o vÃ¡Â»â€¡    | Cao      | `protected: false`. KhÃƒÂ´ng required checks, khÃƒÂ´ng cÃ¡ÂºÂ¥m force-push. CÃ¡ÂºÂ§n bÃ¡ÂºÂ­t Ã¡Â»Å¸ Settings Ã¢â€ â€™ Branches.                                                                                   |
| `rpc:check` khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c enforce         | VÃ¡Â»Â«a | Local cÃ¡ÂºÂ§n `DATABASE_URL`; job CI `rpc-sync` bÃ¡Â»â€¹ `skipped` theo cÃ¡ÂºÂ¥u hÃƒÂ¬nh. Guard tÃ¡Â»â€œn tÃ¡ÂºÂ¡i nhÃ†Â°ng khÃƒÂ´ng chÃ¡ÂºÂ¡y.                                                                   |
| PR #2 (`perf(chat)` cÃ¡Â»Â§a bot `google-labs-jules`) | VÃ¡Â»Â«a | Conflict vÃ¡Â»â€ºi `main` Ã¡Â»Å¸ `server/src/index.ts`, `AI_WORKFLOW.md`, `src/application/chat/useChat.ts`. Ã„ÂÃ¡Â»Â¥ng vÃƒÂ¹ng chat do AI sÃ¡Â»Å¸ hÃ¡Â»Â¯u Ã¢â€ â€™ cÃ¡ÂºÂ§n AI review trÃ†Â°Ã¡Â»â€ºc khi merge. |

---

## 7. CÃƒÂ¡ch dÃƒÂ¹ng file nÃƒÂ y

**TrÃ†Â°Ã¡Â»â€ºc khi bÃ¡ÂºÂ¯t Ã„â€˜Ã¡ÂºÂ§u viÃ¡Â»â€¡c:**

1. Ã„ÂÃ¡Â»Âc Ã‚Â§2 Ã¢â‚¬â€ vÃƒÂ¹ng mÃƒÂ¬nh Ã„â€˜Ã¡Â»â€¹nh Ã„â€˜Ã¡Â»Â¥ng cÃƒÂ³ chÃ¡Â»Â§ chÃ†Â°a?
2. CÃƒÂ³ rÃ¡Â»â€œi Ã¢â€ â€™ liÃƒÂªn hÃ¡Â»â€¡ chÃ¡Â»Â§ cÃ…Â©, hoÃ¡ÂºÂ·c Ã„â€˜Ã¡Â»Â xuÃ¡ÂºÂ¥t chuyÃ¡Â»Æ’n chÃ¡Â»Â§.
3. ChÃ†Â°a cÃƒÂ³ Ã¢â€ â€™ thÃƒÂªm dÃƒÂ²ng vÃƒÂ o Ã‚Â§3, ghi rÃƒÂµ branch.

**Khi mÃ¡Â»Å¸ PR:** chuyÃ¡Â»Æ’n dÃƒÂ²ng tÃ¡Â»Â« Ã‚Â§3 sang Ã‚Â§4 (nÃ¡ÂºÂ¿u chÃ¡Â»Â Gate) hoÃ¡ÂºÂ·c Ã‚Â§5 (khi Ã„â€˜ÃƒÂ£ merge). KhÃƒÂ´ng Ã„â€˜Ã¡Â»Æ’ dÃƒÂ²ng mÃ¡Â»â€œ cÃƒÂ´i.

**Khi phÃƒÂ¡t hiÃ¡Â»â€¡n rÃ¡Â»Â§i ro:** thÃƒÂªm vÃƒÂ o Ã‚Â§6. RÃ¡Â»Â§i ro khÃƒÂ´ng xÃ¡Â»Â­ lÃƒÂ½ Ã„â€˜Ã†Â°Ã¡Â»Â£c ngay vÃ¡ÂºÂ«n phÃ¡ÂºÂ£i Ã„â€˜Ã†Â°Ã¡Â»Â£c ghi lÃ¡ÂºÂ¡i Ã¢â‚¬â€ im lÃ¡ÂºÂ·ng lÃƒÂ  cÃƒÂ¡ch nÃƒÂ³ biÃ¡ÂºÂ¿n thÃƒÂ nh sÃ¡Â»Â± cÃ¡Â»â€˜.
