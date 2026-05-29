export type TemplateBridgeMessage = Record<string, unknown> & {
  type: string
}

type MessageHandler = (message: TemplateBridgeMessage) => void
type StateHandler = (connected: boolean) => void

export type TemplateTransport = {
  readonly id: string
  readonly connected: boolean
  connect: () => Promise<void>
  send: (message: TemplateBridgeMessage) => void
  onMessage: (handler: MessageHandler) => () => void
  onStateChange: (handler: StateHandler) => () => void
  close: () => void
}

export type LocalBridgeWebSocketTransportOptions = {
  url?: string
  reconnectDelayMs?: number
  maxQueueSize?: number
}

const DEFAULT_BRIDGE_URL = 'ws://127.0.0.1:5176'
const DEFAULT_RECONNECT_DELAY_MS = 3000
const DEFAULT_MAX_QUEUE_SIZE = 100

export class LocalBridgeWebSocketTransport implements TemplateTransport {
  readonly id = 'local-bridge-websocket'

  private readonly url: string
  private readonly reconnectDelayMs: number
  private readonly maxQueueSize: number
  private socket: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private destroyed = false
  private connectingPromise: Promise<void> | null = null
  private messageHandlers = new Set<MessageHandler>()
  private stateHandlers = new Set<StateHandler>()
  private queue: TemplateBridgeMessage[] = []
  private isConnected = false

  constructor(options: LocalBridgeWebSocketTransportOptions = {}) {
    this.url = options.url || DEFAULT_BRIDGE_URL
    this.reconnectDelayMs = options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS
    this.maxQueueSize = options.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE
  }

  get connected() {
    return this.isConnected
  }

  connect() {
    if (typeof WebSocket === 'undefined') {
      return Promise.reject(new Error('Current runtime does not support WebSocket'))
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    if (this.connectingPromise) {
      return this.connectingPromise
    }

    this.destroyed = false
    this.connectingPromise = new Promise((resolve, reject) => {
      let socket: WebSocket

      try {
        socket = new WebSocket(this.url)
      } catch (error) {
        this.connectingPromise = null
        this.scheduleReconnect()
        reject(error)
        return
      }

      this.socket = socket

      socket.onopen = () => {
        this.isConnected = true
        this.connectingPromise = null
        this.clearReconnectTimer()
        this.emitState(true)
        this.flushQueue()
        resolve()
      }

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as TemplateBridgeMessage
          this.messageHandlers.forEach((handler) => handler(message))
        } catch (error) {
          console.warn('[auto-exhibition-template-sdk] Failed to parse bridge message', error)
        }
      }

      socket.onclose = () => {
        this.isConnected = false
        this.connectingPromise = null
        this.emitState(false)
        this.scheduleReconnect()
      }

      socket.onerror = (event) => {
        if (this.connectingPromise) {
          this.connectingPromise = null
          reject(event)
        }
      }
    })

    return this.connectingPromise
  }

  send(message: TemplateBridgeMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
      return
    }

    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift()
    }

    this.queue.push(message)
    void this.connect().catch(() => {
      // Reconnect is scheduled by connect().
    })
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onStateChange(handler: StateHandler) {
    this.stateHandlers.add(handler)
    return () => this.stateHandlers.delete(handler)
  }

  close() {
    this.destroyed = true
    this.clearReconnectTimer()
    this.queue = []
    this.isConnected = false

    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  private flushQueue() {
    while (this.queue.length && this.socket?.readyState === WebSocket.OPEN) {
      const message = this.queue.shift()
      if (message) {
        this.socket.send(JSON.stringify(message))
      }
    }
  }

  private scheduleReconnect() {
    if (this.destroyed) {
      return
    }

    this.clearReconnectTimer()
    this.reconnectTimer = setTimeout(() => {
      void this.connect().catch(() => {
        // Keep retrying until close() is called.
      })
    }, this.reconnectDelayMs)
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private emitState(connected: boolean) {
    this.stateHandlers.forEach((handler) => handler(connected))
  }
}
