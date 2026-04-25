import { buildValueMapFromConfig } from '../value-map/normalize'
import { validateTemplateConfig } from './validation'
import type { TemplateBuildArtifacts } from '../../sdk/types'

// 这个方法暴露给外部构建脚本或测试用例时，仍然强制先校验再构建。
// 这样调用方拿到的 valueMap 一定来自 SDK 认可过的 configJson，而不是一份半合法中间态。
export function buildTemplateValueMap(configJson: unknown) {
  return buildValueMapFromConfig(validateTemplateConfig(configJson))
}

// 构建流程需要同时拿到“规范化后的 configJson”和“基于它生成的 valueMap”。
// 两者打包返回后，调用方无论是落盘还是注入运行时，都不会再自己拼第二套产物。
export function buildTemplateArtifacts(configJson: unknown): TemplateBuildArtifacts {
  const normalizedConfig = validateTemplateConfig(configJson)

  return {
    configJson: normalizedConfig,
    valueMap: buildValueMapFromConfig(normalizedConfig),
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