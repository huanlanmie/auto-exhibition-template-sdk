import type { TemplateRuntime, TemplateRuntimeOptions } from '../sdk/types'
import { createTemplateRuntime } from './createTemplateRuntime'
import { matchesBrowserHostConfig, validateBrowserHostConfig } from './communication/browserHostTransport'

let defaultRuntime: TemplateRuntime | null = null

export function getDefaultTemplateRuntime(options: TemplateRuntimeOptions = {}): TemplateRuntime {
  if (!defaultRuntime) {
    const injected = typeof window !== 'undefined'
      && Object.prototype.hasOwnProperty.call(window, '__AUTO_EXHIBITION_TEMPLATE_RUNTIME__')
    if (injected) {
      const host = validateBrowserHostConfig(window.__AUTO_EXHIBITION_TEMPLATE_RUNTIME__)
      if (options.browserHost !== undefined && !matchesBrowserHostConfig(validateBrowserHostConfig(options.browserHost), host)) {
        throw new Error('Explicit browser host must match the injected browser host configuration')
      }
      defaultRuntime = createTemplateRuntime({ ...options, mode: 'browser', browserHost: host })
    } else {
      defaultRuntime = createTemplateRuntime(options)
    }
  } else {
    if (typeof window !== 'undefined' && Object.prototype.hasOwnProperty.call(window, '__AUTO_EXHIBITION_TEMPLATE_RUNTIME__')) {
      const injected = validateBrowserHostConfig(window.__AUTO_EXHIBITION_TEMPLATE_RUNTIME__)
      if (defaultRuntime.mode !== 'browser' || !matchesBrowserHostConfig(defaultRuntime.browserHost, injected)) {
        throw new Error('Template runtime was already initialized; its injected browser host cannot change')
      }
    }
    if (options.mode !== undefined && options.mode !== defaultRuntime.mode) {
      throw new Error('Template runtime was already initialized; its mode cannot change')
    }
    if (options.browserHost !== undefined) {
      const host = validateBrowserHostConfig(options.browserHost)
      if (defaultRuntime.mode !== 'browser' || !matchesBrowserHostConfig(defaultRuntime.browserHost, host)) {
        throw new Error('Template runtime was already initialized; its browser host cannot change')
      }
    }
    if (options.transport !== undefined || options.handshakeTimeoutMs !== undefined) {
      throw new Error('Template runtime was already initialized; its transport options cannot change')
    }
    if (options.configJson !== undefined) defaultRuntime.context.setConfigJson(options.configJson)
    const snapshot = options.initialValueMap ?? options.valueMap
    if (snapshot !== undefined) defaultRuntime.context.setValueMap(snapshot)
  }
  return defaultRuntime
}

export function setDefaultTemplateRuntime(runtime: TemplateRuntime): void {
  if (runtime.disposed) throw new Error('Cannot bind a disposed template runtime')
  if (typeof window !== 'undefined' && Object.prototype.hasOwnProperty.call(window, '__AUTO_EXHIBITION_TEMPLATE_RUNTIME__')) {
    const injected = validateBrowserHostConfig(window.__AUTO_EXHIBITION_TEMPLATE_RUNTIME__)
    if (runtime.mode !== 'browser' || !matchesBrowserHostConfig(runtime.browserHost, injected)) {
      throw new Error('Explicit default runtime must match the injected browser host configuration')
    }
  }
  if (defaultRuntime && defaultRuntime !== runtime) {
    throw new Error('Template runtime was already initialized; bind the default before importing the App')
  }
  defaultRuntime = runtime
}
