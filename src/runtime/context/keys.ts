import type { InjectionKey } from 'vue'
import type { TemplateContext } from '../../sdk/types'

// 注入 key 集中放在这里，避免 Provider、组合函数和潜在公共组件各自声明导致上下文断裂。
export const TEMPLATE_CONTEXT_KEY: InjectionKey<TemplateContext> = Symbol('template-sdk-context')