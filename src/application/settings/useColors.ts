import { useState } from 'react';

export interface ColorItem {
  id: string;
  name: string;
  code: string;
  hex?: string;
  pantone?: string;
}

const mockColors: ColorItem[] = [
  { id: 'col-1', name: 'Trắng Sứ (Optical White)', code: 'W-01', hex: '#FFFFFF', pantone: '11-0601 TCX' },
  { id: 'col-2', name: 'Đen Tuyển (Jet Black)', code: 'B-09', hex: '#0a0a0a', pantone: '19-0303 TCX' },
  { id: 'col-3', name: 'Xanh Navy (Navy Blue)', code: 'NV-03', hex: '#00205B', pantone: '19-3832 TCX' },
  { id: 'col-4', name: 'Xám Tiêu (Melange Gray)', code: 'GR-05', hex: '#808080', pantone: '16-3801 TCX' },
  { id: 'col-5', name: 'Đỏ Đô (Burgundy / Maroon)', code: 'RD-08', hex: '#800020', pantone: '19-1617 TCX' },
];

export function useColors() {
  const [colors, setColors] = useState<ColorItem[]>(mockColors);
  const [isLoading] = useState(false);

  return {
    colors,
    isLoading,
    addColor: (c: ColorItem) => setColors((prev) => [...prev, c]),
    removeColor: (id: string) => setColors((prev) => prev.filter((c) => c.id !== id)),
  };
}

export function useColorOptions() {
  const { colors, isLoading } = useColors();
  const options = colors.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }));
  return { options, colors, isLoading };
}
