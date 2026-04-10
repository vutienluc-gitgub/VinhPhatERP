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
- [ ] **Raw Fabric / Finished Fabric**: Audit inline `style={{}}` in list header buttons — minor cleanup.
- [x] **BOM (Bill of Materials)**: `BomList` already uses DataTablePremium with mobile cards.

### 4. Code Quality & UX Debt (Ongoing 🧹)

- [ ] **Form Standardization**: Ensure all forms use `AdaptiveSheet` or `Bottom Sheet` for mobile compliance.
- [ ] **Linting Cleanup**: Address remaining `object-property-newline` warnings (approx. 60).
- [ ] **Type Integrity**: Ensure 100% `tsc --noEmit` compliance with zero `any`. ✅ _Fixed `Column` → `DataTableColumn` across all Reports sections. Typecheck: 0 errors._

---

## 📈 Quality Standards Checklist

- [ ] No manual `gray-*`, `rounded-md`, or `bg-white`.
- [ ] Mobile-first responsive layout (Table on Desktop, Cards on Mobile).
- [ ] Centralized schema usage in `@/schema`.
- [ ] Touch-friendly interactions (Min 44px tap target).
- [ ] Consistent Icon system (Lucide-react, 20px, 1.5 stroke).
