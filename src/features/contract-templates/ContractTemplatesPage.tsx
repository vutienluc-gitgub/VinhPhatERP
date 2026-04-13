import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Icon, SearchInput } from '@/shared/components';
import { CONTRACT_TYPE_LABELS } from '@/schema';
import type { ContractType, ContractTemplate } from '@/schema';

import {
  getTemplates,
  createTemplate,
  updateTemplate,
} from './contract-templates.module';
import { TemplateEditor } from './TemplateEditor';

// ── Component ────────────────────────────────────────────────────────────────

export function ContractTemplatesPage() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] =
    useState<ContractTemplate | null>(null);
  const [creatingType, setCreatingType] = useState<ContractType | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ContractType>('all');

  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: getTemplates,
  });

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (
        searchQuery &&
        !t.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [templates, searchQuery, typeFilter]);

  function handleEdit(template: ContractTemplate) {
    setSelectedTemplate(template);
    setCreatingType(null);
  }

  function handleDuplicate(template: ContractTemplate) {
    setSelectedTemplate({
      ...template,
      id: '', // Empty ID means it will be created as new but we pass it as template
      name: `${template.name} (Bản sao)`,
    });
    setCreatingType(null);
  }

  function handleClose() {
    setSelectedTemplate(null);
    setCreatingType(null);
  }

  async function handleSaved(data: { name: string; content: string }) {
    try {
      if (creatingType || (selectedTemplate && !selectedTemplate.id)) {
        // Create mode
        const typeToUse = creatingType || selectedTemplate?.type || 'sale';
        await createTemplate({
          type: typeToUse as ContractType,
          name: data.name,
          content: data.content,
        });
        toast.success('Đã tạo mẫu hợp đồng mới.');
      } else if (selectedTemplate && selectedTemplate.id) {
        // Update mode
        await updateTemplate(selectedTemplate.id, {
          name: data.name,
          content: data.content,
        });
        toast.success('Mẫu hợp đồng đã được cập nhật.');
      }

      await queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      handleClose();
    } catch (err) {
      toast.error('Lỗi khi lưu: ' + (err as Error).message);
      throw err;
    }
  }

  async function handleSeedDefaults() {
    const loading = toast.loading('Đang khởi tạo mẫu mặc định...');
    try {
      await createTemplate({
        type: 'sale',
        name: 'Hợp đồng mua bán vải thành phẩm',
        content: `
          <h2 style="text-align: center;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
          <p style="text-align: center;"><strong>Độc lập - Tự do - Hạnh phúc</strong></p>
          <hr />
          <h1 style="text-align: center;">HỢP ĐỒNG KINH TẾ</h1>
          <p style="text-align: center;">Số: {{contract_number}}</p>
          <p>Hôm nay, ngày {{contract_date}}, chúng tôi gồm:</p>
          <p><strong>BÊN BÁN (BÊN VĨNH PHÁT): {{party_b_name}}</strong></p>
          <p>Địa chỉ: {{party_b_address}}</p>
          <p>Mã số thuế: {{party_b_tax_code}}</p>
          <p>Người đại diện: {{party_b_representative}}</p>
          <p><strong>BÊN MUA (BÊN ĐỐI TÁC): {{party_a_name}}</strong></p>
          <p>Địa chỉ: {{party_a_address}}</p>
          <p>Mã số thuế: {{party_a_tax_code}}</p>
          <p>Điều khoản thanh toán: {{payment_term}}</p>
          <p>...</p>
        `,
      });
      await createTemplate({
        type: 'purchase',
        name: 'Hợp đồng mua sợi nguyên liệu',
        content: `
          <h2 style="text-align: center;">HỢP ĐỒNG MUA HÀNG</h2>
          <p style="text-align: center;">Số: {{contract_number}}</p>
          <p><strong>Bên mua (Bên Vĩnh Phát):</strong> {{party_b_name}}</p>
          <p><strong>Bên bán (Bên Đối tác):</strong> {{party_a_name}}</p>
          <p>Dựa trên nhu cầu thực tế, hai bên đồng ý ký kết mua bán nguyên liệu (sợi) với nội dung như sau:</p>
          <p>Ngày ký: {{contract_date}}</p>
          <p>...</p>
        `,
      });
      await queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast.success('Khởi tạo mẫu mặc định thành công!', { id: loading });
    } catch (err) {
      toast.error('Lỗi khởi tạo: ' + (err as Error).message, { id: loading });
    }
  }

  if (selectedTemplate || creatingType) {
    return (
      <div className="panel-card card-flush max-w-5xl mx-auto border-none shadow-2xl">
        <div className="card-header-area card-header-premium p-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2.5 rounded-xl bg-surface-subtle hover:bg-surface-strong border border-border/50 transition-all shadow-sm group"
              onClick={handleClose}
              title="Quay lại"
            >
              <Icon
                name="ArrowLeft"
                size={20}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
            </button>
            <div>
              <p className="eyebrow-premium text-primary/70 mb-1">
                {creatingType ? 'KHỞI TẠO CẤU HÌNH' : 'ĐIỀU CHỈNH MẪU'}
              </p>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                {creatingType
                  ? `${CONTRACT_TYPE_LABELS[creatingType]}`
                  : selectedTemplate?.name}
                {selectedTemplate && selectedTemplate.id && (
                  <span className="ml-3 px-2 py-0.5 rounded-md bg-primary/5 text-xs font-bold text-primary border border-primary/10 align-middle">
                    {CONTRACT_TYPE_LABELS[selectedTemplate.type]}
                  </span>
                )}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-surface-strong/30 backdrop-blur-sm">
          <TemplateEditor
            template={
              selectedTemplate && selectedTemplate.id
                ? selectedTemplate
                : undefined
            }
            onSaved={handleSaved}
            onCancel={handleClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5 px-0.5">
            <div className="p-1 rounded-md bg-blue-600/10 text-blue-601">
              <Icon name="Settings" size={14} strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase">
              QUẢN TRỊ HỆ THỐNG
            </p>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Mẫu hợp đồng
          </h1>
        </div>
        <NewTemplateMenu onSelect={setCreatingType} />
      </div>

      <div className="panel-card card-flush border-none shadow-xl overflow-visible">
        {/* Toolbar: Search + Filter */}
        <div
          className="px-5 md:px-7 py-4 border-b border-border/50 flex flex-wrap items-center gap-3 rounded-t-2xl relative z-10"
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              placeholder="Tìm kiếm mẫu văn bản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 shadow-sm border-border/60 focus:border-blue-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Filter" size={16} className="text-muted" />
            <select
              className="field-input h-11 text-sm font-semibold shadow-sm border-border/60 pr-10 min-w-[160px]"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as 'all' | ContractType)
              }
            >
              <option value="all">Tất cả danh mục</option>
              <option value="sale">Mẫu Bán hàng</option>
              <option value="purchase">Mẫu Mua hàng</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 md:p-8 bg-gradient-to-b from-white/20 to-transparent">
          {/* Error state */}
          {error && (
            <div className="p-6 rounded-2xl bg-danger/5 border border-danger/20 flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-danger/10 text-danger mb-3">
                <Icon name="AlertCircle" size={32} />
              </div>
              <h3 className="font-bold text-danger">Không thể tải dữ liệu</h3>
              <p className="text-sm text-danger/80 mt-1 max-w-xs">
                {(error as Error).message}
              </p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="py-24 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon name="FileText" size={24} className="text-primary/40" />
                </div>
              </div>
              <span className="mt-6 text-sm font-bold text-muted tracking-wide animate-pulse uppercase">
                Đang đồng bộ dữ liệu mẫu...
              </span>
            </div>
          )}

          {/* Template list */}
          {!isLoading && !error && (
            <div className="grid gap-6 lg:grid-cols-2">
              {templates.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-blue-500/5 rounded-3xl animate-ping opacity-20"></div>
                    <Icon
                      name="FileStack"
                      size={40}
                      className="text-blue-600/50"
                    />
                  </div>
                  <h3 className="text-xl font-extrabold text-foreground mb-2">
                    Hệ thống chưa có mẫu mẫu văn bản
                  </h3>
                  <p className="text-muted max-w-sm text-sm leading-relaxed mb-8">
                    Khởi tạo các mẫu tiêu chuẩn để bắt đầu quản lý quy trình ký
                    kết tự động.
                  </p>
                  <button
                    type="button"
                    className="btn-primary group h-12 px-8 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all rounded-xl font-bold flex items-center gap-3"
                    onClick={() => void handleSeedDefaults()}
                  >
                    <Icon name="Zap" size={18} className="fill-current" />
                    Bắt đầu với mẫu tiêu chuẩn
                  </button>
                </div>
              )}

              {templates.length > 0 && filteredTemplates.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center text-center">
                  <div className="p-4 bg-surface-subtle rounded-2xl mb-4">
                    <Icon name="SearchX" size={40} className="text-muted/50" />
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    Không tìm thấy mẫu phù hợp
                  </p>
                  <p className="text-muted mt-2">
                    Dữ liệu không khớp với từ khóa "{searchQuery}"
                  </p>
                </div>
              )}

              {filteredTemplates.map((template, idx) => (
                <div
                  key={template.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <TemplateCard
                    template={template}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NewTemplateMenu (Dropdown CTA) ───────────────────────────────────────────

type NewTemplateMenuProps = {
  onSelect: (type: ContractType) => void;
};

function NewTemplateMenu({ onSelect }: NewTemplateMenuProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(type: ContractType) {
    setOpen(false);
    onSelect(type);
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-primary h-[48px] px-6 shadow-lg shadow-primary/20 flex items-center gap-2.5 rounded-2xl font-black text-sm transition-all hover:-translate-y-0.5"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="Plus" size={20} strokeWidth={2.5} />
        TẠO MẪU MỚI
        <div
          className={`ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <Icon name="ChevronDown" size={14} />
        </div>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[40]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2.5 z-[50] w-64 p-2 rounded-2xl border border-border/60 bg-white shadow-2xl animate-in zoom-in-95 duration-200 origin-top-right">
            <button
              type="button"
              className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-all group"
              onClick={() => handleSelect('sale')}
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
                <Icon name="FileText" size={16} />
              </div>
              Bản mẫu Bán hàng
            </button>
            <button
              type="button"
              className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold hover:bg-violet-600 hover:text-white flex items-center gap-3 mt-1 transition-all group"
              onClick={() => handleSelect('purchase')}
            >
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
                <Icon name="FileText" size={16} />
              </div>
              Bản mẫu Mua hàng
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── TemplateCard ─────────────────────────────────────────────────────────────

type TemplateCardProps = {
  template: ContractTemplate;
  onEdit: (template: ContractTemplate) => void;
  onDuplicate: (template: ContractTemplate) => void;
};

function TemplateCard({ template, onEdit, onDuplicate }: TemplateCardProps) {
  const formattedDate = new Date(template.updated_at).toLocaleDateString(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  );

  const typeLabel = CONTRACT_TYPE_LABELS[template.type];
  const isPurchase = template.type === 'purchase';

  // Chuyển HTML thành text cho nội dung xem trước
  const rawText = template.content
    ? template.content
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : 'Chưa có cấu hình nội dung.';

  return (
    <div className="group relative bg-white border border-border/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 overflow-hidden h-full flex flex-col">
      {/* Background Accent */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-110 ${isPurchase ? 'bg-violet-600' : 'bg-blue-600'}`}
      ></div>

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`p-3.5 rounded-2xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm ${
              isPurchase
                ? 'bg-violet-500/10 text-violet-600'
                : 'bg-blue-500/10 text-blue-600'
            }`}
          >
            <Icon name="FileSignature" size={24} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h4
              className="font-extrabold text-foreground leading-tight truncate-2-lines h-10 flex items-center"
              title={template.name}
            >
              {template.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isPurchase ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}
              >
                {typeLabel}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wide transition-colors ${
            template.is_active
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/10'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${template.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
          ></div>
          {template.is_active ? 'Active' : 'Disabled'}
        </div>
      </div>

      {/* Modern Preview Section */}
      <div className="flex-1 relative mb-6">
        <div className="absolute inset-0 bg-slate-50 border border-slate-100/60 rounded-2xl rotate-1 group-hover:rotate-2 transition-transform duration-500 origin-bottom-right opacity-40"></div>
        <div className="absolute inset-0 bg-white border border-slate-200/50 rounded-2xl -rotate-1 group-hover:-rotate-2 transition-transform duration-500 origin-bottom-left opacity-60"></div>

        <div className="relative bg-white border border-border/80 rounded-2xl p-4 h-32 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col">
          <div className="flex gap-1 mb-2.5 pb-2 border-b border-slate-50">
            <div className="w-2 h-2 rounded-full bg-slate-100"></div>
            <div className="w-2 h-2 rounded-full bg-slate-100"></div>
            <div className="w-2 h-2 rounded-full bg-slate-100"></div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted/80 font-medium line-clamp-4 whitespace-pre-wrap select-none italic ql-editor">
            {rawText}
          </p>

          {/* Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />

          {/* Interactive Hover Peek */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
            <button
              className="bg-white px-4 py-2 rounded-xl shadow-xl border border-border/50 text-xs font-bold text-primary flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              onClick={() => onEdit(template)}
            >
              <Icon name="Eye" size={14} />
              XEM CHI TIẾT
            </button>
          </div>
        </div>
      </div>

      {/* Refined Footer Action Area */}
      <div className="flex items-center justify-between pt-5 mt-auto border-t border-slate-50 relative z-10">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">
            Last Modification
          </p>
          <p className="text-xs font-extrabold text-slate-600">
            {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 active:scale-90"
            onClick={() => onDuplicate(template)}
            title="Duplicate Template"
          >
            <Icon name="Copy" size={18} />
          </button>
          <button
            type="button"
            className="h-10 px-5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-blue-600/20 active:scale-95 flex items-center gap-2 group/btn"
            onClick={() => onEdit(template)}
          >
            <Icon
              name="Pencil"
              size={14}
              className="group-hover/btn:rotate-12 transition-transform"
            />
            EDIT
          </button>
        </div>
      </div>
    </div>
  );
}
