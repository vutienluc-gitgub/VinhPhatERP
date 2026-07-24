export * from './core/types';
export * from './core/registry';
export * from './renderers/png-renderer';

// Register all built-in templates
import { LabelRegistry } from './core/registry';
import { fabric80x40Template } from './templates/fabric-80x40/config';

LabelRegistry.register(fabric80x40Template);
