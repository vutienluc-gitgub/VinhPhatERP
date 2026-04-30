import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import type { ContractType } from '@/schema';
import { CONTRACT_TEMPLATE_MESSAGES } from '@/schema';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '@/features/contract-templates/contract-templates.module';

// ── Query Key ────────────────────────────────────────────────────────────────

const TEMPLATES_KEY = ['contract-templates'] as const;

// ── Types ────────────────────────────────────────────────────────────────────

type TemplateFilter = {
  search: string;
  type: 'all' | ContractType;
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useContractTemplates() {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<TemplateFilter>({
    search: '',
    type: 'all',
  });

  const query = useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: getTemplates,
  });

  const filtered = useMemo(() => {
    const list = query.data ?? [];
    return list.filter((t) => {
      if (filter.type !== 'all' && t.type !== filter.type) return false;
      if (
        filter.search &&
        !t.name.toLowerCase().includes(filter.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [query.data, filter]);

  const createMutation = useMutation({
    mutationFn: (data: { type: ContractType; name: string; content: string }) =>
      createTemplate(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success(CONTRACT_TEMPLATE_MESSAGES.CREATE_SUCCESS);
    },
    onError: (err: Error) => {
      toast.error(CONTRACT_TEMPLATE_MESSAGES.CREATE_ERROR + err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; content?: string; is_active?: boolean };
    }) => updateTemplate(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success(CONTRACT_TEMPLATE_MESSAGES.UPDATE_SUCCESS);
    },
    onError: (err: Error) => {
      toast.error(CONTRACT_TEMPLATE_MESSAGES.UPDATE_ERROR + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success(CONTRACT_TEMPLATE_MESSAGES.DELETE_SUCCESS);
    },
    onError: (err: Error) => {
      toast.error(CONTRACT_TEMPLATE_MESSAGES.DELETE_ERROR + err.message);
    },
  });

  const toggleTemplate = async (template: {
    id: string;
    is_active: boolean;
  }) => {
    await updateMutation.mutateAsync({
      id: template.id,
      data: { is_active: !template.is_active },
    });
  };

  async function seedDefaults() {
    const loading = toast.loading(CONTRACT_TEMPLATE_MESSAGES.SEED_LOADING);
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
      await queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success(CONTRACT_TEMPLATE_MESSAGES.SEED_SUCCESS, { id: loading });
    } catch (err) {
      toast.error(
        CONTRACT_TEMPLATE_MESSAGES.SEED_ERROR + (err as Error).message,
        { id: loading },
      );
    }
  }

  return {
    templates: query.data ?? [],
    filteredTemplates: filtered,
    isLoading: query.isLoading,
    error: query.error,

    filter,
    setFilter,

    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    toggleTemplate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    seedDefaults,
  };
}
