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
      <div className="bg-teal-50 border border-success rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-success-soft p-2 rounded-lg">
            <Icon name="Building2" className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-bold text-success">
              Đã liên kết Khách hàng
            </p>
            <p className="text-xs text-success">
              Lead này thuộc về một hồ sơ khách hàng chính thức.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(`/app/customers?id=${lead.customer_id}`)}
          className="bg-surface hover:bg-teal-50 text-success border-success"
        >
          Mở hồ sơ
        </Button>
      </div>
    );
  }

  if (hasDuplicateCustomer) {
    return (
      <div className="bg-amber-50 border border-warning rounded-xl p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Icon
            name="AlertCircle"
            className="h-5 w-5 text-warning mt-0.5 shrink-0"
          />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-warning-strong">
              Phát hiện dữ liệu trùng lặp
            </h4>
            <p className="text-sm text-warning-strong mt-1">
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
                className="flex items-center justify-between bg-surface p-3 rounded-lg border border-warning shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Icon name="Building2" className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {c.name}
                    </p>
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
              className="bg-surface text-warning-strong border-warning hover:bg-warning-soft"
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
    <div className="bg-blue-50 border border-info rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-info-soft p-2 rounded-lg">
          <Icon name="UserPlus" className="h-5 w-5 text-info" />
        </div>
        <div>
          <p className="text-sm font-bold text-info">Lead tiềm năng độc lập</p>
          <p className="text-xs text-info">
            Chưa được liên kết với bất kỳ Khách hàng chính thức nào.
          </p>
        </div>
      </div>
      <Button
        variant="primary"
        isLoading={isPending}
        onClick={() => handleConvert()}
        className="bg-info-soft hover:bg-info-soft"
      >
        Tạo Khách hàng mới
      </Button>
    </div>
  );
}
