import { computed, type ComputedRef } from 'vue'
import { useTemplateContext } from '../runtime/context/useTemplateContext'
import type { TemplateValueAtPath, TemplateValuePath } from './types'

// SDK 对模板层只暴露这一种取值方式：传入点路径和可选默认值，返回可直接在模板里消费的响应式结果。
export function useTemplateValue<Path extends TemplateValuePath>(
  key: Path,
  defaultValue?: TemplateValueAtPath<Path>,
): ComputedRef<TemplateValueAtPath<Path>>
export function useTemplateValue<T = unknown>(key: string, defaultValue?: T): ComputedRef<T | unknown>
export function useTemplateValue<T = unknown>(key: string, defaultValue?: T): ComputedRef<unknown> {
  const context = useTemplateContext()

  return computed(() => {
    // 路径统一交给上下文解析，模板层只维护 title、timeline[0].phase 这一套写法。
    const resolvedPath = context.resolvePath(String(key || ''))

    // 真正读取时只面向 SDK 内部 valueMap，避免模板直接依赖 configJson 的原始结构细节。
    const nextValue = context.resolveValue(resolvedPath)

    // 只有 valueMap 里完全没命中时才回退默认值；
    // 如果命中了空字符串、false、0 这类合法值，就原样返回，不做误判。
    return nextValue === undefined ? defaultValue : nextValue
  })
}