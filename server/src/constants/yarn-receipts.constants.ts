/**
 * Yarn Receipts Server Constants & Feedback Messages
 * Centralizes all user-facing messages and validation alerts.
 */

export const YARN_SLIP_SCAN_MESSAGES = {
  INVALID_MULTIPART: 'Yêu cầu phải ở định dạng multipart/form-data',
  MISSING_FILE: "Vui lòng đính kèm file ảnh phiếu cân trong trường 'file'",
  EMPTY_FILE: 'Tệp tin hình ảnh tải lên không có dữ liệu',
  AMBIGUOUS_SUPPLIER:
    'Chưa thể tự động khớp Nhà cung cấp với độ tin cậy tuyệt đối. Cần đối chiếu và chọn thủ công.',
  VISION_TIMEOUT:
    'Hệ thống nhận diện tài liệu vượt quá thời gian xử lý cho phép. Vui lòng thử lại.',
  VISION_RATE_LIMIT:
    'Hệ thống AI đang quá tải lượt gọi (Rate Limit). Vui lòng thử lại sau giây lát.',
  INTERNAL_ERROR: 'Đã xảy ra lỗi trong quá trình xử lý phiếu cân sợi.',
  duplicateFound: (receiptNumber: string, receiptDate: string | null) =>
    receiptDate
      ? `Phát hiện phiếu nhập '${receiptNumber}' (ngày ${receiptDate}) đã tồn tại trong hệ thống.`
      : `Phát hiện phiếu nhập '${receiptNumber}' đã tồn tại trong hệ thống.`,
  duplicateImageFound: (receiptNumber?: string) =>
    receiptNumber
      ? `Ảnh phiếu cân này đã từng được quét trước đó (phiếu ${receiptNumber}).`
      : 'Ảnh phiếu cân này trùng khớp hoàn toàn với một tài liệu đã quét trước đó.',
} as const;
