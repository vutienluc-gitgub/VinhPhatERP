-- Enable RLS (an toàn cho DB)
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;

-- Cho phép ai cũng có thể đọc (read) danh sách màu sắc
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'colors' AND policyname = 'Enable read access for all users'
  ) THEN
      CREATE POLICY "Enable read access for all users" ON public.colors FOR SELECT USING (true);
  END IF;
END
$$;

-- Chèn dữ liệu mồi mặc định (nếu chưa có)
INSERT INTO public.colors (code, name)
VALUES 
  ('WH-01', 'Trắng tinh'),
  ('WH-02', 'Trắng ngà (Ivory)'),
  ('BK-01', 'Đen'),
  ('GR-01', 'Xám nhạt'),
  ('GR-02', 'Xám lông chuột'),
  ('NV-01', 'Xanh navy'),
  ('BL-01', 'Xanh dương'),
  ('BL-02', 'Xanh baby'),
  ('RD-01', 'Đỏ tươi'),
  ('RD-02', 'Đỏ đô (Maroon)'),
  ('PK-01', 'Hồng nhạt'),
  ('PK-02', 'Hồng đào'),
  ('YL-01', 'Vàng chanh'),
  ('YL-02', 'Vàng nghệ'),
  ('GN-01', 'Xanh lá mạ'),
  ('GN-02', 'Xanh rêu'),
  ('BR-01', 'Nâu bò'),
  ('BR-02', 'Nâu chocolate'),
  ('BG-01', 'Be (Beige)'),
  ('PR-01', 'Tím nhạt')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
