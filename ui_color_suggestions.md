# 🎨 Design Token Replacement Review (Step 1)

> Các báo cáo dưới đây chỉ là gợi ý thay đổi. File mã nguồn KHÔNG BỊ SỬA tự động.
> Vui lòng Review từng class và tìm Token ngữ nghĩa (Semantic Token) phù hợp nhất với context của Component.

## `src/api/operations.demo.ts`

- **Line 114**: `bg-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  avatarColor: 'bg-indigo-600',
  ```
- **Line 121**: `bg-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  avatarColor: 'bg-emerald-600',
  ```
- **Line 128**: `bg-red-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  avatarColor: 'bg-red-500',
  ```

## `src/app/router/GlobalErrorElement.tsx`

- **Line 35**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl border border-gray-100">
  ```
- **Line 36**: `bg-red-100` ➡️ **Suggest:** `bg-danger-soft`
  ```tsx
  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
  ```
- **Line 37**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  <Icon name="TriangleAlert" className="h-8 w-8 text-red-600" />
  ```
- **Line 40**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h1 className="mb-2 text-2xl font-bold text-gray-900">
  ```
- **Line 43**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <p className="mb-6 text-gray-500">
  ```
- **Line 47**: `text-red-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mb-8 rounded-lg bg-red-50 p-4 text-left text-sm text-red-800 break-words font-mono overflow-auto max-h-32">
  ```
- **Line 54**: `bg-blue-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700';
  ```
- **Line 54**: `bg-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700';
  ```
- **Line 64**: `border-gray-300` ➡️ **Suggest:** `border-muted`
  ```tsx
  className =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50';
  ```
- **Line 64**: `text-gray-700` ➡️ **Suggest:** `text-secondary`
  ```tsx
  className =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50';
  ```

## `src/app/router/portalRoutes.tsx`

- **Line 52**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 text-sm text-slate-500">Đang tải…</div>
  ```

## `src/components/ui/ModuleErrorBoundary.tsx`

- **Line 30**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
  ```
- **Line 30**: `text-red-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
  ```
- **Line 33**: `bg-red-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700';
  ```
- **Line 33**: `bg-red-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700';
  ```

## `src/features/auth/LoginForm.tsx`

- **Line 111**: `bg-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl text-center">
  ```
- **Line 111**: `border-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl text-center">
  ```
- **Line 112**: `text-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-amber-500 font-semibold text-sm uppercase tracking-wider mb-2">
  ```
- **Line 168**: `text-rose-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-rose-400 text-xs ml-1 font-medium">
  ```
- **Line 199**: `text-rose-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-rose-400 text-xs ml-1 font-medium">
  ```
- **Line 238**: `bg-rose-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
  ```
- **Line 238**: `border-rose-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
  ```
- **Line 239**: `text-rose-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-rose-400 text-sm font-medium">{serverError}</p>
  ```
- **Line 257**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'group relative w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed';
  ```

## `src/features/bom/bom.plugin.tsx`

- **Line 23**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 text-sm text-slate-500">Đang tải BOM module...</div>
  ```

## `src/features/chat/UnifiedFeedPage.tsx`

- **Line 37**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <div className="p-6 text-center text-red-500">
  ```

## `src/features/contract-templates/ContractTemplatesPage.tsx`

- **Line 112**: `bg-blue-100` ➡️ **Suggest:** `bg-info-soft`
  ```tsx
  className={`ml-3 px-2 py-0.5 rounded-lg text-xs font-bold align-middle ${view.template.type === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
  ```
- **Line 112**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`ml-3 px-2 py-0.5 rounded-lg text-xs font-bold align-middle ${view.template.type === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
  ```
- **Line 112**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`ml-3 px-2 py-0.5 rounded-lg text-xs font-bold align-middle ${view.template.type === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
  ```
- **Line 112**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`ml-3 px-2 py-0.5 rounded-lg text-xs font-bold align-middle ${view.template.type === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
  ```

## `src/features/contract-templates/NewTemplateMenu.tsx`

- **Line 62**: `bg-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold hover:bg-emerald-600 hover:text-surface flex items-center gap-3 transition-all group';
  ```
- **Line 65**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-surface/20 group-hover:text-surface transition-colors">
  ```
- **Line 65**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-surface/20 group-hover:text-surface transition-colors">
  ```
- **Line 72**: `bg-blue-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-surface flex items-center gap-3 mt-1 transition-all group';
  ```
- **Line 75**: `bg-blue-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-surface/20 group-hover:text-surface transition-colors">
  ```
- **Line 75**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-surface/20 group-hover:text-surface transition-colors">
  ```

## `src/features/contract-templates/TemplateCard.tsx`

- **Line 55**: `bg-blue-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-110 ${isPurchase ? 'bg-blue-600' : 'bg-emerald-600'}`}
  ```
- **Line 55**: `bg-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-110 ${isPurchase ? 'bg-blue-600' : 'bg-emerald-600'}`}
  ```
- **Line 65**: `bg-blue-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-blue-500/10 text-blue-600'
  ```
- **Line 65**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  ? 'bg-blue-500/10 text-blue-600'
  ```
- **Line 66**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-emerald-500/10 text-emerald-600'
  ```
- **Line 66**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-emerald-500/10 text-emerald-600'
  ```
- **Line 83**: `bg-blue-100` ➡️ **Suggest:** `bg-info-soft`
  ```tsx
  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${isPurchase ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
  ```
- **Line 83**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${isPurchase ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
  ```
- **Line 83**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${isPurchase ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
  ```
- **Line 83**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${isPurchase ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
  ```
- **Line 96**: `text-blue-500` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  iconClass: 'text-blue-500',
  ```

## `src/features/contract-templates/TemplateEditor.tsx`

- **Line 70**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 flex gap-3 items-start">
  ```
- **Line 74**: `text-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-amber-500 shrink-0 mt-0.5';
  ```
- **Line 77**: `text-amber-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-medium text-amber-800">
  ```
- **Line 82**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-amber-700 mt-1">
  ```

## `src/features/contracts/ContractForm.tsx`

- **Line 182**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 flex gap-3 items-start">
  ```
- **Line 183**: `text-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
  ```
- **Line 185**: `text-amber-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm text-amber-800">{warning}</p>
  ```

## `src/features/contracts/ContractPreview.tsx`

- **Line 77**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-slate-500 font-mono">
  ```
- **Line 82**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-100">
  ```
- **Line 82**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-100">
  ```

## `src/features/crm/components/CreateLeadModal.tsx`

- **Line 206**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
  ```
- **Line 210**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'h-5 w-5 text-amber-600 mt-0.5 shrink-0';
  ```
- **Line 213**: `text-amber-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h4 className="text-sm font-bold text-amber-800">
  ```
- **Line 216**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm text-amber-700 mt-1">
  ```
- **Line 225**: `border-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100 shadow-sm';
  ```
- **Line 230**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'h-4 w-4 text-amber-600';
  ```
- **Line 233**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-bold text-slate-800">
  ```
- **Line 236**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-slate-500">
  ```
- **Line 257**: `border-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center gap-2 bg-white/60 p-3 rounded-lg border border-amber-100';
  ```
- **Line 261**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'h-4 w-4 text-amber-600';
  ```
- **Line 264**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-medium text-slate-700">
  ```
- **Line 267**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-slate-500">
  ```
- **Line 280**: `border-teal-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 flex items-center justify-between">
  ```
- **Line 282**: `text-teal-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Building2" className="h-5 w-5 text-teal-600" />
  ```
- **Line 284**: `text-teal-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-bold text-teal-800">
  ```
- **Line 287**: `text-teal-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-teal-700">
  ```

## `src/features/crm/components/LeadCard.tsx`

- **Line 75**: `text-purple-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Layers" size={12} className="text-purple-600 shrink-0" />
  ```
- **Line 85**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center gap-1 text-amber-600 font-medium">
  ```

## `src/features/crm/components/LeadContextualActions.tsx`

- **Line 48**: `border-teal-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-center justify-between">
  ```
- **Line 50**: `bg-teal-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-teal-100 p-2 rounded-lg">
  ```
- **Line 51**: `text-teal-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Building2" className="h-5 w-5 text-teal-700" />
  ```
- **Line 54**: `text-teal-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-bold text-teal-900">
  ```
- **Line 57**: `text-teal-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-teal-700">
  ```
- **Line 65**: `text-teal-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'bg-white hover:bg-teal-50 text-teal-700 border-teal-200';
  ```
- **Line 65**: `border-teal-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'bg-white hover:bg-teal-50 text-teal-700 border-teal-200';
  ```
- **Line 75**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
  ```
- **Line 79**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'h-5 w-5 text-amber-600 mt-0.5 shrink-0';
  ```
- **Line 82**: `text-amber-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h4 className="text-sm font-bold text-amber-800">
  ```
- **Line 85**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm text-amber-700 mt-1">
  ```
- **Line 97**: `border-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100 shadow-sm';
  ```
- **Line 100**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Building2" className="h-4 w-4 text-amber-600" />
  ```
- **Line 102**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-bold text-slate-800">{c.name}</p>
  ```
- **Line 120**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100';
  ```
- **Line 120**: `border-amber-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100';
  ```
- **Line 120**: `bg-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100';
  ```
- **Line 133**: `border-blue-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
  ```
- **Line 135**: `bg-blue-100` ➡️ **Suggest:** `bg-info-soft`
  ```tsx
  <div className="bg-blue-100 p-2 rounded-lg">
  ```
- **Line 136**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="UserPlus" className="h-5 w-5 text-blue-700" />
  ```
- **Line 139**: `text-blue-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-bold text-blue-900">
  ```
- **Line 142**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-blue-700">
  ```
- **Line 151**: `bg-blue-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'bg-blue-600 hover:bg-blue-700';
  ```
- **Line 151**: `bg-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'bg-blue-600 hover:bg-blue-700';
  ```

## `src/features/crm/components/LeadRfqDetail.tsx`

- **Line 36**: `text-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="FileText" size={16} className="text-indigo-600" />
  ```
- **Line 58**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-medium text-amber-600">
  ```

## `src/features/crm/components/LeadSampleDetail.tsx`

- **Line 27**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Package" size={16} className="text-emerald-600" />
  ```

## `src/features/crm/crm.constants.ts`

- **Line 8**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-blue-50 text-blue-700 border-blue-100',
  ```
- **Line 8**: `border-blue-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-blue-50 text-blue-700 border-blue-100',
  ```
- **Line 13**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-amber-50 text-amber-700 border-amber-100',
  ```
- **Line 13**: `border-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-amber-50 text-amber-700 border-amber-100',
  ```
- **Line 18**: `text-purple-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-purple-50 text-purple-700 border-purple-100',
  ```
- **Line 18**: `border-purple-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-purple-50 text-purple-700 border-purple-100',
  ```
- **Line 23**: `text-orange-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-orange-50 text-orange-700 border-orange-100',
  ```
- **Line 23**: `border-orange-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-orange-50 text-orange-700 border-orange-100',
  ```
- **Line 33**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  ```
- **Line 33**: `border-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  ```
- **Line 38**: `text-red-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-red-50 text-red-700 border-red-100',
  ```
- **Line 38**: `border-red-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-red-50 text-red-700 border-red-100',
  ```
- **Line 43**: `text-teal-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-teal-50 text-teal-700 border-teal-100',
  ```
- **Line 43**: `border-teal-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-teal-50 text-teal-700 border-teal-100',
  ```
- **Line 51**: `bg-blue-100` ➡️ **Suggest:** `bg-info-soft`
  ```tsx
  RFQ: { label: 'Yêu cầu Báo giá', colorClass: 'bg-blue-100 text-blue-800' },
  ```
- **Line 51**: `text-blue-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  RFQ: { label: 'Yêu cầu Báo giá', colorClass: 'bg-blue-100 text-blue-800' },
  ```
- **Line 54**: `bg-purple-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-purple-100 text-purple-800',
  ```
- **Line 54**: `text-purple-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-purple-100 text-purple-800',
  ```
- **Line 56**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  CONTACT: { label: 'Liên hệ', colorClass: 'bg-slate-100 text-slate-800' },
  ```
- **Line 56**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  CONTACT: { label: 'Liên hệ', colorClass: 'bg-slate-100 text-slate-800' },
  ```
- **Line 66**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  colorClass: 'text-blue-600 bg-blue-50',
  ```
- **Line 71**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'text-amber-600 bg-amber-50',
  ```
- **Line 76**: `text-purple-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'text-purple-600 bg-purple-50',
  ```
- **Line 81**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'text-emerald-600 bg-emerald-50',
  ```
- **Line 86**: `text-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'text-indigo-600 bg-indigo-50',
  ```
- **Line 91**: `text-green-600` ➡️ **Suggest:** `text-success`
  ```tsx
  colorClass: 'text-green-600 bg-green-50',
  ```
- **Line 96**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'text-slate-600 bg-slate-50',
  ```

## `src/features/customer-portal/CustomerPortalRouter.tsx`

- **Line 58**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  fallback={<div className="p-4 text-sm text-slate-500">Đang tải…</div>}
  ```

## `src/features/customer-portal/quotations/PortalQuotationDetail.tsx`

- **Line 92**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-2 hover:bg-slate-100 rounded-full transition-colors';
  ```
- **Line 111**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <thead className="border-b border-slate-100">
  ```
- **Line 112**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tr className="text-slate-500 uppercase text-[10px] tracking-wider">
  ```
- **Line 126**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="font-semibold text-slate-800">
  ```
- **Line 129**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-xs text-slate-500">
  ```
- **Line 133**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="py-4 text-center text-slate-600">
  ```
- **Line 136**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="py-4 text-right text-slate-600 font-medium">
  ```
- **Line 139**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="py-4 text-right font-bold text-slate-800">
  ```
- **Line 150**: `border-blue-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="portal-card p-5 bg-blue-50/30 border-blue-100">
  ```
- **Line 151**: `text-blue-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
  ```
- **Line 155**: `text-blue-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm text-blue-800 whitespace-pre-wrap">
  ```
- **Line 173**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-px bg-slate-100" />
  ```
- **Line 177**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-slate-500">Ngày báo giá</span>
  ```
- **Line 183**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-slate-500">Hiệu lực đến</span>
  ```
- **Line 185**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  className={`font-medium ${isExpired ? 'text-red-500' : ''}`}
  ```
- **Line 195**: `border-orange-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
  ```
- **Line 196**: `text-orange-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-[10px] uppercase tracking-wider text-orange-600 font-bold mb-1">
  ```
- **Line 199**: `text-orange-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-xl font-black text-orange-700 font-mono">
  ```
- **Line 218**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'w-full text-red-600 border-red-200 hover:bg-red-50';
  ```
- **Line 218**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'w-full text-red-600 border-red-200 hover:bg-red-50';
  ```
- **Line 223**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-[10px] text-slate-400 text-center italic mt-4">
  ```
- **Line 228**: `border-green-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-green-50 border border-green-200 rounded-lg p-5">
  ```
- **Line 229**: `text-green-700` ➡️ **Suggest:** `text-success`
  ```tsx
  <div className="text-green-700 font-bold mb-4 flex items-center gap-2">
  ```
- **Line 233**: `border-green-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="relative border-l-2 border-green-200 ml-3 space-y-6">
  ```
- **Line 235**: `bg-green-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="absolute -left-[21px] bg-green-500 w-3 h-3 rounded-full border-4 border-white"></div>
  ```
- **Line 237**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h4 className="text-sm font-bold text-slate-800">
  ```
- **Line 240**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-slate-500">
  ```
- **Line 246**: `bg-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="absolute -left-[21px] bg-slate-300 w-3 h-3 rounded-full border-4 border-white"></div>
  ```
- **Line 248**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h4 className="text-sm font-bold text-slate-400">
  ```
- **Line 254**: `bg-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="absolute -left-[21px] bg-slate-300 w-3 h-3 rounded-full border-4 border-white"></div>
  ```
- **Line 256**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h4 className="text-sm font-bold text-slate-400">
  ```
- **Line 264**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 bg-slate-50 rounded-lg text-center font-bold text-slate-500">
  ```
- **Line 304**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="space-y-4 text-slate-700 py-2">
  ```
- **Line 305**: `text-blue-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3">
  ```
- **Line 318**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="flex items-start gap-3 cursor-pointer p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors mt-6">
  ```
- **Line 321**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'mt-1 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary';
  ```
- **Line 360**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm text-slate-600">
  ```
- **Line 365**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none';
  ```

## `src/features/customer-portal/quotations/PortalQuotationsPage.tsx`

- **Line 36**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm text-slate-500">
  ```
- **Line 83**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="text-slate-500 text-sm">
  ```
- **Line 86**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="text-slate-500 text-sm">
  ```
- **Line 88**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className={isExpired ? 'text-red-500' : ''}>
  ```
- **Line 95**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="right font-bold text-slate-800">
  ```
- **Line 148**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-xs text-slate-500 space-y-0.5">
  ```
- **Line 155**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  isExpired ? 'text-red-500 font-medium' : '';
  ```
- **Line 162**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="font-bold text-slate-800">
  ```

## `src/features/customers/components/CustomerGroupList.tsx`

- **Line 191**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-10 bg-slate-200 rounded-lg w-1/4" />
  ```
- **Line 192**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-40 bg-slate-100 rounded-xl" />
  ```
- **Line 378**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
  ```

## `src/features/customers/CustomerForm.tsx`

- **Line 424**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
  ```
- **Line 428**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs text-slate-400 italic">
  ```
- **Line 432**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex flex-wrap gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 h-full min-h-[90px] content-start">
  ```
- **Line 456**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
  ```
- **Line 456**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
  ```
- **Line 473**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
  ```
- **Line 482**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-4 min-h-[90px] flex items-center justify-center text-center text-xs text-slate-400 italic">
  ```
- **Line 482**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-4 min-h-[90px] flex items-center justify-center text-center text-xs text-slate-400 italic">
  ```
- **Line 491**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mt-8 pt-6 border-t border-slate-200">
  ```
- **Line 492**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
  ```

## `src/features/customers/CustomerPortalAccountPanel.tsx`

- **Line 119**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 min-h-[90px] flex items-center justify-center">
  ```
- **Line 120**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-slate-400 italic">
  ```
- **Line 128**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="rounded-xl p-3.5 space-y-3.5 border border-slate-200 bg-slate-50 h-full min-h-[90px] flex flex-col justify-between">
  ```
- **Line 132**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[11px] font-mono text-slate-500 truncate max-w-[140px] md:max-w-[180px]">
  ```
- **Line 139**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-slate-200 text-slate-500'
  ```
- **Line 139**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-slate-200 text-slate-500'
  ```
- **Line 144**: `bg-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  account.is_active ? 'bg-[#16a34a]' : 'bg-slate-400';
  ```
- **Line 159**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-[12px] text-slate-500 italic">
  ```
- **Line 173**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
  ```
- **Line 186**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
  ```

## `src/features/customers/CustomersPage.tsx`

- **Line 53**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="border-b border-slate-100 pb-2">
  ```

## `src/features/customers/CustomerTimeline.tsx`

- **Line 9**: `bg-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-amber-100 text-amber-800',
  ```
- **Line 9**: `text-amber-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-amber-100 text-amber-800',
  ```
- **Line 13**: `bg-purple-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-purple-100 text-purple-800',
  ```
- **Line 13**: `text-purple-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-purple-100 text-purple-800',
  ```
- **Line 17**: `bg-blue-100` ➡️ **Suggest:** `bg-info-soft`
  ```tsx
  colorClass: 'bg-blue-100 text-blue-800',
  ```
- **Line 17**: `text-blue-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-blue-100 text-blue-800',
  ```
- **Line 33**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-8 h-8 bg-slate-200 rounded-full" />
  ```
- **Line 35**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-4 bg-slate-200 rounded w-1/3" />
  ```
- **Line 36**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-3 bg-slate-100 rounded w-1/2" />
  ```
- **Line 46**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
  ```
- **Line 47**: `text-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="History" className="w-8 h-8 text-slate-300 mx-auto mb-2" />
  ```
- **Line 48**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm text-slate-500">
  ```
- **Line 56**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="relative border-l border-slate-200 ml-3 md:ml-4 space-y-6 pb-4">
  ```
- **Line 60**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-slate-100 text-slate-800',
  ```
- **Line 60**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  colorClass: 'bg-slate-100 text-slate-800',
  ```
- **Line 67**: `bg-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-amber-100 text-amber-600'
  ```
- **Line 67**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-amber-100 text-amber-600'
  ```
- **Line 69**: `bg-purple-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-purple-100 text-purple-600'
  ```
- **Line 69**: `text-purple-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-purple-100 text-purple-600'
  ```
- **Line 70**: `bg-blue-100` ➡️ **Suggest:** `bg-info-soft`
  ```tsx
  : 'bg-blue-100 text-blue-600'
  ```
- **Line 70**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  : 'bg-blue-100 text-blue-600'
  ```
- **Line 80**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
  ```
- **Line 88**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-medium text-slate-800">
  ```
- **Line 99**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-xs text-slate-500 flex items-center gap-1">
  ```
- **Line 111**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
  ```
- **Line 111**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
  ```

## `src/features/dashboard/dashboard.constants.ts`

- **Line 54**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  cssClass: 'text-emerald-500 bg-emerald-500/10',
  ```
- **Line 54**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  cssClass: 'text-emerald-500 bg-emerald-500/10',
  ```

## `src/features/fabric-catalog/components/B2BPlanner.tsx`

- **Line 90**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
  ```
- **Line 91**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 bg-slate-50 border-b border-slate-100">
  ```
- **Line 92**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
  ```
- **Line 106**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
  ```
- **Line 109**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'weight' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
  ```
- **Line 109**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'weight' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
  ```
- **Line 109**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'weight' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
  ```
- **Line 118**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'length' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
  ```
- **Line 118**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'length' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
  ```
- **Line 118**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'length' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
  ```
- **Line 127**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'garment' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
  ```
- **Line 127**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'garment' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
  ```
- **Line 127**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'garment' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
  ```
- **Line 143**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-sm border border-slate-300 rounded-xl pl-3 pr-12 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-bold transition-all';
  ```
- **Line 146**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-bold text-slate-500">
  ```
- **Line 154**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex-1 text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium';
  ```
- **Line 168**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 flex items-center justify-between">
  ```
- **Line 168**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 flex items-center justify-between">
  ```
- **Line 177**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
  ```
- **Line 179**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
  ```
- **Line 182**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] font-medium text-slate-400">
  ```
- **Line 189**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
  ```
- **Line 196**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-bold text-amber-600 flex items-center gap-1.5">
  ```
- **Line 201**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] text-rose-600 font-medium mt-1">
  ```
- **Line 208**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-medium text-slate-400">--</span>
  ```
- **Line 212**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
  ```
- **Line 213**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
  ```
- **Line 217**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-bold text-slate-800">
  ```
- **Line 229**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] text-slate-500 font-medium">
  ```
- **Line 233**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
  ```
- **Line 235**: `bg-blue-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'h-full rounded-full transition-all bg-blue-500';
  ```
- **Line 249**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="space-y-2 pt-2 border-t border-slate-100">
  ```
- **Line 250**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-bold text-slate-700 block">
  ```
- **Line 257**: `bg-indigo-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full rounded-full ${idx === 0 ? 'bg-indigo-400' : idx === 1 ? 'bg-blue-400' : idx === 2 ? 'bg-sky-400' : 'bg-emerald-400'}`}
  ```
- **Line 257**: `bg-blue-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full rounded-full ${idx === 0 ? 'bg-indigo-400' : idx === 1 ? 'bg-blue-400' : idx === 2 ? 'bg-sky-400' : 'bg-emerald-400'}`}
  ```
- **Line 257**: `bg-emerald-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full rounded-full ${idx === 0 ? 'bg-indigo-400' : idx === 1 ? 'bg-blue-400' : idx === 2 ? 'bg-sky-400' : 'bg-emerald-400'}`}
  ```
