export * from './core/types';
export * from './core/registry';
export * from './renderers/png-renderer';
export { LabelEngine } from './core/engine';
export { computeLayout } from './core/layout-engine';
export { HtmlRenderer } from './renderers/html-renderer';

// Register all built-in templates
import { LabelRegistry } from './core/registry';
import { fabric80x40Template } from './templates/fabric-80x40';

LabelRegistry.register(fabric80x40Template);
