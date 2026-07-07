import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import type { CrmLead } from '@/domain/crm/crm.types';
import {
  useCheckDuplicateContact,
  useConvertLead,
} from '@/application/crm/useCrm';

interface LeadContextualActionsProps {
  lead: CrmLead;
}

export function LeadContextualActions({ lead }: LeadContextualActionsProps) {
  const navigate = useNavigate();
  const { mutateAsync: convertLead, isPending } = useConvertLead();
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Check duplicates if not linked
  const { data: duplicates } = useCheckDuplicateContact({
    phone: lead.phone,
    email: lead.email || undefined,
  });

  const hasDuplicateCustomer = duplicates && duplicates.customers.length > 0;

  const handleConvert = async (customerId?: string) => {
    try {
      await convertLead({ leadId: lead.id, customerId });
      toast.success(
        customerId
          ? 'Đã liên kết khách hàng thành công'
          : 'Đã tạo khách hàng mới thành công',
      );
      // If needed we can automatically open the customer profile
      // navigate(`/app/customers?id=${res.customerId}`);
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi xử lý');
    }
  };

  if (lead.customer_id) {
    return (
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 p-2 rounded-lg">
            <Icon name="Building2" className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <p className="text-sm font-bold text-teal-900">
              Đã liên kết Khách hàng
            </p>
            <p className="text-xs text-teal-700">
              Lead này thuộc về một hồ sơ khách hàng chính thức.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(`/app/customers?id=${lead.customer_id}`)}
          className="bg-white hover:bg-teal-50 text-teal-700 border-teal-200"
        >
          Mở hồ sơ
        </Button>
      </div>
    );
  }

  if (hasDuplicateCustomer) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Icon
            name="AlertCircle"
            className="h-5 w-5 text-amber-600 mt-0.5 shrink-0"
          />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-800">
              Phát hiện dữ liệu trùng lặp
            </h4>
            <p className="text-sm text-amber-700 mt-1">
              Số điện thoại/Email của Lead này khớp với khách hàng đã có trên hệ
              thống. Bạn nên liên kết thay vì tạo mới.
            </p>
          </div>
        </div>

        {showDuplicates ? (
          <div className="space-y-2 mt-2">
            {duplicates.customers.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Icon name="Building2" className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{c.name}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  isLoading={isPending}
                  onClick={() => handleConvert(c.id)}
                >
                  Liên kết
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="bg-white text-amber-700 border-amber-300 hover:bg-amber-100"
              onClick={() => setShowDuplicates(true)}
            >
              Xem khách hàng trùng
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Unlinked and no duplicates
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Icon name="UserPlus" className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <p className="text-sm font-bold text-blue-900">
            Lead tiềm năng độc lập
          </p>
          <p className="text-xs text-blue-700">
            Chưa được liên kết với bất kỳ Khách hàng chính thức nào.
          </p>
        </div>
      </div>
      <Button
        variant="primary"
        isLoading={isPending}
        onClick={() => handleConvert()}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Tạo Khách hàng mới
      </Button>
    </div>
  );
}
