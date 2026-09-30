# Stage 11 Task 2 SDK report

Status: DONE. No staging, commits, tests, browser QA, application startup, or subagent dispatch performed.

## Changed files

- C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/src/sdk/types.ts
- C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/src/runtime/communication/browserHostTransport.ts
- C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/src/runtime/communication/templateBridge.ts
- C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/src/runtime/runtimeRegistry.ts (scope expansion authorized by coordinator)
- C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/api/templateRuntime.md

## Interface and behavior

BrowserHostConfig now has optional `capabilities?: {virtualRouting: boolean}`. Only true opts into software routing. Absent/false are semantically equivalent legacy local-only. Validation rejects null/arrays/non-booleans/unknown fields in capabilities, root config or identity; the validated copy freezes config, identity and capabilities. Protocol version remains 1.

Virtual-capable outgoing function targets accept local, binding, unicast, multicast and broadcast using the pre-existing public target types. Known fields only: local may include own runtime templateSessionId; binding may include nonempty sourceFunction; unicast requires nonempty clientId with optional nonempty templateSessionId; multicast requires exactly one nonempty clientIds string array or nonempty group; broadcast contains only mode. Malformed shapes reject INVALID_TARGET, unknown modes UNSUPPORTED_TARGET_MODE, missing/non-object/array/missing-mode function targets TARGET_NOT_ACTIVE. Legacy nonlocal outgoing function targets retain HARDWARE_UNAVAILABLE. Virtual-capable events validate existing unicast/multicast/broadcast shapes; local/binding/unknown event modes reject UNSUPPORTED_TARGET_MODE. Legacy event forwarding is unchanged.

Inbound template_function_call always requires local, optionally addressing only this runtimeId, independently of capability. Missing target or wrong runtime rejects TARGET_NOT_ACTIVE; nonlocal mode rejects UNSUPPORTED_TARGET_MODE; extra local fields reject INVALID_TARGET. These checks precede handler execution. The host must rewrite a routed child delivery to local and use the receiving runtimeId. Virtual IDs, graph rules, group lookup, authorization and fan-out remain host responsibilities.

Added internal matchesBrowserHostConfig equality including effective virtualRouting. Registry uses it for first injected/explicit config agreement, late explicit options, late global injection changes and setDefaultTemplateRuntime binding. Capabilities cannot silently change after initialization. Local configuration/valueMap updating behavior and identity comparison remain in place.

Logical clientId still comes from sdk_ready/client_id through the existing bridge.clientId getter. No new browser network transport or fallback; existing native LocalBridgeWebSocketTransport remains unchanged. Pending function and storage registration still precedes send; close/disconnect cleanup remains unchanged.

## Verification

Latest `pnpm build`: exit 0, Vite v8.0.8 built 21 modules in 98ms, followed by successful `tsc -p tsconfig.build.json`. Output SDK bundle dist/sdk/index.js: 30.31 kB / 7.91 kB gzip. The earlier build also passed; final source changes were included in the latest build.

`git diff --check` for the five changed tracked files: exit 0. Static review confirmed browser transport contains no physical WS/fetch/fallback implementation, and call/storage pending set operations remain before send. Existing user untracked items were not modified or removed.

No automated functional validation was performed, per approved task constraints. API documentation includes updated human checks for capability opt-in, malformed targets, local inbound rewrite, capability mismatch, logical ID stability and visitor isolation.

## Compatibility and handoff

Rebuild SDK and then consuming template ZIPs to gain software routing. Existing SDK copies inside old ZIPs do not gain capability from host upgrade alone. Old browser hosts with no capability retain local-only outgoing functions. New host must advertise only the declared capability object, deliver routed calls as local, provide stable `v:<visitorSessionId>:<screenId>` logical clientId and enforce frozen graph/virtual IDs. Native/local APIs and old function direction types remain unchanged.

Ruling: capabilities accepts boolean to support the requested explicit false legacy mode; absent and false compare equal because neither grants routing. Cost if wrong: a future contract requiring exact presence equality would need a stricter comparison.

Ruling: multicast requires exactly one destination form (clientIds or group), and rejects unknown fields, to make malformed software targeting explicit. Cost if wrong: callers supplying both forms need to choose one before invoking.

Ruling: incoming nonlocal calls use UNSUPPORTED_TARGET_MODE even under legacy mode; outgoing legacy functions retain HARDWARE_UNAVAILABLE. This separates forbidden host-delivery target modes from the compatibility behavior of callers on an older host.

No open implementation concerns. Build and static review do not substitute for the cross-project human interaction checks.

## Authenticated hidden media follow-up

Coordinator re-authorized only browserHostTransport.ts, templateRuntime.md and this report. Native transport now consumes authenticated port payload `{type:'host_visibility',visible:boolean}` after the normal connected/protocol/identity checks; malformed visible is ignored, and bare window messages cannot reach the control. false pauses document audio/video. A capture listener also pauses subsequent play events while hidden, covering media mounted after the host's initial hidden signal. true does not automatically resume or play media. Pause failures are isolated per element and do not fail the transport; disposal removes the listener. No custom event or template-controlled injected event name is introduced.

Latest follow-up pnpm build: exit 0, Vite 21 modules in 96ms, TypeScript compile passed; SDK bundle 31.03 kB / 8.12 kB gzip. Scoped diff --check passed. No tests/browser/service startup. Source ownership is returned to coordinator; independent SDK incremental review belongs to the backend agent and is not included in this author's backend cross-review approval.
