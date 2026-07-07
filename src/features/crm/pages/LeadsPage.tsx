import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useLeads } from '@/application/crm/useCrm';
import type { LeadFilter, LeadStatus } from '@/domain/crm/crm.types';
import { ViewToggle } from '@/shared/components/ViewToggle';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { SearchInput } from '@/shared/components/SearchInput';
import { Button } from '@/shared/components/Button';
import { useDebouncedValue } from '@/shared/components/filter-bar';
import { LeadsList } from '@/features/crm/components/LeadsList';
import { LeadsKanban } from '@/features/crm/components/LeadsKanban';
import { LeadDetailDrawer } from '@/features/crm/components/LeadDetailDrawer';
import { CreateLeadModal } from '@/features/crm/components/CreateLeadModal';
import { LEAD_STATUS_MAP } from '@/features/crm/crm.constants';

export function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 400);

  // Parse filters from URL
  const statusFilter = (searchParams.get('status') as LeadStatus) || undefined;
  const page = Number(searchParams.get('page')) || 1;

  const filters: LeadFilter = {
    status: statusFilter,
    search: debouncedSearch,
  };

  const { data, isLoading } = useLeads(filters, page);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleStatusFilter = (status: LeadStatus | 'ALL') => {
    if (status === 'ALL') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    searchParams.delete('page');
    setSearchParams(searchParams);
  };

  const closeDrawer = () => setSelectedLeadId(null);

  return (
    <div className="page-container flex flex-col h-full h-[calc(100vh-80px)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Khách hàng Tiềm năng
          </h1>
          <p className="text-sm text-muted">
            Quản lý yêu cầu báo giá và mẫu vải từ khách hàng
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ViewToggle
            value={viewMode}
            onChange={(v) => setViewMode(v as 'table' | 'grid')}
          />
          <Button
            variant="primary"
            leftIcon="Plus"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Thêm Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Tìm theo tên KH, SĐT, Cty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {viewMode === 'table' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => handleStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                !statusFilter
                  ? 'bg-foreground text-background'
                  : 'bg-surface-subtle text-muted hover:text-foreground'
              }`}
            >
              Tất cả
            </button>
            {Object.entries(LEAD_STATUS_MAP).map(([status, meta]) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status as LeadStatus)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-foreground text-background'
                    : 'bg-surface-subtle text-muted hover:text-foreground'
                }`}
              >
                {meta.dot} {meta.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        {viewMode === 'grid' ? (
          <LeadsKanban filters={filters} onSelectLead={setSelectedLeadId} />
        ) : (
          <LeadsList
            data={data?.data ?? []}
            total={data?.total ?? 0}
            page={page}
            isLoading={isLoading}
            onPageChange={(p) => {
              searchParams.set('page', p.toString());
              setSearchParams(searchParams);
            }}
            onSelectLead={setSelectedLeadId}
          />
        )}
      </div>

      <AdaptiveSheet
        open={!!selectedLeadId}
        onClose={closeDrawer}
        title="Chi tiết Lead"
      >
        {selectedLeadId && (
          <LeadDetailDrawer leadId={selectedLeadId} onClose={closeDrawer} />
        )}
      </AdaptiveSheet>

      <CreateLeadModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={(id) => {
          setSelectedLeadId(id);
        }}
      />
    </div>
  );
}
