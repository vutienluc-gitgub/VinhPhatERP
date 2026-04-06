export interface Product {
  id: string
  name: string
  kho_vai: number
  dinh_luong: number
  ky_thuat: string
  mau_sac?: string
}

// FORM
export const productFormFields = [
  { name: "name", label: "Tên vải", type: "text", required: true },
  { name: "kho_vai", label: "Khổ vải", type: "number" },
  { name: "dinh_luong", label: "Định lượng", type: "number" },
  { name: "ky_thuat", label: "Kỹ thuật", type: "text" },
  { name: "mau_sac", label: "Màu sắc", type: "text" },
]

// TABLE
export const productTableColumns = [
  { key: "name", label: "Tên vải" },
  { key: "kho_vai", label: "Khổ" },
  { key: "dinh_luong", label: "ĐL" },
]