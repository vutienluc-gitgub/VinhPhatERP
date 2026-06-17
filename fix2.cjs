const fs = require('fs');

function replaceFile(path, replacements) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  replacements.forEach(([search, replace]) => {
    content = content.split(search).join(replace);
  });
  fs.writeFileSync(path, content, 'utf8');
}

// ActivityTimeline.tsx
replaceFile('src/features/crm/components/ActivityTimeline.tsx', [
  ["import { format } from 'date-fns';\nimport { vi } from 'date-fns/locale';", "import dayjs from 'dayjs';"],
  ["import { ACTIVITY_TYPE_MAP } from '../crm.constants';", "import { ACTIVITY_TYPE_MAP } from '@/features/crm/crm.constants';"],
  ["const meta = ACTIVITY_TYPE_MAP[activity.type] || ACTIVITY_TYPE_MAP.SYSTEM;", "const meta = ACTIVITY_TYPE_MAP[activity.type] || ACTIVITY_TYPE_MAP.SYSTEM;\n              if (!meta) return null;"],
  ["format(new Date(activity.created_at), 'HH:mm dd/MM', { locale: vi })", "dayjs(activity.created_at).format('HH:mm DD/MM')"]
]);

// LeadCard.tsx
replaceFile('src/features/crm/components/LeadCard.tsx', [
  ["import { formatDistanceToNow } from 'date-fns';\nimport { vi } from 'date-fns/locale';", "import dayjs from 'dayjs';\nimport relativeTime from 'dayjs/plugin/relativeTime';\nimport 'dayjs/locale/vi';\n\ndayjs.extend(relativeTime);\ndayjs.locale('vi');"],
  ["import { Badge } from '@/shared/components/Badge';\n", ""],
  ["import { LEAD_TYPE_MAP } from '../crm.constants';", "import { LEAD_TYPE_MAP } from '@/features/crm/crm.constants';"],
  ["const timeAgo = formatDistanceToNow(new Date(lead.created_at), {\n    addSuffix: true,\n    locale: vi,\n  });", "const timeAgo = dayjs().to(dayjs(lead.created_at));"]
]);

// LeadDetailDrawer.tsx
replaceFile('src/features/crm/components/LeadDetailDrawer.tsx', [
  ["import { LEAD_STATUS_MAP, LEAD_TYPE_MAP } from '../crm.constants';", "import { LEAD_STATUS_MAP, LEAD_TYPE_MAP } from '@/features/crm/crm.constants';"],
  ["export function LeadDetailDrawer({ leadId, onClose }: LeadDetailDrawerProps) {", "export function LeadDetailDrawer({ leadId }: LeadDetailDrawerProps) {"],
  ["{lead.sample_detail.selected_variants.map((v: any, i: number) => (", "{lead.sample_detail.selected_variants.map((v: { color_name: string }, i: number) => ("],
  ['<Button variant="primary" icon={<Icon name="ArrowRight" size={16} />}>', '<Button variant="primary" rightIcon="ArrowRight">'],
  ['<Badge key={i} variant="outline">', '<Badge key={i} variant="gray">']
]);

// LeadsKanban.tsx
replaceFile('src/features/crm/components/LeadsKanban.tsx', [
  ["\n  DragOverlay,", ""],
  ["\nimport type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';", "\nimport type { DragEndEvent } from '@dnd-kit/core';"],
  ["import { LEAD_STATUS_MAP } from '../crm.constants';", "import { LEAD_STATUS_MAP } from '@/features/crm/crm.constants';"],
  ["const meta = LEAD_STATUS_MAP[status];", "const meta = LEAD_STATUS_MAP[status];\n  if (!meta) return null;"]
]);

// LeadsList.tsx
replaceFile('src/features/crm/components/LeadsList.tsx', [
  ["import { format } from 'date-fns';\nimport { vi } from 'date-fns/locale';", "import dayjs from 'dayjs';"],
  ["import { LEAD_STATUS_MAP, LEAD_TYPE_MAP } from '../crm.constants';", "import { LEAD_STATUS_MAP, LEAD_TYPE_MAP } from '@/features/crm/crm.constants';"],
  ["format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })", "dayjs(item.created_at).format('DD/MM/YYYY HH:mm')"]
]);

// LeadsPage.tsx
replaceFile('src/features/crm/pages/LeadsPage.tsx', [
  ["import { useDebounce } from '@/shared/hooks/useDebounce';", "import { useDebouncedValue } from '@/shared/components/filter-bar';"],
  ["import { LeadsList } from '../components/LeadsList';", "import { LeadsList } from '@/features/crm/components/LeadsList';"],
  ["import { LeadsKanban } from '../components/LeadsKanban';", "import { LeadsKanban } from '@/features/crm/components/LeadsKanban';"],
  ["import { LeadDetailDrawer } from '../components/LeadDetailDrawer';", "import { LeadDetailDrawer } from '@/features/crm/components/LeadDetailDrawer';"],
  ["import { LEAD_STATUS_MAP } from '../crm.constants';", "import { LEAD_STATUS_MAP } from '@/features/crm/crm.constants';"],
  ["const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');", "const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');"],
  ["const debouncedSearch = useDebounce(searchQuery, 400);", "const debouncedSearch = useDebouncedValue(searchQuery, 400);"],
  ["onChange={(v) => setViewMode(v as 'list' | 'kanban')}", "onChange={(v) => setViewMode(v as 'table' | 'grid')}"],
  ["value: 'kanban'", "value: 'grid'"],
  ["value: 'list'", "value: 'table'"],
  ['<Button variant="primary" icon={<Icon name="Plus" size={16} />}>', '<Button variant="primary" leftIcon="Plus">'],
  ["viewMode === 'list'", "viewMode === 'table'"],
  ["viewMode === 'kanban'", "viewMode === 'grid'"],
  ['<AdaptiveSheet\n        open={!!selectedLeadId}\n        onClose={closeDrawer}\n        title="Chi tiết Lead"\n        size="large"\n      >', '<AdaptiveSheet\n        open={!!selectedLeadId}\n        onClose={closeDrawer}\n        title="Chi tiết Lead"\n      >'],
  ['<LeadDetailDrawer leadId={selectedLeadId} onClose={closeDrawer} />', '<LeadDetailDrawer leadId={selectedLeadId} onClose={closeDrawer} />']
]);

console.log('Fixes applied successfully!');
