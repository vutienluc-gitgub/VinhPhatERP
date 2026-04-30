import type {
  GuideContext,
  PlaybookSection,
} from '@/features/guide-system/types';
import { PLAYBOOK_REGISTRY } from '@/features/guide-system/content/playbook-data';

export function resolveGuides(context: GuideContext): PlaybookSection[] {
  return PLAYBOOK_REGISTRY.filter((section) => {
    // 1. Match module (nếu có context module)
    const matchModule =
      !context.module || section.modules.includes(context.module);

    // 2. Match role (nếu có role và section có giới hạn role)
    const matchRole =
      !context.role ||
      !section.roles ||
      section.roles.length === 0 ||
      section.roles.includes(context.role);

    // 3. (Future) Match state
    // if (context.state && section.targetState !== context.state) return false;

    // 4. (Future) Match error
    // if (context.error && section.targetError !== context.error) return false;

    return matchModule && matchRole;
  });
}
