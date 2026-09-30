import type { TemplateRuntime, TemplateRuntimeOptions } from '../sdk/types'
import { createTemplateRuntime } from './createTemplateRuntime'
import { matchesBrowserHostIdentity, validateBrowserHostConfig } from './communication/browserHostTransport'

let defaultRuntime: TemplateRuntime | null = null

export function getDefaultTemplateRuntime(options: TemplateRuntimeOptions = {}): TemplateRuntime {
  if (!defaultRuntime) {
    const injected = typeof window !== 'undefined'
      && Object.prototype.hasOwnProperty.call(window, '__AUTO_EXHIBITION_TEMPLATE_RUNTIME__')
    defaultRuntime = injected
      ? createTemplateRuntime({ ...options, mode: 'browser',
        browserHost: validateBrowserHostConfig(window.__AUTO_EXHIBITION_TEMPLATE_RUNTIME__) })
      : createTemplateRuntime(options)
  } else {
    if (options.mode !== undefined && options.mode !== defaultRuntime.mode) {
      throw new Error('Template runtime was already initialized; its mode cannot change')
    }
    if (options.browserHost !== undefined) {
      const host = validateBrowserHostConfig(options.browserHost)
      if (defaultRuntime.mode !== 'browser' || defaultRuntime.browserHost?.hostOrigin !== host.hostOrigin
        || !matchesBrowserHostIdentity(defaultRuntime.browserHost?.identity, host.identity)) {
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
    if (runtime.mode !== 'browser' || runtime.browserHost?.hostOrigin !== injected.hostOrigin
      || !matchesBrowserHostIdentity(runtime.browserHost?.identity, injected.identity)) {
      throw new Error('Explicit default runtime must match the injected browser host configuration')
    }
  }
  if (defaultRuntime && defaultRuntime !== runtime) {
    throw new Error('Template runtime was already initialized; bind the default before importing the App')
  }
  defaultRuntime = runtime
}
