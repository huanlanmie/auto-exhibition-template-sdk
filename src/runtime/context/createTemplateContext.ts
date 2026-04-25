import { ref } from 'vue'
import { getValueByPath, joinPath, normalizeRootPath } from '../value-map/path'
import { buildTemplateArtifacts } from '../schema/artifacts'
import type { TemplateConfig, TemplateContext, TemplateSdkOptions } from '../../sdk/types'

// SDK 安装时会立即创建一份全局模板上下文。
// 模板项目后续只通过 useTemplateValue 读取，不需要再自己维护 Provider 或中间状态。
export function createTemplateContext(options: TemplateSdkOptions) {
  // 这里先把 configJson 校验并转换成 valueMap，
  // 后面的读取链路就只剩“路径解析 + 查值”，不会把重逻辑分散到每次渲染里。
  const artifacts = buildTemplateArtifacts(options?.configJson)

  const config = ref<TemplateConfig | null>(artifacts.configJson)
  const valueMap = ref<Record<string, unknown> | null>(artifacts.valueMap)

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