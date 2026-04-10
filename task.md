# Task List: ERP Premium UI/UX Refactoring

Tracking the systematic migration of legacy ERP modules to the **Premium Design System**.

## 🚀 Phase 11: Core Module Migration

### 1. Catalog & Reports (Completed ✅)

- [x] **Fabric Catalog**: Refactored `FabricCatalogList` with `DataTablePremium`, KPI grids, and compact filters.
- [x] **Reports Dashboard**: Migrated `ReportsPage` to Premium layout, removed legacy CSS modules, fixed Tab Switcher logic.
- [x] **Financial Management**: Refactored `DebtsPage`, integrated `DebtAgingSection`, and standardized Customer/Supplier summaries.

### 2. CRM & Personnel (Completed ✅)

- [x] **Suppliers Management**: `SuppliersList` — Premium layout, DataTablePremium, KPI cards, mobile cards.
- [x] **Customer Management**: `CustomerList` — Premium layout with KPI summaries and mobile cards.
- [x] **Employee Personnel**: `EmployeeListPage` — Premium pattern with role KPI cards and mobile cards.

### 3. Inventory & Operations (In Progress 🛠️)

- [x] **Inventory Dashboard**: Full refactor of `InventoryPage` — KPIs (6 cards), Breakdown tables, Aging Stock with Premium DataTable.
- [x] **Raw Fabric / Finished Fabric**: No legacy inline styles found — already clean after lint --fix.
- [x] **BOM (Bill of Materials)**: `BomList` uses DataTablePremium. `BomForm` refactored: removed `@/shared/icons`, all inline styles replaced with CSS classes, `btn-primary`, Premium header.

### 4. Code Quality & UX Debt (Ongoing 🧹)

- [x] **Form Standardization**: All major forms use `AdaptiveSheet`. `CustomerForm` and `BomForm` fully cleaned up.
- [x] **Linting Cleanup**: Zero errors, zero warnings. `bom.module.ts` array-bracket fixed.
- [x] **Type Integrity**: 100% `tsc --noEmit` compliance. Zero `any`. Zero errors.

---

## 📈 Quality Standards Checklist

- [x] No manual `gray-*`, `rounded-md`, or `bg-white`. Fixed: `DyeingOrdersPage`, `Combobox.tsx`, `BomDetail`.
- [x] Mobile-first responsive layout (Table on Desktop, Cards on Mobile).
- [x] Centralized schema usage in `@/schema`.
- [x] Touch-friendly interactions (Min 44px tap target).
- [x] Consistent Icon system (Lucide-react via `<Icon />` wrapper). Fixed: `WorkOrderYarnTable`, `BomDetail`, `BomForm`.

---

## Phase 12: Remaining Legacy Audit (Completed ✅)

- [x] **WorkOrderYarnTable**: Replaced `@/shared/icons` with `<Icon />`, removed icon inline styles.
- [x] **WorkOrderDetail**: Full rewrite — `@/shared/icons` removed, all inline styles replaced, `Badge` for status, Premium header + grid layout.
- [x] **CreditOverrideDialog**: Replaced `AlertTriangle`, `ShieldAlert`, `X` from `@/shared/icons` with `<Icon />`.
- [x] **Combobox selected state**: Removed `bg-blue-50 hover:bg-slate-50` and last `bg-white` in allowInput mode.
- [x] **BomPage**: Removed `style={{ marginBottom: '4px' }}` from filter clear button.

---

## Phase 13: WorkOrderYarnTable & Combobox (Completed ✅)

- [x] **WorkOrderYarnTable**: All inline styles removed — `card-flush mt-4`, `flex items-center gap-1.5`, `font-bold text-primary`, `text-danger`, `text-primary`. Only justified `maxHeight` inline style remains.
- [x] **Global `@/shared/icons` scan**: Zero remaining violations in `src/features/`.
- [x] **Combobox hover state**: Added `--surface-hover` and `--surface-selected` CSS tokens to `global.css` (light + dark). Added `.combobox-option` / `.combobox-option.is-selected` CSS classes to `data-ui.css`. Removed all hardcoded `bg-blue-50`, `hover:bg-slate-50`, `fontWeight` inline styles from Combobox.

## Phase 14: Quotations Module Premium Refactor

- [x] **QuotationList**: Cleanup inline styles in columns and mobile cards. Standardize badge colors.
- [x] **QuotationForm**: Eliminate all inline styles. Fix grid layouts. Standardize footer.
- [x] **QuotationDetail**: Audit for icon violations and inline styles. Premium header pattern.
- [x] **OrderKanban**: Audit for legacy `.css` usage and move to centralized patterns.

## Phase 15: Dyeing Orders Module Implementation

- [x] **DyeingOrderList**: Implement using `DataTablePremium` and `kpi-card-premium`.
- [x] **DyeingOrderForm**: Implement using `AdaptiveSheet` and complex roll selection.
- [x] **DyeingOrderDetail**: Implement Premium detail view with status workflow (Draft -> Sent -> Completed).
- [x] **Roll Integration**: Logic to auto-select available raw fabric rolls for dyeing.
