import type { Plugin } from 'vite';
import type { TemplateConfig } from '../sdk/types';
type TemplateSdkPluginOptions = {
    configJson: TemplateConfig;
    dtsPath?: string;
    valueMapDir?: string;
};
export declare function templateSdkPlugin(options: TemplateSdkPluginOptions): Plugin;
export type { TemplateSdkPluginOptions };
