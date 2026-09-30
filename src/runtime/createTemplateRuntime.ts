import type { TemplateRuntime, TemplateRuntimeOptions } from '../sdk/types'
import { BrowserHostTransport, validateBrowserHostConfig } from './communication/browserHostTransport'
import { LocalBridgeWebSocketTransport } from './communication/localBridgeTransport'
import { RuntimeTemplateBridge } from './communication/templateBridge'
import { createTemplateContext } from './context/createTemplateContext'

export function createTemplateRuntime(options: TemplateRuntimeOptions = {}): TemplateRuntime {
  const mode = options.mode ?? (options.browserHost ? 'browser' : 'local')
  if (mode !== 'browser' && mode !== 'local') throw new Error('Unsupported template runtime mode')
  if (mode === 'browser' && options.transport) throw new Error('Browser mode requires its authenticated host transport')
  if (mode === 'local' && options.browserHost) throw new Error('Local mode cannot include browserHost configuration')
  const browserHost = mode === 'browser' ? validateBrowserHostConfig(options.browserHost) : undefined
  const transport = browserHost
    ? new BrowserHostTransport(browserHost, options.handshakeTimeoutMs)
    : options.transport ?? new LocalBridgeWebSocketTransport()
  const { context } = createTemplateContext({ configJson: options.configJson,
    valueMap: options.initialValueMap ?? options.valueMap,
    allowPreviewMessages: mode === 'local' })
  const bridge = new RuntimeTemplateBridge(transport)
  const unsubscribe = mode === 'browser' ? transport.onMessage((message) => {
    if (message.type !== 'auto-exhibition-template-sdk:update-value-map') return
    const payload = message.payload
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return
    const nextValueMap = (payload as Record<string, unknown>).valueMap
    if (!nextValueMap || typeof nextValueMap !== 'object' || Array.isArray(nextValueMap)) return
    context.setValueMap(nextValueMap as Record<string, unknown>)
  }) : () => {}
  let disposed = false
  const ready = mode === 'browser'
    ? Promise.all([context.ready, bridge.connect()]).then(() => {})
    : context.ready
  const runtime: TemplateRuntime = {
    mode, browserHost, context, bridge,
    get ready() { return mode === 'local' ? context.ready : ready },
    get disposed() { return disposed },
    storage: transport instanceof BrowserHostTransport ? transport.storage : undefined,
    dispose() {
      if (disposed) return
      disposed = true
      unsubscribe()
      bridge.close()
      context.dispose()
    },
  }
  void ready.catch(() => {
    // A failed browser bootstrap cannot leave a live port or preview/config subscriptions.
    if (mode === 'browser') runtime.dispose()
  })
  return runtime
}
