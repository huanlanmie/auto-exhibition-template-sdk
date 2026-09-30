# Task D independent static review

Reviewed revision: **working tree**, based on platform HEAD `3413afc25305bf437e7bd74fd38827fd35bcbe85`, 2026-09-30. Findings refer to the source snapshot read during this review, before root's announced fixes. No test, conversion, build, startup, installation, source mutation, index mutation or commit was performed by the reviewer. This report is the sole output written.

Authority: SDK `docs/superpowers/contracts/virtual-showroom-stage2.md` and Task D in `docs/superpowers/plans/2026-09-30-virtual-showroom-stage2.md`. Method: independent read-only review using the requesting-code-review reviewer template; concrete severity, trigger and remedy are recorded below.

## Scope and strengths

Read shared Worker formats/config/protocol, workspace acquisition/unpack, convert/analyze routes and shared job slots, browser runner/dispatcher/error map/HTML, metadata/quality, main routing, package pins/lock, build script and sample-generation code. Read provider interfaces and selected installed Three code only to verify integration; Task A provider implementation is not approved from this seat.

- Source acquisition retains SHA-256 verification, realpath containment, explicit allowed HTTP origins, no redirects, bounded ZIP expansion, entry selection and workspace cleanup. Browser resources are served through an explicit application-module list and verified package-file catalog; external network requests are blocked.
- Convert and analyze share HMAC nonce authentication and the same active-job slot set. Public error handling uses deliberately constructed failures and fixed browser messages rather than raw filesystem/loader exception strings.
- Provider hints come from fixed code rather than request options. FBX Y-up is not rotated twice; OCCT meter output is not rescaled by source units; DXF unit/axis/extra-scale work is bypassed centrally after provider construction.
- Metadata captures normalized matrices and sanitized source identities before clearing arbitrary userData. Only DXF's raw handle-chain basis is treated as stable. Quality settings are passed to GLTFExporter, with explicit soft triangle/output budgets and a 100 MiB GLB hard ceiling.
- Dependencies are exact pins; the build script explicitly reports syntax/dependency checks rather than claiming model conversion acceptance.

## Critical

None identified in the reviewed shared-code snapshot.

## Important

### D-1 — synchronous Node DXF parsing bypasses the analysis deadline

File: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/api/analyzeRoute.js:35` (timer at 21, post-parse abort check at 48).

Trigger: an authenticated bounded DXF whose synchronous parse/expansion takes longer than `config.timeoutMs`, or a client disconnect while it parses. `analyzeDxf` runs directly on the API event loop. The setTimeout and response-close handler cannot execute while this function is running; the following microtask can reach `throwIfAborted()` and send success before the overdue timer fires. Health requests and unrelated request processing also stop during the parse.

Impact: analysis does not honor the same deadline/cancellation isolation as browser conversion, contrary to the explicit Stage 2 boundary.

Fix: run Node DXF parsing in a dedicated terminable worker thread/child process; keep timeout and disconnect handling in the parent, terminate and await the worker before freeing its slot/workspace, and propagate only fixed failures. Root acknowledged this finding and announced a worker-thread fix; that fix is not included in this initial verdict.

### D-2 — DXF validation errors are discarded by the fixed error map

File: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/browser/errors.js:3` (map through 44; fallback at 47–51). Call sites: `src/api/analyzeRoute.js:37` and `src/browser/convert.js:144`.

Trigger: malformed/binary DXF, unsupported encoding, missing calibration, changed source hash, or an unsupported entity on a modeled layer. The DXF modules throw deliberate `DXF_*` codes, but none are in this map. Both analysis and conversion therefore replace them with generic `CONVERSION_FAILED`.

Impact: the UI cannot tell users whether to confirm units, redo calibration, ignore a layer, choose ASCII, or reduce source complexity. This loses the planned actionable diagnostic behavior; it also hides the exact identity mismatch which should prevent stale calibration reuse.

Fix: add a fixed public message for each deliberate Task B error code, without forwarding source-provided messages/paths. Preserve error-vs-warning behavior and use the same mapping for Node analysis and browser conversion. Root acknowledged and is awaiting Task B's final code list.

### D-3 — instanced/deformed model metadata and instance quality counts are inaccurate