- **Line 262**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex justify-between text-[10px] text-slate-500 font-medium mt-1">
  ```
- **Line 266**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-slate-400">{step.days} ngày</span>
  ```
- **Line 275**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
  ```
- **Line 276**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
  ```
- **Line 277**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
  ```
- **Line 281**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-slate-600">Vải thực dùng:</span>
  ```
- **Line 285**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-slate-600">Hao hụt ước tính:</span>
  ```
- **Line 286**: `text-rose-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-rose-500">
  ```
- **Line 292**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
  ```
- **Line 293**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
  ```
- **Line 297**: `text-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
  ```
- **Line 301**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-bold text-slate-800">
  ```
- **Line 304**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] text-slate-500">~20kg/cuộn</span>
  ```
- **Line 313**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="space-y-4 pt-2 border-t border-slate-100">
  ```
- **Line 318**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-bold text-slate-700">
  ```
- **Line 333**: `text-rose-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs font-medium mt-1">
  ```
- **Line 333**: `border-rose-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs font-medium mt-1">
  ```
- **Line 345**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-bold text-slate-700 block">
  ```
- **Line 352**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2';
  ```
- **Line 354**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 border border-slate-100 shrink-0">
  ```
- **Line 354**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 border border-slate-100 shrink-0">
  ```
- **Line 358**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] font-medium text-slate-500 truncate">
  ```
- **Line 361**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-bold text-slate-800">
  ```
- **Line 375**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 bg-slate-50 border-t border-slate-100">
  ```

## `src/features/fabric-catalog/components/detail/FabricColorSelector.tsx`

- **Line 26**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="text-base font-bold text-gray-900">
  ```
- **Line 32**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <span className="font-semibold text-gray-900">
  ```
- **Line 36**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
  ```
- **Line 36**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
  ```
- **Line 57**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  : 'border-gray-200 hover:border-gray-300',
  ```
- **Line 57**: `border-gray-300` ➡️ **Suggest:** `border-muted`
  ```tsx
  : 'border-gray-200 hover:border-gray-300',
  ```
- **Line 63**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <span className="text-[10px] text-gray-500 font-medium">
  ```

## `src/features/fabric-catalog/components/detail/FabricFAQ.tsx`

- **Line 24**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 mb-3 uppercase">
  ```
- **Line 33**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <p className="font-semibold text-gray-900 mb-1">
  ```
- **Line 36**: `text-gray-700` ➡️ **Suggest:** `text-secondary`
  ```tsx
  <p className="text-gray-700 leading-relaxed">
  ```

## `src/features/fabric-catalog/components/detail/FabricHeaderActions.tsx`

- **Line 35**: `bg-green-100` ➡️ **Suggest:** `bg-success-soft`
  ```tsx
  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
  ```
- **Line 35**: `text-green-700` ➡️ **Suggest:** `text-success`
  ```tsx
  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
  ```
- **Line 39**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
  ```
- **Line 39**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
  ```
- **Line 48**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600';
  ```
- **Line 48**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600';
  ```
- **Line 60**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600';
  ```
- **Line 60**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600';
  ```
- **Line 65**: `bg-red-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
  ```
- **Line 72**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600';
  ```
- **Line 72**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600';
  ```
- **Line 88**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-600';
  ```

## `src/features/fabric-catalog/components/detail/FabricHeroGallery.tsx`

- **Line 61**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full aspect-[4/3] bg-slate-100 relative overflow-hidden border border-black/5">
  ```
- **Line 70**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
  ```
- **Line 106**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'border-transparent hover:border-slate-300',
  ```

## `src/features/fabric-catalog/components/detail/FabricPricingTable.tsx`

- **Line 43**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="text-base font-bold text-gray-900">
  ```
- **Line 56**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="overflow-hidden border border-slate-100 rounded-xl">
  ```
- **Line 59**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
  ```
- **Line 59**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
  ```
- **Line 66**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tbody className="divide-y divide-slate-100 text-slate-700">
  ```
- **Line 103**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 rounded-xl bg-slate-50 text-center border border-dashed border-slate-200">
  ```
- **Line 109**: `border-blue-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 rounded-xl bg-blue-50/50 text-center border border-dashed border-blue-200 flex flex-col items-center justify-center py-6">
  ```
- **Line 110**: `text-blue-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Lock" className="w-6 h-6 text-blue-400 mb-2" />
  ```
- **Line 111**: `text-blue-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-medium text-blue-900 mb-1">
  ```
- **Line 114**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  <p className="text-xs text-blue-600/80 mb-3 text-center">
  ```

## `src/features/fabric-catalog/components/detail/FabricRecommendations.tsx`

- **Line 26**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 border border-gray-100">
  ```
- **Line 26**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 border border-gray-100">
  ```
- **Line 57**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
  ```
- **Line 57**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
  ```
- **Line 75**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
  ```
- **Line 80**: `text-gray-950` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-semibold text-gray-950 text-xs truncate group-hover:text-primary transition-colors">
  ```
- **Line 95**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
  ```
- **Line 95**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
  ```
- **Line 113**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  <div className="w-full h-full flex items-center justify-center text-gray-400">
  ```
- **Line 119**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-primary transition-colors">
  ```
- **Line 126**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  className = 'w-4 h-4 text-gray-400 group-hover:text-primary';
  ```

## `src/features/fabric-catalog/components/detail/FabricRichContent.tsx`

- **Line 21**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 mb-3">
  ```
- **Line 27**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
  ```
- **Line 34**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h4 className="text-sm font-semibold text-gray-900">
  ```
- **Line 52**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 mb-3">
  ```
- **Line 65**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h4 className="text-sm font-semibold text-gray-900">
  ```

## `src/features/fabric-catalog/components/detail/FabricSpecsList.tsx`

- **Line 34**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  <span className="font-semibold text-gray-800 text-sm break-words">
  ```
- **Line 53**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
  ```
- **Line 53**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
  ```
- **Line 120**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
  ```
- **Line 120**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
  ```
- **Line 143**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-baseline gap-1.5 col-span-2 mt-2 pt-2 border-t border-slate-100">
  ```
- **Line 155**: `text-green-600` ➡️ **Suggest:** `text-success`
  ```tsx
  ? 'text-green-600'
  ```
- **Line 156**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  : 'text-red-500',
  ```

## `src/features/fabric-catalog/components/detail/FabricStickyCTA.tsx`

- **Line 26**: `bg-gray-100` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  'flex-1 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-2 rounded-xl transition-colors',
  ```
- **Line 26**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  'flex-1 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-2 rounded-xl transition-colors',
  ```
- **Line 26**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  'flex-1 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-2 rounded-xl transition-colors',
  ```
- **Line 67**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.08)] z-40">
  ```
- **Line 69**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center justify-center gap-4 px-3 py-1.5 bg-slate-50 border-b border-slate-100 max-w-md mx-auto">
  ```
- **Line 70**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center gap-1 text-[10px] text-slate-600">
  ```
