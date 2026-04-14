-- Add pending_review status to order_status enum
-- This status represents customer-submitted order requests awaiting admin approval

ALTER TYPE "public"."order_status" ADD VALUE IF NOT EXISTS 'pending_review' BEFORE 'draft';
