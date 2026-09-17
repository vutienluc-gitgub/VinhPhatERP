/** Bộ lọc chuẩn hóa làm sạch mã tra cứu hóa đơn. */
export function sanitizeLookupCode(code: string): string {
  return (
    code
      .trim()
      .toUpperCase()
      // Chuẩn hóa Unicode tổ hợp để tách dấu
      .normalize('NFD')
      // Loại bỏ toàn bộ các dấu tiếng Việt
      .replace(/[\u0300-\u036f]/g, '')
      // Loại bỏ mọi ký tự đặc biệt, khoảng trắng, gạch ngang, dấu chấm...
      .replace(/[^A-Z0-9]/g, '')
      // Chỉ lấy tối đa 10 ký tự của mã tra cứu chuẩn
      .slice(0, 10)
  );
}
