# P1-05 task review and scoped re-review

## Initial review

Spec compliance: Issues found. Task quality: Needs fixes.

- Important: `src/sdk/index.ts:109` and `src/runtime/runtimeRegistry.ts:7` discarded legacy plugin configJson after module-level bridge access had initialized the default context. The retained local/non-Vite API could render empty or incorrect values while attempting nonexistent artifact-file reads.
- Important: `src/runtime/communication/templateBridge.ts:279` allowed incoming browser function calls with absent/null targets to execute registered handlers instead of returning TARGET_NOT_ACTIVE.
- Strengths: exact parent origin/source/version/identity authentication, window ACK before connected, authenticated port envelopes, pending-before-send registration, terminal transport disposal and snapshot revision protection.
- Cross-task limitation: server injection, host active-runtime enforcement and artifact rebuilding were not independently verified from the SDK task diff.
- Checks: initial task diff, authoritative contract, implementation report and runtime API documentation; focused source/call-site inspection for configJson compatibility and diff-cut functions. No automated tests, browser QA or builds executed.

## Scoped re-review — fix round 1

Spec compliance for both reviewed findings: ADDRESSED. Code quality for this fix scope: Approved.

1. ADDRESSED — legacy configJson compatibility. `src/runtime/runtimeRegistry.ts:29` now applies explicit configJson to the existing context, keeping its bridge and transport. `src/sdk/index.ts:111` also honors configJson with an explicitly supplied runtime. `src/runtime/context/createTemplateContext.ts:72` validates before mutation, increments config and snapshot revisions, installs normalized artifacts, marks current readiness fulfilled, and aborts the obsolete read. The artifact continuation checks revisions before writing and suppresses an obsolete failure when explicit configuration has superseded it (`src/runtime/context/createTemplateContext.ts:118`). Thus a pending previously captured ready promise resolves after cancellation rather than rejecting merely because explicit configuration replaced the file read. `src/runtime/createTemplateRuntime.ts:34` returns current context.ready in local mode, so later callers also recover after an already failed artifact load. An already settled rejected Promise retained by a caller naturally remains rejected; this does not block current runtime readiness or configuration recovery.

2. ADDRESSED — incoming browser targets. `src/runtime/communication/templateBridge.ts:280` checks that target is a non-array object with a string mode, returning TARGET_NOT_ACTIVE for absent/null/malformed targets before handler execution. Non-local modes retain HARDWARE_UNAVAILABLE, and mismatched local runtime IDs retain TARGET_NOT_ACTIVE (`src/runtime/communication/templateBridge.ts:285`).

New important fix-related breakage: None found by scoped source inspection.

Checks: read current modified SDK index/types, runtime registry/factory/context and incoming call validation, plus the appended fix report. No tests, builds, browser QA, staging, commits or subagents. Source behavior was reviewed statically; the implementer reports a passing post-fix SDK build.
