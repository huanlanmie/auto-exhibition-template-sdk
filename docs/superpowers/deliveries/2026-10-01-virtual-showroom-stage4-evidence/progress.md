# P4 progress / rulings

Baselines: platform c7c142040ed54bf1d30abbd4732ab7b1b231c7f7; SDK1e12cb4abb3ccdf3e206f6f78ce72fdeaae3846d. Both branches codex/virtual-showroom-stage4, original paths retained. 11 original user bytehashes freshly captured; room1 ONLINE/draft6/public2/original model+digest, activeimports0 before work.

Ruling: latest user requests approved roadmap P4 implementation. Architectural refinements recorded in contract/plan without redundant permission/TDD gates; developer/user authorize continued action. Optional priority question pending, no answer inferred as approval. Work proceeds with stated large-scene priority and parallel real mesh3d route, independent of that optional preference.
Ruling: no unit/integration/E2E, model analysis/parse/conversion QA, browser business QA or engine/simplifier initialization by agents/tools. Pure input generation, compile/build/static independent review/readiness/preservation reads only. All actual functionality/performance remains user's manual acceptance.
Ruling: retain current saved checkout paths and features branches rather than moving live service/data or user work into a new checkout. Never reset source/data, snapshot again, publish505 or touch SQL/Nacos/physical client/device.
Ruling: optional static streaming keeps default off, full coarse plus atomic high chunks, high global metadata once, pinned Meshopt bounded-error LOD; max64/32MiB chunks/default100MiB aggregate maintained. Coarse resident bytes and high encoded bytes budget separated, no actual GPU quota claim.
Ruling: current fixed LibreDWG provides real faces/polyface/unsmoothedmesh fields, no ACIS triangulation/commercial engine installed. Implement only direct mesh3d and explicit rejection/disabled full-solid capability, no fake boxes/2d extrusions. No new unspecified native/animation formats.
Ruling: parent common integration owned Root; A only new streaming helper sources, B only new mesh3d sources, C only client runtime/lease/metrics+existing UI API. New chunkAssetCache.js approved for refcount/token lease reuse; C owns UI API, Root ImportWizard/newdwg3doptions. Exact task sources specified in plan before mutations; cross-review never approves own scope.

## Preflight interface/conflict scan

| Tasks | Shared file / interface | Result / ruling |
| --- | --- | --- |
| A–D | browser convert calls prepareStreaming; global metadata/quality | Root owns shared. capture raw canonical before collect, prepare afterward, once global IDs; returned scene exported by Root. |
| A–C | stream manifest/coarse IDs/frame | Unique streamAtomicId, not name/GUID/index; fixed SHA-free meta.streaming reference; normalized-model m/Yup and building transform once. |
| A–B | normalized static glTF | B returns safe native m/Yup scene; A generic static units only, no direct native dependency. |
| B–D | native module/caps/formats/workspace/UI | Root exact dispatcher/whitelist and dwg3d override .dwg mapping; B raw geometry only; auto stays existingdwg2d. |
| C–D | published descriptors/model document/owner API | ExistingScene schema remains unchanged; generatedcoarse marker selects fixedmanifest; descriptors frozen in backend. C UIAPI source ownership excludes Root concurrent mutation. |
| B–C | late loader/publicprivacy | Generic normalized GLB, no nativeengine in UI; bounded root markers and closed registered asset paths only. |
| A | options/caps/output | Exact {name,glbBase64} outputs, descriptors in manifest, digests/bytes verified Parent. No sample engine execution; syntax only. |
| B | sourceunits/topology/rawnative | Signed dualhash, original vertices, safe heapcopy/lifetime, genuine3D blocks; strict unsupported excludes solids, no commercial tools. |
| C | resolver/queue/model epoch | Sync lease closure per record, refcount+token; no key-only ABA cleanup; ≤2loads/worlddistance/hysteresis/budget/coarsefallback. |
| D | inlineartifacts/Java closedgraph/metadata digest | Meta doesn't depend on stream SHA; stream gets final meta+coarse SHA; publicmanifest last, private excluded; validate then originalCAS. |

Implementation A/B/C dispatched from frozencontract/plan. Root D integrates, validates backend/UI option paths and creates hand-input/docs. Final A/B/C +DJava/DWorkerUI +architecture independent Approved, C/I/Minor closed. FreshWorker/UIbuild andJava17testskippackage passed; only ownedWorker/showroom restarted; health/readiness/505/11hash readback preserved. Platform exact49productfile localcommit e17dacaf8c7e054d289d3149db5dbb89f55247ce. SDK docs/evidence localcommit follows; no push.
