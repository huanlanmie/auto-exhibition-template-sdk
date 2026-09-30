import { hasInjectionContext, inject } from 'vue'
import { getDefaultTemplateRuntime } from '../runtime/runtimeRegistry'
import { TEMPLATE_RUNTIME_KEY } from '../runtime/context/runtimeKeys'
import type {
  TemplateBridge,
  TemplateEventHandler,
  TemplateEventTarget,
  TemplateFunctionDefinition,
  TemplateFunctionHandler,
  TemplateFunctionInvokeOptions,
  TemplateFunctionInvokeTarget,
} from './types'

export function useTemplateBridge(): TemplateBridge {
  const runtime = hasInjectionContext() ? inject(TEMPLATE_RUNTIME_KEY, null) : null
  return (runtime ?? getDefaultTemplateRuntime()).bridge
}

export function registerTemplateFunction(
  name: string,
  handler: TemplateFunctionHandler,
  definition?: TemplateFunctionDefinition,
) {
  return useTemplateBridge().registerTemplateFunction(name, handler, definition)
}

export function unregisterTemplateFunction(name: string) {
  return useTemplateBridge().unregisterTemplateFunction(name)
}

export function invokeTemplateFunction(
  target: TemplateFunctionInvokeTarget,
  functionName: string,
  args?: unknown,
  options?: TemplateFunctionInvokeOptions,
) {
  return useTemplateBridge().invokeTemplateFunction(target, functionName, args, options)
}

export function emitTemplateEvent(
  channel: string,
  payload?: unknown,
  target?: TemplateEventTarget,
) {
  return useTemplateBridge().emitTemplateEvent(channel, payload, target)
}

export function onTemplateEvent(channel: string, handler: TemplateEventHandler) {
  return useTemplateBridge().onTemplateEvent(channel, handler)
}
