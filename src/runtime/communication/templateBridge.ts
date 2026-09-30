import { createMessageId } from './id'
import { LocalBridgeWebSocketTransport } from './localBridgeTransport'
import { BrowserHostTransport, validateBrowserLocalTarget } from './browserHostTransport'
import type { TemplateBridgeMessage, TemplateTransport } from './transport'
import { getDefaultTemplateRuntime } from '../runtimeRegistry'
import type {
  TemplateBridge,
  TemplateEventHandler,
  TemplateEventTarget,
  TemplateFunctionDefinition,
  TemplateFunctionHandler,
  TemplateFunctionInvokeOptions,
  TemplateFunctionInvokeTarget,
  TemplateFunctionRegistration,
  TemplateFunctionResult,
} from '../../sdk/types'

type PendingCall = {
  functionName: string
  resolve: (result: TemplateFunctionResult) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout> | null
}

const DEFAULT_FUNCTION_TIMEOUT_MS = 3000

function toError(code: string, message: string, details?: unknown) {
  const error = new Error(message)
  Object.assign(error, { code, details })
  return error
}

function clonePayload<T>(payload: T): T {
  if (payload === undefined) {
    return payload
  }

  return JSON.parse(JSON.stringify(payload)) as T
}

export class RuntimeTemplateBridge implements TemplateBridge {
  private readonly transport: TemplateTransport
  private readonly functionRegistry = new Map<string, TemplateFunctionRegistration>()
  private readonly eventListeners = new Map<string, Set<TemplateEventHandler>>()
  private readonly pendingCalls = new Map<string, PendingCall>()
  private localClientId: string | null = null
  private isConnected = false
  private destroyed = false
  private readonly unsubscribeMessage: () => void
  private readonly unsubscribeState: () => void

  constructor(transport: TemplateTransport = new LocalBridgeWebSocketTransport()) {
    this.transport = transport
    this.unsubscribeMessage = this.transport.onMessage((message) => this.handleMessage(message))
    this.unsubscribeState = this.transport.onStateChange((connected) => {
      this.isConnected = connected
      if (connected) {
        this.syncRegisteredFunctions()
      } else if (this.transport instanceof BrowserHostTransport) {
        this.rejectPendingCalls(toError('HOST_DISCONNECTED', 'Browser host transport disconnected'))
      }
    })
  }

  get clientId() {
    return this.localClientId
  }

  get connected() {
    return !this.destroyed && (this.isConnected || this.transport.connected)
  }

  connect() {
    if (this.destroyed) return Promise.reject(toError('BRIDGE_CLOSED', 'Template bridge closed'))
    return this.transport.connect()
  }

  registerTemplateFunction(
    name: string,
    handler: TemplateFunctionHandler,
    definition?: TemplateFunctionDefinition,
  ) {
    this.assertOpen()
    const functionName = String(name || '').trim()

    if (!functionName) {
      throw new Error('registerTemplateFunction requires a non-empty function name')
    }

    if (typeof handler !== 'function') {
      throw new Error('registerTemplateFunction requires a handler function')
    }

    this.functionRegistry.set(functionName, {
      name: functionName,
      definition: definition ? clonePayload(definition) : undefined,
      handler,
    })
    this.syncRegisteredFunctions()

    return () => { if (!this.destroyed) this.unregisterTemplateFunction(functionName) }
  }

  unregisterTemplateFunction(name: string) {
    this.assertOpen()
    this.functionRegistry.delete(name)
    this.syncRegisteredFunctions()
  }

