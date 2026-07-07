import { useNavigate } from 'react-router-dom';

import type { QuotationsFormValues } from '@/schema/quotation.schema';
import type { CrmLead } from '@/domain/crm/crm.types';

export function useConvertToQuote() {
  const navigate = useNavigate();

  const convertToQuote = (lead: CrmLead, onClose: () => void) => {
    const initialData: Partial<QuotationsFormValues> = {
      notes: `Báo giá cho Lead: ${lead.customer_name} - ${lead.phone}`,
    };

    if (lead.type === 'RFQ' && lead.rfq_detail) {
      if (lead.rfq_detail.rfq_items && lead.rfq_detail.rfq_items.length > 0) {
        initialData.items = lead.rfq_detail.rfq_items.map((item) => ({
          fabricType: item.code || '',
          colorName: item.color_name || '',
          quantity: item.quantity || 0,
          unit: item.unit === 'kg' ? 'kg' : 'm',
          unitPrice: item.target_price || 0,
          widthCm: 0,
          leadTimeDays: 0,
          notes: '',
        }));
      } else {
        initialData.items = [
          {
            fabricType: lead.rfq_detail.fabric_catalog?.name || '',
            colorName: lead.rfq_detail.variant?.color_name || '',
            quantity: lead.rfq_detail.quantity || 0,
            unit: lead.rfq_detail.unit === 'kg' ? 'kg' : 'm',
            unitPrice: lead.rfq_detail.target_price || 0,
            widthCm: 0,
            leadTimeDays: 0,
            notes: '',
          },
        ];
      }
    }

    navigate('/sales/quotations', {
      state: {
        createFromLead: true,
        initialData,
      },
    });

    onClose();
  };

  return { convertToQuote };
}
