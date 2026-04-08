import { useQuery } from '@tanstack/react-query';

import { untypedDb } from '@/services/supabase/untyped';

export type ColorOption = {
  code: string;
  name: string;
};

const QUERY_KEY = ['colors', 'options'] as const;

/**
 * Lấy danh sách màu từ bảng `colors` để dùng trong Combobox.
 * Tìm kiếm được theo tên hoặc mã màu.
 * Note: sau khi migrate, chạy `npm run db:types` để cập nhật database.types.ts
 */
export function useColorOptions() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<ColorOption[]> => {
      // Dùng untypedDb theo quy định Level 7 Architecture
      const { data, error } = await untypedDb
        .from('colors')
        .select('code, name')
        .order('name');

      if (error) throw error;
      return (data ?? []) as ColorOption[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Chuyển ColorOption[] thành mảng options cho Combobox (tìm được theo tên + mã) */
export function toColorComboboxOptions(colors: ColorOption[]) {
  return colors.map((c) => ({
    value: c.name, // lưu tên vào form field (backward compatible)
    label: c.name,
    code: c.code, // hiện mã màu làm phụ đề trong dropdown
  }));
}
