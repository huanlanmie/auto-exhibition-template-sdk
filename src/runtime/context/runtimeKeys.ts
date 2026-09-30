import type { InjectionKey } from 'vue'
import type { TemplateRuntime } from '../../sdk/types'

export const TEMPLATE_RUNTIME_KEY: InjectionKey<TemplateRuntime> = Symbol('auto-exhibition-template-sdk-runtime')
