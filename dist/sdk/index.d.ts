import type { Plugin } from 'vue';
import { buildTemplateArtifacts, buildTemplateJsonFiles, buildTemplateValueMap } from '../runtime/schema/artifacts';
import { validateTemplateConfig } from '../runtime/schema/validation';
import { useTemplateValue } from './useTemplateValue';
export { useTemplateValue };
export { buildTemplateArtifacts, buildTemplateJsonFiles, buildTemplateValueMap, validateTemplateConfig, };
export type { TemplateArrayOperation, TemplateArrayField, TemplateBuildArtifacts, TemplateConfig, TemplateContext, InferTemplateValueMap, RegisteredTemplateValueMap, TemplateField, TemplateFieldSchema, TemplateFieldType, TemplateImageField, TemplateMediaObject, TemplateMediaValue, TemplateNumberField, TemplateSdkOptions, TemplateStringField, TemplateValidationIssue, TemplateValueAtPath, TemplateValueMapRegistry, TemplateValuePath, TemplateVideoField, ValidateTemplateConfigKeys, } from './types';
declare const TemplateSdk: Plugin;
export default TemplateSdk;
