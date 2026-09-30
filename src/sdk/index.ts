import type { App, Plugin } from 'vue'
import {
  buildTemplateArtifacts,
  buildTemplateJsonFiles,
  buildTemplateFunctionManifest,
  buildTemplateSdkMeta,
  buildTemplateValueMap,
} from '../runtime/schema/artifacts'
import { validateTemplateConfig } from '../runtime/schema/validation'
import { getDefaultTemplateRuntime } from '../runtime/runtimeRegistry'
import { TEMPLATE_RUNTIME_KEY } from '../runtime/context/runtimeKeys'
import { TEMPLATE_CONTEXT_KEY } from '../runtime/context/keys'
import { useTemplateValue } from './useTemplateValue'
import {
  emitTemplateEvent,
  invokeTemplateFunction,
  onTemplateEvent,
  registerTemplateFunction,
  unregisterTemplateFunction,
  useTemplateBridge,
} from './useTemplateBridge'
import type { TemplateSdkOptions } from './types'

// SDK 的公开面保持很薄：
// 1. 模板项目运行时只需要安装插件并调用 useTemplateValue；
// 2. 构建链路如果需要导出 JSON 文件，则直接复用同一套校验和构建函数。
// 这样可以保证“运行时读取的结构”和“构建时产出的结构”永远来自同一份实现。
export { useTemplateValue }
export { createTemplateRuntime } from '../runtime/createTemplateRuntime'
export { getDefaultTemplateRuntime, setDefaultTemplateRuntime } from '../runtime/runtimeRegistry'
export { BrowserHostTransport, validateBrowserHostConfig, matchesBrowserHostIdentity } from '../runtime/communication/browserHostTransport'
export { TEMPLATE_RUNTIME_KEY } from '../runtime/context/runtimeKeys'
export type { TemplateBridgeMessage, TemplateTransport } from '../runtime/communication/transport'
export {
  emitTemplateEvent,
  invokeTemplateFunction,
  onTemplateEvent,
  registerTemplateFunction,
  unregisterTemplateFunction,
  useTemplateBridge,
}
export {
  buildTemplateArtifacts,
  buildTemplateJsonFiles,
  buildTemplateFunctionManifest,
  buildTemplateSdkMeta,
  buildTemplateValueMap,
  validateTemplateConfig,
}
export type {
  BrowserHostConfig,
  BrowserHostIdentity,
  BrowserHostEnvelope,
  TemplateRuntime,
  TemplateRuntimeOptions,
  TemplateRuntimeStorage,
  TemplateArrayOperation,
  TemplateArrayField,
  TemplateBuildArtifacts,
  TemplateConfig,
  TemplateContext,
  TemplateBridge,
  TemplateEventHandler,
  TemplateEventTarget,
  InferTemplateValueMap,
  RegisteredTemplateValueMap,
  TemplateField,
  TemplateFieldSchema,
  TemplateFieldType,
  TemplateFileAcceptKind,
  TemplateFileAcceptToken,
  TemplateFileField,
  TemplateImageField,
  TemplateMediaObject,
  TemplateMediaValue,
  TemplateFunctionDefinition,
  TemplateFunctionDirection,
  TemplateFunctionHandler,
  TemplateFunctionInvokeContext,
  TemplateFunctionInvokeOptions,
  TemplateFunctionInvokeTarget,
  TemplateFunctionManifest,
  TemplateFunctionManifestItem,
  TemplateFunctionMap,
  TemplateFunctionParam,
  TemplateFunctionParamType,
  TemplateFunctionRegistration,
  TemplateFunctionResult,
  TemplateFunctionQos,
  TemplateFunctionTransport,
  TemplateNumberField,
  TemplateObjectField,
  TemplateSdkOptions,
  TemplateSdkValueMapMeta,
  TemplateStringField,
  TemplateValidationIssue,
  TemplateValueAtPath,
  TemplateValueMapRegistry,
  TemplateValuePath,
  TemplateVideoField,
  ValidateTemplateConfigKeys,
} from './types'

const TemplateSdk: Plugin = {
  install(app: App, options: TemplateSdkOptions = {}) {
    // 标准模板项目不再在 main.js 传 configJson；
    // configJson 由 templateSdkPlugin 在 dev/build 阶段提供为固定 JSON 产物，运行时自动加载。
    // options 仅保留给 SDK 自测和非 Vite 场景，避免把运行时安装和构建配置再次绑在一起。
    const runtime = options.runtime ?? getDefaultTemplateRuntime({ configJson: options.configJson })
    if (runtime.disposed) throw new Error('Cannot install a disposed template runtime')
    if (options.runtime && options.configJson !== undefined) runtime.context.setConfigJson(options.configJson)
    app.provide(TEMPLATE_RUNTIME_KEY, runtime)
    app.provide(TEMPLATE_CONTEXT_KEY, runtime.context)
  },
}

export default TemplateSdk