- **Line 71**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Package" className="w-3 h-3 text-slate-400" />
  ```
- **Line 73**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-slate-800">{displayMOQ}</span>
  ```
- **Line 75**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-px h-3 bg-slate-200" />
  ```
- **Line 76**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center gap-1 text-[10px] text-slate-600">
  ```
- **Line 77**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Clock" className="w-3 h-3 text-slate-400" />
  ```
- **Line 79**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-slate-800">{displayLeadTime}</span>
  ```
- **Line 83**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-px h-3 bg-slate-200" />
  ```
- **Line 84**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center gap-1 text-[10px] text-slate-600">
  ```
- **Line 85**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Tag" className="w-3 h-3 text-slate-400" />
  ```
- **Line 86**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-emerald-700">
  ```

## `src/features/fabric-catalog/components/detail/FabricTitleAndBadges.tsx`

- **Line 30**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h2 className="text-xl font-bold text-gray-900 leading-snug">
  ```
- **Line 41**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-slate-100 text-slate-800 border-slate-200'
  ```
- **Line 41**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-slate-100 text-slate-800 border-slate-200'
  ```
- **Line 41**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-slate-100 text-slate-800 border-slate-200'
  ```
- **Line 42**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
  ```
- **Line 42**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
  ```
- **Line 53**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  ? 'bg-red-50 text-red-600 border-red-100'
  ```
- **Line 53**: `border-red-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-red-50 text-red-600 border-red-100'
  ```
- **Line 54**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
  ```
- **Line 54**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
  ```

## `src/features/fabric-catalog/components/FabricAdminTab.tsx`

- **Line 39**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
  ```
- **Line 41**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-4">
  ```
- **Line 75**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
  ```

## `src/features/fabric-catalog/components/FabricImageGalleryCard.tsx`

- **Line 50**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row items-stretch';
  ```
- **Line 52**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full sm:w-48 aspect-[4/3] sm:aspect-square bg-slate-100 relative group shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200">
  ```
- **Line 52**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full sm:w-48 aspect-[4/3] sm:aspect-square bg-slate-100 relative group shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200">
  ```
- **Line 61**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-slate-600 hover:text-red-600 p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all';
  ```
- **Line 61**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  className =
    'absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-slate-600 hover:text-red-600 p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all';
  ```
- **Line 78**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
  ```
- **Line 92**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full border-slate-200 bg-white text-slate-900 rounded-lg text-xs py-1.5 px-2 focus:ring-1 focus:ring-primary/20 transition-all';
  ```
- **Line 92**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full border-slate-200 bg-white text-slate-900 rounded-lg text-xs py-1.5 px-2 focus:ring-1 focus:ring-primary/20 transition-all';
  ```
- **Line 102**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
  ```
- **Line 108**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full border-slate-200 bg-white text-slate-900 rounded-lg text-xs py-1.5 px-3 focus:ring-1 focus:ring-primary/20 transition-all';
  ```
- **Line 108**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full border-slate-200 bg-white text-slate-900 rounded-lg text-xs py-1.5 px-3 focus:ring-1 focus:ring-primary/20 transition-all';
  ```
- **Line 114**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
  ```
- **Line 120**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full border-slate-200 bg-white text-slate-900 rounded-lg text-xs py-1.5 px-3 focus:ring-1 focus:ring-primary/20 transition-all';
  ```
- **Line 120**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full border-slate-200 bg-white text-slate-900 rounded-lg text-xs py-1.5 px-3 focus:ring-1 focus:ring-primary/20 transition-all';
  ```
- **Line 126**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-primary/50 transition-colors w-full sm:w-auto">
  ```
- **Line 129**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'rounded border-slate-300 text-primary focus:ring-primary w-4 h-4';
  ```
- **Line 132**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-semibold text-slate-700">
  ```

## `src/features/fabric-catalog/components/FabricImageGalleryEditor.tsx`

- **Line 20**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
  ```
- **Line 22**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-sm font-semibold text-slate-800">
  ```
- **Line 25**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-slate-500 mt-1">{LABELS.GALLERY_DESC}</p>
  ```
- **Line 29**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`relative cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 transition-colors flex items-center gap-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
  ```
- **Line 29**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`relative cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 transition-colors flex items-center gap-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
  ```
- **Line 53**: `text-yellow-800` ➡️ **Suggest:** `text-warning-strong`
  ```tsx
  <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs font-medium border border-yellow-200 flex items-start gap-2">
  ```
- **Line 53**: `border-yellow-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs font-medium border border-yellow-200 flex items-start gap-2">
  ```
- **Line 71**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
  ```
- **Line 72**: `text-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Image" className="w-10 h-10 text-slate-300 mb-3" />
  ```
- **Line 73**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-medium text-slate-600">
  ```
- **Line 76**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-slate-400 mt-1">
  ```
- **Line 98**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 h-32">
  ```
- **Line 100**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-semibold text-slate-500">
  ```

## `src/features/fabric-catalog/components/FabricPublicTab.tsx`

- **Line 20**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-10">
  ```
- **Line 29**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-12">
  ```
- **Line 32**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-px bg-slate-100 w-full" />
  ```
- **Line 36**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-px bg-slate-100 w-full" />
  ```
- **Line 40**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-px bg-slate-100 w-full" />
  ```

## `src/features/fabric-catalog/components/FabricReadinessScore.tsx`

- **Line 29**: `text-emerald-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
  ```
- **Line 29**: `border-emerald-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
  ```
- **Line 31**: `text-amber-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'text-amber-800 bg-amber-50 border-amber-200'
  ```
- **Line 31**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'text-amber-800 bg-amber-50 border-amber-200'
  ```
- **Line 32**: `text-red-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'text-red-800 bg-red-50 border-red-200';
  ```
- **Line 32**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'text-red-800 bg-red-50 border-red-200';
  ```
- **Line 42**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm border font-black text-lg text-slate-700">
  ```
- **Line 49**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
  ```
- **Line 49**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
  ```
- **Line 85**: `border-emerald-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'border-emerald-200 text-emerald-700'
  ```
- **Line 85**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'border-emerald-200 text-emerald-700'
  ```
- **Line 86**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'border-amber-200 text-amber-700',
  ```
- **Line 86**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'border-amber-200 text-amber-700',
  ```
- **Line 92**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={check.passed ? 'text-emerald-500' : 'text-amber-500'}
  ```
- **Line 92**: `text-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={check.passed ? 'text-emerald-500' : 'text-amber-500'}
  ```

## `src/features/fabric-catalog/components/InquiryCartDrawer.tsx`

- **Line 36**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
  ```
- **Line 37**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="font-bold text-gray-900 flex items-center gap-2">
  ```
- **Line 43**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-1 rounded-full hover:bg-slate-200 text-slate-500';
  ```
- **Line 43**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-1 rounded-full hover:bg-slate-200 text-slate-500';
  ```
- **Line 52**: `text-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="PackageOpen" className="w-12 h-12 text-slate-300" />
  ```
- **Line 66**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex gap-3 p-3 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow bg-white group relative';
  ```
- **Line 68**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
  ```
- **Line 77**: `text-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full h-full flex items-center justify-center text-slate-300">
  ```
- **Line 83**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-bold text-slate-800 truncate">
  ```
- **Line 88**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded inline-block mt-1">
  ```
- **Line 88**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded inline-block mt-1">
  ```
- **Line 95**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all';
  ```
- **Line 95**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  className =
    'absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all';
  ```
- **Line 107**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 border-t border-slate-100 bg-white space-y-2">
  ```
- **Line 110**: `bg-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm';
  ```
- **Line 110**: `bg-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm';
  ```
- **Line 117**: `bg-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm';
  ```
- **Line 117**: `bg-indigo-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm';
  ```

## `src/features/fabric-catalog/components/public-tab-sections/FabricPublicCustomerSection.tsx`

- **Line 16**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
  ```
- **Line 24**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-sm font-medium text-slate-700 block mb-3">
  ```
- **Line 35**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-4 h-4 rounded-full border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 35**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-4 h-4 rounded-full border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 41**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 41**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 45**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-emerald-500 mr-1.5';
  ```
- **Line 58**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-4 h-4 rounded-full border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 58**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-4 h-4 rounded-full border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 64**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 64**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 68**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-emerald-500 mr-1.5';
  ```
- **Line 81**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-4 h-4 rounded-full border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 81**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-4 h-4 rounded-full border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 87**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 87**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 91**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-emerald-500 mr-1.5';
  ```
- **Line 99**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-px bg-slate-100" />
  ```
- **Line 103**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-sm font-medium text-slate-700 block mb-3">
  ```
- **Line 114**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'rounded border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 114**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'rounded border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 120**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 120**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 124**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-emerald-500 mr-1.5';
  ```
- **Line 137**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'rounded border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 137**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'rounded border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 143**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 143**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 147**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-emerald-500 mr-1.5';
  ```
- **Line 160**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'rounded border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 160**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'rounded border-slate-300 text-emerald-600 focus:ring-emerald-600';
  ```
- **Line 166**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 166**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="flex items-center text-sm text-slate-700 group-hover:text-slate-900">
  ```
- **Line 170**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-emerald-500 mr-1.5';
  ```

## `src/features/fabric-catalog/components/public-tab-sections/FabricPublicFAQSection.tsx`

- **Line 52**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
  ```
- **Line 70**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <p className="text-xs text-red-500">{faqErrors.message}</p>
  ```
- **Line 74**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-amber-600">
  ```
- **Line 80**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
  ```
- **Line 83**: `text-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'w-8 h-8 text-slate-300 mx-auto mb-2';
  ```
- **Line 100**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 relative group';
  ```
- **Line 103**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-semibold text-slate-500 mt-1">
  ```
- **Line 109**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-slate-400 hover:text-red-500 transition-colors p-1';
  ```
- **Line 109**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'text-slate-400 hover:text-red-500 transition-colors p-1';
  ```
- **Line 117**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-medium text-slate-700 block mb-1">
  ```
- **Line 123**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';
  ```
- **Line 123**: `border-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';
  ```
- **Line 127**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <p className="text-xs text-red-500 mt-1">
  ```
- **Line 132**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-amber-600 mt-1">
  ```
- **Line 139**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-medium text-slate-700 block mb-1">
  ```
- **Line 146**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y';
  ```
- **Line 146**: `border-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y';
  ```
- **Line 150**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <p className="text-xs text-red-500 mt-1">
  ```

## `src/features/fabric-catalog/components/public-tab-sections/FabricPublicPlannerSection.tsx`

- **Line 24**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
  ```
- **Line 62**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-sm font-medium text-slate-700 mb-1';
  ```
- **Line 80**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <p className="text-xs text-red-500 mt-1">
  ```
- **Line 91**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors';
  ```
- **Line 91**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors';
  ```
- **Line 105**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
  ```

## `src/features/fabric-catalog/components/public-tab-sections/FabricPublicPreview.tsx`

- **Line 37**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
  ```
- **Line 44**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-[320px] bg-white rounded-2xl overflow-hidden flex flex-col shadow-sm border border-slate-200">
  ```
- **Line 46**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="aspect-square bg-slate-100 flex flex-col items-center justify-center relative">
  ```
- **Line 55**: `text-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Image" size={48} className="text-slate-300 mb-2" />
  ```
- **Line 56**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm text-slate-400 font-medium">
  ```
- **Line 64**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-200">
  ```
- **Line 64**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-200">
  ```
- **Line 71**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-8 h-8 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors';
  ```
- **Line 71**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-8 h-8 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors';
  ```
- **Line 71**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-8 h-8 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors';
  ```
- **Line 79**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 bg-white border-b border-slate-100">
  ```
- **Line 82**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h4 className="font-bold text-lg text-slate-800 leading-tight">
  ```
- **Line 85**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1 font-medium">
  ```
- **Line 93**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 bg-white space-y-3 border-b border-slate-100">
  ```
- **Line 96**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
  ```
- **Line 99**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xl font-extrabold text-emerald-600 leading-none">
  ```
- **Line 111**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 block">
  ```
- **Line 114**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-bold text-slate-700">
  ```
- **Line 122**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-2 border border-slate-100">
  ```
- **Line 123**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="w-2 h-2 rounded-full bg-emerald-500" />
  ```
- **Line 124**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-semibold text-slate-700">
  ```
- **Line 138**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 bg-white border-b border-slate-100">
  ```
- **Line 139**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
  ```
- **Line 142**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <ul className="space-y-1.5 text-xs font-medium text-slate-600">
  ```
- **Line 148**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-emerald-500';
  ```
- **Line 158**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-emerald-500';
  ```
- **Line 168**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-emerald-500';
  ```
- **Line 181**: `bg-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full py-2.5 bg-slate-900 text-white font-bold rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-sm';
  ```
- **Line 181**: `bg-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full py-2.5 bg-slate-900 text-white font-bold rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-sm';
  ```

## `src/features/fabric-catalog/components/public-tab-sections/FabricPublicPricingSection.tsx`

- **Line 69**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
  ```
- **Line 78**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
  ```
- **Line 81**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="font-bold text-slate-900 text-lg">
  ```
- **Line 92**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
  ```
- **Line 94**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
  ```
- **Line 97**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="font-bold text-slate-900 text-lg">
  ```
- **Line 101**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
  ```
- **Line 103**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
  ```
- **Line 106**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="font-bold text-slate-900 text-lg">
  ```
- **Line 110**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
  ```
- **Line 112**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
  ```
- **Line 115**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="font-bold text-slate-400 text-lg">
  ```
- **Line 125**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors';
  ```
- **Line 125**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors';
  ```
- **Line 139**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="pt-4 border-t border-slate-100 space-y-4">
  ```
- **Line 168**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="border border-slate-200 rounded-lg overflow-x-auto">
  ```
- **Line 170**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <thead className="bg-slate-50 text-slate-500 font-medium">
  ```
- **Line 299**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-slate-400 hover:text-red-500 transition-colors p-1';
  ```
- **Line 299**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'text-slate-400 hover:text-red-500 transition-colors p-1';
  ```
- **Line 313**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-8 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 text-sm bg-slate-50">
  ```
- **Line 313**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-8 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 text-sm bg-slate-50">
  ```
- **Line 347**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full h-9 px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-left text-xs font-semibold hover:bg-white focus:outline-none transition-all truncate flex items-center justify-between cursor-pointer';
  ```
- **Line 353**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-slate-400 shrink-0 ml-1';
  ```
- **Line 363**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="absolute right-0 top-10 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3.5 space-y-3 text-xs max-h-60 overflow-y-auto">
  ```
- **Line 364**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-slate-700 block mb-1">
  ```
- **Line 373**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 select-none py-1 hover:bg-slate-50 rounded px-1';
  ```
- **Line 373**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 select-none py-1 hover:bg-slate-50 rounded px-1';
  ```
- **Line 389**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] text-slate-400 font-mono">
  ```
- **Line 401**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-center text-primary font-bold hover:underline border-t border-slate-100 pt-2 block mt-2 cursor-pointer bg-transparent border-none';
  ```

## `src/features/fabric-catalog/components/public-tab-sections/FabricPublicSeoSection.tsx`

- **Line 39**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
  ```
- **Line 47**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
  ```
- **Line 51**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg min-w-0">
  ```
- **Line 56**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-slate-400 shrink-0';
  ```
- **Line 58**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-medium text-slate-700 truncate">
  ```
