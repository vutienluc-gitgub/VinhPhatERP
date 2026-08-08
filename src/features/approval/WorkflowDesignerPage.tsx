import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { WorkflowDesignerBoard } from '@/domains/approval/ui/designer/WorkflowDesignerBoard';
import { WorkflowRepository } from '@/domains/approval/repositories/workflow-repository';
import {
  ApprovalWorkflow,
  ApprovalWorkflowStep,
} from '@/domains/approval/models/types';
import { Icon } from '@/shared/components/Icon';

export function WorkflowDesignerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workflowId = searchParams.get('id');
  const [workflow, setWorkflow] = useState<Partial<ApprovalWorkflow> | null>(
    null,
  );
  const [steps, setSteps] = useState<ApprovalWorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (workflowId) {
        const wf = await WorkflowRepository.getWorkflowById(workflowId);
        if (wf) {
          setWorkflow(wf);
          const wfSteps = await WorkflowRepository.getWorkflowSteps(workflowId);
          setSteps(wfSteps);
        }
      } else {
        // Initialize empty
        setWorkflow({
          is_active: true,
          version: 1,
        });
        setSteps([]);
      }
      setLoading(false);
    }
    loadData();
  }, [workflowId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Icon name="Loader2" className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Không tìm thấy quy trình.
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-surface-secondary rounded-full transition-colors"
        >
          <Icon name="ArrowLeft" className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {workflowId ? 'Chỉnh sửa Quy trình' : 'Tạo mới Quy trình'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Thiết kế sơ đồ phê duyệt bằng công cụ Low-Code.
          </p>
        </div>
      </div>

      <WorkflowDesignerBoard
        workflow={workflow}
        initialSteps={steps}
        onComplete={() => navigate(-1)}
      />
    </div>
  );
}
