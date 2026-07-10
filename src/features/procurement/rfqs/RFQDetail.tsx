import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import dayjs from 'dayjs';

import { Icon, Badge, Button } from '@/shared/components';
import { TabSwitcher } from '@/shared/components/TabSwitcher';
import { getErrorMessage } from '@/shared/utils/error';
import {
  useRFQById,
  useRFQItems,
  useUpdateRfqStatus,
} from '@/application/procurement/useRFQs';

import { RFQQuotesTab } from './components/RFQQuotesTab';
import {
  RFQ_LABELS,
  RFQ_STATUS_LABELS,
  RFQ_STATUS_COLORS,
} from './rfqs.constants';

export function RFQDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'items' | 'suppliers'>('items');

  const {
    data: rfq,
    isLoading: isLoadingRfq,
    error: rfqError,
  } = useRFQById(id ?? null);
  const { data: items = [], isLoading: isLoadingItems } = useRFQItems(
    id ?? null,
  );
  const updateStatusMutation = useUpdateRfqStatus();

  if (isLoadingRfq) {
    return (
      <div className="page-container pb-8 space-y-6">
        <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (rfqError || !rfq) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl mt-8">
        <Icon
          name="XCircle"
          size={48}
          className="text-destructive mx-auto mb-4"
        />
        <p className="text-lg font-bold text-slate-800 mb-2">
          {rfqError ? getErrorMessage(rfqError) : RFQ_LABELS.DETAIL_NOT_FOUND}
        </p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => navigate('/rfqs')}
        >
          {RFQ_LABELS.BACK_TO_LIST}
        </Button>
      </div>
    );
  }

  const qrUrl = `${RFQ_LABELS.QR_DOMAIN}/rfq/${rfq.id}`;

  const handleUpdateStatus = async (status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: rfq.id, status });
    } catch (error) {
      console.error('[UpdateRFQStatusError]', error);
    }
  };

  return (
    <div className="page-container pb-8">
      {/* ── Header ── */}
      <div className="card-header-area flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-surface-subtle transition-colors"
            onClick={() => navigate('/rfqs')}
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {RFQ_LABELS.DETAIL_TITLE_PREFIX} {rfq.rfq_code}
              <Badge variant={RFQ_STATUS_COLORS[rfq.status] ?? 'gray'}>
                {RFQ_STATUS_LABELS[rfq.status] ?? rfq.status}
              </Badge>
            </h1>
            <p className="text-sm text-muted mt-1">{rfq.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {rfq.status === 'open' && (
            <Button
              variant="warning"
              onClick={() => handleUpdateStatus('closing_soon')}
              isLoading={updateStatusMutation.isPending}
            >
              {RFQ_LABELS.ACTION_WARN_CLOSING}
            </Button>
          )}
          {(rfq.status === 'open' || rfq.status === 'closing_soon') && (
            <Button
              variant="secondary"
              onClick={() => handleUpdateStatus('closed')}
              isLoading={updateStatusMutation.isPending}
            >
              {RFQ_LABELS.ACTION_CLOSE_RFQ}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 md:px-6">
        <div className="lg:col-span-2 space-y-6">
          {/* ── Info Card ── */}
          <div className="panel-card p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted mb-1 font-medium uppercase tracking-wider">
                  Mã RFQ
                </p>
                <p className="font-semibold text-primary">{rfq.rfq_code}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1 font-medium uppercase tracking-wider">
                  Ngày tạo
                </p>
                <p className="font-medium">
                  {dayjs(rfq.created_at).format('DD/MM/YYYY')}
                </p>
              </div>
              <div className="col-span-2 md:col-span-2">
                <p className="text-xs text-muted mb-1 font-medium uppercase tracking-wider text-destructive">
                  {RFQ_LABELS.DETAIL_DEADLINE}
                </p>
                <p className="font-semibold text-destructive">
                  {dayjs(rfq.deadline_date).format('DD/MM/YYYY HH:mm')}
                </p>
              </div>
            </div>
            {rfq.notes && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm font-medium mb-2">Ghi chú:</p>
                <p className="text-sm text-muted whitespace-pre-wrap">
                  {rfq.notes}
                </p>
              </div>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="panel-card">
            <div className="p-4 border-b border-border">
              <TabSwitcher
                tabs={[
                  { key: 'items', label: RFQ_LABELS.TAB_ITEMS },
                  { key: 'suppliers', label: RFQ_LABELS.TAB_SUPPLIERS },
                ]}
                active={activeTab}
                onChange={setActiveTab}
              />
            </div>

            {activeTab === 'items' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-subtle border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted">
                        #
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted">
                        Vật tư
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted">
                        Quy cách
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted">
                        Số lượng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {isLoadingItems ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted">
                          Đang tải vật tư...
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted">
                          Không có vật tư nào.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr
                          key={item.id}
                          className="hover:bg-surface-subtle/30"
                        >
                          <td className="px-4 py-3 text-muted">{index + 1}</td>
                          <td className="px-4 py-3 font-medium">
                            {item.material_name}
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {item.material_specs || '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {item.qty_required} {item.uom}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'suppliers' && (
              <div className="p-6 text-center text-slate-500">
                <RFQQuotesTab rfq={rfq} />
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar (QR Code) ── */}
        <div className="space-y-6">
          <div className="panel-card p-6 flex flex-col items-center text-center">
            <h3 className="font-semibold text-lg mb-2">
              {RFQ_LABELS.QR_TITLE}
            </h3>
            <p className="text-sm text-muted mb-6">{RFQ_LABELS.QR_DESC}</p>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-border inline-block mb-6">
              <QRCodeCanvas
                id="rfq-qr-code"
                value={qrUrl}
                size={200}
                bgColor={'#ffffff'}
                fgColor={'#0f172a'}
                level={'H'}
                includeMargin={false}
              />
            </div>

            <div className="w-full space-y-3">
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={() => {
                  const canvas = document.getElementById(
                    'rfq-qr-code',
                  ) as HTMLCanvasElement;
                  if (canvas) {
                    const pngUrl = canvas
                      .toDataURL('image/png')
                      .replace('image/png', 'image/octet-stream');
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = `QR_${rfq.rfq_code}.png`;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                  }
                }}
              >
                <Icon name="Download" size={16} className="mr-2" />
                Tải mã QR
              </Button>

              <h2 className="text-sm font-bold uppercase tracking-wider text-muted mt-6 mb-4 border-b border-border pb-2">
                {RFQ_LABELS.SHARE_QR_CODE}
              </h2>
              <div className="relative">
                <input
                  type="text"
                  value={qrUrl}
                  readOnly
                  className="field-input text-xs font-mono pr-10 bg-surface-subtle"
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1"
                  onClick={() => {
                    navigator.clipboard.writeText(qrUrl);
                  }}
                  title="Copy link"
                >
                  <Icon name="Copy" size={14} />
                </button>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-muted">
                  {RFQ_LABELS.QR_HELPER_TEXT}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