- **Line 67**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'shrink-0 h-8 text-xs px-2 text-slate-500 hover:text-slate-800';
  ```
- **Line 67**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'shrink-0 h-8 text-xs px-2 text-slate-500 hover:text-slate-800';
  ```
- **Line 83**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-xs text-red-500 mt-1 block">
  ```
- **Line 92**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'shrink-0 text-slate-500 hover:text-slate-800';
  ```
- **Line 92**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'shrink-0 text-slate-500 hover:text-slate-800';
  ```
- **Line 99**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-[10px] text-slate-400">
  ```
- **Line 107**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
  ```
- **Line 111**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-xs text-slate-500 break-all p-2 bg-slate-50 rounded border border-slate-100 flex-1 min-w-0 w-full">
  ```
- **Line 111**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-xs text-slate-500 break-all p-2 bg-slate-50 rounded border border-slate-100 flex-1 min-w-0 w-full">
  ```
- **Line 121**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors';
  ```
- **Line 121**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors';
  ```
- **Line 121**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors';
  ```
- **Line 129**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors';
  ```
- **Line 129**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors';
  ```
- **Line 129**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors';
  ```
- **Line 148**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1';
  ```
- **Line 148**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1';
  ```
- **Line 155**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 ml-2';
  ```
- **Line 155**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 ml-2';
  ```

## `src/features/fabric-catalog/components/public-tab-sections/FabricPublicStatusSection.tsx`

- **Line 26**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
  ```
