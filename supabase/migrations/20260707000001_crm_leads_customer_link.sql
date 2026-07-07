-- Cập nhật bảng crm_leads để hỗ trợ kiến trúc B2B liên kết với Customers

-- 1. Thêm các cột mới (reserve for future and current use)
ALTER TABLE public.crm_leads
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS contact_id uuid, -- For future company-contact architecture
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS converted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS converted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Thêm policy cho việc cập nhật customer_id và các trường mới 
-- Giả định RLS đã được thiết lập cho crm_leads trước đó.
-- Chúng ta chỉ cần index cho performance vì tìm kiếm lead theo customer_id sẽ rất phổ biến
CREATE INDEX IF NOT EXISTS idx_crm_leads_customer_id ON public.crm_leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_phone ON public.crm_leads(phone);
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON public.crm_leads(email);
