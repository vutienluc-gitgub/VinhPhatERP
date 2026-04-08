-- Migration: Make order_id nullable in shipments table
-- This migration removes the NOT NULL constraint on order_id, allowing shipments to be created without linking to an order.

alter table public.shipments
  alter column order_id drop not null;
