export type TemplateBridgeMessage = Record<string, unknown> & { type: string }
export type MessageHandler = (message: TemplateBridgeMessage) => void
export type StateHandler = (connected: boolean) => void

export type TemplateTransport = {
  readonly id: string
  readonly connected: boolean
  connect: () => Promise<void>
  send: (message: TemplateBridgeMessage) => void
  onMessage: (handler: MessageHandler) => () => void
  onStateChange: (handler: StateHandler) => () => void
  close: () => void
}
