import { useState, useMemo } from 'react';

import type { Employee } from '@/schema';
import {
  Icon,
  Badge,
  DataTable,
  AddButton,
  Button,
  ActionBar,
  FilterBar,
  KpiCard,
  KpiGrid,
  type FilterFieldConfig,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  useEmployees,
  useDeactivateEmployee,
  useCompanyRoles,
} from '@/application/crm';

import { EmployeeForm } from './EmployeeForm';
import { RoleManagementModal } from './RoleManagementModal';
import { EMPLOYEE_LABELS, EMPLOYEE_MESSAGES } from './employees.constants';

const STATUS_LABELS: Record<string, string> = {
  active: EMPLOYEE_LABELS.STATUS_ACTIVE,
  inactive: EMPLOYEE_LABELS.STATUS_INACTIVE,
};

export function EmployeeListPage() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    query: '',
    role: '',
  });

  const {
    data: employees,
    isLoading,
    isError,
  } = useEmployees({
    role: filterValues.role || undefined,
    query: filterValues.query || undefined,
  });

  const { data: rolesData } = useCompanyRoles();
  const roleOptions = useMemo(
    () => rolesData?.map((r) => ({ value: r.code, label: r.name })) || [],
    [rolesData],
  );

  const roleLabels = useMemo(
    () => Object.fromEntries(rolesData?.map((r) => [r.code, r.name]) || []),
    [rolesData],
  );

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'query',
      type: 'search',
      label: EMPLOYEE_LABELS.FILTER_SEARCH,
      placeholder: EMPLOYEE_LABELS.FILTER_SEARCH_PLACEHOLDER,
    },
    {
      key: 'role',
      type: 'combobox',
      label: EMPLOYEE_LABELS.FILTER_ROLE,
      options: roleOptions,
    },
  ];

  const kpiStats = useMemo(() => {
    if (!employees) return { total: 0, active: 0, sales: 0, driver: 0 };

    let active = 0;
    let sales = 0;
    let driver = 0;

    for (const emp of employees) {
      if (emp.status === 'active') active++;
      if (emp.role === 'sales') sales++;
      if (emp.role === 'driver') driver++;
    }

    return {
      total: employees.length,
      active,
      sales,
      driver,
    };
  }, [employees]);

  function handleFilterChange(key: string, value: string | undefined) {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value ?? '',
    }));
  }

  const deactivateMutation = useDeactivateEmployee();
  const { confirm } = useConfirm();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  function handleCreate() {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  }

  function handleEdit(employee: Employee) {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  }

  async function handleDeactivate(employee: Employee) {
    const ok = await confirm({
      title: EMPLOYEE_LABELS.DEACTIVATE_TITLE,
      message: EMPLOYEE_LABELS.DEACTIVATE_MESSAGE(employee.name),
      confirmLabel: EMPLOYEE_LABELS.BTN_DEACTIVATE,
      cancelLabel: EMPLOYEE_LABELS.BTN_CANCEL,
      variant: 'danger',
    });
    if (ok) deactivateMutation.mutate(employee.id);
  }

  if (isError) {
    return (
      <div className="panel-card">
        <p className="error-inline">{EMPLOYEE_MESSAGES.LOAD_ERROR}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="panel-card card-flush">
        {/* Header Area */}
        <div className="card-header-area flex items-center justify-between">
          <div className="flex gap-2">
            <AddButton
              onClick={handleCreate}
              label={EMPLOYEE_LABELS.BTN_CREATE}
            />
            <Button
              variant="secondary"
              onClick={() => setIsRoleModalOpen(true)}
            >
              <Icon name="Settings" size={16} className="mr-2" />{' '}
              {EMPLOYEE_LABELS.BTN_MANAGE_ROLE}
            </Button>
          </div>
        </div>

        {/* KPI Dashboard area */}
        <KpiGrid className="kpi-section">
          <KpiCard
            label={EMPLOYEE_LABELS.KPI_TOTAL}
            value={kpiStats.total}
            icon="Users"
            variant="primary"
            footer={EMPLOYEE_LABELS.KPI_TOTAL_SUB}
          />
          <KpiCard
            label={EMPLOYEE_LABELS.KPI_ACTIVE}
            value={kpiStats.active}
            icon="Activity"
            variant="success"
            footer={EMPLOYEE_LABELS.KPI_ACTIVE_SUB}
          />
          <KpiCard
            label={EMPLOYEE_LABELS.KPI_SALES}
            value={kpiStats.sales}
            icon="Briefcase"
            variant="warning"
            footer={EMPLOYEE_LABELS.KPI_SALES_SUB}
          />
          <KpiCard
            label={EMPLOYEE_LABELS.KPI_DRIVER}
            value={kpiStats.driver}
            icon="Truck"
            variant="info"
            footer={EMPLOYEE_LABELS.KPI_DRIVER_SUB}
          />
        </KpiGrid>

        {/* Filter Area (Config-Driven) */}
        <FilterBar
          schema={filterSchema}
          value={filterValues}
          onChange={handleFilterChange}
          onClear={() =>
            setFilterValues({
              query: '',
              role: '',
            })
          }
        />

        {/* 📑 Data Table / Cards */}
        <DataTable
          data={employees ?? []}
          isLoading={isLoading}
          rowKey={(e) => e.id}
          onRowClick={handleEdit}
          emptyStateTitle={
            filterValues.query || filterValues.role
              ? EMPLOYEE_LABELS.EMPTY_SEARCH_TITLE
              : EMPLOYEE_LABELS.EMPTY_DATA_TITLE
          }
          emptyStateDescription={
            filterValues.query || filterValues.role
              ? EMPLOYEE_LABELS.EMPTY_SEARCH_DESC
              : EMPLOYEE_LABELS.EMPTY_DATA_DESC
          }
          emptyStateIcon={
            filterValues.query || filterValues.role ? 'Search' : 'Users'
          }
          emptyStateActionLabel={
            !(filterValues.query || filterValues.role)
              ? EMPLOYEE_LABELS.EMPTY_ACTION
              : undefined
          }
          onEmptyStateAction={
            !(filterValues.query || filterValues.role)
              ? handleCreate
              : undefined
          }
          columns={[
            {
              header: EMPLOYEE_LABELS.TABLE_CODE,
              id: 'code',
              sortable: true,
              cell: (emp) => (
                <span className="font-bold text-primary">{emp.code}</span>
              ),
            },
            {
              header: EMPLOYEE_LABELS.TABLE_NAME,
              id: 'name',
              sortable: true,
              cell: (emp) => <span className="font-bold">{emp.name}</span>,
            },
            {
              header: EMPLOYEE_LABELS.TABLE_PHONE,
              id: 'phone',
              sortable: true,
              className: 'text-sm font-medium',
              cell: (emp) => emp.phone || '—',
            },
            {
              header: EMPLOYEE_LABELS.TABLE_ROLE,
              id: 'role',
              sortable: true,
              cell: (emp) => (
                <span className="badge-outline">
                  {roleLabels[emp.role] ?? emp.role}
                </span>
              ),
            },
            {
              header: EMPLOYEE_LABELS.TABLE_STATUS,
              id: 'status',
              sortable: true,
              cell: (emp) => (
                <Badge variant={emp.status === 'active' ? 'success' : 'gray'}>
                  {STATUS_LABELS[emp.status] ?? emp.status}
                </Badge>
              ),
            },
            {
              header: EMPLOYEE_LABELS.TABLE_ACTIONS,
              className: 'text-right',
              onCellClick: () => {},
              cell: (emp) => (
                <ActionBar
                  actions={
                    [
                      {
                        icon: 'Pencil',
                        onClick: () => handleEdit(emp),
                        title: EMPLOYEE_LABELS.BTN_EDIT,
                      },
                      emp.status === 'active'
                        ? {
                            icon: 'UserX',
                            onClick: () => void handleDeactivate(emp),
                            title: EMPLOYEE_LABELS.BTN_DEACTIVATE,
                            variant: 'danger',
                            disabled: deactivateMutation.isPending,
                          }
                        : null,
                    ].filter(Boolean) as ActionConfig[]
                  }
                />
              ),
            },
          ]}
          renderMobileCard={(emp) => (
            <div className="mobile-card">
              <div className="mobile-card-header">
                <span className="mobile-card-title">{emp.code}</span>
                <Badge variant={emp.status === 'active' ? 'success' : 'gray'}>
                  {STATUS_LABELS[emp.status] ?? emp.status}
                </Badge>
              </div>
              <div className="mobile-card-body">
                <p className="font-bold text-lg">{emp.name}</p>
                <div className="mobile-card-row">
                  <span className="label">
                    {EMPLOYEE_LABELS.TABLE_MOBILE_CONTACT}
                  </span>
                  <span className="value">{emp.phone || '—'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/10">
                  <span className="text-[10px] uppercase font-bold text-muted bg-surface-subtle px-1.5 py-0.5 rounded">
                    {roleLabels[emp.role] ?? emp.role}
                  </span>
                </div>
              </div>
            </div>
          )}
        />

        <EmployeeForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          employee={selectedEmployee}
        />
        <RoleManagementModal
          open={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
        />
      </div>
    </div>
  );
}
