import { ref } from 'vue'
import { getValueByPath, joinPath, normalizeRootPath } from '../value-map/path'
import { buildTemplateArtifacts } from '../schema/artifacts'
import type { TemplateConfig, TemplateContext, TemplateSdkOptions } from '../../sdk/types'

const CONFIG_JSON_URL = '/config.json'
const VALUE_MAP_URL = '/assets/template/valueMap.json'

async function fetchJsonFile(url: string) {
  const response = await fetch(url, { cache: 'no-cache' })

  if (!response.ok) {
    throw new Error(`加载 ${url} 失败：${response.status}`)
  }

  return response.json()
}

async function loadTemplateArtifactsFromPluginOutput() {
  const [configJson, valueMap] = await Promise.all([
    fetchJsonFile(CONFIG_JSON_URL),
    fetchJsonFile(VALUE_MAP_URL),
  ])

  return {
    configJson,
    valueMap,
  }
}

// SDK 安装时会立即创建一份全局模板上下文。
// 模板项目后续只通过 useTemplateValue 读取，不需要再自己维护 Provider 或中间状态。
export function createTemplateContext(options: TemplateSdkOptions = {}) {
  const config = ref<TemplateConfig | null>(null)
  const valueMap = ref<Record<string, unknown> | null>(null)

  function applyArtifacts(artifacts: { configJson: TemplateConfig; valueMap: Record<string, unknown> }) {
    config.value = artifacts.configJson
    valueMap.value = artifacts.valueMap
  }

  // 运行时优先支持旧式直接传入，方便 SDK 自测和非 Vite 场景；
  // 模板项目标准接入则由 Vite 插件在 dev/build 阶段提供固定 JSON 产物，运行时自动加载。
  if (options?.configJson !== undefined) {
    applyArtifacts(buildTemplateArtifacts(options.configJson))
  } else if (typeof window !== 'undefined' && typeof fetch === 'function') {
    loadTemplateArtifactsFromPluginOutput()
      .then((artifacts) => applyArtifacts(artifacts))
      .catch((error) => {
        console.error('[template-sdk] 自动加载模板配置失败', error)
      })
  }

  const context: TemplateContext = {
    config,
    valueMap,
    resolvePath(path, scopeBasePath = '') {
      const normalizedPath = String(path || '').trim()

      // 空 key 时直接回到当前作用域根路径，方便模板在局部上下文里读取整段对象。
      if (!normalizedPath) {
        return normalizeRootPath(scopeBasePath)
      }

      // 旧版 /title 这类写法已经废弃，继续接受只会让模板层长期保留双语义路径。
      if (normalizedPath.startsWith('/')) {
        throw new Error('template-sdk useTemplateValue key 不能以 / 开头，请改为 title、timeline[0].phase 这类点路径')
      }

      // 先把当前作用域和局部 key 拼接，再统一去掉残留前导斜杠，保证最终读取只走一套根路径规范。
      return normalizeRootPath(joinPath(scopeBasePath, normalizedPath))
    },
    resolveValue(path) {
      // 模板层看起来像是在读 configJson，实际上读的是 SDK 从 configJson 推导出的运行态快照 valueMap。
      // 这样读取成本低、结构稳定，也不会暴露源配置对象给模板层直接修改。
      return getValueByPath(valueMap.value, path)
    },
  }

  return { context }
}