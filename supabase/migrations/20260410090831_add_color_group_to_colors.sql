ALTER TABLE public.colors ADD COLUMN color_group varchar(50);

-- Pre-populate known color groups
UPDATE public.colors SET color_group = 'Màu Lợt' WHERE code IN ('WH-01', 'WH-02', 'PK-01', 'PK-02', 'YL-01', 'BG-01', 'RAW');
UPDATE public.colors SET color_group = 'Màu Trung' WHERE code IN ('GR-01', 'GR-02', 'BL-01', 'BL-02', 'RD-01', 'YL-02', 'GN-01', 'PR-01', 'CB-01');
UPDATE public.colors SET color_group = 'Màu Đậm' WHERE code IN ('BK-01', 'NV-01', 'RD-02', 'GN-02', 'BR-01', 'BR-02');
