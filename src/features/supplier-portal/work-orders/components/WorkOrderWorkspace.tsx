import {
  Outlet,
  useLocation,
  useParams,
  useNavigate,
  Navigate,
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { Badge } from '@/shared/components/Badge';
import { Icon } from '@/shared/components/Icon';
import { TabSwitcher } from '@/shared/components/TabSwitcher';
import { Button } from '@/shared/components/Button';
import { useWorkOrder } from '@/features/supplier-portal/work-orders/hooks/useWorkOrder';

import { WorkOrderPermissionGuard } from './WorkOrderPermissionGuard';

export function WorkOrderWorkspace() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { workOrder, statePayload, actions } = useWorkOrder(id);

  // If we are exactly at /work-orders/:id, redirect to /overview
  const isExactRoot = location.pathname.endsWith(id || '');
  if (isExactRoot) {
    return (
      <Navigate to={`/portal/supplier/work-orders/${id}/overview`} replace />
    );
  }

  const tabs = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'production', label: 'Sản xuất' },
    { key: 'materials', label: 'Vật tư' },
    { key: 'quality', label: 'Chất lượng' },
    { key: 'documents', label: 'Tài liệu' },
    { key: 'timeline', label: 'Lịch sử' },
  ];

  const currentTab = location.pathname.split('/').pop() || 'overview';

  return (
    <WorkOrderPermissionGuard workOrderId={id}>
      {(capabilities) => (
        <div className="flex flex-col h-full bg-surface-secondary/30 relative pb-20 md:pb-0">
          {/* MES Header */}
          <header className="bg-surface border-b border-default sticky top-0 z-20">
            <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
              {/* Top Row: Breadcrumb & Title */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2 text-muted mb-1 text-sm">
                    <button
                      onClick={() => navigate('/portal/supplier/work-orders')}
                      className="hover:text-primary flex items-center"
                    >
                      <Icon name="arrow-left" size={14} className="mr-1" /> Danh
                      sách
                    </button>
                    <span>/</span>
                    <span>Lệnh gia công</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-xl md:text-2xl font-semibold text-foreground uppercase tracking-tight">
                      WO-{id?.split('-')[0]}
                    </h1>
                    <Badge
                      variant={
                        statePayload?.status === 'completed'
                          ? 'success'
                          : statePayload?.status === 'in_progress'
                            ? 'info'
                            : 'default'
                      }
                    >
                      {statePayload?.status}
                    </Badge>
                  </div>
                </div>

                {/* Desktop Action Buttons (Rendered if capabilities exist) */}
                <div className="hidden md:flex items-center space-x-2">
                  {statePayload?.availableActions.includes('start') && (
                    <Button
                      onClick={() => actions.start()}
                      isLoading={actions.isPending}
                    >
                      Bắt đầu chạy máy
                    </Button>
                  )}
                  {statePayload?.availableActions.includes('pause') && (
                    <Button
                      variant="outline"
                      onClick={() => actions.pause()}
                      isLoading={actions.isPending}
                    >
                      Tạm dừng
                    </Button>
                  )}
                  {statePayload?.availableActions.includes('complete') && (
                    <Button
                      variant="primary"
                      onClick={() => actions.complete()}
                      isLoading={actions.isPending}
                    >
                      Hoàn thành
                    </Button>
                  )}
                </div>
              </div>

              {/* KPI Dashboard inside Header */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="flex flex-col border-r border-default pr-4">
                  <span className="text-xs text-muted font-medium mb-1 uppercase">
                    Progress
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-primary">
                      72%
                    </span>
                    <div className="h-2 w-full bg-surface-secondary rounded-full overflow-hidden hidden md:block">
                      <div
                        className="h-full bg-primary"
                        style={{ width: '72%' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col border-r border-default px-4">
                  <span className="text-xs text-muted font-medium mb-1 uppercase">
                    Efficiency
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    93%
                  </span>
                </div>
                <div className="flex flex-col border-r border-default px-4">
                  <span className="text-xs text-muted font-medium mb-1 uppercase">
                    Defect
                  </span>
                  <span className="text-lg font-semibold text-danger">
                    1.8%
                  </span>
                </div>
                <div className="flex flex-col border-r border-default px-4">
                  <span className="text-xs text-muted font-medium mb-1 uppercase">
                    Mat. Loss
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    0.9%
                  </span>
                </div>
                <div className="flex flex-col pl-4">
                  <span className="text-xs text-muted font-medium mb-1 uppercase">
                    Delay
                  </span>
                  <span className="text-lg font-semibold text-warning">2h</span>
                </div>
              </div>

              {/* Deep-link Tab Navigation */}
              <TabSwitcher
                tabs={tabs}
                active={currentTab}
                onChange={(tab) =>
                  navigate(`/portal/supplier/work-orders/${id}/${tab}`)
                }
              />
            </div>
          </header>

          {/* Sub-route Content */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto w-full p-4 md:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Outlet context={{ capabilities, workOrder }} />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Mobile Sticky Action Bar */}
          <div className="md:hidden sticky bottom-0 p-4 bg-surface border-t border-default flex gap-2">
            {statePayload?.availableActions.includes('start') && (
              <Button
                className="w-full"
                onClick={() => actions.start()}
                isLoading={actions.isPending}
              >
                Bắt đầu chạy máy
              </Button>
            )}
            {statePayload?.availableActions.includes('pause') && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => actions.pause()}
                isLoading={actions.isPending}
              >
                Tạm dừng
              </Button>
            )}
            {statePayload?.availableActions.includes('complete') && (
              <Button
                className="w-full"
                variant="primary"
                onClick={() => actions.complete()}
                isLoading={actions.isPending}
              >
                Hoàn thành
              </Button>
            )}
          </div>
        </div>
      )}
    </WorkOrderPermissionGuard>
  );
}