- **Line 28**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
  ```
- **Line 30**: `bg-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
  ```
- **Line 35**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`text-xs font-semibold px-2 py-1 rounded-md ${isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
  ```
- **Line 35**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`text-xs font-semibold px-2 py-1 rounded-md ${isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
  ```
- **Line 35**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`text-xs font-semibold px-2 py-1 rounded-md ${isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
  ```
- **Line 35**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`text-xs font-semibold px-2 py-1 rounded-md ${isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
  ```
- **Line 44**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-medium text-slate-700">
  ```
- **Line 56**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-px bg-slate-100" />
  ```
- **Line 61**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-slate-500">{TAB_LABELS.LAST_UPDATED}</span>
  ```
- **Line 62**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-medium text-slate-700">
  ```
- **Line 69**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-slate-500">Public URL</span>
  ```
- **Line 78**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Copy" size={14} className="text-slate-500" />
  ```

## `src/features/fabric-catalog/components/PublicCompareModal.tsx`

- **Line 49**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
  ```
- **Line 50**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="font-bold text-gray-900 flex items-center gap-2">
  ```
- **Line 56**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-1 rounded-full hover:bg-slate-200 text-slate-500';
  ```
- **Line 56**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-1 rounded-full hover:bg-slate-200 text-slate-500';
  ```
- **Line 64**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-center py-16 text-slate-400 text-sm">
  ```
- **Line 68**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <table className="w-full border-collapse text-left text-xs text-slate-700 min-w-[500px]">
  ```
- **Line 70**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tr className="border-b border-slate-100 bg-slate-50">
  ```
- **Line 71**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <th className="p-3 font-semibold text-slate-900 w-1/4">
  ```
- **Line 95**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="p-3 font-medium text-slate-900">
  ```
- **Line 105**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="p-3 font-medium text-slate-900">
  ```
- **Line 117**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="p-3 font-medium text-slate-900">
  ```
- **Line 127**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="p-3 font-medium text-slate-900">
  ```
- **Line 140**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="p-3 font-medium text-slate-900">
  ```
- **Line 152**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="p-3 font-medium text-slate-900">MOQ</td>
  ```
- **Line 156**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-3 font-semibold text-slate-900';
  ```
- **Line 163**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="p-3 font-medium text-slate-900">
  ```
- **Line 169**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-3 font-semibold text-slate-900';
  ```
- **Line 175**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tr className="border-t border-slate-200">
  ```
- **Line 191**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'text-red-500 hover:text-red-700 font-semibold';
  ```
- **Line 191**: `text-red-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-red-500 hover:text-red-700 font-semibold';
  ```
- **Line 204**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-slate-50">
  ```

## `src/features/fabric-catalog/components/PublicFabricDetailSkeleton.tsx`

- **Line 6**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
  ```
- **Line 10**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="w-full aspect-[4/3] bg-gray-200"></div>
  ```
- **Line 15**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
  ```
- **Line 16**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
  ```
- **Line 17**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
  ```
- **Line 22**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
  ```
- **Line 25**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div key={i} className="w-10 h-10 rounded-full bg-gray-200"></div>
  ```
- **Line 32**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
  ```
- **Line 36**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
  ```
- **Line 37**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  ```

## `src/features/fabric-catalog/components/PublicInquiryModal.tsx`

- **Line 266**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
  ```
- **Line 267**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="font-bold text-gray-900 flex items-center gap-2">
  ```
- **Line 275**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-1 rounded-full hover:bg-slate-200 text-slate-500';
  ```
- **Line 275**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-1 rounded-full hover:bg-slate-200 text-slate-500';
  ```
- **Line 330**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-semibold text-slate-700">
  ```
- **Line 338**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-[#0068ff] hover:bg-[#0068ff]/5 transition-all group';
  ```
- **Line 340**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-[#0068ff]/10 flex items-center justify-center transition-colors">
  ```
- **Line 343**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-5 h-5 text-slate-500 group-hover:text-[#0068ff] transition-colors';
  ```
- **Line 346**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-bold text-slate-800">
  ```
- **Line 349**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] text-slate-500 leading-snug">
  ```
- **Line 404**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
  ```
- **Line 413**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-xs font-semibold text-slate-800';
  ```
- **Line 429**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-bold text-slate-700 block mb-1">
  ```
- **Line 430**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  {
    LABELS.requestedQty;
  }
  <span className="text-red-500">*</span>;
  ```
- **Line 439**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-sm border border-slate-200 rounded-xl pl-3 pr-12 py-2 focus:outline-none focus:border-primary bg-white';
  ```
- **Line 442**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-bold text-slate-500">
  ```
- **Line 448**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-start gap-1.5">
  ```
- **Line 448**: `border-blue-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-start gap-1.5">
  ```
- **Line 466**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-bold text-slate-700 block">
  ```
- **Line 467**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  {
    LABELS.contactNameLabel;
  }
  <span className="text-red-500">*</span>;
  ```
- **Line 474**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary';
  ```
- **Line 480**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-bold text-slate-700 block">
  ```
- **Line 481**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  {
    LABELS.contactPhoneLabel;
  }
  <span className="text-red-500">*</span>;
  ```
- **Line 488**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary';
  ```
- **Line 494**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-bold text-slate-700 block">
  ```
- **Line 501**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary';
  ```
- **Line 507**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-bold text-slate-700 block">
  ```
- **Line 514**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary';
  ```
- **Line 532**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-px flex-1 bg-slate-200" />
  ```
- **Line 533**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] text-slate-400 font-medium">
  ```
- **Line 536**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-px flex-1 bg-slate-200" />
  ```
- **Line 565**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
  ```
- **Line 566**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Check" className="w-8 h-8 text-emerald-600" />
  ```
- **Line 569**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-lg font-bold text-slate-900">
  ```
- **Line 572**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-slate-500 mt-1">
  ```
- **Line 579**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
  ```
- **Line 582**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-slate-900">
  ```

## `src/features/fabric-catalog/components/PublicLoginModal.tsx`

- **Line 70**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
  ```
- **Line 71**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="font-bold text-gray-900 flex items-center gap-2">
  ```
- **Line 77**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-1 rounded-full hover:bg-slate-200 text-slate-500';
  ```
- **Line 77**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-1 rounded-full hover:bg-slate-200 text-slate-500';
  ```
- **Line 85**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h2 className="text-xl font-bold text-gray-900 mb-1">
  ```
- **Line 88**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <p className="text-gray-500 text-sm">
  ```
- **Line 97**: `text-gray-700` ➡️ **Suggest:** `text-secondary`
  ```tsx
  className = 'text-sm font-medium text-gray-700';
  ```
- **Line 108**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  className =
    'w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all';
  ```
- **Line 108**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  className =
    'w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all';
  ```
- **Line 115**: `text-gray-700` ➡️ **Suggest:** `text-secondary`
  ```tsx
  className = 'text-sm font-medium text-gray-700';
  ```
- **Line 126**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  className =
    'w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all';
  ```
- **Line 126**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  className =
    'w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all';
  ```
- **Line 131**: `border-red-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center">
  ```
- **Line 132**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  <p className="text-red-600 text-sm font-medium">{serverError}</p>
  ```

## `src/features/fabric-catalog/components/PublicSampleModal.tsx`

- **Line 83**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
  ```
- **Line 84**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="font-bold text-gray-900 flex items-center gap-2">
  ```
- **Line 90**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-1 rounded-full hover:bg-slate-200 text-slate-500';
  ```
- **Line 90**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'p-1 rounded-full hover:bg-slate-200 text-slate-500';
  ```
- **Line 105**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
  ```
- **Line 114**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-xs font-semibold text-slate-800';
  ```
- **Line 131**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-bold text-slate-700 block">
  ```
- **Line 132**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  {
    LABELS.contactNameLabel;
  }
  <span className="text-red-500">*</span>;
  ```
- **Line 139**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary';
  ```
- **Line 146**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-bold text-slate-700 block">
  ```
- **Line 147**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  {
    LABELS.contactPhoneLabel;
  }
  <span className="text-red-500">*</span>;
  ```
- **Line 154**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary';
  ```
- **Line 161**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-bold text-slate-700 block">
  ```
- **Line 163**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-500">*</span>
  ```
- **Line 170**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary resize-none';
  ```
- **Line 177**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-bold text-slate-700 block">
  ```
- **Line 184**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary';
  ```

## `src/features/fabric-catalog/components/PublicStickyCTA.tsx`

- **Line 40**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.08)] z-40">
  ```
- **Line 44**: `bg-gray-100` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  className =
    'flex-1 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-2 rounded-xl transition-colors';
  ```
- **Line 44**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  className =
    'flex-1 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-2 rounded-xl transition-colors';
  ```
- **Line 44**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  className =
    'flex-1 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-2 rounded-xl transition-colors';
  ```

## `src/features/fabric-catalog/FabricCatalogForm.tsx`

- **Line 96**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="px-6 py-2 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
  ```

## `src/features/fabric-catalog/FabricVariantForm.tsx`

- **Line 392**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs text-emerald-600 italic">
  ```

## `src/features/fabric-catalog/PublicFabricDetailPage.tsx`

- **Line 123**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  <h1 className="text-xl font-bold text-gray-800 mb-2">
  ```
- **Line 128**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <p className="text-xs text-red-500 mb-6 font-mono break-all">
  ```

## `src/features/inventory/components/InventoryAdjustmentHistory.tsx`

- **Line 45**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-slate-800">{map[type] || type}</span>
  ```
- **Line 64**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`font-bold ${isPos ? 'text-emerald-600' : 'text-red-600'}`}
  ```
- **Line 64**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  className={`font-bold ${isPos ? 'text-emerald-600' : 'text-red-600'}`}
  ```
- **Line 116**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`font-bold ${r.adjustment_qty > 0 ? 'text-emerald-600' : 'text-red-600'}`}
  ```
- **Line 116**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  className={`font-bold ${r.adjustment_qty > 0 ? 'text-emerald-600' : 'text-red-600'}`}
  ```

## `src/features/inventory/components/InventoryAdjustmentModal.tsx`

- **Line 102**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
  ```
- **Line 207**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`font-bold ${form.watch('adjustmentQty') > 0 ? 'text-emerald-600' : 'text-red-600'}`}
  ```
- **Line 207**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  className={`font-bold ${form.watch('adjustmentQty') > 0 ? 'text-emerald-600' : 'text-red-600'}`}
  ```

## `src/features/inventory/components/InventoryMobileCard.tsx`

- **Line 23**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="font-bold text-slate-800">{roll.fabric_type}</p>
  ```
- **Line 40**: `text-orange-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Clock" size={14} className="text-orange-500/70" />
  ```
- **Line 75**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-black text-slate-700">
  ```
- **Line 98**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-sm font-black text-slate-700';
  ```
- **Line 101**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] ml-0.5 font-black text-slate-700">
  ```

## `src/features/inventory/components/YarnInventoryColumns.tsx`

- **Line 18**: `bg-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return { label: 'Empty', variant: 'gray', barColor: 'bg-slate-300' };
  ```
- **Line 24**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return { label: 'OK', variant: 'success', barColor: 'bg-emerald-500' };
  ```
- **Line 26**: `bg-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return { label: 'Low', variant: 'warning', barColor: 'bg-amber-500' };
  ```
- **Line 27**: `bg-red-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return { label: 'Risk', variant: 'danger', barColor: 'bg-red-500' };
  ```
- **Line 62**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  meta: { className: 'text-right max-sm:hidden text-slate-600' },
  ```
- **Line 69**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-600 font-medium">
  ```
- **Line 102**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
  ```
- **Line 137**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
  ```
- **Line 151**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-sm font-black text-slate-700';
  ```
- **Line 154**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] ml-0.5 font-black text-slate-700">
  ```
- **Line 159**: `text-red-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-[9px] uppercase text-red-400 font-bold mb-0.5">
  ```
- **Line 164**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'text-sm font-black text-red-600';
  ```
- **Line 167**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-[10px] ml-0.5 font-black text-red-600">
  ```
- **Line 172**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-[9px] uppercase text-emerald-600 font-bold mb-0.5">
  ```
- **Line 177**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-sm font-black text-emerald-700';
  ```
- **Line 180**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] ml-0.5 font-black text-emerald-700">
  ```

## `src/features/looms/components/LoomCompactCard.tsx`

- **Line 18**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  running: 'bg-emerald-500 text-white',
  ```
- **Line 19**: `bg-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  idle: 'bg-slate-400 text-white',
  ```
- **Line 20**: `bg-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  maintenance: 'bg-amber-500 text-white',
  ```
- **Line 21**: `bg-red-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  breakdown: 'bg-red-500 text-white',
  ```
- **Line 22**: `bg-purple-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  setup: 'bg-purple-500 text-white',
  ```
- **Line 83**: `bg-blue-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md text-xs font-semibold">
  ```
- **Line 83**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md text-xs font-semibold">
  ```
- **Line 83**: `text-blue-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md text-xs font-semibold">
  ```
- **Line 88**: `bg-blue-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md text-xs font-semibold">
  ```
- **Line 88**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md text-xs font-semibold">
  ```
- **Line 88**: `text-blue-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md text-xs font-semibold">
  ```
- **Line 93**: `bg-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-semibold">
  ```
- **Line 93**: `text-indigo-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-semibold">
  ```
- **Line 93**: `text-indigo-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-semibold">
  ```
- **Line 98**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-semibold">
  ```
- **Line 98**: `bg-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-semibold">
  ```
- **Line 98**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-semibold">
  ```
- **Line 98**: `text-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-semibold">
  ```
- **Line 103**: `bg-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md text-xs font-semibold">
  ```
- **Line 103**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md text-xs font-semibold">
  ```
- **Line 103**: `text-amber-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md text-xs font-semibold">
  ```
- **Line 112**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Layers" size={14} className="text-slate-400" />
  ```
- **Line 119**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Scale" size={14} className="text-slate-400" />
  ```
- **Line 122**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="font-bold text-emerald-600 dark:text-emerald-400">
  ```
- **Line 122**: `text-emerald-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="font-bold text-emerald-600 dark:text-emerald-400">
  ```
- **Line 132**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex flex-col gap-1">
  ```
- **Line 134**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
  ```
- **Line 134**: `text-emerald-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
  ```
- **Line 137**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
  ```
- **Line 137**: `text-emerald-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
  ```
- **Line 141**: `bg-emerald-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full bg-emerald-200 dark:bg-emerald-900 rounded-full h-1.5">
  ```
- **Line 141**: `bg-emerald-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-full bg-emerald-200 dark:bg-emerald-900 rounded-full h-1.5">
  ```
- **Line 143**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'bg-emerald-500 h-1.5 rounded-full';
  ```
- **Line 151**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'text-[0.65rem] text-emerald-600/80 dark:text-emerald-400/80 mt-1 truncate';
  ```
- **Line 151**: `text-emerald-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'text-[0.65rem] text-emerald-600/80 dark:text-emerald-400/80 mt-1 truncate';
  ```

## `src/features/looms/components/LoomFormStep1General.tsx`

- **Line 31**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
  ```
- **Line 31**: `text-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
  ```
- **Line 32**: `text-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Info" size={16} className="text-indigo-500" />
  ```
- **Line 111**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
  ```
- **Line 111**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
  ```

## `src/features/looms/components/LoomFormStep2Capacity.tsx`

- **Line 32**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
  ```
- **Line 32**: `text-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
  ```
- **Line 33**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Activity" size={16} className="text-emerald-500" />
  ```

## `src/features/looms/components/LoomFormStep3Specs.tsx`

- **Line 19**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
  ```
- **Line 19**: `text-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
  ```
- **Line 20**: `text-blue-500` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  <Icon name="Settings" size={16} className="text-blue-500" />
  ```

## `src/features/looms/components/LoomFormStep4Other.tsx`

- **Line 19**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
  ```
- **Line 19**: `text-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
  ```
- **Line 20**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <Icon name="FileText" size={16} className="text-gray-500" />
  ```

## `src/features/looms/components/LoomMobileCard.tsx`

- **Line 19**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20',
  ```
- **Line 19**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20',
  ```
- **Line 19**: `text-emerald-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20',
  ```
- **Line 21**: `bg-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20',
  ```
- **Line 21**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20',
  ```
- **Line 21**: `text-amber-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20',
  ```
- **Line 23**: `bg-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-slate-500/10 text-slate-700 dark:text-slate-400 ring-slate-500/20',
  ```
- **Line 23**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-slate-500/10 text-slate-700 dark:text-slate-400 ring-slate-500/20',
  ```
- **Line 23**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-slate-500/10 text-slate-700 dark:text-slate-400 ring-slate-500/20',
  ```
- **Line 26**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  active: 'bg-emerald-500',
  ```
- **Line 27**: `bg-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  maintenance: 'bg-amber-500',
  ```
- **Line 28**: `bg-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  inactive: 'bg-slate-500',
  ```

## `src/features/looms/components/MachineSpecMobileCard.tsx`

- **Line 12**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-emerald-100 text-emerald-800'
  ```
- **Line 12**: `text-emerald-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-emerald-100 text-emerald-800'
  ```
- **Line 13**: `bg-gray-100` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  : 'bg-gray-100 text-gray-800'
  ```
- **Line 13**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  : 'bg-gray-100 text-gray-800'
  ```
- **Line 29**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="inline-flex items-center rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
  ```
- **Line 35**: `text-purple-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="inline-flex items-center rounded-sm bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
  ```
- **Line 58**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="p-4 bg-white rounded-lg border border-gray-200">
  ```
- **Line 62**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <div className="text-sm text-gray-500">
  ```

## `src/features/looms/hooks/useMachineSpecColumns.tsx`

- **Line 97**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  ? 'text-red-500 hover:bg-red-50'
  ```
- **Line 98**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'text-emerald-600 hover:bg-emerald-50'
  ```

## `src/features/looms/LoomForm.tsx`

- **Line 172**: `bg-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="warning-inline mb-4 text-sm bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg flex items-start gap-2 border border-amber-200 dark:border-amber-500/20">
  ```
- **Line 172**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="warning-inline mb-4 text-sm bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg flex items-start gap-2 border border-amber-200 dark:border-amber-500/20">
  ```
- **Line 172**: `text-amber-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="warning-inline mb-4 text-sm bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg flex items-start gap-2 border border-amber-200 dark:border-amber-500/20">
  ```
- **Line 172**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="warning-inline mb-4 text-sm bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg flex items-start gap-2 border border-amber-200 dark:border-amber-500/20">
  ```
- **Line 172**: `border-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="warning-inline mb-4 text-sm bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg flex items-start gap-2 border border-amber-200 dark:border-amber-500/20">
  ```

## `src/features/operations/components/ActivityFeed.tsx`

- **Line 18**: `bg-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  a.avatarColor ?? 'bg-indigo-600',
  ```

## `src/features/operations/components/BlockedTransitionsWidget.tsx`

- **Line 151**: `border-rose-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'rounded-lg border border-rose-200/70 bg-rose-50/70 px-3 py-2';
  ```
- **Line 153**: `text-rose-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs font-medium text-rose-700 line-clamp-2">
  ```

## `src/features/operations/components/KanbanColumn.tsx`

- **Line 96**: `border-rose-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  if (blockedReason) return 'bg-rose-50/70 border border-rose-200/80';
  ```
- **Line 102**: `border-indigo-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return 'bg-indigo-50/60 border border-indigo-100';
  ```
- **Line 106**: `border-red-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return 'bg-red-50/60 border border-red-100';
  ```
- **Line 108**: `border-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return 'bg-emerald-50/60 border border-emerald-100';
  ```
- **Line 135**: `border-rose-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700">
  ```
- **Line 135**: `text-rose-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700">
  ```

## `src/features/operations/components/MiniCalendar.tsx`

- **Line 47**: `bg-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-indigo-600 text-white font-semibold'
  ```
- **Line 49**: `text-indigo-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-indigo-50 text-indigo-700 font-medium'
  ```
- **Line 55**: `bg-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-indigo-500" />
  ```

## `src/features/operations/components/TaskCard.tsx`

- **Line 46**: `border-indigo-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/40';
  ```
- **Line 46**: `border-indigo-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/40';
  ```
- **Line 50**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return 'border-red-200 hover:border-red-400 bg-red-50/40';
  ```
- **Line 50**: `border-red-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return 'border-red-200 hover:border-red-400 bg-red-50/40';
  ```
- **Line 52**: `border-emerald-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/40';
  ```
- **Line 52**: `border-emerald-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/40';
  ```
- **Line 54**: `border-indigo-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  return 'border-zinc-200 hover:border-indigo-300 bg-white';
  ```
- **Line 78**: `border-indigo-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'absolute top-2 right-2 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 opacity-60 hover:opacity-100 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all';
  ```
- **Line 78**: `text-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'absolute top-2 right-2 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 opacity-60 hover:opacity-100 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all';
  ```
- **Line 84**: `text-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="font-semibold text-zinc-900 leading-snug group-hover:text-indigo-600 mb-2">
  ```
- **Line 106**: `bg-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold">
  ```
- **Line 120**: `border-rose-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-700">
  ```
- **Line 120**: `text-rose-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-700">
  ```

## `src/features/operations/kanbanColumns.ts`

- **Line 23**: `bg-indigo-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  tone: 'bg-indigo-100 text-indigo-700',
  ```
- **Line 23**: `text-indigo-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  tone: 'bg-indigo-100 text-indigo-700',
  ```
- **Line 35**: `bg-red-100` ➡️ **Suggest:** `bg-danger-soft`
  ```tsx
  tone: 'bg-red-100 text-red-700',
  ```
- **Line 35**: `text-red-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  tone: 'bg-red-100 text-red-700',
  ```
- **Line 41**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  tone: 'bg-emerald-100 text-emerald-700',
  ```
- **Line 41**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  tone: 'bg-emerald-100 text-emerald-700',
  ```

## `src/features/operations/TaskForm.container.tsx`

- **Line 110**: `border-indigo-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  ```

## `src/features/operations/TaskForm.view.tsx`

- **Line 288**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100';
  ```
- **Line 288**: `text-red-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100';
  ```
- **Line 288**: `border-red-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100';
  ```

## `src/features/orders/dashboard/components/FulfillmentKpiCards.tsx`

- **Line 33**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  color: 'text-blue-600',
  ```
- **Line 34**: `border-blue-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  bgColor: 'bg-blue-50 border-blue-100',
  ```
- **Line 41**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'text-emerald-600',
  ```
- **Line 42**: `border-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  bgColor: 'bg-emerald-50 border-emerald-100',
  ```
- **Line 52**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  color: summary.overdueOrders > 0 ? 'text-red-600' : 'text-zinc-500',
  ```
- **Line 55**: `border-red-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-red-50 border-red-100'
  ```

## `src/features/orders/dashboard/components/FulfillmentProgressBar.tsx`

- **Line 19**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-emerald-500'
  ```
- **Line 21**: `bg-blue-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-blue-500'
  ```
- **Line 22**: `bg-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-amber-500';
  ```
- **Line 35**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'text-emerald-600'
  ```
- **Line 37**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  ? 'text-blue-600'
  ```
- **Line 38**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'text-amber-600'
  ```

## `src/features/orders/dashboard/components/OrderFulfillmentTable.tsx`

- **Line 121**: `border-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
  ```
- **Line 136**: `text-indigo-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
  ```
- **Line 136**: `border-indigo-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
  ```
- **Line 248**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  ? 'text-red-600 font-bold'
  ```
- **Line 257**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'inline ml-1 text-red-500';
  ```

## `src/features/orders/dashboard/components/StageTimeline.tsx`

- **Line 41**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  isDone ? 'bg-emerald-500' : 'bg-zinc-200';
  ```

## `src/features/orders/OrderList.tsx`

- **Line 129**: `text-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors';
  ```
- **Line 129**: `bg-indigo-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors';
  ```
- **Line 129**: `border-indigo-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors';
  ```

## `src/features/payments/components/UnpaidDocumentsSection.tsx`

- **Line 56**: `border-gray-300` ➡️ **Suggest:** `border-muted`
  ```tsx
  className="w-4 h-4 rounded appearance-none checked:bg-primary border border-gray-300 checked:border-primary shrink-0 relative
  ```

## `src/features/procurement/purchase-orders/components/detail/POActionsCard.tsx`

- **Line 100**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2">
  ```
- **Line 100**: `border-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2">
  ```

## `src/features/procurement/purchase-orders/components/detail/POApprovalHistory.tsx`

- **Line 35**: `border-green-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-green-50 border-green-200 text-green-600'
  ```
- **Line 35**: `text-green-600` ➡️ **Suggest:** `text-success`
  ```tsx
  ? 'bg-green-50 border-green-200 text-green-600'
  ```
- **Line 37**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-red-50 border-red-200 text-red-600'
  ```
- **Line 37**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  ? 'bg-red-50 border-red-200 text-red-600'
  ```
- **Line 39**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-amber-50 border-amber-200 text-amber-600'
  ```
- **Line 39**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-amber-50 border-amber-200 text-amber-600'
  ```
- **Line 40**: `border-blue-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-blue-50 border-blue-200 text-blue-600'
  ```
- **Line 40**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  : 'bg-blue-50 border-blue-200 text-blue-600'
  ```
- **Line 56**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
  ```
- **Line 61**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <span className="font-medium text-gray-900">
  ```
- **Line 65**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <span className="text-gray-500 mx-2">•</span>
  ```
- **Line 66**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <span className="text-sm text-gray-500">
  ```
- **Line 93**: `text-gray-700` ➡️ **Suggest:** `text-secondary`
  ```tsx
  <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
  ```
- **Line 93**: `border-gray-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
  ```

## `src/features/procurement/purchase-orders/components/detail/POApproveModal.tsx`

- **Line 26**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="font-semibold text-lg text-gray-900 m-0">
  ```
- **Line 29**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <p className="text-sm text-gray-500">
  ```
- **Line 33**: `text-gray-600` ➡️ **Suggest:** `text-muted`
  ```tsx
  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
  ```
- **Line 50**: `border-gray-300` ➡️ **Suggest:** `border-muted`
  ```tsx
  className = 'w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary';
  ```
- **Line 54**: `text-gray-700` ➡️ **Suggest:** `text-secondary`
  ```tsx
  className = 'text-sm text-gray-700 select-none cursor-pointer';
  ```

## `src/features/procurement/purchase-orders/components/detail/POGoodsReceiptsList.tsx`

- **Line 30**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="p-16 flex flex-col items-center justify-center text-center bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-xl m-4">
  ```
- **Line 31**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-5 text-gray-400">
  ```
- **Line 34**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  <h4 className="text-xl font-bold text-gray-800 mb-2">
  ```
- **Line 37**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <p className="text-base text-gray-500 max-w-md mb-8">
  ```
- **Line 75**: `text-green-600` ➡️ **Suggest:** `text-success`
  ```tsx
  <span className="font-medium text-green-600">
  ```

## `src/features/procurement/purchase-orders/components/detail/POInfoCard.tsx`

- **Line 68**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="col-span-2 mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
  ```
- **Line 68**: `text-red-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="col-span-2 mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
  ```

## `src/features/procurement/purchase-orders/components/detail/POMaterialsTable.tsx`

- **Line 45**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  <td className="px-4 py-3 text-gray-800">
  ```
- **Line 52**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  <span className="font-medium text-xs text-gray-400 font-mono">
  ```
- **Line 74**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
  ```
- **Line 77**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="px-4 py-3 text-right text-amber-600 font-semibold">
  ```
- **Line 82**: `text-gray-700` ➡️ **Suggest:** `text-secondary`
  ```tsx
  <span className="text-xs font-bold text-gray-700">
  ```
- **Line 85**: `bg-gray-100` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
  ```
- **Line 85**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
  ```
- **Line 87**: `bg-gray-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full transition-all ${percent === 0 ? 'bg-gray-300' : percent >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
  ```
- **Line 87**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full transition-all ${percent === 0 ? 'bg-gray-300' : percent >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
  ```
- **Line 87**: `bg-amber-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full transition-all ${percent === 0 ? 'bg-gray-300' : percent >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
  ```

## `src/features/procurement/purchase-orders/components/detail/PORejectModal.tsx`

- **Line 23**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="font-semibold text-lg text-gray-900 m-0">
  ```
- **Line 28**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <p className="text-sm text-gray-500">
  ```
- **Line 34**: `text-gray-600` ➡️ **Suggest:** `text-muted`
  ```tsx
  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
  ```
- **Line 36**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-500">*</span>
  ```

## `src/features/procurement/purchase-orders/components/detail/POTemplate.tsx`

- **Line 35**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  className = 'p-8 bg-white text-gray-800 text-sm font-sans relative';
  ```
- **Line 77**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  <span className="text-[10px] text-gray-400 mt-1">
  ```
- **Line 85**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h1 className="font-bold text-2xl text-gray-900 m-0 uppercase">
  ```
- **Line 88**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <p className="text-gray-500 font-semibold mt-1">
  ```
- **Line 94**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="grid grid-cols-2 gap-8 mb-6 border border-gray-200 p-4 rounded-xl">
  ```
- **Line 96**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2 uppercase text-xs">
  ```
- **Line 96**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2 uppercase text-xs">
  ```
- **Line 119**: `text-gray-900` ➡️ **Suggest:** `text-foreground hoặc text-primary`
  ```tsx
  <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2 uppercase text-xs">
  ```
- **Line 119**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2 uppercase text-xs">
  ```
- **Line 145**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <table className="w-full border-collapse border border-gray-200 text-xs">
  ```
- **Line 148**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <th className="border border-gray-200 p-2 text-center w-10">
  ```
- **Line 151**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <th className="border border-gray-200 p-2 text-left">
  ```
- **Line 154**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <th className="border border-gray-200 p-2 text-left">
  ```
- **Line 157**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <th className="border border-gray-200 p-2 text-center w-16">
  ```
- **Line 160**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <th className="border border-gray-200 p-2 text-right w-20">
  ```
- **Line 163**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <th className="border border-gray-200 p-2 text-right w-24">
  ```
- **Line 166**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <th className="border border-gray-200 p-2 text-right w-28">
  ```
- **Line 176**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <td className="border border-gray-200 p-2 text-center">
  ```
- **Line 179**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <td className="border border-gray-200 p-2 font-mono">
  ```
- **Line 182**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <td className="border border-gray-200 p-2">{detail.name}</td>
  ```
- **Line 183**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <td className="border border-gray-200 p-2 text-center uppercase">
  ```
- **Line 186**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <td className="border border-gray-200 p-2 text-right">
  ```
- **Line 189**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <td className="border border-gray-200 p-2 text-right">
  ```
- **Line 192**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <td className="border border-gray-200 p-2 text-right font-medium">
  ```
- **Line 205**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <p className="text-xs text-gray-500 italic">
  ```
- **Line 209**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="w-5/12 border border-gray-200 rounded-xl p-3 bg-gray-50 text-xs">
  ```
- **Line 210**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="flex justify-between py-1 border-b border-gray-200">
  ```
- **Line 217**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="flex justify-between py-1 border-b border-gray-200">
  ```
- **Line 231**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="flex justify-between py-1 border-b border-gray-200">
  ```
- **Line 253**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-0.5 w-32 bg-gray-200 mx-auto mb-1"></div>
  ```
- **Line 254**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <span className="text-xs text-gray-500">
  ```
- **Line 262**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-0.5 w-32 bg-gray-200 mx-auto mb-1"></div>
  ```
- **Line 263**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <span className="text-xs text-gray-500">
  ```
- **Line 271**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-0.5 w-32 bg-gray-200 mx-auto mb-1"></div>
  ```
- **Line 272**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <span className="text-xs text-gray-500">
  ```
- **Line 281**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="border-t border-gray-200 mt-20 pt-4 text-center text-[10px] text-gray-400">
  ```
- **Line 281**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  <div className="border-t border-gray-200 mt-20 pt-4 text-center text-[10px] text-gray-400">
  ```

## `src/features/procurement/purchase-orders/components/detail/POTimeline.tsx`

- **Line 26**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center gap-4 py-4 px-6 bg-amber-50 border border-amber-200 rounded-xl shadow-sm mb-6 text-amber-700">
  ```
- **Line 26**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center gap-4 py-4 px-6 bg-amber-50 border border-amber-200 rounded-xl shadow-sm mb-6 text-amber-700">
  ```
- **Line 27**: `text-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="AlertCircle" size={24} className="text-amber-500" />
  ```
- **Line 37**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center gap-4 py-4 px-6 bg-red-50 border border-red-200 rounded-xl shadow-sm mb-6 text-red-700">
  ```
- **Line 37**: `text-red-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center gap-4 py-4 px-6 bg-red-50 border border-red-200 rounded-xl shadow-sm mb-6 text-red-700">
  ```
- **Line 38**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <Icon name="XCircle" size={24} className="text-red-500" />
  ```
- **Line 47**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="flex items-center gap-4 py-4 px-6 bg-gray-50 border border-gray-200 rounded-xl shadow-sm mb-6 text-gray-700">
  ```
- **Line 47**: `text-gray-700` ➡️ **Suggest:** `text-secondary`
  ```tsx
  <div className="flex items-center gap-4 py-4 px-6 bg-gray-50 border border-gray-200 rounded-xl shadow-sm mb-6 text-gray-700">
  ```
- **Line 48**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <Icon name="Slash" size={24} className="text-gray-500" />
  ```
- **Line 65**: `bg-gray-100` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="absolute left-14 right-14 top-5 h-1.5 bg-gray-100 -z-10 rounded-full"></div>
  ```
- **Line 81**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-white shadow-md' : 'bg-surface border-gray-200 text-gray-400'}`}
  ```
- **Line 81**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-white shadow-md' : 'bg-surface border-gray-200 text-gray-400'}`}
  ```
- **Line 86**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  className={`text-sm font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}
  ```
- **Line 86**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  className={`text-sm font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}
  ```

## `src/features/procurement/purchase-orders/components/POAttachmentsCard.tsx`

- **Line 10**: `border-gray-300` ➡️ **Suggest:** `border-muted`
  ```tsx
  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center text-gray-500 hover:bg-gray-50 hover:border-primary cursor-pointer transition-colors">
  ```
- **Line 10**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center text-gray-500 hover:bg-gray-50 hover:border-primary cursor-pointer transition-colors">
  ```
