import type { Plugin } from 'vite';
import type { TemplateConfig } from '../sdk/types';
type TemplateSdkVitePluginOptions = {
    configJson: TemplateConfig;
    dtsPath?: string;
    artifactsDir?: string;
};
export declare function templateSdkVite(options: TemplateSdkVitePluginOptions): Plugin;
export type { TemplateSdkVitePluginOptions };
