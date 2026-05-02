import type { OpsGrade } from '@/features/shipments/ops-ui/utils/gradeColor';

export interface EntityCardProps {
  id: string;
  grade: OpsGrade;
  title: string;
  subtitle?: string;
  isLocked?: boolean;
}