- **Line 11**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  <Icon name="UploadCloud" size={32} className="mb-2 text-gray-400" />
  ```

## `src/features/procurement/purchase-orders/components/POGeneralInfoCard.tsx`

- **Line 78**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-500">*</span>
  ```
- **Line 99**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-500 text-sm mt-1 block">
  ```
- **Line 107**: `bg-gray-100` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg h-9 items-center">
  ```
- **Line 113**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  : 'text-gray-500 hover:text-gray-800'
  ```
- **Line 113**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  : 'text-gray-500 hover:text-gray-800'
  ```
- **Line 124**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  : 'text-gray-500 hover:text-gray-800'
  ```
- **Line 124**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  : 'text-gray-500 hover:text-gray-800'
  ```
- **Line 163**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-500">*</span>
  ```
- **Line 167**: `border-red-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`field-input h-9 ${errors.order_date ? 'border-danger border-red-500' : ''}`}
  ```
- **Line 171**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-500 text-sm mt-1 block">
  ```

## `src/features/procurement/purchase-orders/components/POItemsTable.tsx`

- **Line 81**: `text-gray-600` ➡️ **Suggest:** `text-muted`
  ```tsx
  <thead className="text-xs text-gray-600 bg-gray-50/80 border-b border-border sticky top-0 z-20 backdrop-blur-sm">
  ```
- **Line 88**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-500">*</span>
  ```
- **Line 94**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  {
    PO_CONSTANTS.COL_QTY;
  }
  <span className="text-red-500">*</span>;
  ```
- **Line 98**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-500">*</span>
  ```
- **Line 126**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  <td className="px-3 py-1.5 text-center text-gray-400 align-middle">
  ```
- **Line 153**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-[10px] text-red-500 mt-0.5 leading-tight">
  ```
- **Line 197**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-[10px] text-red-500 mt-0.5 leading-tight text-right">
  ```
- **Line 215**: `border-amber-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'border-amber-400 focus:border-amber-500 text-amber-700 bg-amber-50/20 font-semibold'
  ```
- **Line 215**: `border-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'border-amber-400 focus:border-amber-500 text-amber-700 bg-amber-50/20 font-semibold'
  ```
- **Line 215**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'border-amber-400 focus:border-amber-500 text-amber-700 bg-amber-50/20 font-semibold'
  ```
- **Line 226**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-[10px] text-red-500 mt-0.5 leading-tight text-right">
  ```
- **Line 232**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-[10px] text-amber-700 flex items-center gap-1 mt-1 bg-amber-50 p-1 rounded border border-amber-200 justify-end font-semibold">
  ```
- **Line 232**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-[10px] text-amber-700 flex items-center gap-1 mt-1 bg-amber-50 p-1 rounded border border-amber-200 justify-end font-semibold">
  ```
- **Line 243**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  <td className="px-3 py-1.5 text-right tabular-nums text-gray-800 font-semibold align-middle">
  ```
- **Line 258**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  className =
    'text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 mr-1';
  ```
- **Line 266**: `text-gray-400` ➡️ **Suggest:** `text-muted-foreground`
  ```tsx
  className =
    'text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1';
  ```
- **Line 266**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  className =
    'text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1';
  ```
- **Line 278**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <div className="p-3 text-red-500 text-sm bg-red-50">
  ```

## `src/features/procurement/purchase-orders/components/POPaymentPanel.tsx`

- **Line 91**: `text-gray-600` ➡️ **Suggest:** `text-muted`
  ```tsx
  <div className="flex justify-between items-center text-sm text-gray-600">
  ```
- **Line 93**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  <span className="font-semibold tabular-nums text-gray-800">
  ```
- **Line 98**: `text-gray-600` ➡️ **Suggest:** `text-muted`
  ```tsx
  <div className="flex justify-between items-center text-sm text-gray-600">
  ```
- **Line 100**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  <span className="font-semibold tabular-nums text-gray-800">
  ```
- **Line 105**: `text-gray-600` ➡️ **Suggest:** `text-muted`
  ```tsx
  <div className="flex justify-between items-center text-sm text-gray-600">
  ```
- **Line 107**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  <span className="font-semibold tabular-nums text-gray-800">
  ```
- **Line 112**: `border-gray-300` ➡️ **Suggest:** `border-muted`
  ```tsx
  <div className="border-t border-dashed border-gray-300 pt-3.5">
  ```
- **Line 114**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  <span className="font-bold text-sm text-gray-800 uppercase tracking-wider">
  ```
- **Line 121**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <span className="text-xs font-bold text-gray-500 ml-1.5 uppercase">
  ```

## `src/features/procurement/purchase-orders/GoodsReceiptForm.tsx`

- **Line 97**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  className = 'text-gray-500 hover:text-gray-800 text-2xl';
  ```
- **Line 97**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  className = 'text-gray-500 hover:text-gray-800 text-2xl';
  ```
- **Line 113**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  {
    PO_CONSTANTS.GR_DATE;
  }
  <span className="text-red-500">*</span>;
  ```
- **Line 121**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-500 text-sm mt-1 block">
  ```
- **Line 157**: `text-orange-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="p-3 text-right text-orange-600 font-medium">
  ```
- **Line 168**: `border-red-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`field-input text-right ${errors.items?.[index]?.received_qty ? 'border-red-500' : ''}`}
  ```
- **Line 178**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-500 text-xs mt-1 block">
  ```
- **Line 197**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <div className="text-red-500 text-sm">
  ```

## `src/features/procurement/purchase-orders/POCreatePage.tsx`

- **Line 144**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
  ```
- **Line 145**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-64 bg-gray-200 rounded-xl"></div>
  ```
- **Line 159**: `bg-gray-100` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
  ```
- **Line 159**: `text-gray-600` ➡️ **Suggest:** `text-muted`
  ```tsx
  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
  ```
- **Line 159**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
  ```

## `src/features/procurement/purchase-orders/PODetailPage.tsx`

- **Line 189**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
  ```
- **Line 190**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-10 bg-gray-200 rounded w-24"></div>
  ```
- **Line 192**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
  ```
- **Line 194**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-64 bg-gray-200 rounded-xl lg:col-span-2"></div>
  ```
- **Line 195**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-64 bg-gray-200 rounded-xl lg:col-span-1"></div>
  ```
- **Line 197**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="h-64 bg-gray-200 rounded-xl w-full"></div>
  ```
- **Line 204**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <div className="p-8 text-center text-red-500">
  ```

## `src/features/procurement/purchase-orders/POListTable.tsx`

