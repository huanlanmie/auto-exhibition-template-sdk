import { inject } from 'vue'
import { TEMPLATE_CONTEXT_KEY } from './keys'

// 所有 SDK 取值能力都必须建立在已安装 TemplateSdk 的应用上下文里。
// 这里集中做一次注入校验，避免每个组合函数都各自拼报错文案。
export function useTemplateContext() {
  const context = inject(TEMPLATE_CONTEXT_KEY, null)

  if (!context) {
    throw new Error('useTemplateValue requires TemplateSdk to be installed before use')
  }

  return context
}