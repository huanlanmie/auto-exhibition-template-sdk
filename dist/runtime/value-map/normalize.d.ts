import type { TemplateConfig, TemplateField } from '../../sdk/types';
export declare function isObjectRecord(value: unknown): value is Record<string, unknown>;
export declare function normalizeFields(fields: unknown): TemplateField[];
export declare function cloneValue<T>(value: T): T;
export declare function buildValueMapFromConfig(config: TemplateConfig | null): Record<string, unknown>;
