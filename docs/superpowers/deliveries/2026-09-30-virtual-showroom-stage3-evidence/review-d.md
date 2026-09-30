# P3 Task D independent static review

Reviewed revision: **working tree**, 2026-09-30. Reviewer: `/root/stage11_backend_graph`, independent of Root's Task D implementation. This reviewer authored Task B and therefore **does not approve or independently review the six Task B files**, including the latest Job observer repair. A separate reviewer must approve those files.

Scope: Worker `src/config.js`, `formats.js`, `protocol.js`, `io/jobWorkspace.js`, `api/analyzeRoute.js`, `api/convertRoute.js`, `api/jobSlots.js`, `browser/runner.js`, `browser/convert.js`, `browser/errors.js`, `pipeline/metadata.js`, `providers/ifcProvider.js`, `providers/nativeFailure.js`, `scripts/build.js`, `scripts/generate-stage3-samples.js`, package/lock and necessary read-only provider-interface references. Authority: P3 contract and Task D plan. No implementation, engine execution, input parsing/conversion, tests, browser QA, startup, install or Git mutation was performed during this independent review.

## Critical / Important

No unresolved Critical or Important issue found in the reviewed **Task D** snapshot.

## Minor D-M1 — closed: explicit DWG browser provenance failure message

- File: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/browser/errors.js:3` (fixed-message map).
- Trigger: trusted DWG intermediate provenance validation deliberately throws `DWG_DERIVED_INVALID` through the browser converter interface.
- The initial reviewed map lacked this code, so `browserFailure` reduced the deliberately classified failure to generic `CONVERSION_FAILED`. This was fail-closed and did not leak private data, but lost the actionable re-analysis reason.
- Recommendation sent to Root: add a fixed `DWG_DERIVED_INVALID` message instructing the owner to analyze/confirm the DWG again. No conversion behavior change is needed.
- Final static re-read confirms Root added that exact code and fixed actionable message at `browser/errors.js:8`. Closed before delivery; no unresolved Minor remains.

## Evidence and contract assessment

1. `config.js:47–57` keeps IFC/DWG optional, requires static provider files plus native readiness, exposes explicit scope/schema/version/disabled reason and `manual-required`, and does not claim real quota or format acceptance. The final DWG list now includes its transitive P2 DXF converter/analyzer/geometry/builder/worker/parser dependencies. `formats.js` retains all eight P2 formats and aliases while adding `ifc`/`dwg`; unsupported native isolation does not itself make mesh/P2 readiness false. Package and lock pin web-ifc 0.0.78 and LibreDWG 0.7.14 without upgrading the P2 pins.

2. `protocol.js:9–24` continues to authenticate the complete raw body with timestamp, nonce, HMAC and replay protection before admission. Lines 40–41 validate canonical owner/room scope as a distinct signed request field and require it for explicit DWG. The selected-auto-DWG provider interface also requires scope. The workspace still verifies the original package SHA before unpacking (`io/jobWorkspace.js:46–47`), rejects unsafe/archive entries and uses bounded source/expansion budgets. Entry detection adds IFC versus STEP header discrimination and DWG magic without changing the private storage allowlist.

3. Both routes keep concurrency acquisition, overall deadlines and disconnect cancellation. Native preflight/prepare dispatch occurs before browser conversion. The final cleanup branches (`api/analyzeRoute.js:78–87`, `api/convertRoute.js:65–78`) preserve `NATIVE_CLEANUP_UNCONFIRMED`, do not overwrite it with the outer abort code, and retain its workspace. The fixed public message does not expose process paths. Whether Task B actually establishes quiescence is explicitly outside this review; the shared caller now respects its failure contract.

4. `providers/ifcProvider.js:9–48` hashes the actual selected entry, enforces the IFC input cap and calibration hashes, requires no common centering, checks fixed regular-file output paths under the child directory and size limits, checks GLB header/declared length, and verifies public/private source and version provenance. It returns only `scene.glb` in the derived route map; `ifc-properties.json` stays a separate fixed `model-private` artifact. Task A owns IFC schema/geometry/property semantics and receives a different independent review.

5. `browser/runner.js:13–35` adds only the two browser converters to an explicit application-module set. Derived bytes are accessible solely through Root's trusted filename map, not ZIP entries/options; IFC properties and native provider/WASM modules are absent from this map and vendor routes. External network requests remain blocked. `convertRoute.js:54–62` constructs the public manifest before adding the fixed private IFC artifact; the sidecar is not listed in public manifest resources. Combined public/private output size remains capped and every artifact receives a digest and fixed descriptor.

6. `browser/convert.js:69–79` applies provider metre/Y-up hints once. DWG joins DXF in bypassing the common additional scale, leaving existing P2 normalization rules intact. IFC metadata propagation at lines 128–136 selects the contract public summary/element fields and does not copy private sidecar contents. The referenced trusted provider summary uses generated floor labels, safe type/count/identity fields and only georeferencing presence/applied flags; original names, descriptions, CRS and exact datum remain outside these public fields.

7. `pipeline/metadata.js:4–11` makes IFC stable identity conditional on format, canonical flag, exact basis and both well-formed GUIDs. Other formats do not inherit that privilege. Lines 75–87 downgrade repeated identities in both catalog and GLB extras. Existing catalog count/depth/ID limits and userData clearing remain in place. Mesh fragments without the canonical element anchor remain heuristic. The common layer does not promote EXPRESS IDs or DXF-derived handles to stable IFC identity.

8. `providers/nativeFailure.js` translates known native codes to fixed messages and constructs `ConversionError` only for deliberate classifications; unmatched native errors become the fixed IFC fallback. Actual route callers expose only deliberate application errors, while filesystem/network/Playwright failures use generic public messages. `INVALID_IFC` is supplied through the IFC fixed-message table; Root separately fixed its native transport exception allowlist. This review does not approve that Task B edit itself.

9. `scripts/build.js` only syntax-checks JS/MJS/CJS, resolves and reads pinned dependency metadata, checks fixed deploy files, and runs the launcher's declared `-CompileOnly` mode on Windows. It does not invoke provider parsing or conversions. The fixture generator writes deterministic IFC-SPF source text and hashes, including millimetre/metre, shifted-wall, datum, duplicate-GUID and schema cases; it does not fabricate a DWG or initialize an engine. Source fixtures remain manual inputs, not evidence of successful conversion.

## Verdict

**Approved for Task D static integration.** No unresolved Critical, Important or Minor remains in this snapshot. This verdict does not approve Task B authored code, Task A IFC internals, Task C backend/UI, actual Job quota/termination, drawing compatibility, generated fixture acceptance, or visual correctness. Those remain independent review/manual acceptance responsibilities; no build or static inspection is presented as functional proof.
