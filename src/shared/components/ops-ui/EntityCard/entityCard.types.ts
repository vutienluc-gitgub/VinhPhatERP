import type { OpsGrade } from '@/shared/components/ops-ui/utils/gradeColor';

export interface EntityCardProps {
  id: string;
  grade: OpsGrade;
  title: string;
  subtitle?: string;
  isLocked?: boolean;
}