- **Line 88**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
  ```
- **Line 90**: `bg-green-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full ${p >= 100 ? 'bg-green-500' : p > 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
  ```
- **Line 90**: `bg-orange-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full ${p >= 100 ? 'bg-green-500' : p > 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
  ```
- **Line 90**: `bg-gray-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full ${p >= 100 ? 'bg-green-500' : p > 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
  ```
- **Line 180**: `bg-gray-200` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
  ```
- **Line 182**: `bg-green-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full transition-all ${p >= 100 ? 'bg-green-500' : p > 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
  ```
- **Line 182**: `bg-orange-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full transition-all ${p >= 100 ? 'bg-green-500' : p > 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
  ```
- **Line 182**: `bg-gray-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`h-full transition-all ${p >= 100 ? 'bg-green-500' : p > 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
  ```

## `src/features/procurement/rfqs/components/RFQQuotesTab.tsx`

- **Line 36**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
  ```
- **Line 37**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
  ```
- **Line 52**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
  ```
- **Line 53**: `text-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Inbox" size={48} className="text-slate-300 mx-auto mb-4" />
  ```
- **Line 54**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-slate-500 font-medium">
  ```
- **Line 57**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm text-slate-400 mt-1">
  ```
- **Line 105**: `border-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'border-emerald-500 ring-1 ring-emerald-500'
  ```
- **Line 106**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'border-slate-200 hover:border-blue-300'
  ```
- **Line 106**: `border-blue-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'border-slate-200 hover:border-blue-300'
  ```
- **Line 110**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-start justify-between gap-4">
  ```
- **Line 113**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="font-bold text-lg text-slate-800">
  ```
- **Line 118**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
  ```
- **Line 120**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Phone" size={14} className="text-slate-400" />
  ```
- **Line 124**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Clock" size={14} className="text-slate-400" />
  ```
- **Line 129**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mt-3 text-sm text-slate-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
  ```
- **Line 129**: `border-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mt-3 text-sm text-slate-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
  ```
- **Line 130**: `text-amber-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-semibold text-amber-800">
  ```
- **Line 139**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
  ```
- **Line 167**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
  ```
- **Line 186**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="font-medium text-slate-700">
  ```
- **Line 193**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-xs text-amber-600 mt-0.5">
  ```
- **Line 205**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="px-5 py-3 text-right font-semibold text-slate-800">
  ```
- **Line 209**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate';
  ```

## `src/features/procurement/rfqs/RFQDetail.tsx`

- **Line 40**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
  ```
- **Line 41**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
  ```
- **Line 48**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl mt-8">
  ```
- **Line 54**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-lg font-bold text-slate-800 mb-2">
  ```
- **Line 233**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-6 text-center text-slate-500">
  ```

## `src/features/procurement/suppliers/hooks/useSupplierColumns.tsx`

- **Line 85**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-medium text-emerald-600">
  ```

## `src/features/procurement/suppliers/SupplierPriceList.tsx`

- **Line 97**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  {
    L.LBL_MATERIAL_CODE;
  }
  <span className="text-red-500">*</span>;
  ```
- **Line 106**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-red-500 text-xs">
  ```
- **Line 113**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  {
    L.LBL_UNIT_PRICE;
  }
  <span className="text-red-500">*</span>;
  ```

## `src/features/settings/CompanySettingsForm.tsx`

- **Line 69**: `bg-blue-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
  ```
- **Line 69**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
  ```
- **Line 243**: `bg-purple-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
  ```
- **Line 243**: `text-purple-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
  ```

## `src/features/settings/FinanceSettingsForm.tsx`

- **Line 63**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
  ```
- **Line 63**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
  ```

## `src/features/settings/IntegrationSettingsForm.tsx`

- **Line 58**: `bg-orange-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
  ```
- **Line 58**: `text-orange-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
  ```

## `src/features/settings/NotificationSettingsForm.tsx`

- **Line 73**: `bg-rose-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
  ```
- **Line 73**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
  ```

## `src/features/settings/NumberingSettingsForm.tsx`

- **Line 70**: `bg-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
  ```
- **Line 70**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
  ```

## `src/features/settings/PermissionMatrixForm.tsx`

- **Line 321**: `text-amber-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="AlertCircle" size={18} className="text-amber-400" />
  ```

## `src/features/settings/ProductionSettingsForm.tsx`

- **Line 61**: `bg-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
  ```
- **Line 61**: `text-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
  ```

## `src/features/settings/settings.plugin.tsx`

- **Line 39**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="p-4 text-sm text-slate-500">Đang tải cấu hình...</div>
  ```

## `src/features/settings/SettingsLayout.tsx`

- **Line 114**: `bg-red-100` ➡️ **Suggest:** `bg-danger-soft`
  ```tsx
  className =
    'px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors';
  ```
- **Line 114**: `text-red-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors';
  ```
- **Line 114**: `bg-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors';
  ```

## `src/features/settings/UiSettingsForm.tsx`

- **Line 66**: `bg-pink-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0">
  ```
- **Line 66**: `text-pink-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0">
  ```

## `src/features/shipments/AdHocShipmentForm.tsx`

- **Line 147**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
  ```
- **Line 147**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
  ```
- **Line 148**: `text-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="FileText" className="w-5 h-5 text-indigo-500" />
  ```
- **Line 223**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-medium text-slate-700">
  ```
- **Line 234**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
  ```
- **Line 234**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
  ```
- **Line 235**: `text-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Truck" className="w-5 h-5 text-indigo-500" />
  ```
- **Line 368**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
  ```
- **Line 368**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
  ```
- **Line 369**: `text-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Package" className="w-5 h-5 text-indigo-500" />
  ```

## `src/features/shipments/components/ops/DispatchConfirmSheet.tsx`

- **Line 60**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm">
  ```
- **Line 60**: `text-amber-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm">
  ```
- **Line 61**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-bold text-slate-800 mb-2">
  ```
- **Line 64**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm text-slate-600">
  ```
- **Line 72**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="form-label block text-slate-700">
  ```
- **Line 73**: `text-rose-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  {
    MSG.LBL_ORDER;
  }
  <span className="text-rose-500">*</span>;
  ```

## `src/features/shipments/components/quick-print/K80PrintLayout.tsx`

- **Line 200**: `text-gray-500` ➡️ **Suggest:** `text-muted`
  ```tsx
  <div className="text-center italic text-gray-500 my-4">
  ```

## `src/features/shipments/components/ShipmentMobileCard.tsx`

- **Line 13**: `bg-blue-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  shipped: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20',
  ```
- **Line 13**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  shipped: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20',
  ```
- **Line 13**: `text-blue-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  shipped: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20',
  ```
- **Line 15**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20',
  ```
- **Line 15**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20',
  ```
- **Line 15**: `text-emerald-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20',
  ```
- **Line 17**: `bg-purple-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-500/20',
  ```
- **Line 17**: `text-purple-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-500/20',
  ```
- **Line 17**: `text-purple-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-500/20',
  ```
- **Line 18**: `bg-red-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  returned: 'bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20',
  ```
- **Line 18**: `text-red-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  returned: 'bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20',
  ```
- **Line 18**: `text-red-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  returned: 'bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20',
  ```
- **Line 20**: `bg-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20',
  ```
- **Line 20**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20',
  ```
- **Line 20**: `text-amber-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20',
  ```
- **Line 23**: `bg-blue-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  shipped: 'bg-blue-500',
  ```
- **Line 24**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  delivered: 'bg-emerald-500',
  ```
- **Line 25**: `bg-purple-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  partially_returned: 'bg-purple-500',
  ```
- **Line 26**: `bg-red-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  returned: 'bg-red-500',
  ```
- **Line 27**: `bg-amber-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  preparing: 'bg-amber-500',
  ```
- **Line 32**: `bg-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-slate-500/10 text-slate-700 dark:text-slate-400 ring-slate-500/20';
  ```
- **Line 32**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-slate-500/10 text-slate-700 dark:text-slate-400 ring-slate-500/20';
  ```
- **Line 32**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-slate-500/10 text-slate-700 dark:text-slate-400 ring-slate-500/20';
  ```
- **Line 33**: `bg-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  const currentDot = dotColors[status] || 'bg-slate-500';
  ```
- **Line 81**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
  ```

## `src/features/shipments/hooks/useShipmentColumns.tsx`

- **Line 68**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
  ```
- **Line 131**: `bg-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 ring-2 ring-slate-100 dark:ring-slate-800" />
  ```
- **Line 132**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-[1.5px] h-[22px] bg-slate-200 border-l border-dashed border-slate-300 dark:border-slate-600 my-0.5" />
  ```
- **Line 132**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-[1.5px] h-[22px] bg-slate-200 border-l border-dashed border-slate-300 dark:border-slate-600 my-0.5" />
  ```
- **Line 132**: `border-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-[1.5px] h-[22px] bg-slate-200 border-l border-dashed border-slate-300 dark:border-slate-600 my-0.5" />
  ```
- **Line 134**: `bg-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${isCompleted ? 'bg-success' : s.status === 'preparing' ? 'bg-slate-300' : 'bg-orange-500 animate-pulse'}`}
  ```
- **Line 134**: `bg-orange-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${isCompleted ? 'bg-success' : s.status === 'preparing' ? 'bg-slate-300' : 'bg-orange-500 animate-pulse'}`}
  ```

## `src/features/shipments/ops-ui/ResourceBay/ResourceBay.tsx`

- **Line 37**: `border-indigo-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-indigo-50/50 border-indigo-400 ring-4 ring-indigo-500/20',
  ```
- **Line 42**: `border-indigo-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'border-indigo-300 border-dashed animate-pulse cursor-pointer',
  ```
- **Line 43**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  !isOver && !isBayWaiting && 'border-slate-200 bg-surface shadow-sm',
  ```
- **Line 50**: `bg-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-inner">
  ```
- **Line 55**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="text-lg font-black uppercase text-slate-800 line-clamp-1">
  ```
- **Line 59**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-sm font-medium text-slate-500 line-clamp-1">
  ```
- **Line 71**: `border-rose-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-rose-50 border-rose-100'
  ```
- **Line 72**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'bg-slate-50 border-slate-100',
  ```
- **Line 76**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-slate-400 font-medium">
  ```
- **Line 82**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  isFull ? 'text-rose-600' : 'text-slate-700',
  ```
- **Line 82**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  isFull ? 'text-rose-600' : 'text-slate-700',
  ```
- **Line 89**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-8 w-2 rounded-full bg-slate-200 overflow-hidden flex flex-col justify-end">
  ```
- **Line 93**: `bg-rose-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  isFull ? 'bg-rose-500' : 'bg-indigo-500',
  ```
- **Line 93**: `bg-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  isFull ? 'bg-rose-500' : 'bg-indigo-500',
  ```

## `src/features/shipments/ops-ui/utils/gradeColor.ts`

- **Line 9**: `border-emerald-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-500/10',
  ```
- **Line 9**: `text-emerald-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-500/10',
  ```
- **Line 13**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-amber-50 border-amber-200 text-amber-800 shadow-amber-500/10',
  ```
- **Line 13**: `text-amber-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-amber-50 border-amber-200 text-amber-800 shadow-amber-500/10',
  ```
- **Line 17**: `border-rose-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-500/10',
  ```
- **Line 17**: `text-rose-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-500/10',
  ```
- **Line 21**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed',
  ```
- **Line 21**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed',
  ```
- **Line 21**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed',
  ```
- **Line 26**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-[var(--surface-subtle)] border-dashed border-slate-300 text-slate-300',
  ```
- **Line 26**: `text-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-[var(--surface-subtle)] border-dashed border-slate-300 text-slate-300',
  ```

## `src/features/shipments/pages/K80QuickShipmentPage.tsx`

- **Line 49**: `text-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="Printer" size={24} className="text-emerald-500" />
  ```
- **Line 50**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-800">
  ```
- **Line 65**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  {
    LABELS.CUSTOMER;
  }
  <span className="text-red-500">*</span>;
  ```
- **Line 122**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'text-red-500 hover:text-red-600 p-1 rounded transition-colors';
  ```
- **Line 122**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'text-red-500 hover:text-red-600 p-1 rounded transition-colors';
  ```

## `src/features/shipments/pages/ShipmentDispatchPage.tsx`

- **Line 74**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex flex-col items-center gap-2 text-slate-500">
  ```
- **Line 86**: `bg-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-slate-900 p-5 sm:p-6 text-white shadow-xl">
  ```
- **Line 88**: `text-emerald-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-emerald-400">
  ```
- **Line 91**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="mt-1 text-sm text-slate-400">{MSG.SUBTITLE}</p>
  ```
- **Line 95**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="block text-[10px] uppercase tracking-wider text-slate-400">
  ```
- **Line 103**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="block text-[10px] uppercase tracking-wider text-slate-400">
  ```
- **Line 106**: `text-emerald-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-lg font-bold text-emerald-400">
  ```
- **Line 113**: `border-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="pl-4 border-l border-slate-700 flex items-center gap-3">
  ```
- **Line 118**: `bg-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-transparent';
  ```
- **Line 118**: `text-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-transparent';
  ```
- **Line 118**: `bg-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-transparent';
  ```
- **Line 129**: `bg-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
  ```
- **Line 129**: `bg-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
  ```
- **Line 151**: `text-indigo-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Icon name="PackageOpen" className="h-5 w-5 text-indigo-500" />
  ```
- **Line 152**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h2 className="text-lg font-extrabold uppercase text-slate-800">
  ```
- **Line 157**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm max-h-[70vh] overflow-y-auto">
  ```
- **Line 159**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
  ```

## `src/features/shipments/ShipmentForm.tsx`

- **Line 444**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="rounded-xl border border-slate-200 p-4 space-y-3">
  ```
- **Line 445**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
  ```
- **Line 452**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex justify-between items-center py-2 border-b border-slate-100 last:border-0';
  ```
- **Line 458**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-xs text-slate-500">
  ```

## `src/features/shipments/ShipmentList.tsx`

- **Line 226**: `bg-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <button className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2">
  ```
- **Line 226**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <button className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2">
  ```

## `src/features/shipments/ShipmentRollPicker.tsx`

- **Line 120**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`rounded-xl border-2 border-dashed border-slate-200 p-8 text-center ${className ?? ''}`}
  ```
- **Line 125**: `text-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'mx-auto text-slate-300 mb-2';
  ```
- **Line 127**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-slate-500 font-medium">{MSG.EMPTY_ROLLS}</p>
  ```
- **Line 136**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs text-slate-500">
  ```
- **Line 140**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
  ```

## `src/features/shipments/ShipmentVerifyPage.tsx`

- **Line 119**: `bg-green-100` ➡️ **Suggest:** `bg-success-soft`
  ```tsx
  ? 'bg-green-100 text-green-700'
  ```
- **Line 119**: `text-green-700` ➡️ **Suggest:** `text-success`
  ```tsx
  ? 'bg-green-100 text-green-700'
  ```
- **Line 121**: `bg-blue-100` ➡️ **Suggest:** `bg-info-soft`
  ```tsx
  ? 'bg-blue-100 text-blue-700'
  ```
- **Line 121**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-blue-100 text-blue-700'
  ```
- **Line 122**: `bg-gray-100` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  : 'bg-gray-100 text-gray-600'
  ```
- **Line 122**: `text-gray-600` ➡️ **Suggest:** `text-muted`
  ```tsx
  : 'bg-gray-100 text-gray-600'
  ```

## `src/features/supplier-portal/SupplierQuoteForm.tsx`

- **Line 100**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-sm font-semibold text-slate-700">
  ```
- **Line 117**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-sm font-semibold text-slate-700">
  ```
- **Line 134**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-sm font-semibold text-slate-700">
  ```
- **Line 163**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className = 'border border-slate-200 rounded-lg p-4 bg-slate-50/50';
  ```
- **Line 167**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="font-bold text-slate-800">
  ```
- **Line 188**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-semibold text-slate-700">
  ```
- **Line 225**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <label className="text-xs font-semibold text-slate-700">
  ```

## `src/features/supplier-portal/SupplierQuotePage.tsx`

- **Line 20**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-24 bg-slate-200 rounded-xl animate-pulse" />
  ```
- **Line 21**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
  ```
- **Line 22**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
  ```
- **Line 32**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h2 className="text-lg font-bold text-slate-800 text-center">
  ```
- **Line 47**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
  ```
- **Line 47**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
  ```
- **Line 50**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h2 className="text-xl font-bold text-slate-800 mb-2">
  ```
- **Line 69**: `text-blue-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="text-blue-200 text-sm">
  ```
- **Line 100**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <p className="font-medium text-slate-800">{rfq.title}</p>
  ```
- **Line 103**: `border-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="md:col-span-2 bg-amber-50 p-3 rounded-lg border border-amber-100 text-amber-900 text-sm whitespace-pre-wrap mt-2">
  ```
- **Line 103**: `text-amber-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="md:col-span-2 bg-amber-50 p-3 rounded-lg border border-amber-100 text-amber-900 text-sm whitespace-pre-wrap mt-2">
  ```

## `src/features/weaving-invoices/components/BulkRollStation.tsx`

- **Line 58**: `border-indigo-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50 scale-105 z-10 shadow-lg',
  ```
- **Line 61**: `border-emerald-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-emerald-50 border-emerald-300 text-emerald-700',
  ```
- **Line 61**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-emerald-50 border-emerald-300 text-emerald-700',
  ```
- **Line 64**: `border-indigo-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-[var(--surface-subtle)] border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-indigo-300',
  ```
- **Line 153**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-xs font-semibold text-emerald-600 tabular-nums">
  ```
- **Line 191**: `bg-indigo-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
  ```
- **Line 191**: `text-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
  ```

## `src/features/weaving-invoices/components/PasteExcelParser.tsx`

- **Line 125**: `border-indigo-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/30 p-4">
  ```
- **Line 155**: `border-amber-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/30 p-4">
  ```

## `src/features/weaving-invoices/components/PublicInvoiceRollsTable.tsx`

- **Line 42**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 bg-slate-50 print:bg-slate-100">
  ```
- **Line 42**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 bg-slate-50 print:bg-slate-100">
  ```
- **Line 42**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 bg-slate-50 print:bg-slate-100">
  ```
- **Line 52**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tbody className="divide-y divide-slate-100 text-slate-700">
  ```
- **Line 58**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="p-3 text-center text-slate-400">{idx + 1}</td>
  ```
- **Line 59**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="p-3 font-bold text-slate-800 tracking-wide">
  ```
- **Line 72**: `text-green-700` ➡️ **Suggest:** `text-success`
  ```tsx
  ? 'bg-green-50 text-green-700'
  ```
- **Line 74**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-blue-50 text-blue-700'
  ```
- **Line 76**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-amber-50 text-amber-700'
  ```
- **Line 77**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'text-slate-400'
  ```
- **Line 86**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <td className="p-3 truncate max-w-[120px] text-slate-400 italic">
  ```
- **Line 93**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tr className="border-t-2 border-slate-200 font-bold bg-slate-50/70 text-slate-800">
  ```
- **Line 93**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <tr className="border-t-2 border-slate-200 font-bold bg-slate-50/70 text-slate-800">
  ```

## `src/features/weaving-invoices/components/RollProgressBar.tsx`

- **Line 26**: `border-emerald-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'bg-emerald-50 border-emerald-300'
  ```
- **Line 36**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  isComplete ? 'text-emerald-600' : 'text-[var(--text-primary)]',
  ```

## `src/features/weaving-invoices/components/WeavingInvoiceFormStep2Rolls.tsx`

- **Line 104**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg animate-pulse">
  ```
- **Line 104**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg animate-pulse">
  ```

## `src/features/weaving-invoices/hooks/useWeavingInvoiceColumns.tsx`

- **Line 52**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-slate-800">
  ```

## `src/features/weaving-invoices/InvoiceSearchPage.tsx`

- **Line 169**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-bold space-y-1">
  ```
- **Line 169**: `text-red-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-bold space-y-1">
  ```
- **Line 171**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  <p className="font-normal text-red-600">
  ```
- **Line 197**: `border-red-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'border-red-500 ring-1 ring-red-500'
  ```
- **Line 207**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="absolute right-3.5 top-3.5 text-slate-400">
  ```
- **Line 212**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  <span className="text-xs font-semibold text-red-600">
  ```
- **Line 263**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
  ```
- **Line 263**: `text-red-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
  ```

## `src/features/weaving-invoices/PublicInvoiceDetailPage.tsx`

- **Line 50**: `bg-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className: 'bg-amber-100 text-amber-700',
  ```
- **Line 50**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className: 'bg-amber-100 text-amber-700',
  ```
- **Line 54**: `bg-blue-100` ➡️ **Suggest:** `bg-info-soft`
  ```tsx
  className: 'bg-blue-100 text-blue-700',
  ```
- **Line 54**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className: 'bg-blue-100 text-blue-700',
  ```
- **Line 56**: `bg-green-100` ➡️ **Suggest:** `bg-success-soft`
  ```tsx
  paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
  ```
- **Line 56**: `text-green-700` ➡️ **Suggest:** `text-success`
  ```tsx
  paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
  ```
- **Line 159**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-8 bg-slate-200 rounded-lg w-1/3 animate-pulse" />
  ```
- **Line 162**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
  ```
- **Line 163**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
  ```
- **Line 166**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse" />
  ```
- **Line 167**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
  ```
- **Line 170**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
  ```
- **Line 172**: `bg-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="h-10 bg-slate-200 rounded-lg w-32 animate-pulse" />
  ```
- **Line 203**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className: 'bg-slate-100 text-slate-700',
  ```
- **Line 203**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className: 'bg-slate-100 text-slate-700',
  ```
- **Line 229**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  className =
    'flex items-center gap-1.5 rounded-xl text-xs font-bold px-3 py-2 border border-[#dce6f0] bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-blue-600';
  ```
- **Line 240**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center gap-1.5 rounded-xl text-xs font-bold px-3 py-2 border border-[#dce6f0] bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-slate-700';
  ```
- **Line 250**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center gap-1.5 rounded-xl text-xs font-bold px-3 py-2 border border-[#dce6f0] bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-emerald-700';
  ```
- **Line 261**: `text-indigo-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center gap-1.5 rounded-xl text-xs font-bold px-3 py-2 border border-[#dce6f0] bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-indigo-700';
  ```
- **Line 288**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
  ```
- **Line 309**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-sm font-semibold text-slate-500">
  ```
- **Line 317**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-slate-700">
  ```
- **Line 323**: `text-blue-600` ➡️ **Suggest:** `text-info hoặc text-link`
  ```tsx
  <span className="font-extrabold text-blue-600 tracking-wider uppercase text-sm select-all">
  ```
- **Line 331**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-100">
  ```
- **Line 337**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-sm font-bold text-slate-800">
  ```
- **Line 379**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-extrabold text-sm md:text-base text-slate-800 block truncate">
  ```
- **Line 387**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-extrabold text-sm md:text-base text-slate-800 block">
  ```
- **Line 419**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 my-8 text-xs text-slate-500 italic print:bg-white print:border-none print:p-0">
  ```
- **Line 419**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 my-8 text-xs text-slate-500 italic print:bg-white print:border-none print:p-0">
  ```
- **Line 420**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-slate-700 not-italic block mb-1">
  ```
- **Line 428**: `border-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
  ```
- **Line 434**: `border-emerald-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="inline-flex flex-col border border-emerald-200 bg-emerald-50/50 rounded-2xl p-4 text-left max-w-sm">
  ```
- **Line 435**: `text-emerald-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-emerald-800 font-bold text-xs flex items-center gap-1.5">
  ```
- **Line 438**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] text-emerald-600 mt-1">
  ```
- **Line 441**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-[10px] text-emerald-600">
  ```
- **Line 457**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="bg-white p-2 border border-slate-200 rounded-2xl shadow-sm print:p-0 print:border-none">
  ```

## `src/features/weaving-invoices/WeavingInvoicesPage.tsx`

- **Line 26**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-medium text-slate-700">
  ```

## `src/features/work-orders/components/WorkOrderKanbanBoard.tsx`

- **Line 35**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  { key: 'draft', label: 'Bản nháp', color: 'bg-slate-100' },
  ```
- **Line 36**: `bg-indigo-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  { key: 'yarn_issued', label: 'Đã xuất sợi', color: 'bg-indigo-100' },
  ```
- **Line 37**: `bg-blue-100` ➡️ **Suggest:** `bg-info-soft`
  ```tsx
  { key: 'in_progress', label: 'Đang sản xuất', color: 'bg-blue-100' },
  ```
- **Line 38**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  { key: 'completed', label: 'Hoàn thành', color: 'bg-emerald-100' },
  ```
- **Line 93**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-medium text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
  ```
- **Line 108**: `text-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-indigo-600">
  ```
- **Line 166**: `border-slate-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`flex flex-col rounded-2xl p-3 w-[280px] shrink-0 h-full ${col.color} bg-opacity-40 border border-slate-200/50`}
  ```
- **Line 169**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <h3 className="font-bold text-slate-800 text-[13px] uppercase tracking-wider">
  ```
- **Line 172**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <Badge variant="gray" className="bg-white/60 text-slate-600 font-bold">
  ```
- **Line 189**: `text-slate-400` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-center py-8 text-xs text-slate-400 border-2 border-dashed border-slate-300 rounded-xl m-1 opacity-70">
  ```
- **Line 189**: `border-slate-300` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="text-center py-8 text-xs text-slate-400 border-2 border-dashed border-slate-300 rounded-xl m-1 opacity-70">
  ```
- **Line 298**: `text-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-bold text-indigo-600">
  ```

## `src/features/work-orders/components/YarnAvailabilityWarning.tsx`

- **Line 52**: `border-emerald-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
  ```
- **Line 52**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
  ```
- **Line 62**: `border-amber-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
  ```
- **Line 63**: `text-amber-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
  ```
- **Line 71**: `text-amber-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'flex items-center justify-between text-[11px] text-amber-700 bg-white/60 rounded-md px-2 py-1.5';
  ```
- **Line 81**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  <strong className={w.available <= 0 ? 'text-red-600' : ''}>
  ```

## `src/features/work-orders/components/YarnIssueModal.tsx`

- **Line 316**: `border-blue-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
  ```
- **Line 316**: `text-blue-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
  ```
- **Line 338**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
  ```
- **Line 338**: `text-red-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
  ```

## `src/features/work-orders/hooks/useWorkOrderColumns.tsx`

- **Line 97**: `text-slate-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-medium text-slate-800">
  ```

## `src/features/work-orders/WorkOrderList.tsx`

- **Line 213**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
  ```
- **Line 215**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow text-primary' : 'text-slate-600 hover:text-slate-900'}`}
  ```
- **Line 215**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow text-primary' : 'text-slate-600 hover:text-slate-900'}`}
  ```
- **Line 221**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-primary' : 'text-slate-600 hover:text-slate-900'}`}
  ```
- **Line 221**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-primary' : 'text-slate-600 hover:text-slate-900'}`}
  ```

## `src/features/yarn-catalog/components/StepKnittingEngineering.tsx`

- **Line 62**: `bg-gray-100` ➡️ **Suggest:** `bg-surface-secondary`
  ```tsx
  'bg-gray-100 text-gray-800';
  ```
- **Line 62**: `text-gray-800` ➡️ **Suggest:** `text-primary`
  ```tsx
  'bg-gray-100 text-gray-800';
  ```
- **Line 108**: `border-gray-200` ➡️ **Suggest:** `border-default`
  ```tsx
  <div className="p-4 bg-white rounded-lg border border-gray-200">
  ```
- **Line 134**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'text-red-500 p-2';
  ```
