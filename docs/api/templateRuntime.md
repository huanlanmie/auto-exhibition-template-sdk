# Template Runtime API

`createTemplateRuntime(options?: TemplateRuntimeOptions): TemplateRuntime` 创建独立实例；`setDefaultTemplateRuntime(runtime): void` 在导入 App 前绑定模块顶层调用的默认实例；`getDefaultTemplateRuntime(): TemplateRuntime` 获取首次访问时创建或预先绑定的默认实例。

```ts
type TemplateRuntimeOptions = {
  mode?: 'local' | 'browser'
  browserHost?: {
    protocolVersion: 1
    hostOrigin: string
    identity: { visitorSessionId: string; screenId: string; runtimeId: string }
  }
  configJson?: unknown
  initialValueMap?: Record<string, unknown>
  valueMap?: Record<string, unknown> // initialValueMap 的兼容别名
  transport?: TemplateTransport // 仅允许 local 模式
  handshakeTimeoutMs?: number // 默认 10000，必须为有限正数
}
```

`browserHost` 存在时默认选 browser，否则选 local。`initialValueMap` 优先于 `valueMap`；预置快照存在时不读取配置文件，`configJson` 未提供则 context.config 保持 null。无预置快照且无 configJson 时，从当前文档基址加载 `./config.json` 和 `./assets/auto-exhibition-template-sdk/valueMap.json`。提供 configJson 时复用 SDK 校验和归一化，再应用预置快照。

runtime 包含 `mode/browserHost?/context/bridge/ready/disposed/storage?/dispose()`。`ready` 在浏览器握手和上下文配置均完成后 resolve；浏览器模式失败时自动 dispose。local 的 ready 只等待上下文，不额外发起 WebSocket 连接。bridge 保留现有函数和事件 API。

context 包含响应式 `config/valueMap`、`resolvePath/resolveValue`、`ready/setConfigJson/setValueMap/dispose`。`setConfigJson(configJson)` 先校验配置，再同步更新配置和归一化快照，取消旧文件读取。新快照拥有版本保护，先到达的宿主更新不会被较晚完成的文件加载覆盖。浏览器模式只接受已认证端口的更新；local 模式继续接受同源父窗口的旧更新消息。dispose 中止尚未完成的 fetch 并移除监听。

保留非 Vite 接入：模块顶层函数调用已经创建默认 Bridge 后，`app.use(TemplateSdk, { configJson })` 仍将显式配置应用到同一个 runtime/context/bridge。也可同时传 `{ runtime, configJson }` 更新显式实例；此操作只更新配置，不切换 transport、mode 或 browser identity。后续默认访问指定不同模式、父源、identity 或 transport 选项会明确报错。显式配置使本地 context/runtime 的当前 ready 立即可用，即使早前默认文件加载失败。

默认访问优先读取 `window.__AUTO_EXHIBITION_TEMPLATE_RUNTIME__`，存在但无效时抛出 `INVALID_BROWSER_CONFIG`，只在完全未注入时使用 local 默认。hostOrigin 必须是完整的 HTTP(S) origin，不允许 `*`、路径或尾斜杠。三个 identity 字段必须是非空字符串。显式绑定的 browser runtime 必须匹配已注入配置，默认实例初始化之后更换实例会明确报错。

## Bootstrap

服务端注入配置必须早于 App 脚本。标准已编译模板使用自身打包的 SDK 自动创建默认 runtime，避免平台额外导入 SDK 造成模块 registry 副本。源代码 bootstrap 可使用：

```ts
import { createApp } from 'vue'
import TemplateSdk, { createTemplateRuntime, setDefaultTemplateRuntime } from 'auto-exhibition-template-sdk'

const runtime = createTemplateRuntime({ mode: 'browser',
  browserHost: window.__AUTO_EXHIBITION_TEMPLATE_RUNTIME__! })
setDefaultTemplateRuntime(runtime)
const { default: App } = await import('./App.vue')
createApp(App).use(TemplateSdk, { runtime }).mount('#app')
await runtime.ready
```

不要静态导入含有顶层 SDK 调用的 App 后才绑定默认实例。setup 内 `useTemplateBridge()` 优先读取 Vue 注入的 runtime；模块顶层 API 使用默认 registry。销毁默认 runtime 后 registry 保留该终态实例，不再自动创建 local Bridge。

## 平台侧精确协议

1. child → parent window：`{type:'exhibition-template-host:ready',protocolVersion:1,identity}`，targetOrigin 为精确 hostOrigin。
2. parent → child window：`{type:'exhibition-template-host:init',protocolVersion:1,identity}`，通过 transfer list 传入恰好一个 MessagePort。SDK 检查 `event.origin === hostOrigin`、`event.source === window.parent`、协议版本与三个 identity 字段；任何不匹配都丢弃。
3. SDK 绑定端口并调用 `port.start()` 后，child → parent **window**：`{type:'exhibition-template-host:ack',protocolVersion:1,identity}`。ACK 不通过端口发送。SDK 成功发送 ACK 后才 connected，随后发送端口业务消息。Host 同样核对 origin/source/identity，ACK 后才处理业务并通过端口回送 `sdk_ready`。
4. 端口双向信封始终为 `{protocolVersion:1,identity,payload:TemplateBridgeMessage}`，不再依赖 MessagePort 的 event.origin。协议和 identity 每条消息均校验，不匹配的消息丢弃。

