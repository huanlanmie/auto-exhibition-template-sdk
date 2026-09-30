import type { BrowserHostConfig, BrowserHostIdentity, TemplateRuntimeStorage } from '../../sdk/types'
import { createMessageId } from './id'
import type { MessageHandler, StateHandler, TemplateBridgeMessage, TemplateTransport } from './transport'

const PREFIX = 'exhibition-template-host:'

export function browserHostError(code: string, message: string) {
  return Object.assign(new Error(message), { code })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return Object.keys(value).every((key) => keys.includes(key))
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function matchesBrowserHostIdentity(value: unknown, identity: BrowserHostIdentity) {
  return isRecord(value) && value.visitorSessionId === identity.visitorSessionId
    && value.screenId === identity.screenId && value.runtimeId === identity.runtimeId
}

export function matchesBrowserHostConfig(value: BrowserHostConfig | undefined, config: BrowserHostConfig) {
  return value?.hostOrigin === config.hostOrigin && matchesBrowserHostIdentity(value.identity, config.identity)
    && (value.capabilities?.virtualRouting === true) === (config.capabilities?.virtualRouting === true)
}

export function validateBrowserHostConfig(value: unknown): BrowserHostConfig {
  if (!isRecord(value) || value.protocolVersion !== 1 || typeof value.hostOrigin !== 'string'
    || !isRecord(value.identity) || !['visitorSessionId', 'screenId', 'runtimeId'].every(
      (key) => typeof (value.identity as Record<string, unknown>)[key] === 'string'
        && String((value.identity as Record<string, unknown>)[key]).trim().length > 0,
    )) {
    throw browserHostError('INVALID_BROWSER_CONFIG', 'Invalid injected browser runtime configuration')
  }
  let origin: URL
  try { origin = new URL(value.hostOrigin) } catch {
    throw browserHostError('INVALID_BROWSER_CONFIG', 'hostOrigin must be an exact HTTP(S) origin')
  }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== value.hostOrigin) {
    throw browserHostError('INVALID_BROWSER_CONFIG', 'hostOrigin must be an exact HTTP(S) origin')
  }
  if (!hasOnlyKeys(value, ['protocolVersion', 'hostOrigin', 'identity', 'capabilities'])
    || !hasOnlyKeys(value.identity, ['visitorSessionId', 'screenId', 'runtimeId'])
    || (value.capabilities !== undefined && (!isRecord(value.capabilities)
      || !hasOnlyKeys(value.capabilities, ['virtualRouting'])
      || typeof value.capabilities.virtualRouting !== 'boolean'))) {
    throw browserHostError('INVALID_BROWSER_CONFIG', 'Unsupported browser host configuration or capabilities')
  }
  return Object.freeze({ protocolVersion: 1, hostOrigin: value.hostOrigin,
    identity: Object.freeze({ visitorSessionId: String(value.identity.visitorSessionId),
      screenId: String(value.identity.screenId), runtimeId: String(value.identity.runtimeId) }),
    ...(value.capabilities === undefined ? {} : {
      capabilities: Object.freeze({ virtualRouting: (value.capabilities as Record<string, unknown>).virtualRouting as boolean }),
    }) })
}

/** Inbound deliveries always address this receiving runtime, even with virtual routing enabled. */
export function validateBrowserLocalTarget(target: unknown, runtimeId: string) {
  if (!isRecord(target) || typeof target.mode !== 'string') {
    throw browserHostError('TARGET_NOT_ACTIVE', 'No active local function target was supplied')
  }
  if (target.mode !== 'local') {
    throw browserHostError('UNSUPPORTED_TARGET_MODE', 'Host deliveries must use a local function target')
  }
  if (!hasOnlyKeys(target, ['mode', 'templateSessionId'])) {
    throw browserHostError('INVALID_TARGET', 'Invalid local function target shape')
  }
  if (target.templateSessionId !== undefined && target.templateSessionId !== runtimeId) {
    throw browserHostError('TARGET_NOT_ACTIVE', 'Requested runtime is not the active local runtime')
  }
}

