const fs = require('fs');

const file = 'src/features/fabric-catalog/components/FabricReadinessScore.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);

content = content.replace(
  'Hoàn thiện: {passedCount}/{totalCount} tiêu chí',
  "{COMP_LABELS.READINESS_SCORE.replace('{passedCount}', passedCount.toString()).replace('{totalCount}', totalCount.toString())}"
);

fs.writeFileSync(file, content, 'utf8');