原消息类型保持不变：`sdk_ready/register_functions/invoke_function/template_function_call/function_result/function_error/emit_event/received_event`。Host 通过 `sdk_ready.clientId` 提供当前 runtime 的逻辑 clientId；收到 `invoke_function` 时检查活动实例，回送 `template_function_call`，将结果或错误按 messageId 回送。仅 `{mode:'local'}` 支持执行，可选 `templateSessionId` 必须匹配 identity.runtimeId。inactive/missing runtime 或缺失、null、非对象、缺少 mode 的入站调用目标返回 `TARGET_NOT_ACTIVE`，不会执行 handler；`binding/unicast/multicast/broadcast` 函数目标返回 `HARDWARE_UNAVAILABLE`。Host 必须独立执行这些限制。

宿主配置更新的端口 payload 为：

```ts
{ type: 'auto-exhibition-template-sdk:update-value-map', payload: { valueMap: nextSnapshot } }
```

## 访客隔离存储

browser runtime 提供 `runtime.storage.get(key): Promise<unknown>`、`set(key,value): Promise<void>`、`remove(key): Promise<void>`。平台负责按 visitorSessionId/screenId/runtimeId 命名空间存储并验证当前活动 runtime，不对模板已有 localStorage 自动改写。

端口请求 payload 分别为 `{type:'storage_get'|'storage_set'|'storage_remove',requestId,key,value?}`；成功 `{type:'storage_result',requestId,value?}`，失败 `{type:'storage_error',requestId,error:{code,message}}`。存储等待项在发送前登记，默认超时 10 秒。

## 销毁和错误

`runtime.dispose()` 幂等，关闭 bridge 和 MessagePort、移除窗口/端口/transport 监听、清空注册函数和事件订阅、停止握手/请求计时器、中止文件 fetch 并 reject 等待项。未完成的函数调用得到 `BRIDGE_CLOSED`，销毁后 connect/invoke 拒绝，注册和发送明确报错。浏览器通道失败会拒绝等待调用并由 ready 的失败清理整个 runtime；不会改用 local WS。已开始执行的 handler 无法中断，但结束时不再发送结果。

握手超时 `HOST_HANDSHAKE_TIMEOUT`；父窗口缺失 `HOST_UNAVAILABLE`；端口无法解码 `HOST_MESSAGE_ERROR`；队列溢出 `HOST_QUEUE_FULL`；函数重复 messageId `DUPLICATE_MESSAGE_ID`；函数超时 `FUNCTION_TIMEOUT`；存储超时 `STORAGE_TIMEOUT`。

## 手动核对（M05/M06）

构建检查只执行 `pnpm build`；下面由人工在浏览器执行，不提供自动功能测试。

1. M05：用有效注入配置打开跨源 iframe。DevTools 观察 ready → init（恰好一个 port）→ child window ACK → port sdk_ready；检查 origin/source/identity。先等 runtime.ready，然后注册 echo 函数并以 `{mode:'local'}` 调用，核对结果与 messageId。修改 origin、source、协议或任一 identity 后重放 init/信封，确认无调用和连接；完整未授权握手应在 10 秒后失败。验证硬件目标 `HARDWARE_UNAVAILABLE`、其他 runtimeId `TARGET_NOT_ACTIVE`。
2. M05：从已认证端口发送 valueMap 更新，观察 `useTemplateValue` 更新；同名裸 window 消息不可更新 browser runtime。在文件读取未完成前发送新快照，读取完成后仍应保留新快照。使用 storage.set/get/remove，切换 screen/runtime/session 后核对隔离。
3. M06：启动一个尚未返回的函数调用和存储请求，立即 dispose；观察等待项拒绝、connected false、后续 connect/invoke 拒绝。第二次 dispose 无副作用，较晚 handler 结果不再发送，旧 port/旧 identity 不更新新 iframe。Network 不应出现 `ws://127.0.0.1:5176`。
4. 本地兼容：移除注入配置，按旧 Vue 插件方式启动模板。检查相对 config/valueMap 请求、媒体路径、`useTemplateValue` 和同源父窗口预览更新；注册函数时仍连接本地 `ws://127.0.0.1:5176`。再检查不同源 window 更新被拒绝，dispose 后旧监听/重连停止。
5. 将注入配置改为缺字段或非法 origin，首次默认调用应同步失败，不能连接本地 WS。初始化默认实例后绑定另一个 runtime，应明确报错。
6. 本地非 Vite：先在模块顶层调用 `registerTemplateFunction`，再安装插件并传 `configJson`，检查相同 runtime/bridge 被复用、配置和值同步可读、本地 runtime.ready resolve。较早的文件读取完成或失败后不得覆盖显式配置。Browser 入站 template_function_call 分别省略 target、传 null、数组或空对象，应回 function_error/TARGET_NOT_ACTIVE 且 handler 未执行。

先构建并消费本仓库的新 SDK 产物，再重新构建模板 ZIP。旧 ZIP 中的既有 SDK 不会因平台升级自动获得 native runtime；需要重新打包或明确采用平台认证的 legacy-bridge。