Files: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/pipeline/metadata.js:24`–26; `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/browser/convert.js:100`; quality consumer `src/pipeline/optimize.js:24`–27.

Trigger: an accepted glTF `EXT_mesh_gpu_instancing` mesh with translated/scaled instances, or a SkinnedMesh whose default-pose bounds differ from its base geometry. The existing glTF provider supports the instancing extension and Three creates an InstancedMesh. Metadata always copies `geometry.boundingBox` instead of the object-level bounding box that includes instances/deformation. Meanwhile shared triangle statistics count the base geometry once, regardless of InstancedMesh.count.

Impact: anchor bounds can describe an empty origin region rather than the actual building and differ from the top-level Box3 bounds. A 1,000-triangle mesh instanced 1,000 times reports only 1,000 triangles and evades the mobile/desktop soft quality warnings despite rendering 1,000,000 triangles.

Fix: use the object-aware bounding-box semantics used by Three Box3 (compute/use object.boundingBox where supplied, otherwise geometry bounds); keep metadata bounds finite. Validate and budget instance counts, and count rendered triangles across instances for quality, while exposing unique geometry counts separately if useful. Do not silently pretend instance transforms are independent stable anchors.

### D-4 — calibration package hash does not distinguish multiple DXF entries

Files: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/api/analyzeRoute.js:35` and 46; `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/browser/runner.js:61`–63. Integration evidence: `src/converters/dxf.js:11`, `src/builders/dxfSpaceBuilder.js:25`–28 (interface read only).

Trigger: a ZIP contains `a.dxf` and `b.dxf` with overlapping handles/layer names. Analyze and calibrate a.dxf, then submit b.dxf as options.entryFile while retaining the prior options.dxf. Both analyses use the same verified package sourceHash; the shared browser context passes that same hash for either entry. The calibration shape does not bind an entry identity, so the builder hash check passes.

Impact: a's reference length, layer decisions and openings can be applied to b despite the contract saying another file's analysis cannot be reused. Package integrity alone proves neither which entry was calibrated nor that the same entry is being modeled.

Fix: retain package sourceHash, and additionally bind calibration to a verified selected-entry identity (e.g. normalized entryFile plus entry content digest). Return it in preflight, include it in the calibration contract, and validate it against the actual selected entry before modeling. Coordinate the small contract/UI/provider interface addition with B/C. If a deliberately package-wide calibration policy is desired instead, that is a spec change requiring an explicit decision, not an implicit assumption.

### D-5 — readiness advertises providers with missing transitive local modules

File: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/config.js:38`–41.

Trigger: partial deployment includes a converter entry and vendor loader but omits `meshImportSupport.js`, or includes dxf.js/parser but omits dxfAnalysis.js, dxfGeometry.js or dxfSpaceBuilder.js. Current enabled checks only inspect the entry and principal vendor file(s). Health continues advertising those formats and createJob accepts them; the actual conversion fails at dynamic import.

Impact: the advertised capability list is not the set of usable deployed providers, contrary to the contract's explicit partial-provider deployment requirement.

Fix: define each provider's complete fixed local-module/vendor-file dependency list and gate readiness on every member (including the new Node analysis worker for DXF). Retain independently available base mesh conversion. Report actual installed pinned versions or validate them when constructing readiness, rather than assuming labels establish compatibility.

## Minor

### D-6 — normalization summary invents an OCCT source unit

File: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/browser/convert.js:113`.

Trigger: a STEP/IGES provider deliberately returns `units.source: null` and `normalizationHint.sourceUnit: null`, because OCCT does not expose the source unit. The nullish fallback proceeds to options.unit/default `m`, so report.normalization.inputUnit claims m (or the user's irrelevant source unit), while report.units.source correctly remains null.

Impact: physical output remains correct, but exported metadata contradicts itself and gives a false source-unit provenance claim prohibited by the contract.

Fix: distinguish explicitly unknown source units from missing provider metadata; preserve null/unknown when a provider supplied a units object or an explicit sourceUnit property. Do not replace OCCT's unknown source unit with the output meter convention.

## Declined to judge

- Task A provider algorithms themselves: this reviewer authored those files; an independent seat must approve them. Only shared interface compatibility was considered here.
- Task B CAD geometry correctness beyond shared context/error/entry-identity integration: assigned to a separate independent review; no approval of its topology/modeling algorithms is implied.
- Task C Java/UI ownership, CAS and reimport matrix logic: outside Task D source scope and assigned separately.
- Visual material fidelity, real CAD completeness, performance timing and successful end-to-end conversions: functional execution is explicitly prohibited this stage; no runtime claims are made from static inspection.

## Assessment

**Ready to merge: No, pending Important fixes and independent static recheck.** Shared isolation, normalization and metadata structure are coherent, but the analysis deadline, DXF failure reporting, multi-entry calibration identity, instance accounting and truthful readiness need correction. D-6 should be fixed alongside these small shared-report changes. No Critical issue was identified; this is not a functional acceptance verdict.
