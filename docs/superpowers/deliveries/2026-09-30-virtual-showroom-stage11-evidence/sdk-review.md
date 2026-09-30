# Spec compliance

- Approved for Task 2 against contract v1.1. No Important or Critical finding in the supplied SDK diff.
- Capability opt-in, legacy absence/false behavior, copied/frozen configuration, and explicit/injected/late configuration agreement are implemented at `src/runtime/communication/browserHostTransport.ts:28`, `:33`, `:187` and `src/runtime/runtimeRegistry.ts:13`, `:23`, `:32`, `:50`.
- Software target shapes are checked before queue/send: local receiver identity, optional binding source function, required unicast destination, mutually exclusive multicast destinations/group, broadcast-only shape, and explicit unknown-mode rejection at `src/runtime/communication/browserHostTransport.ts:64`, `:79`, `:180`. Events use their existing unicast/multicast/broadcast forms at `:198`.
- Inbound function calls invoke the local-target validator before handler execution, irrespective of capability, at `src/runtime/communication/templateBridge.ts:279`. Missing/malformed local targets and wrong runtime ids cannot reach the handler at `:305`.
- Host authority is retained: client ids/groups/graph permissions are not resolved by the SDK. The authenticated port envelope remains protocol version plus full identity at `src/runtime/communication/browserHostTransport.ts:208`; window source/origin/identity and port identity checks remain at `:224` and `:251`.
- No browser WebSocket/fetch fallback was introduced. Local WebSocket selection remains in unchanged `src/runtime/createTemplateRuntime.ts:13`; the new inbound check is guarded by `instanceof BrowserHostTransport` at `src/runtime/communication/templateBridge.ts:279`.
- Cross-project verification remains outside this SDK diff: stable `v:<visitor>:<screen>` assignment, frozen permissions, virtual-only destinations, receiver target rewriting and visitor isolation are host responsibilities. Existing `sdk_ready` consumption at `src/runtime/communication/templateBridge.ts:229` exposes the host-assigned logical client id unchanged.

# Strengths

- Incoming delivery validation is shared and stays stricter than outbound routing, avoiding a capability flag accidentally enabling nonlocal execution inside a template (`browserHostTransport.ts:64`; `templateBridge.ts:281`).
- Effective capability comparison treats absence and false consistently while preventing late enablement through normal registry APIs (`browserHostTransport.ts:28`; `runtimeRegistry.ts:21`).
- The diff limits functional changes to target/config validation. Pending function and storage registration remain before send (`templateBridge.ts:147`; `browserHostTransport.ts:283`), with existing close/disconnect cleanup and late-handler suppression preserved (`templateBridge.ts:188`, `:312`; `browserHostTransport.ts:298`).
- Documentation explains the required host rewrite and legacy/new ZIP compatibility instead of implying that a host upgrade retrofits an embedded old SDK (`docs/api/templateRuntime.md:58`).

# Issues

Critical: none.

Important: none.

Minor: none requiring a change in this task.

# Assessment and review scope

Task quality: Approved.

This was an independent read-only Task 2 review, not a review of the reviewer's earlier Java work. The exact supplied `sdk-review.diff` was read once. Whole-function context was inspected where diff hunks cut target validation, send, inbound execution, or registry branching mid-function. Focused unchanged-code checks covered two named risks: accidental native WebSocket selection changes (`createTemplateRuntime.ts`, `localBridgeTransport.ts`) and changed pending/disposal timing (the surrounding bridge/transport methods). No broad repository crawl, source/Git mutation, build, functional test, browser or service startup was performed. Only this report was written.

The implementer's successful build is reported evidence, not a rerun by this reviewer. User-requested absence of automated functional tests is not treated as a defect; the cross-project manual checks remain pending.
