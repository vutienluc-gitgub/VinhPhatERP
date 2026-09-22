---
name: bigdata-perf
description: Web performance, list virtualization, query optimization, and memory efficiency standards for VinhPhatERP. Use when handling large datasets, optimizing heavy ERP tables, refactoring dropdowns/selects, or resolving rendering lag.
---

# Big Data & Performance Optimization (VinhPhatERP)

## Overview

Adapted from Addy Osmani's `performance-optimization` and tailored for **VinhPhatERP v3**.
The golden rule: **"Measure before you optimize."**
ERP systems frequently handle thousands of fabric rolls, inventory movements, customer orders, and ledger entries. Unoptimized rendering or naive data fetching will freeze the browser and spike database connection pools.

---

## When to Use

- Building or refactoring lists, tables, or pickers containing $> 30$ items.
- Optimizing slow pages with heavy re-renders or laggy input response.
- Auditing Supabase queries for N+1 problems or excessive payload size.
- Resolving performance bottlenecks flagged during Refactor Checklist audits (Item 13).

---

## 1. Dropdown & Select Component Selection Matrix

To prevent DOM bloat, strictly choose dropdown components according to data scale:

| Dataset Size       | Component to Use      | Architecture Base                 | Context                                            |
| :----------------- | :-------------------- | :-------------------------------- | :------------------------------------------------- |
| **$\le$ 30 items** | `<VPSelect>`          | Radix Select $\rightarrow$ Shadcn | Status, Order Type, Unit, Priority                 |
| **$> 30$ items**   | `<VPCombobox>`        | Popover + Command (Searchable)    | CustomerPicker, SupplierPicker                     |
| **$> 500$ items**  | `<VPVirtualCombobox>` | TanStack Virtual + VPCombobox     | Fabric Roll Selector, Large Product SKU Catalog    |
| **Any count**      | `<select>` (Native)   | ❌ **FORBIDDEN**                  | Restricted by Architecture Guard (`no-raw-select`) |

---

## 2. Table & List Virtualization Standards

When rendering lists of fabric rolls, invoices, or production tickets:

1. **Client Virtualization**:
   - For lists $> 100$ items rendered simultaneously in the DOM, wrap with **TanStack Virtual** (`useVirtualizer`).
   - Keep item row height fixed or properly estimated to avoid layout shifts.
2. **Server-Side Pagination & Cursor Fetching**:
   - Never fetch thousands of rows into client state with `select('*')`.
   - Use paginated queries with `limit` and `range` (or cursor-based pagination).
   - In React Query, use `useInfiniteQuery` or standard paged queries with `keepPreviousData: true`.
3. **Payload Pruning (No Over-fetching)**:
   - Explicitly select only the fields needed for the list view:

     ```typescript
     // ❌ Over-fetching: downloads heavy JSON metadata & notes
     supabase.from('fabric_rolls').select('*');

     // ✅ Optimal: downloads only columns displayed in the table
     supabase
       .from('fabric_rolls')
       .select('id, roll_code, meter_length, weight_kg, status');
     ```

---

## 3. Query Optimization & Eliminating N+1 Calls

- **Never execute queries inside loops**:

  ```typescript
  // ❌ N+1 Query: 100 round-trips to Supabase
  for (const order of orders) {
    const items = await fetchOrderItems(order.id);
  }

  // ✅ Batch or Join: 1 round-trip
  const { data } = await supabase
    .from('orders')
    .select('id, order_no, items:order_items(id, product_name, quantity)');
  ```

- **Use Atomic RPC for Aggregations**:
  - If calculating totals, debt balances, or inventory metrics across multiple tables, execute an atomic SQL/RPC function on PostgreSQL instead of downloading thousands of raw rows to calculate in the browser.

---

## 4. UI Render Performance & Stability

1. **Stable Keys in Lists**:
   - Always use a unique identifier: `key={roll.id}`.
   - Never use array index (`key={index}`), which breaks reconciliation and forces full DOM recreation on sorting/filtering.
2. **Memoize Costly Computations**:
   - Wrap heavy filtering, sorting, or multi-field searching in `useMemo`.
   - Wrap handler functions passed down to memoized list items in `useCallback`.
3. **Debounce User Input**:
   - Debounce search input fields (e.g. 300ms) before triggering network fetches to avoid hammering the Supabase API.
4. **Loading States**:
   - Always render lightweight Skeleton loaders during fetching to eliminate Content Layout Shift (CLS).
