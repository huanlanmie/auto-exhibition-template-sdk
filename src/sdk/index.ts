import type { App, Plugin } from 'vue'
import {
  buildTemplateArtifacts,
  buildTemplateJsonFiles,
  buildTemplateValueMap,
} from '../runtime/schema/artifacts'
import { validateTemplateConfig } from '../runtime/schema/validation'
import { createTemplateContext } from '../runtime/context/createTemplateContext'
import { TEMPLATE_CONTEXT_KEY } from '../runtime/context/keys'
import { useTemplateValue } from './useTemplateValue'
import type { TemplateSdkOptions } from './types'

// SDK 的公开面保持很薄：
// 1. 模板项目运行时只需要安装插件并调用 useTemplateValue；
// 2. 构建链路如果需要导出 JSON 文件，则直接复用同一套校验和构建函数。
// 这样可以保证“运行时读取的结构”和“构建时产出的结构”永远来自同一份实现。
export { useTemplateValue }
export {
  buildTemplateArtifacts,
  buildTemplateJsonFiles,
  buildTemplateValueMap,
  validateTemplateConfig,
}
export type {
  TemplateArrayOperation,
  TemplateArrayField,
  TemplateBuildArtifacts,
  TemplateConfig,
  TemplateContext,
  InferTemplateValueMap,
  RegisteredTemplateValueMap,
  TemplateField,
  TemplateFieldSchema,
  TemplateFieldType,
  TemplateImageField,
  TemplateMediaObject,
  TemplateMediaValue,
  TemplateNumberField,
  TemplateSdkOptions,
  TemplateStringField,
  TemplateValidationIssue,
  TemplateValueAtPath,
  TemplateValueMapRegistry,
  TemplateValuePath,
  TemplateVideoField,
  ValidateTemplateConfigKeys,
} from './types'

const TemplateSdk: Plugin = {
  install(app: App, options: TemplateSdkOptions) {
    // SDK 只接收 configJson。
    // 模板作者维护的源数据边界被固定在这一份对象上，
    // 运行时 valueMap 则由 SDK 在内部统一推导，避免调用方手工拼装第二份结构。
    const { context } = createTemplateContext({ ...options })

    app.provide(TEMPLATE_CONTEXT_KEY, context)
  },
}

export default TemplateSdk