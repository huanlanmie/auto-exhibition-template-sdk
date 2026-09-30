# SDD ledger — plan: docs/superpowers/plans/2026-09-30-virtual-showroom-stage1.md

SDK base 22442ce9e81fe40e5e77b72a786ec3d896af74ad; platform base 3b066c7c90e6fe7447ca9ced098c97590449738c.
Both checkouts are on codex/virtual-showroom-stage1. Existing platform modifications retained.

Ruling: preserve current checkouts on new feature branches — manual testing uses these paths and platform has existing changes — cost if wrong is local reversible branch/patch adjustment.
Ruling: manual tests only, builds permitted — explicit user instruction overrides skill-default TDD — user must confirm runtime behavior.
Ruling: parallel independent repositories/directories, root-only commits — developer requires useful delegation and plan identifies independent streams — shared entry/schema files integrated sequentially.
Ruling: Three.js pinned 0.186.1 in UI and Worker — verified npm registry metadata — old demo r160 not mixed into new runtime.

## Preflight pairs

| Tasks | Shared interface/files | Finding/ruling |
|---|---|---|
| P1-01/P1-02 | owner/detail/resources | contract fixed; resource service may read DB, never publishConfig |
| P1-02/P1-03 | source and staging resource manifest | normalized output hash verified by backend |
| P1-03/P1-04 | modelVersionId/assetKey | contract building.assetKey optional; canonical model path fixed |
| P1-04/P1-06 | screen object/binding | binding increments draftVersion; root integrates editor fields |
| P1-05/P1-06 | host identity/message port | injected config before app modules; native/legacy port identical |
| P1-06/P1-07 | template profile/preview | unverified persistent/hardware templates preview-only |
| P1-07/P1-08 | immutable revision/resources | Redis resource base holds revision; no admin cookies |
| P1-08/P1-09 | multi-entry/router/gateway | source patches preserve user bootstrap edits |

## Task self-consistency

| Task | Check |
|---|---|
| P0-01 | contract and baseline written; tools available, tests disabled |
| P1-01 | SQL separate from live DB; owner and optimistic update consistent |
| P1-02 | ZIP authoritative; DB value_map note corrected; relative resources require stable session base |
| P1-03 | bounded worker background task, actual progress, GLB/glTF/OBJ only |
| P1-04 | JS frontend existing design system; three-layer scene and stable IDs |
| P1-05 | runtime registry plus transport, old local behavior retained |
| P1-06 | one active runtime; legacy compatibility is restricted, not arbitrary browser certification |
| P1-07 | resource prep outside transaction; snapshot switch in short guarded transaction |
| P1-08 | only public narrow prefix; viewer independently bootstrapped |
| P1-09 | build checks and handoff, no automatic functional QA |

## Progress

Task P0-01: complete — contract v1 established; baseline/branch recorded. Other tasks not complete.
Task P1-05: fix round 1/5 — late configJson compatibility and missing browser target addressed; scoped review approved.
Task P1-05: complete (SDK 22442ce..b185d05, review clean; pnpm build exit 0, manual tests pending).
Task P1-01/P1-02/P1-03: implemented — final backend/Worker task review pending, Java and Worker builds recorded in reports.
Task P1-04/P1-06/P1-07/P1-08: integration in progress — root viewer/host present, editor preview/acknowledgement and public dependency pruning ongoing.
Ruling: executable templates only served through the isolated Worker proxy with server-owned secret — prevents privileged-origin execution — deployment must set matching secret and private backend reachability.
Ruling: immutable private bytes retained, no destructive asset collector — preserves old revisions and active sessions — orphan disk usage needs later operational cleanup.
Ruling: first stage uses one backend import coordinator — restart recovery has no distributed job lease — deployment must avoid overlapping coordinator replicas.
Task P1-03: fix round 1/5 — unsupported required glTF extensions, invalid triangle indices and unexpected private-path errors addressed; scoped review approved. ImportReport fields completed before broad final review.
Task P1-01/P1-02/P1-07/P1-08: fix round 1/5 — preview image validity/server provenance, atomic cancellation, rollback entitlement, early bootstrap and truthful replay response addressed; Java 14/14 build passed; scoped re-review pending.
Task P1-04/P1-06/P1-08/P1-09: fix round 1/5 — template aspect ratio, hotspot fallback and modal focus corrected; bound-screen upload identity and mobile safe areas integrated; UI 2177-module build passed; scoped re-review pending.
Ruling: capture preview provenance at upload against the persisted binding — manual preview image creation cannot otherwise prove instance identity — reupload is required after a binding change.
Ruling: align Java import concurrency to one active plus eight queued, matching Worker default — avoids ordinary parallel upload failures — higher throughput needs explicit matched service capacity.
Ruling: retain existing Maven/JBR warnings without unrelated upgrades — compilation succeeds with release17 and tests skipped — existing toolchain diagnostics remain visible.
Task P1-04/P1-06/P1-08/P1-09: scoped fix review clean — aspect ratio, hotspot fallback and focus approved; final upload format alignment ongoing.
Task P1-01/P1-02/P1-07/P1-08: fix round 2/5 — five findings approved; WebP header-only payload validation remains invalid, narrowing stage-1 preview image formats.
Ruling: previews accept PNG/JPEG only until a real WebP decoder is available — header structure cannot prove usable pixels — WebP images must be exported as PNG/JPEG first.
Task P1-01/P1-02/P1-07/P1-08: scoped backend review clean — PNG/JPEG decoding accepted, all important findings resolved; final Java 14/14 build passed.
Task P1-03: task review clean; platform worker commit c03ad1c4 plus richer report in ffd8993f.
Whole-branch review SDK b185d05 / platform ffd8993f: three Important integration defects; one consolidated fix wave dispatched (centering alias, import failure display, undo save boundary).
Ruling: undo/redo applies to unsaved edits in stage 1, successful save clears both histories — restored deleted bindings cannot bypass server authorization — undo cannot cross a completed save until a trusted restoration workflow is added.
Whole-branch final fix: platform ffd8993f..b4788404, three findings addressed; scoped final review approved, no direct Critical/Important regression. Worker and UI builds exit 0 after fix; no functional execution.
Task P1-01: complete — data/owner/permission/CAS API implemented, backend and final review clean.
Task P1-02: complete — private assets/template ZIP/runtime resource boundary implemented, review clean.
Task P1-03: complete — normalized model import/worker/typed reports/cancel implemented, builds and review clean.
Task P1-04: complete — shared scene/editor/navigation/undo save boundary implemented, build and review clean.
Task P1-06: complete — binding/preview/proportional isolated host/local functions implemented, review clean.
Task P1-07: complete — validation/provenance/immutable publish/update/offline/authorized rollback implemented, review clean.
Task P1-08: complete — anonymous independent viewer/fixed resource sessions/minimal manifest implemented, review clean.
Task P1-09: complete — mobile controls/safe areas/docs/builds/hand-test materials delivered. M01–M12 not executed.
Implementation complete. Feature branches retained; no merge/push/live SQL/Nacos/bucket/proxy application. Original 11 modified platform file hashes retained.
Final packaging: docs committed; SDK/platform committed feature ranges pass whitespace checks. Platform 32de9f25 only removes redundant trailing blank lines; no semantic source change after approved b4788404.
Scratch cleanup was rejected by automatic execution policy (reason: blocked by policy); no deletion occurred. Private ignored plan scratch retained; reviewed reports and public Maven settings remain preserved in delivery docs. Feature implementation is unaffected.
