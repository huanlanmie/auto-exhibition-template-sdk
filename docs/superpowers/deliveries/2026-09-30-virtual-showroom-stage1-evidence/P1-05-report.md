# P1-05 implementation report

Status: implemented, SDK build passed. Branch: `codex/virtual-showroom-stage1`. No automated functional tests created or run. No commits, staging, subagents, planning-document edits or unrelated developer-asset edits.

## Changes

- Added reusable transport types in `src/runtime/communication/transport.ts`; old local transport file re-exports TemplateBridgeMessage/TemplateTransport for compatibility.
- Added typed BrowserHostTransport: exact parent origin/source authentication; protocolVersion 1 and visitorSessionId/screenId/runtimeId matching; ready/init/ACK and MessagePort envelopes; bounded pre-handshake queue; terminal handshake failure; explicit close/disposal.
- Added createTemplateRuntime and runtimeRegistry, exported their public APIs/types, and added Vue runtime injection key. SDK plugin shares runtime context/bridge; Vue setup favors injected runtime while module-level API uses default registry.
- Default runtime consumes `window.__AUTO_EXHIBITION_TEMPLATE_RUNTIME__` on first access. Present but invalid config fails explicitly. Explicit binding must match injected browser config. Replacing an initialized default fails. Disposed registry is retained, preventing fallback to local WS.
- Context exposes ready/setValueMap/dispose; aborts file reads and removes preview listener; snapshot revision protection prevents old file reads overwriting newer snapshots. Browser updates come only through the authenticated port; local preview retains same-origin parent window updates and document-relative files.
- Runtime supports frozen-contract `initialValueMap`; `valueMap` is an alias and loses precedence to initialValueMap. A supplied snapshot skips file fetch; optional configJson still undergoes SDK artifact validation/normalization. Browser ready waits for both context and handshake and auto-disposes on bootstrap rejection. Local ready does not initiate a WS connection.
- Function bridge registers pending calls before send, cleans failed sends, rejects duplicate pending IDs, unsubscribes transport handlers, clears registries/listeners/timers, and suppresses async handler replies after disposal. Local transport close is terminal and stops reconnect work.
- Browser runtime includes explicit namespaced-host storage API (does not rewrite arbitrary template localStorage).
- README and `docs/api/templateBridge.html` updated; new `docs/api/templateRuntime.md` contains the full API, bootstrap, platform protocol and M05/M06/local manual procedures.

## Platform consumption contract

1. Before any App scripts, server injects `{protocolVersion:1,hostOrigin,identity:{visitorSessionId,screenId,runtimeId}}` into `window.__AUTO_EXHIBITION_TEMPLATE_RUNTIME__`. Server must validate host origin/screen membership and safely HTML-escape serialized JSON. Native compiled template uses its own bundled SDK; do not load an external second SDK bootstrap/registry.
2. Child posts `exhibition-template-host:ready` to exact hostOrigin; host authenticates child origin, iframe source and identity.
3. Host posts `exhibition-template-host:init` with version/identity and exactly one MessagePort in the transfer list.
4. SDK binds/starts that port, then posts **child → parent window** `exhibition-template-host:ack`, version/identity, exact hostOrigin. ACK is not a port message. SDK marks connected after successfully sending ACK, then emits queued port messages. Host must validate ACK origin/source/identity, mark its instance connected and send sdk_ready through the port.
5. Every port message wraps `{protocolVersion:1,identity,payload:TemplateBridgeMessage}`. Identity/version mismatch is silently discarded. MessagePort event.origin is not used for authentication.
6. Host receives register_functions and local invoke_function; for its one active runtime sends template_function_call back, then routes function_result/function_error by messageId. Hardware-directed function targets fail HARDWARE_UNAVAILABLE; missing/inactive target fails TARGET_NOT_ACTIVE. Optional local templateSessionId is the runtimeId, not screenId. Host must enforce active-runtime restrictions independently of SDK.
7. Host config updates wrap payload `{type:'auto-exhibition-template-sdk:update-value-map',payload:{valueMap}}` inside the authenticated envelope. Bare browser window update messages are not accepted in browser mode.
8. Storage requests wrap `{type:'storage_get'|'storage_set'|'storage_remove',requestId,key,value?}`; responses `{type:'storage_result',requestId,value?}` or `{type:'storage_error',requestId,error:{code,message}}`. Storage namespace is owned by host and comprises visitorSessionId/screenId/runtimeId. Default storage request timeout is 10 seconds.

## Public API

