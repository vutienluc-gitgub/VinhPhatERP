import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { useCompanySettings } from '@/shared/hooks/useCompanySettings';
import { formatCurrency } from '@/shared/utils/format';

import { useQuotation } from './useQuotations';

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

  if (isLoading)
    return <div style={{ padding: '2rem' }}>Đang tải báo giá...</div>;
  if (error) return <div style={{ padding: '2rem' }}>Lỗi tải báo giá</div>;
  if (!quotation)
    return <div style={{ padding: '2rem' }}>Không tìm thấy báo giá.</div>;

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
    <div
      style={{
        background: '#fff',
        color: '#000',
        minHeight: '100vh',
        padding: '2rem 1rem',
      }}
    >
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

      <div
        className="no-print"
        style={{
          textAlign: 'center',
          marginBottom: '2rem',
        }}
      >
        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
          }}
        >
          🖨️ In lại
        </button>
      </div>

      <div className="print-wrapper">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '1.5rem',
                textTransform: 'uppercase',
              }}
            >
              {companyName}
            </h1>
            {companyAddress && (
              <p style={{ margin: '0.25rem 0 0 0' }}>
                Địa chỉ: {companyAddress}
              </p>
            )}
            <p style={{ margin: 0 }}>
              {companyPhone && `SĐT: ${companyPhone}`}
              {companyPhone && companyTaxCode && ' - '}
              {companyTaxCode && `MST: ${companyTaxCode}`}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <img
              src={companyLogo}
              alt="Logo"
              style={{
                width: 80,
                height: 80,
                objectFit: 'contain',
              }}
            />
          </div>
        </div>

        <hr
          style={{
            margin: '1rem 0',
            border: 'none',
            borderBottom: '2px solid #000',
          }}
        />

        <div
          style={{
            textAlign: 'center',
            margin: '2rem 0',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.8rem',
              textTransform: 'uppercase',
            }}
          >
            BẢNG BÁO GIÁ
          </h2>
          <p
            style={{
              margin: '0.5rem 0 0 0',
              fontStyle: 'italic',
            }}
          >
            Số: {quotation.quotation_number}
          </p>
          <p
            style={{
              margin: 0,
              fontStyle: 'italic',
            }}
          >
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
              <th className="text-center" style={{ width: '5%' }}>
                STT
              </th>
              <th style={{ width: '30%' }}>Loại vải / Hàng hoá</th>
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
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} className="text-right">
                <strong>Tạm tính:</strong>
              </td>
              <td className="text-right">
                <strong>{formatCurrency(quotation.subtotal)}</strong>
              </td>
            </tr>
            {quotation.discount_amount > 0 && (
              <tr>
                <td colSpan={6} className="text-right">
                  Chiết khấu:
                </td>
                <td className="text-right">
                  -{formatCurrency(quotation.discount_amount)}
                </td>
              </tr>
            )}
            {quotation.vat_amount > 0 && (
              <tr>
                <td colSpan={6} className="text-right">
                  Thuế GTGT ({quotation.vat_rate}%):
                </td>
                <td className="text-right">
                  {formatCurrency(quotation.vat_amount)}
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
          <div
            style={{
              margin: '1rem 0',
              padding: '0.75rem 1rem',
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
          >
            <strong>Thông tin thanh toán:</strong>
            {companyBankName && (
              <p style={{ margin: '0.25rem 0 0 0' }}>
                Ngân hàng: {companyBankName}
              </p>
            )}
            {companyBankAccount && (
              <p style={{ margin: 0 }}>Số TK: {companyBankAccount}</p>
            )}
            <p style={{ margin: 0 }}>Chủ TK: {companyName}</p>
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <h3
            style={{
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
            }}
          >
            Điều khoản thương mại:
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.5rem',
            }}
          >
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4rem',
          }}
        >
          <div className="text-center" style={{ width: '40%' }}>
            <strong>XÁC NHẬN CỦA KHÁCH HÀNG</strong>
            <p
              style={{
                marginTop: '4rem',
                fontStyle: 'italic',
              }}
            >
              (Ký, đóng dấu)
            </p>
          </div>
          <div className="text-center" style={{ width: '40%' }}>
            <strong>ĐẠI DIỆN {companyName.toUpperCase()}</strong>
            <p
              style={{
                marginTop: '4rem',
                fontStyle: 'italic',
              }}
            >
              (Ký, ghi rõ họ tên)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
