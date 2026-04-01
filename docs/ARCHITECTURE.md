# VinhPhat App V2 Architecture

## Stack

- React + TypeScript + Vite
- Feature-based frontend structure
- Supabase for auth, database, and policies
- Mobile-first UX baseline

## Initial modules

- Auth
- Customers
- Suppliers
- Yarn receipts
- Raw fabric
- Finished fabric
- Orders
- Order progress
- Shipments
- Payments
- Inventory
- Reports
- Settings

## Folder strategy

- `src/app`: app shell, providers, router, layouts
- `src/features`: business modules by domain
- `src/shared`: reusable UI, hooks, types, helpers
- `src/services`: infrastructure adapters such as Supabase and offline queue
- `supabase/migrations`: SQL migrations
- `tests`: unit and integration tests
