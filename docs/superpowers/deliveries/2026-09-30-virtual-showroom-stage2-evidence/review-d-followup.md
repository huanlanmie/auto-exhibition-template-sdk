# Task D follow-up independent static review

Reviewed revision: **working tree**, 2026-09-30, following the fixes to D-1 through D-6 in `review-d.md`. Scope is shared Worker code and the Task B DXF entry identity contract only. Task C is still being edited and is not approved here. No tests, conversions, build, browser QA, startup, installation, source changes or Git mutations were performed by this reviewer; only this report was written.

## Resolution evidence

All paths below are under `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/`.

| Finding | Static resolution | Result |
| --- | --- | --- |
| D-1: main-thread DXF analysis deadline | `src/api/analyzeRoute.js:9`–28 starts a dedicated worker, attaches the parent AbortSignal, terminates on abort, and awaits termination in finally. The response/slot/workspace cleanup is reached only after the off-thread helper settles. `src/cad/analyzeWorker.js:5`–8 runs the synchronous parser inside the worker and sends only preflight or a fixed failure. The parent event loop can now service the deadline and disconnect callbacks while parsing runs. | Resolved |
| D-2: lost DXF error codes | `src/browser/errors.js:39`–85 includes the deliberate DXF read, calibration, identity, topology, modeling and budget failures found in the current analyzer/builder/converter source. The code matcher at 96 accepts digits, including `DXF_UNSUPPORTED_3D`; messages remain from the fixed map. The Node worker uses the same mapper at `src/cad/analyzeWorker.js:7`. | Resolved |
| D-3: instance/deformation bounds and quality | `src/pipeline/metadata.js:24`–30 now prefers object.boundingBox and computes it when absent, falling back to geometry only for ordinary meshes, matching the relevant Three Box3 semantics. `src/browser/convert.js:100`–104 validates positive integer instance copies, limits each mesh to 100,000 copies, multiplies rendered vertices/triangles and enforces the 10 million rendered-vertex hard limit. Separate geometryVertices/instances are exposed at 123; quality reads the corrected rendered triangle statistics. | Resolved |
| D-4: same-package different-entry calibration | `src/api/analyzeRoute.js:58` computes SHA-256 over the actual selected entry bytes and adds entryHash to preflight. `src/converters/dxf.js:12`–16 independently hashes the fetched selected entry using Web Crypto and rejects a mismatched/missing calibration entryHash before modeling. `src/builders/dxfSpaceBuilder.js:25`–30 accepts the new field and validates both package identity and the trusted selected-entry digest. The contract now explicitly includes entryHash. Same-byte entries can legitimately share calibration; different bytes cannot reuse it merely because the ZIP hash matches. | Resolved in Worker/contract scope |
| D-5: advertised missing local dependencies | `src/config.js:38`–42 now includes converter helpers and DXF analyzer/geometry/builder/Node-worker modules in allPresent dependency lists, plus the relevant fixed vendor resources. Missing a scoped local helper disables its optional provider; the base mesh readiness guard remains. Exact dependency version verification remains the build script's responsibility. | Resolved |
| D-6: unknown OCCT source units | `src/browser/convert.js:116` distinguishes an explicitly supplied source/sourceUnit property from an absent provider value. Explicit null is retained in normalization.inputUnit; the existing loaded.units merge also retains source:null. The common normalization still applies meter output exactly once and permits user extra scale. | Resolved |

## Remaining Critical / Important / Minor findings

None identified in these reviewed fixes. No new blocking issue was found from their control flow or shared interfaces. This conclusion is based on reading the implementation and its actual provider/Three integration, not on a build result.

## Declined to judge

- Task A provider implementation: authored by this reviewer, so independent approval must come from another seat.
- Task B modeling/topology changes beyond entryHash input and validation: outside this follow-up scope and separately reviewed.
- Task C UI forwarding of entryHash and remaining Java/UI work: explicitly still in progress and excluded; its independent review must verify the finished UI carries the new preflight field.
- Real conversion success, material fidelity, CAD completeness and measured termination/performance behavior: no functional execution is authorized, so these remain user manual acceptance items.

## Verdict

**Approved for Task D shared-code static review and the DXF entry identity integration.** D-1 through D-6 are closed in the reviewed working tree. This supersedes the blocking Task D verdict in `review-d.md` for those findings, while preserving that report as the original review record. It is not approval of unfinished Task C or a claim of runtime/model acceptance.