function validateVirtualTarget(target: unknown, runtimeId: string, event: boolean) {
  if (!isRecord(target) || typeof target.mode !== 'string') {
    throw browserHostError('INVALID_TARGET', 'A software routing target with a mode is required')
  }
  const invalid = () => { throw browserHostError('INVALID_TARGET', `Invalid ${target.mode} software routing target shape`) }
  switch (target.mode) {
    case 'local':
      if (event) throw browserHostError('UNSUPPORTED_TARGET_MODE', 'Events do not support local targets')
      validateBrowserLocalTarget(target, runtimeId)
      return
    case 'binding':
      if (event) throw browserHostError('UNSUPPORTED_TARGET_MODE', 'Events do not support binding targets')
      if (!hasOnlyKeys(target, ['mode', 'sourceFunction'])
        || (target.sourceFunction !== undefined && !isNonEmptyString(target.sourceFunction))) invalid()
      return
    case 'unicast':
      if (!hasOnlyKeys(target, event ? ['mode', 'clientId'] : ['mode', 'clientId', 'templateSessionId'])
        || !isNonEmptyString(target.clientId)
        || (target.templateSessionId !== undefined && !isNonEmptyString(target.templateSessionId))) invalid()
      return
    case 'multicast': {
      const hasClients = target.clientIds !== undefined
      const hasGroup = target.group !== undefined
      if (!hasOnlyKeys(target, ['mode', 'clientIds', 'group']) || hasClients === hasGroup
        || (hasClients && (!Array.isArray(target.clientIds) || target.clientIds.length === 0
          || !target.clientIds.every(isNonEmptyString)))
        || (hasGroup && !isNonEmptyString(target.group))) invalid()
      return
    }
    case 'broadcast':
      if (!hasOnlyKeys(target, ['mode'])) invalid()
      return
    default:
      throw browserHostError('UNSUPPORTED_TARGET_MODE', `Unsupported software routing target mode: ${target.mode}`)
  }
}

