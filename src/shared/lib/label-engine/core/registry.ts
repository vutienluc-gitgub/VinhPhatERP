import { LabelTemplate } from './types';

class Registry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private templates = new Map<string, LabelTemplate<any>>();

  register<T>(template: LabelTemplate<T>) {
    this.templates.set(template.id, template);
  }

  get<T = unknown>(id: string): LabelTemplate<T> {
    const tpl = this.templates.get(id);
    if (!tpl) throw new Error(`Label template '${id}' not found`);
    return tpl as LabelTemplate<T>;
  }
}

export const LabelRegistry = new Registry();
