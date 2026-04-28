import { type ComputedRef } from 'vue';
import type { TemplateValueAtPath, TemplateValuePath } from './types';
export declare function useTemplateValue<Path extends TemplateValuePath>(key: Path, fallbackValue?: TemplateValueAtPath<Path>): ComputedRef<TemplateValueAtPath<Path>>;
export declare function useTemplateValue<T = unknown>(key: string, fallbackValue?: T): ComputedRef<T | unknown>;