- **Line 203**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'text-red-500 hover:text-red-600 p-1';
  ```
- **Line 203**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'text-red-500 hover:text-red-600 p-1';
  ```

## `src/schema/work-order.schema.ts`

- **Line 16**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-slate-100 text-slate-700',
  ```
- **Line 16**: `text-slate-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-slate-100 text-slate-700',
  ```
- **Line 20**: `bg-indigo-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-indigo-100 text-indigo-700',
  ```
- **Line 20**: `text-indigo-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-indigo-100 text-indigo-700',
  ```
- **Line 24**: `bg-blue-100` ➡️ **Suggest:** `bg-info-soft`
  ```tsx
  color: 'bg-blue-100 text-blue-700',
  ```
- **Line 24**: `text-blue-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-blue-100 text-blue-700',
  ```
- **Line 28**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-emerald-100 text-emerald-700',
  ```
- **Line 28**: `text-emerald-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-emerald-100 text-emerald-700',
  ```
- **Line 32**: `bg-rose-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-rose-100 text-rose-700',
  ```
- **Line 32**: `text-rose-700` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-rose-100 text-rose-700',
  ```

## `src/schema/yarn-engineering.schema.ts`

- **Line 40**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-emerald-100 text-emerald-800',
  ```
- **Line 40**: `text-emerald-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-emerald-100 text-emerald-800',
  ```
- **Line 45**: `bg-blue-100` ➡️ **Suggest:** `bg-info-soft`
  ```tsx
  color: 'bg-blue-100 text-blue-800',
  ```
- **Line 45**: `text-blue-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-blue-100 text-blue-800',
  ```
- **Line 50**: `bg-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-amber-100 text-amber-800',
  ```
- **Line 50**: `text-amber-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-amber-100 text-amber-800',
  ```
- **Line 55**: `bg-orange-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-orange-100 text-orange-800',
  ```
- **Line 55**: `text-orange-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-orange-100 text-orange-800',
  ```
- **Line 60**: `bg-red-100` ➡️ **Suggest:** `bg-danger-soft`
  ```tsx
  color: 'bg-red-100 text-red-800',
  ```
- **Line 60**: `text-red-800` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  color: 'bg-red-100 text-red-800',
  ```

## `src/shared/components/roll-grid/LotMatrixCard.tsx`

- **Line 120**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="font-extrabold text-amber-600">
  ```

## `src/shared/components/roll-grid/RollGridItem.tsx`

- **Line 50**: `bg-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  'bg-slate-900 text-white shadow-lg',
  ```
- **Line 130**: `bg-emerald-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in-50 duration-200">
  ```

## `src/shared/components/TagInput.tsx`

- **Line 57**: `border-red-200` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  className =
    'inline-flex items-center gap-1 px-2 py-0.5 bg-surface-strong border border-border rounded-full text-sm font-medium text-text transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600 group cursor-pointer';
  ```
- **Line 57**: `text-red-600` ➡️ **Suggest:** `text-danger`
  ```tsx
  className =
    'inline-flex items-center gap-1 px-2 py-0.5 bg-surface-strong border border-border rounded-full text-sm font-medium text-text transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600 group cursor-pointer';
  ```
- **Line 67**: `text-red-500` ➡️ **Suggest:** `text-danger`
  ```tsx
  className = 'text-muted group-hover:text-red-500';
  ```

## `src/shared/value/core/NumericInput.tsx`

- **Line 129**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none select-none text-sm z-10">
  ```
- **Line 151**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none select-none text-sm z-10">
  ```

## `src/shared/value/density/DensityText.tsx`

- **Line 26**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  success: 'text-emerald-600 font-medium',
  ```
- **Line 27**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  danger: 'text-rose-600 font-medium',
  ```

## `src/shared/value/length/LengthText.tsx`

- **Line 26**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  success: 'text-emerald-600 font-medium',
  ```
- **Line 27**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  danger: 'text-rose-600 font-medium',
  ```

## `src/shared/value/money/MoneyCell.tsx`

- **Line 29**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  success: 'text-emerald-600',
  ```
- **Line 30**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  danger: 'text-rose-600',
  ```
- **Line 31**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  warning: 'text-amber-600',
  ```

## `src/shared/value/money/MoneyStat.tsx`

- **Line 32**: `border-indigo-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  primary: 'bg-indigo-50 border-indigo-100',
  ```
- **Line 33**: `border-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  success: 'bg-emerald-50 border-emerald-100',
  ```
- **Line 34**: `border-rose-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  danger: 'bg-rose-50 border-rose-100',
  ```
- **Line 35**: `border-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  warning: 'bg-amber-50 border-amber-100',
  ```
- **Line 39**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  default: 'text-slate-500 bg-slate-100',
  ```
- **Line 39**: `bg-slate-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  default: 'text-slate-500 bg-slate-100',
  ```
- **Line 40**: `text-indigo-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  primary: 'text-indigo-600 bg-indigo-100',
  ```
- **Line 40**: `bg-indigo-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  primary: 'text-indigo-600 bg-indigo-100',
  ```
- **Line 41**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  success: 'text-emerald-600 bg-emerald-100',
  ```
- **Line 41**: `bg-emerald-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  success: 'text-emerald-600 bg-emerald-100',
  ```
- **Line 42**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  danger: 'text-rose-600 bg-rose-100',
  ```
- **Line 42**: `bg-rose-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  danger: 'text-rose-600 bg-rose-100',
  ```
- **Line 43**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  warning: 'text-amber-600 bg-amber-100',
  ```
- **Line 43**: `bg-amber-100` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  warning: 'text-amber-600 bg-amber-100',
  ```
- **Line 51**: `text-slate-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-medium text-slate-600">{title}</span>
  ```
- **Line 60**: `text-slate-900` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
  ```
- **Line 63**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  <span className="text-sm font-semibold text-slate-500">đ</span>
  ```
- **Line 73**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  ? 'text-emerald-600'
  ```
- **Line 74**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  : 'text-rose-600',
  ```
- **Line 89**: `text-slate-500` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  {
    subtitle && <span className="text-slate-500">{subtitle}</span>;
  }
  ```

## `src/shared/value/money/MoneyText.tsx`

- **Line 27**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  success: 'text-emerald-600 font-medium',
  ```
- **Line 28**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  danger: 'text-rose-600 font-medium',
  ```
- **Line 29**: `text-amber-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  warning: 'text-amber-600 font-medium',
  ```

## `src/shared/value/percentage/PercentageText.tsx`

- **Line 26**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  success: 'text-emerald-600 font-medium',
  ```
- **Line 27**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  danger: 'text-rose-600 font-medium',
  ```

## `src/shared/value/quantity/QuantityText.tsx`

- **Line 28**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  success: 'text-emerald-600 font-medium',
  ```
- **Line 29**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  danger: 'text-rose-600 font-medium',
  ```

## `src/shared/value/weight/WeightText.tsx`

- **Line 26**: `text-emerald-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  success: 'text-emerald-600 font-medium',
  ```
- **Line 27**: `text-rose-600` ➡️ **Suggest:** `Semantic Token (VD: text-muted, bg-surface)`
  ```tsx
  danger: 'text-rose-600 font-medium',
  ```
