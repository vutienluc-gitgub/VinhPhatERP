import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { useCompanySettings } from '@/shared/hooks/useCompanySettings';
import { formatCurrency } from '@/shared/utils/format';
import { useQuotation } from '@/application/quotations';

function formatDateLong(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
}

export default function QuotationPrint() {
  const { id } = useParams();
  const { data: quotation, isLoading, error } = useQuotation(id);
  const { data: company } = useCompanySettings();

  useEffect(() => {
    // Automatically trigger print dialog when loaded
    if (quotation && company) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [quotation, company]);

  if (isLoading) return <div className="p-8">Đang tải báo giá...</div>;
  if (error) return <div className="p-8">Lỗi tải báo giá</div>;
  if (!quotation) return <div className="p-8">Không tìm thấy báo giá.</div>;

  const items = quotation.quotation_items ?? [];

  // Fallback nếu chưa có company settings
  const companyName = company?.company_name || 'Công Ty TNHH Dệt May Vĩnh Phát';
  const companyAddress = company?.address || '';
  const companyPhone = company?.phone || '';
  const companyTaxCode = company?.tax_code || '';
  const companyLogo = company?.logo_url || '/vite.svg';
  const companyBankName = company?.bank_name || '';
  const companyBankAccount = company?.bank_account || '';

  return (
    <div className="bg-white text-black min-h-[100vh] py-8 px-4">
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { background: #fff; margin: 0; padding: 0; }
          .no-print { display: none; }
        }
        .print-wrapper {
          max-width: 210mm;
          margin: 0 auto;
          font-family: 'Times New Roman', Times, serif;
          font-size: 14pt;
          line-height: 1.5;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        .print-table th, .print-table td {
          border: 1px solid #000;
          padding: 8px;
        }
        .print-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
      `}</style>

      <div className="no-print text-center mb-8">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 cursor-pointer"
        >
          🖨️ In lại
        </button>
      </div>

      <div className="print-wrapper">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="m-0 text-2xl uppercase">{companyName}</h1>
            {companyAddress && (
              <p className="mt-1 mb-0 mx-0">Địa chỉ: {companyAddress}</p>
            )}
            <p className="m-0">
              {companyPhone && `SĐT: ${companyPhone}`}
              {companyPhone && companyTaxCode && ' - '}
              {companyTaxCode && `MST: ${companyTaxCode}`}
            </p>
          </div>
          <div className="text-right">
            <img
              src={companyLogo}
              alt="Logo"
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>

        <hr className="my-4 mx-0 border-none border-b-2 border-black" />

        <div className="text-center my-8 mx-0">
          <h2 className="m-0 text-[1.8rem] uppercase">BẢNG BÁO GIÁ</h2>
          <p className="mt-2 mb-0 mx-0 italic">
            Số: {quotation.quotation_number}
          </p>
          <p className="m-0 italic">
            {formatDateLong(quotation.quotation_date)}
          </p>
        </div>

        <div>
          <p>
            <strong>Kính gửi:</strong> {quotation.customers?.name ?? '—'}
          </p>
          {quotation.customers?.code && (
            <p>
              <strong>Mã KH:</strong> {quotation.customers.code}
            </p>
          )}
          <p>
            Công ty {companyName} trân trọng gửi đến Quý Khách hàng báo giá sản
            phẩm như sau:
          </p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th className="text-center w-[5%]">STT</th>
              <th className="w-[30%]">Loại vải / Hàng hoá</th>
              <th>Màu</th>
              <th>Khổ (cm)</th>
              <th className="text-right">Số lượng</th>
              <th className="text-right">Đơn giá</th>
              <th className="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((item, index) => (
                <tr key={item.id}>
                  <td className="text-center">{index + 1}</td>
                  <td>{item.fabric_type}</td>
                  <td>{item.color_name || '—'}</td>
                  <td className="text-center">{item.width_cm || '—'}</td>
                  <td className="text-right">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="text-right">
                    {formatCurrency(item.unit_price)}đ
                  </td>
                  <td className="text-right">{formatCurrency(item.amount)}đ</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} className="text-right">
                <strong>Tạm tính:</strong>
              </td>
              <td className="text-right">
                <strong>{formatCurrency(quotation.subtotal)}đ</strong>
              </td>
            </tr>
            {quotation.discount_amount > 0 && (
              <tr>
                <td colSpan={6} className="text-right">
                  Chiết khấu:
                </td>
                <td className="text-right">
                  -{formatCurrency(quotation.discount_amount)}đ
                </td>
              </tr>
            )}
            {quotation.vat_amount > 0 && (
              <tr>
                <td colSpan={6} className="text-right">
                  Thuế GTGT ({quotation.vat_rate}%):
                </td>
                <td className="text-right">
                  {formatCurrency(quotation.vat_amount)}đ
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={6} className="text-right">
                <strong>Tổng thanh toán:</strong>
              </td>
              <td className="text-right">
                <strong>{formatCurrency(quotation.total_amount)} đ</strong>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Thông tin ngân hàng (nếu có) */}
        {(companyBankName || companyBankAccount) && (
          <div className="my-4 mx-0 py-3 px-4 border border-[#ccc] rounded">
            <strong>Thông tin thanh toán:</strong>
            {companyBankName && (
              <p className="mt-1 mb-0 mx-0">Ngân hàng: {companyBankName}</p>
            )}
            {companyBankAccount && (
              <p className="m-0">Số TK: {companyBankAccount}</p>
            )}
            <p className="m-0">Chủ TK: {companyName}</p>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-[1.2rem] mb-2">Điều khoản thương mại:</h3>
          <ul className="m-0 pl-6">
            <li>
              <strong>Thời hạn báo giá:</strong> Đến hết{' '}
              {formatDateLong(quotation.valid_until)}
            </li>
            <li>
              <strong>Điều kiện thanh toán:</strong>{' '}
              {quotation.payment_terms || 'Thoả thuận'}
            </li>
            <li>
              <strong>Điều kiện giao hàng:</strong>{' '}
              {quotation.delivery_terms || 'Thoả thuận'}
            </li>
            {quotation.notes && (
              <li>
                <strong>Ghi chú khác:</strong> {quotation.notes}
              </li>
            )}
          </ul>
        </div>

        <div className="flex justify-between mt-16">
          <div className="text-center w-[40%]">
            <strong>XÁC NHẬN CỦA KHÁCH HÀNG</strong>
            <p className="mt-16 italic">(Ký, đóng dấu)</p>
          </div>
          <div className="text-center w-[40%]">
            <strong>ĐẠI DIỆN {companyName.toUpperCase()}</strong>
            <p className="mt-16 italic">(Ký, ghi rõ họ tên)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
