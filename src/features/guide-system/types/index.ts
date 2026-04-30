export type GuideActionType = 'navigate' | 'mutation' | 'external';

export interface GuideAction {
  type: GuideActionType;
  payload: string; // path or API endpoint
  label: string;
}

export interface GuideStep {
  id: string;
  title: string;
  content: string; // Markdown content
  actions?: GuideAction[];
  nextSteps?: string[]; // IDs of next steps
}

export interface PlaybookSection {
  id: string;
  title: string;
  roles: string[];
  modules: string[];
  steps: GuideStep[];
  relatedWorkflows?: string[];
}

export interface GuideContext {
  role?: string | null;
  module?: string | null;
  entityId?: string | null;
  state?: string | null;
}
