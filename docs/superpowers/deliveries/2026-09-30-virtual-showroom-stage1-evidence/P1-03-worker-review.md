### Spec Compliance

- ❌ Issues found in Worker P1-03: unsupported required glTF extensions are accepted as partial output, and malformed indexed geometry can be reported as successful. See Important findings below.
- ⚠️ Java verification/persistence before SUCCEEDED, bounded executor/retry handling, owner-scoped attachment, partial acknowledgement, and admin integration are outside this Worker-only diff and must be checked by the integration reviewer. This review does not treat their absence from Worker ownership as a missing implementation.
- ⚠️ Browser execution, conversion fidelity, cancellation timing, and public proxy behavior remain manual verification items. No browser, server, conversion, functional test, smoke test, or build was run during this review. Implementer-reported syntax/dependency build is not functional evidence.

### Strengths

- `virtual-showroom-worker/src/protocol.js:8–24` signs the raw-body digest with epoch seconds, checks the 300-second window, compares HMAC with timingSafeEqual, and retains nonce replay state for the full acceptance window.
- `virtual-showroom-worker/src/io/jobWorkspace.js:11–80` constrains source realpaths/origins, requires a source digest, bounds streamed acquisition and ZIP expansion, and rejects traversal, links, special files and path collisions. `src/api/convertRoute.js:33–48` independently bounds aggregate output and hashes each artifact.
- `virtual-showroom-worker/src/main.js:11–24` validates the public prefix, strips `/showroom`, forwards only a header allowlist, injects its own runtime secret, rejects redirects, and excludes upstream cookies/authentication headers from responses.
- `virtual-showroom-worker/src/browser/convert.js:40–80` reports actual conversion stages and applies unit/axis/centering transforms; `src/converters/gltf.js:26–29` and `src/converters/obj.js:15–24` explicitly record missing texture/material degradation.
- `virtual-showroom-worker/package.json:13–15` and inspected `package-lock.json:46–50` agree on Three 0.186.1. No version mismatch was found.

### Issues

#### Critical (Must Fix)

- None found by static inspection.

#### Important (Should Fix)

1. **[P2] Reject unsupported required glTF extensions before loading.** `virtual-showroom-worker/src/converters/gltf.js:21–29,43–47`; `src/browser/convert.js:9,84–85`. The preflight validates version and resources but never checks `extensionsRequired` against actual configured capabilities. The installed Three loader only calls `console.warn` for an unknown required extension (`node_modules/three/examples/jsm/loaders/GLTFLoader.js:508–539`), so the Worker captures that warning and emits an otherwise usable `result` with `status:partial`. A package with valid fallback mesh bytes and a required unsupported extension can therefore lose required scene/material semantics and still be accepted after ordinary partial acknowledgement. Required extensions are capability failures, not the allowed missing-texture degradation. Maintain an explicit supported-required-extension check (including decoder availability) and fail before producing artifacts.

2. **[P2] Validate index buffers before declaring geometry valid.** `virtual-showroom-worker/src/browser/convert.js:65–71`. The geometry guard checks only position count and finite position values; triangle count derives from index *length* without checking index values. For example, three finite positions and indices `[9,9,9]` produce one reported triangle and finite bounds despite containing no valid triangle. Three assigns the accessor directly as the index (`node_modules/three/examples/jsm/loaders/GLTFLoader.js:4880–4888`) and the exporter serializes that same index accessor (`node_modules/three/examples/jsm/exporters/GLTFExporter.js:2131–2152`), so this path can emit `report.status:success` and an invalid GLB with missing renderable geometry. Reject indices outside `[0, position.count)`, invalid triangle element counts, and empty indexed primitives; use nullish rather than truthy fallback when distinguishing indexed from non-indexed geometry.

#### Minor (Nice to Have)

3. **[P3] Sanitize coded filesystem errors as well as uncoded exceptions.** `virtual-showroom-worker/src/api/convertRoute.js:54`. Any error with a code other than ENOENT/EACCES/EPERM returns its original message without root-path replacement or the length cap. A ZIP with file `a` followed by `a/model.obj` triggers EEXIST/ENOTDIR during extraction and can disclose the absolute private work directory in the import failure. Only explicitly created public ConversionError messages should pass through unchanged; sanitize other Node error messages regardless of code.

### Assessment

- **Task quality: Needs fixes.** The service boundaries and artifact staging are well separated and bounded, but product validation does not yet prevent two classes of unusable/semantically unsupported models from becoming results.
- **Review checks:** Read the supplied Worker diff in sequential chunks, task brief, implementation report and contract. Used the task-reviewer method. No checkout/index/branch changes, staging, commits, subagents or execution checks were performed. The only write is this report.
- **Focused checks outside the diff:** inspected the package lock for exact dependency-version agreement; inspected installed Three loader/exporter code for named risks of required-extension handling, texture-load degradation/completion and index validation. No broader platform crawl was performed. Changed source was reviewed from the diff; a narrow diff scan supplied exact finding line numbers.

### Scoped rereview — correction round 1

- **Spec compliance for reviewed corrections: ✅ Addressed. Task quality for this scope: Approved.** No Critical or Important regression was identified in the fixes by static inspection.
- **Finding 1 — ADDRESSED.** `virtual-showroom-worker/src/converters/gltf.js:8–16,35–38` now rejects required extensions outside an explicit capability allowlist, excludes unconfigured KTX2/Basis and AVIF, and checks Meshopt support. The listed names were compared with the actual pinned Three 0.186.1 loader's extension switch and registered plugins (`node_modules/three/examples/jsm/loaders/GLTFLoader.js:146–250,508–541,628–652`); no false allowed extension was found. Draco/Meshopt remain configured at `src/converters/gltf.js:72–73`. Unsupported-extension validation becomes a fixed structured failure through `src/browser/convert.js:100`, `src/browser/errors.js:7,25–29` and `src/browser/runner.js:59`, before artifact staging.
- **Finding 2 — ADDRESSED.** `virtual-showroom-worker/src/converters/gltf.js:41–50` validates primitive modes, index accessor shape/type and counts before loading. `src/browser/convert.js:67–76` then validates the decoded/triangulated index values and material groups, requires complete nonempty triangles, and distinguishes an existing empty index from absent indexing. The original three-position/indices `[9,9,9]` case necessarily raises INVALID_GEOMETRY_INDEX before export; that failure is propagated rather than emitted as success.
- **Finding 3 — ADDRESSED.** `virtual-showroom-worker/src/api/convertRoute.js:50–57` now exposes only deliberate ConversionError messages and sends fixed generic responses for unexpected exceptions, including EEXIST/ENOTDIR. `src/browser/errors.js:3–29` replaces browser/loader error text with fixed allowlisted messages, and the runner serves the new module and converts its failure result into a deliberate application error at `src/browser/runner.js:24,54–60`. Raw filesystem or Playwright exception messages no longer cross this boundary.
- **Scope and checks:** Read `worker-fix-review.diff` and the appended correction report; compared only the three earlier findings and direct fix integration. The supplied fix diff omitted the newly imported error module and runner changes, so those exact files were inspected to verify that the module is served and structured failures reach the route. The pinned loader was inspected solely to validate the extension allowlist. No broader review, build, functional test, browser, server or conversion execution was performed. Runtime behavior remains manually unverified as previously stated.
