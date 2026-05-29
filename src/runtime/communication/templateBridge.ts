import { createMessageId } from './id'
import { LocalBridgeWebSocketTransport, type TemplateBridgeMessage, type TemplateTransport } from './localBridgeTransport'
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

  constructor(transport: TemplateTransport = new LocalBridgeWebSocketTransport()) {
    this.transport = transport
    this.transport.onMessage((message) => this.handleMessage(message))
    this.transport.onStateChange((connected) => {
      this.isConnected = connected
      if (connected) {
        this.syncRegisteredFunctions()
      }
    })
  }

  get clientId() {
    return this.localClientId
  }

  get connected() {
    return this.isConnected || this.transport.connected
  }

  connect() {
    return this.transport.connect()
  }

  registerTemplateFunction(
    name: string,
    handler: TemplateFunctionHandler,
    definition?: TemplateFunctionDefinition,
  ) {
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

    return () => this.unregisterTemplateFunction(functionName)
  }

  unregisterTemplateFunction(name: string) {
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

    this.transport.send({
      type: 'invoke_function',
      messageId,
      traceId: options.traceId || messageId,
      target,
      functionName,
      args: clonePayload(args),
      ttl: options.ttl ?? 8,
      expectResult,
      ts: Date.now(),
    })

    if (!expectResult) {
      return Promise.resolve({ messageId, functionName })
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
    })
  }

  emitTemplateEvent(channel: string, payload?: unknown, target: TemplateEventTarget = { mode: 'broadcast' }) {
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
    if (!this.eventListeners.has(channel)) {
      this.eventListeners.set(channel, new Set())
    }

    this.eventListeners.get(channel)?.add(handler)
    return () => {
      this.eventListeners.get(channel)?.delete(handler)
    }
  }

  close() {
    this.pendingCalls.forEach((pending) => {
      if (pending.timer) {
        clearTimeout(pending.timer)
      }
      pending.reject(toError('BRIDGE_CLOSED', 'Template bridge closed'))
    })
    this.pendingCalls.clear()
    this.transport.close()
  }

  private syncRegisteredFunctions() {
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
        void this.handleFunctionCall(message)
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

      this.transport.send({
        type: 'function_result',
        messageId,
        functionName,
        result: clonePayload(result),
        ts: Date.now(),
      })
    } catch (error) {
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

let defaultBridge: RuntimeTemplateBridge | null = null

export function getDefaultTemplateBridge() {
  if (!defaultBridge) {
    defaultBridge = new RuntimeTemplateBridge()
  }

  return defaultBridge
}