`createTemplateRuntime({mode?,browserHost?,configJson?,initialValueMap?,valueMap?,transport?,handshakeTimeoutMs?})`; transport override is local-only. Runtime returns mode, browserHost?, context, bridge, ready, disposed, storage?, dispose().

`setDefaultTemplateRuntime(runtime)` must run before App import if explicit bootstrap is used. `getDefaultTemplateRuntime()` supports native injected configuration automatically. Vue installation: `app.use(TemplateSdk,{runtime})` (runtime optional). `useTemplateBridge()` honors setup injection.

Browser storage API is `runtime.storage.get(key)`, `set(key,value)`, `remove(key)`, all Promise-returning. Config/context API is `runtime.context.setValueMap(snapshot)` plus existing reactive refs and lookup methods.

## Validation evidence

- Final `pnpm build`: exit 0, Vite 8.0.8 production build + `tsc -p tsconfig.build.json` declarations passed. 21 modules transformed; generated `dist/sdk/index.js` 26.16 kB, gzip 7.12 kB. Root package `index.js` and `index.d.ts` point to regenerated dist SDK outputs.
- Initial build caught TypeScript erasableSyntaxOnly parameter-property syntax; changed to an explicit field and reran successfully. Final build after all code changes passed.
- `git diff --check`: exit 0. Git prints expected existing LF→CRLF policy warnings, no whitespace errors.
- No automated functional tests executed. Manual protocol/security/lifecycle checks remain unexecuted and are documented for root/user acceptance; no claim of browser end-to-end verification.

## Manual handoff / practical limits

M05: verify cross-origin ready/init/window ACK/port sdk_ready, local echo, hardware/non-active error codes, spoofed source/origin/version/identity rejection, authenticated value-map update, snapshot/read race and storage namespace isolation. Wait runtime.ready before result-bearing function calls.

M06: dispose with a pending function and storage request; verify rejection, disconnected state, idempotent disposal, no stale handler reply/listener update, no local WS fallback and rejection of future operations. Explicit runtime disposal is required when a child template is removed; MessagePort does not provide a portable remote-close notification, so silent host disappearance is detected by pending-request timeouts or lifecycle disposal.

Local: omit injection and use old Vue install. Verify relative config/valueMap files, old same-origin parent preview updates and local WS bridge behavior; dispose stops listeners/reconnect. Invalid injected config must fail instead of fallback. Rebinding initialized default must fail.

Build SDK before template consumption and rebuild/upload native template ZIP; existing ZIP bundles do not upgrade automatically. Root owns platform integration and Git commits. Build output is ignored by repository Git policy; source changes plus packaging/build consumption are the reviewable deliverable.

## Review fix round 1

Both requested findings were confirmed against source. The referenced `scratch/P1-05-review.md` is absent in the SDK checkout, so this round follows the two precise findings supplied by root.

1. A module-level bridge access could initialize the default runtime before `app.use(TemplateSdk,{configJson})`; supplied configuration was ignored. Added `context.setConfigJson()` to validate and update the existing context/normalized snapshot, abort obsolete artifact-file reads, and guard against late config/map overwrite. Existing default runtime access applies explicit config to that same instance; plugin installation with `{runtime,configJson}` also honors config. No second bridge or mode/transport replacement occurs. The local runtime/context current ready becomes fulfilled for explicit config even if previous relative-file loading failed. Attempts to change initialized mode, browserHost origin/identity or transport options now explicitly fail.
2. Browser `template_function_call` with absent/null target reached handlers. It now rejects absent, null, non-object, array or missing-mode target with `function_error`/`TARGET_NOT_ACTIVE` before checking/executing registered handlers. Non-local mode still returns `HARDWARE_UNAVAILABLE`; mismatched local templateSessionId still returns `TARGET_NOT_ACTIVE`.

Round changed files: `src/sdk/types.ts`, `src/sdk/index.ts`, `src/runtime/runtimeRegistry.ts`, `src/runtime/context/createTemplateContext.ts`, `src/runtime/createTemplateRuntime.ts`, `src/runtime/communication/templateBridge.ts`, `docs/api/templateRuntime.md`, and this report.

Verification: final `pnpm build` exit 0 (Vite 21 modules + declaration tsc), SDK output 27.47 kB/gzip 7.35 kB; `git diff --check` exit 0. No automated functional tests, commits or staging. Manual follow-up cases were appended to API doc: module-level function registration followed by plugin config installation; explicit configuration during an obsolete file read; incoming target absent/null/array/empty object must never execute its handler.
