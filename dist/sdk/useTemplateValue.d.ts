import { type ComputedRef } from 'vue';
import type { TemplateValueAtPath, TemplateValuePath } from './types';
export declare function useTemplateValue<Path extends TemplateValuePath>(key: Path, defaultValue?: TemplateValueAtPath<Path>): ComputedRef<TemplateValueAtPath<Path>>;
export declare function useTemplateValue<T = unknown>(key: string, defaultValue?: T): ComputedRef<T | unknown>;
