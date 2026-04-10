import { useQuery } from '@tanstack/react-query';

import { colorApi } from '@/api/color.api';

export type ColorOption = {
  code: string;
  name: string;
};

const QUERY_KEY = ['colors', 'options'] as const;

/**
 * Lấy danh sách màu từ bảng `colors` để dùng trong Combobox.
 * Tìm kiếm được theo tên hoặc mã màu.
 */
export function useColorOptions() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<ColorOption[]> => {
      const data = await colorApi.list();
      return data.map((c) => ({
        code: c.code,
        name: c.name,
      }));
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
