import { buildValueMapFromConfig } from '../value-map/normalize'
import { validateTemplateConfig } from './validation'
import type {
  TemplateBuildArtifacts,
  TemplateConfig,
  TemplateFunctionDefinition,
  TemplateFunctionManifest,
  TemplateFunctionManifestItem,
  TemplateFunctionParam,
  TemplateSdkValueMapMeta,
} from '../../sdk/types'

const SDK_SCHEMA_VERSION = 1
const RESERVED_META_KEY = '__templateSdk'

function cloneJsonValue<T>(value: T): T {
  if (value === undefined) {
    return value
  }

  return JSON.parse(JSON.stringify(value)) as T
}

function normalizeFunctionDirection(value: TemplateFunctionDefinition['direction']): TemplateFunctionManifestItem['direction'] {
  return value === 'in' || value === 'out' || value === 'inout' ? value : 'inout'
}

function normalizeFunctionParam(param: TemplateFunctionParam): TemplateFunctionParam {
  return {
    name: String(param?.name || '').trim(),
    type: param?.type || 'any',
    label: param?.label !== undefined ? String(param.label) : undefined,
    required: Boolean(param?.required),
    defaultValue: cloneJsonValue(param?.defaultValue),
    description: param?.description !== undefined ? String(param.description) : undefined,
  }
}

function normalizeFunctionDefinition(name: string, definition: TemplateFunctionDefinition): TemplateFunctionManifestItem {
  const params = Array.isArray(definition?.params)
    ? definition.params.map((param) => normalizeFunctionParam(param))
    : []

  const transport = definition?.transport && typeof definition.transport === 'object'
    ? cloneJsonValue(definition.transport)
    : undefined

  const manifestItem: TemplateFunctionManifestItem = {
    name: String(name),
    label: definition?.label !== undefined ? String(definition.label) : undefined,
    description: definition?.description !== undefined ? String(definition.description) : undefined,
    direction: normalizeFunctionDirection(definition?.direction),
    params,
    returns: cloneJsonValue(definition?.returns),
    trigger: cloneJsonValue(definition?.trigger),
    transport,
    tags: Array.isArray(definition?.tags) ? definition.tags.map((tag) => String(tag)).filter(Boolean) : [],
  }

  return manifestItem
}

export function buildTemplateFunctionManifest(config: TemplateConfig | null | undefined): TemplateFunctionManifest {
  const result: TemplateFunctionManifest = {}
  const functions = (config?.functions && typeof config.functions === 'object'
    ? config.functions
    : {}) as Record<string, TemplateFunctionDefinition>

  Object.entries(functions).forEach(([name, definition]) => {
    result[name] = normalizeFunctionDefinition(name, definition)
  })

  return result
}

export function buildTemplateSdkMeta(config: TemplateConfig | null | undefined): TemplateSdkValueMapMeta {
  return {
    schemaVersion: SDK_SCHEMA_VERSION,
    functions: buildTemplateFunctionManifest(config),
  }
}

// 这个方法暴露给外部构建脚本或测试用例时，仍然强制先校验再构建。
// 这样调用方拿到的 valueMap 一定来自 SDK 认可过的 configJson，而不是一份半合法中间态。
export function buildTemplateValueMap(configJson: unknown) {
  const normalizedConfig = validateTemplateConfig(configJson)
  return {
    ...buildValueMapFromConfig(normalizedConfig),
    [RESERVED_META_KEY]: buildTemplateSdkMeta(normalizedConfig),
  }
}

// 构建流程需要同时拿到“规范化后的 configJson”和“基于它生成的 valueMap”。
// 两者打包返回后，调用方无论是落盘还是注入运行时，都不会再自己拼第二套产物。
export function buildTemplateArtifacts(configJson: unknown): TemplateBuildArtifacts {
  const normalizedConfig = validateTemplateConfig(configJson)
  const functionManifest = buildTemplateFunctionManifest(normalizedConfig)

  return {
    configJson: normalizedConfig,
    valueMap: {
      ...buildValueMapFromConfig(normalizedConfig),
      [RESERVED_META_KEY]: {
        schemaVersion: SDK_SCHEMA_VERSION,
        functions: functionManifest,
      },
    },
    functionManifest,
  }
}

// SDK 本身不直接写文件，只提供可直接写盘的 JSON 字符串。
// 这样前端项目、Node 脚本或平台构建器都能复用这一层，而不把文件系统能力绑死在 SDK 内部。
export function buildTemplateJsonFiles(configJson: unknown, space = 2) {
  const artifacts = buildTemplateArtifacts(configJson)

  return {
    configJson: JSON.stringify(artifacts.configJson, null, space),
    valueMap: JSON.stringify(artifacts.valueMap, null, space),
  }
}
