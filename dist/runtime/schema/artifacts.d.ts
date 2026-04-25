import type { TemplateBuildArtifacts } from '../../sdk/types';
export declare function buildTemplateValueMap(configJson: unknown): Record<string, unknown>;
export declare function buildTemplateArtifacts(configJson: unknown): TemplateBuildArtifacts;
export declare function buildTemplateJsonFiles(configJson: unknown, space?: number): {
    configJson: string;
    valueMap: string;
};