  invokeTemplateFunction(
    target: TemplateFunctionInvokeTarget,
    functionName: string,
    args?: unknown,
    options: TemplateFunctionInvokeOptions = {},
  ) {
    const messageId = options.messageId || createMessageId('fn')
    const timeoutMs = options.timeoutMs ?? DEFAULT_FUNCTION_TIMEOUT_MS
    const expectResult = options.expectResult !== false

    if (this.destroyed) return Promise.reject(toError('BRIDGE_CLOSED', 'Template bridge closed'))
    if (this.pendingCalls.has(messageId)) return Promise.reject(toError('DUPLICATE_MESSAGE_ID', `Pending call ${messageId} already exists`))
    const message: TemplateBridgeMessage = {
      type: 'invoke_function',
      messageId,
      traceId: options.traceId || messageId,
      target,
      functionName,
      args: clonePayload(args),
      ttl: options.ttl ?? 8,
      expectResult,
      ts: Date.now(),
    }

    if (!expectResult) {
      try {
        this.transport.send(message)
        return Promise.resolve({ messageId, functionName })
      } catch (error) { return Promise.reject(error) }
    }

    return new Promise<TemplateFunctionResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCalls.delete(messageId)
        reject(toError('FUNCTION_TIMEOUT', `Template function ${functionName} timed out after ${timeoutMs}ms`))
      }, timeoutMs)

      this.pendingCalls.set(messageId, {
        functionName,
        resolve,
        reject,
        timer,
      })
      try { this.transport.send(message) } catch (error) {
        clearTimeout(timer)
        this.pendingCalls.delete(messageId)
        reject(error)
      }
    })
  }

  emitTemplateEvent(channel: string, payload?: unknown, target: TemplateEventTarget = { mode: 'broadcast' }) {
    this.assertOpen()
    const messageId = createMessageId('evt')
    this.transport.send({
      type: 'emit_event',
      messageId,
      channel,
      target,
      payload: clonePayload(payload === undefined ? {} : payload),
      ts: Date.now(),
    })
    return messageId
  }

  onTemplateEvent(channel: string, handler: TemplateEventHandler) {
    this.assertOpen()
    if (!this.eventListeners.has(channel)) {
      this.eventListeners.set(channel, new Set())
    }

    this.eventListeners.get(channel)?.add(handler)
    return () => {
      this.eventListeners.get(channel)?.delete(handler)
    }
  }

  close() {
    if (this.destroyed) return
    this.destroyed = true
    this.isConnected = false
    this.localClientId = null
    this.unsubscribeMessage()
    this.unsubscribeState()
    this.rejectPendingCalls(toError('BRIDGE_CLOSED', 'Template bridge closed'))
    this.functionRegistry.clear()
    this.eventListeners.clear()
    this.transport.close()
  }

  private assertOpen() {
    if (this.destroyed) throw toError('BRIDGE_CLOSED', 'Template bridge closed')
  }

  private rejectPendingCalls(reason: Error) {
    this.pendingCalls.forEach((pending) => {
      if (pending.timer) {
        clearTimeout(pending.timer)
      }
      pending.reject(reason)
    })
    this.pendingCalls.clear()
  }

  private syncRegisteredFunctions() {
    if (this.destroyed) return
    this.transport.send({
      type: 'register_functions',
      functions: Array.from(this.functionRegistry.values()).map((item) => ({
        name: item.name,
        definition: clonePayload(item.definition || {}),
      })),
      ts: Date.now(),
    })
  }

  private handleMessage(message: TemplateBridgeMessage) {
    if (this.destroyed) return
    switch (message.type) {
      case 'sdk_ready':
        this.localClientId = typeof message.clientId === 'string' ? message.clientId : null
        this.syncRegisteredFunctions()
        break
      case 'client_id':
        this.localClientId = typeof message.clientId === 'string' ? message.clientId : null
        break
      case 'received_event':
        this.dispatchTemplateEvent(message)
        break
      case 'template_function_call':
        void this.handleFunctionCall(message).catch((error) => {
          if (!this.destroyed) console.warn('[auto-exhibition-template-sdk] Failed to reply to function call', error)
        })
        break
      case 'function_result':
        this.resolveFunctionResult(message)
        break
      case 'function_error':
        this.rejectFunctionResult(message)
        break
      default:
        break
    }
  }

  private dispatchTemplateEvent(message: TemplateBridgeMessage) {
    const channel = typeof message.channel === 'string' ? message.channel : ''
    const listeners = this.eventListeners.get(channel)

    if (!listeners?.size) {
      return
    }

    listeners.forEach((handler) => {
      handler({
        from: message.from,
        channel,
        payload: message.payload,
        messageId: typeof message.messageId === 'string' ? message.messageId : undefined,
        ts: typeof message.ts === 'number' ? message.ts : undefined,
      })
    })
  }

  private async handleFunctionCall(message: TemplateBridgeMessage) {
    const functionName = typeof message.functionName === 'string' ? message.functionName : ''
    const registration = this.functionRegistry.get(functionName)
    const messageId = typeof message.messageId === 'string' ? message.messageId : createMessageId('fn')

    if (this.transport instanceof BrowserHostTransport) {
      try {
        validateBrowserLocalTarget(message.target, this.transport.config.identity.runtimeId)
      } catch (error) {
        const reason = error as Error & { code: string }
        this.transport.send({ type: 'function_error', messageId, functionName,
          error: { code: reason.code, message: reason.message }, ts: Date.now() })
        return
      }
    }

    if (!registration) {
      this.transport.send({
        type: 'function_error',
        messageId,
        functionName,
        error: {
          code: 'FUNCTION_NOT_REGISTERED',
          message: `Template function ${functionName} is not registered`,
        },
        ts: Date.now(),
      })
      return
    }

    try {
      const result = await registration.handler(message.args, {
        messageId,
        traceId: typeof message.traceId === 'string' ? message.traceId : undefined,
        from: message.from,
        target: message.target as TemplateFunctionInvokeTarget | undefined,
        ts: typeof message.ts === 'number' ? message.ts : undefined,
      })
      if (this.destroyed) return
      this.transport.send({
        type: 'function_result',
        messageId,
        functionName,
        result: clonePayload(result),
        ts: Date.now(),
      })
    } catch (error) {
      if (this.destroyed) return
      this.transport.send({
        type: 'function_error',
        messageId,
        functionName,
        error: {
          code: 'FUNCTION_EXECUTION_FAILED',
          message: error instanceof Error ? error.message : String(error),
        },
        ts: Date.now(),
      })
    }
  }

  private resolveFunctionResult(message: TemplateBridgeMessage) {
    const messageId = typeof message.messageId === 'string' ? message.messageId : ''
    const pending = this.pendingCalls.get(messageId)

    if (!pending) {
      return
    }

    this.pendingCalls.delete(messageId)
    if (pending.timer) {
      clearTimeout(pending.timer)
    }

    pending.resolve({
      messageId,
      functionName: typeof message.functionName === 'string' ? message.functionName : pending.functionName,
      result: message.result,
    })
  }

  private rejectFunctionResult(message: TemplateBridgeMessage) {
    const messageId = typeof message.messageId === 'string' ? message.messageId : ''
    const pending = this.pendingCalls.get(messageId)

    if (!pending) {
      return
    }

    this.pendingCalls.delete(messageId)
    if (pending.timer) {
      clearTimeout(pending.timer)
    }

    const error = message.error && typeof message.error === 'object'
      ? message.error as { code?: unknown; message?: unknown; details?: unknown }
      : {}

    pending.reject(toError(
      typeof error.code === 'string' ? error.code : 'FUNCTION_ERROR',
      typeof error.message === 'string' ? error.message : `Template function ${pending.functionName} failed`,
      error.details,
    ))
  }
}

export function getDefaultTemplateBridge() {
  return getDefaultTemplateRuntime().bridge
}