type StoragePending = {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export class BrowserHostTransport implements TemplateTransport {
  readonly id = 'browser-host-message-port'
  readonly config: BrowserHostConfig
  readonly storage: TemplateRuntimeStorage
  private port: MessagePort | null = null
  private destroyed = false
  private isConnected = false
  private connectingPromise: Promise<void> | null = null
  private resolveConnection: (() => void) | null = null
  private rejectConnection: ((reason: Error) => void) | null = null
  private handshakeTimer: ReturnType<typeof setTimeout> | null = null
  private readonly messageHandlers = new Set<MessageHandler>()
  private readonly stateHandlers = new Set<StateHandler>()
  private readonly pendingStorage = new Map<string, StoragePending>()
  private hostVisible = true
  private listeningForMedia = false
  private queue: TemplateBridgeMessage[] = []
  private readonly handshakeTimeoutMs: number

  constructor(config: BrowserHostConfig, handshakeTimeoutMs = 10000) {
    this.config = validateBrowserHostConfig(config)
    this.handshakeTimeoutMs = handshakeTimeoutMs
    if (!Number.isFinite(handshakeTimeoutMs) || handshakeTimeoutMs <= 0) {
      throw browserHostError('INVALID_BROWSER_CONFIG', 'handshakeTimeoutMs must be positive and finite')
    }
    this.storage = {
      get: (key) => this.storageRequest('storage_get', key),
      set: async (key, value) => { await this.storageRequest('storage_set', key, value) },
      remove: async (key) => { await this.storageRequest('storage_remove', key) },
    }
  }

  get connected() { return this.isConnected && !this.destroyed }

  connect(): Promise<void> {
    if (this.destroyed) return Promise.reject(browserHostError('BRIDGE_CLOSED', 'Browser runtime is disposed'))
    if (this.connected) return Promise.resolve()
    if (this.connectingPromise) return this.connectingPromise
    if (typeof window === 'undefined' || window.parent === window) {
      const reason = browserHostError('HOST_UNAVAILABLE', 'Browser runtime requires a parent iframe host')
      this.fail(reason)
      return Promise.reject(reason)
    }
    this.connectingPromise = new Promise<void>((resolve, reject) => {
      this.resolveConnection = resolve
      this.rejectConnection = reject
    })
    const connection = this.connectingPromise
    window.addEventListener('message', this.handleInit)
    this.handshakeTimer = setTimeout(() => {
      this.fail(browserHostError('HOST_HANDSHAKE_TIMEOUT', 'Browser host handshake timed out'))
    }, this.handshakeTimeoutMs)
    try {
      window.parent.postMessage({ type: `${PREFIX}ready`, protocolVersion: 1, identity: this.config.identity }, this.config.hostOrigin)
    } catch (error) {
      this.fail(error instanceof Error ? error : new Error(String(error)))
    }
    return connection
  }

  send(message: TemplateBridgeMessage) {
    if (this.destroyed) throw browserHostError('BRIDGE_CLOSED', 'Browser runtime is disposed')
    if (message.type === 'invoke_function' || message.type === 'template_function_call') {
      const target = message.target
      if (!isRecord(target) || typeof target.mode !== 'string') {
        throw browserHostError('TARGET_NOT_ACTIVE', 'No active local function target was supplied')
      }
      if (this.config.capabilities?.virtualRouting === true) {
        validateVirtualTarget(target, this.config.identity.runtimeId, false)
      } else {
        if (target.mode !== 'local') {
          throw browserHostError('HARDWARE_UNAVAILABLE', 'Browser runtime supports only local function targets')
        }
        if (target.templateSessionId !== undefined && target.templateSessionId !== this.config.identity.runtimeId) {
          throw browserHostError('TARGET_NOT_ACTIVE', 'Requested runtime is not the active local runtime')
        }
      }
    }
    if (message.type === 'emit_event' && this.config.capabilities?.virtualRouting === true) {
      validateVirtualTarget(message.target, this.config.identity.runtimeId, true)
    }
    if (!this.connected) {
      if (this.queue.length >= 100) throw browserHostError('HOST_QUEUE_FULL', 'Browser host message queue is full')
      this.queue.push(message)
      void this.connect().catch(() => { /* The runtime ready promise reports handshake failure. */ })
      return
    }
    this.port!.postMessage({ protocolVersion: 1, identity: this.config.identity, payload: message })
  }

  onMessage(handler: MessageHandler) {
    if (this.destroyed) throw browserHostError('BRIDGE_CLOSED', 'Browser runtime is disposed')
    this.messageHandlers.add(handler)
    return () => { this.messageHandlers.delete(handler) }
  }

  onStateChange(handler: StateHandler) {
    if (this.destroyed) throw browserHostError('BRIDGE_CLOSED', 'Browser runtime is disposed')
    this.stateHandlers.add(handler)
    return () => { this.stateHandlers.delete(handler) }
  }

  close() { this.fail(browserHostError('BRIDGE_CLOSED', 'Browser runtime is disposed')) }

  private readonly handleInit = (event: MessageEvent) => {
    if (this.destroyed || this.connected || event.origin !== this.config.hostOrigin
      || event.source !== window.parent || !isRecord(event.data)
      || event.data.type !== `${PREFIX}init` || event.data.protocolVersion !== 1
      || !matchesBrowserHostIdentity(event.data.identity, this.config.identity)) return
    if (event.ports.length !== 1) return
    this.port = event.ports[0]!
    this.port.onmessage = this.handlePortMessage
    this.port.onmessageerror = () => this.fail(browserHostError('HOST_MESSAGE_ERROR', 'Browser host port message could not be decoded'))
    this.port.start()
    try {
      // ACK is child -> parent over window; all subsequent payloads use the bound port.
      window.parent.postMessage({ type: `${PREFIX}ack`, protocolVersion: 1, identity: this.config.identity }, this.config.hostOrigin)
      this.isConnected = true
      this.cleanupHandshake()
      this.stateHandlers.forEach((handler) => handler(true))
      const queued = this.queue
      this.queue = []
      for (const message of queued) this.send(message)
      this.resolveConnection?.()
      this.resolveConnection = null
      this.rejectConnection = null
    } catch (error) {
      this.fail(error instanceof Error ? error : new Error(String(error)))
    }
  }

  private readonly handlePortMessage = (event: MessageEvent) => {
    const envelope: unknown = event.data
    if (!this.connected || !isRecord(envelope) || envelope.protocolVersion !== 1
      || !matchesBrowserHostIdentity(envelope.identity, this.config.identity)
      || !isRecord(envelope.payload) || typeof envelope.payload.type !== 'string') return
    const message = envelope.payload as TemplateBridgeMessage
    if (message.type === 'host_visibility') {
      if (typeof message.visible !== 'boolean') return
      this.hostVisible = message.visible
      if (typeof document !== 'undefined') {
        if (!this.listeningForMedia) {
          document.addEventListener('play', this.handleMediaPlay, true)
          this.listeningForMedia = true
        }
        if (!this.hostVisible) document.querySelectorAll<HTMLMediaElement>('audio,video').forEach(this.pauseMedia)
      }
      return
    }
    if (message.type === 'storage_result' || message.type === 'storage_error') {
      const requestId = typeof message.requestId === 'string' ? message.requestId : ''
      const pending = this.pendingStorage.get(requestId)
      if (!pending) return
      this.pendingStorage.delete(requestId)
      clearTimeout(pending.timer)
      if (message.type === 'storage_result') pending.resolve(message.value)
      else {
        const error = isRecord(message.error) ? message.error : {}
        pending.reject(browserHostError(typeof error.code === 'string' ? error.code : 'STORAGE_ERROR',
          typeof error.message === 'string' ? error.message : 'Browser host storage request failed'))
      }
      return
    }
    this.messageHandlers.forEach((handler) => handler(message))
  }

  private readonly pauseMedia = (media: HTMLMediaElement) => {
    try { media.pause() } catch { /* Media suspension is best effort and must not close the authenticated port. */ }
  }

  private readonly handleMediaPlay = (event: Event) => {
    if (!this.hostVisible && event.target instanceof HTMLMediaElement) this.pauseMedia(event.target)
  }

  private async storageRequest(type: string, key: string, value?: unknown): Promise<unknown> {
    if (typeof key !== 'string' || !key.length) throw new Error('Storage key must be a non-empty string')
    await this.connect()
    const requestId = createMessageId('storage')
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingStorage.delete(requestId)
        reject(browserHostError('STORAGE_TIMEOUT', 'Browser host storage request timed out'))
      }, 10000)
      this.pendingStorage.set(requestId, { resolve, reject, timer })
      try { this.send({ type, requestId, key, value }) } catch (error) {
        clearTimeout(timer)
        this.pendingStorage.delete(requestId)
        reject(error)
      }
    })
  }

  private cleanupHandshake() {
    if (typeof window !== 'undefined') window.removeEventListener('message', this.handleInit)
    if (this.handshakeTimer) clearTimeout(this.handshakeTimer)
    this.handshakeTimer = null
  }

  private fail(reason: Error) {
    if (this.destroyed) return
    this.destroyed = true
    this.isConnected = false
    this.cleanupHandshake()
    if (this.listeningForMedia && typeof document !== 'undefined') {
      document.removeEventListener('play', this.handleMediaPlay, true)
      this.listeningForMedia = false
    }
    this.rejectConnection?.(reason)
    this.rejectConnection = null
    this.resolveConnection = null
    if (this.port) {
      this.port.onmessage = null
      this.port.onmessageerror = null
      this.port.close()
      this.port = null
    }
    this.queue = []
    this.pendingStorage.forEach(({ reject, timer }) => { clearTimeout(timer); reject(reason) })
    this.pendingStorage.clear()
    this.stateHandlers.forEach((handler) => handler(false))
    this.messageHandlers.clear()
    this.stateHandlers.clear()
  }
}
