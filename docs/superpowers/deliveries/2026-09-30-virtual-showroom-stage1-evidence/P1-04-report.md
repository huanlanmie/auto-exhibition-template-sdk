# P1-04 implementation report

## Result

Implemented the shared scene core and authenticated virtual-showroom editor in `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3`. No staging or commits. No automated functional tests or browser QA were run, per the execution ruling.

Final production build: `npm run build:prod`, exit 0, 2160 modules transformed, completed in 24.55 seconds. Full build output: `P1-04-build.log` beside this report. The build confirms compilation only; live backend flows, WebGL rendering, gestures, collision tuning and publishing remain for the designated manual validation stage.

## Files

- `src/virtual-showroom/scene-core/schema.js`: schema defaults, independent JSON snapshots, IDs, editor validation.
- `src/virtual-showroom/scene-core/sceneRuntime.js`: building/exhibit/navigation groups; asynchronous model loading with stale-result disposal; editor orbit, picking/highlight, constrained transform gizmo; visitor/try-walk plane motion with calibrated yaw-box collision; frame loop, resize and disposal.
- `src/virtual-showroom/scene-core/modelLoader.js`: pinned GLTFLoader + Meshopt + local Draco; normalized models must be self-contained GLB, external references are rejected.
- `src/virtual-showroom/scene-core/screenObjects.js`: screen/hotspot geometry, contain/cover preview textures, cancellation on object disposal.
- `src/virtual-showroom/scene-core/{picking,collision,dispose}.js`: visibility-aware picks, rotated box/radius collision and geometry/material/texture cleanup.
- `src/views/showroom/virtualShowroom/index.vue`: list/search/create/delete, visitor link, offline and published-revision rollback.
- `src/views/showroom/virtualShowroom/editor.vue`: object tree, screen/hotspot add/clone/delete, numeric and gizmo transforms, snapshot command undo/redo, entry/viewpoints/collision boxes, versioned draft saving, local JSON export and conflict preservation, import application, instance binding, update inspection, validation/publish.
- `src/views/showroom/virtualShowroom/imports.vue`: resumable task via jobId query parameter, explicit application into latest versioned draft.
- `src/views/showroom/virtualShowroom/components/{ObjectTree,SceneCanvas,ObjectProperties,ImportWizard}.vue`.
- `src/api/showroom/virtualShowroom.js`: owner-token admin API with actionable server error codes preserved, binary authenticated asset reads and revocable blob URL resolver.
- `src/router/index.js`: minimal permission-gated hidden editor/import fallback routes. Navigation uses backend menu route names `VirtualShowroom`, `VirtualShowroomEditor`, `VirtualShowroomImports`; active menu `/virtualShowroom/index`.
- `package.json`, `pnpm-lock.yaml`: exact `three: 0.186.1`. pnpm lock change reduced to the eight required Three lines, preserving unrelated dependency resolutions. npm package lock is ignored by the existing repository.
- `public/virtual-showroom/draco/{draco_decoder.js,draco_decoder.wasm,draco_wasm_wrapper.js,README.md}` copied from the pinned package; `public/virtual-showroom/THREE-LICENSE.txt`.

## Interfaces for integration

`createSceneRuntime({container,document,resolveAsset,mode})` exposes all required methods: `applyDocument`, `setMode`, `onPick`, `getCameraState`, `restoreCameraState`, `setInputEnabled`, `dispose`.

Additional methods: `select(id)`, `onTransform(handler)`, `onError(handler)`, `setTransformMode(translate|rotate|scale)`, `setWalking(boolean)`, `setLayerVisible(building|exhibits|navigation, boolean)`, `getObjectElementState(id)` returning projected `{x,y,visible}`. `onTransform` emits `{id,transform:{position,quaternion,scale},yaw}`. Navigation IDs are `spawn`, `viewpoint:<id>`, `collider:<index>`; building ID is `building`; exhibits use their actual objectId. Visitor picks can return `building` for an occluding building, so consumers should resolve an exhibit before opening content.

SceneCanvas emits `ready(runtime)`, `pick(id)`, `transform(change)` and exposes `getRuntime()`. Its Three instance remains a lexical variable, outside Vue deep reactivity. Scene document edits replace a shallowRef value. Root may now integrate the authenticated active-template overlay/preview; no public viewer or template-host files were created by this task.

Local object commands persist via whole-document `PUT draft` with `expectedDraftVersion`, as confirmed by root. Binding uses the separate versioned binding PUT, then resets undo history at this authoritative boundary. Failed saves leave the local document and command history untouched. Conflict reload is explicit and warns before local changes are discarded.

Import capabilities consume `{formats:[{format,enabled,...}],maxUploadBytes,workerAvailable}`. Options use `format`, `entryFile`, `unit:m|cm|mm`, positive `scale`, `axis:y-up|z-up`, boolean `centering`. Progress is displayed only when provided; status polls stop on failure and can be explicitly retried. Partial conversion requires the acknowledgment checkbox before applying the model. Existing job monitoring remains usable if conversion capabilities are temporarily unavailable.

Template picker consumes data/rows with string `id`, optional `sourceConfigId`, `instanceVersion`, `templateName`. Direct-instance and device-theme-instance supported; compatibility defaults to preview-only, with explicit native/legacy selection.

## Constraints and handoff

- Manual validation is still required against running backend/worker/storage, with real fixtures and role permissions. Build success is not represented as functional acceptance.
- Plane walking uses entry eye-height and hand-calibrated box colliders/bounds; it does not infer architectural navigation, stairs or multiple floors.
- Public visitor entry and live template host/preview are root-owned integrations. Editor currently supports preview images and content binding, exposing canvas hooks for root integration.
- Import application relies on backend-verified job resource references and owner-scoped draft validation. No external conversion services or runtime CDN are used.
- Existing user edits to functionLinkage and all backend/gateway/SDK files were left untouched.

## Follow-up: live preview, preview upload and acknowledgments

Root-owned `TemplateRuntimeHost` and `createPublicSession` are now connected from the admin editor. The screen toolbar/property action first saves, then requests the authenticated preview manifest and resolves the selected screen from that immutable manifest. A changed draftVersion is rejected as a conflict. The host uses the manifest's separate runtime origin, while the scoped resource session supplies only its bearer-capability asset URLs and renewal ticket. Canvas input is disabled during preview; closing, expiry or editor disposal tears down the scoped resource session, and closing restores the captured camera state.

`ObjectProperties` now exposes JPG/PNG/WebP upload (10 MiB limit, client filename/MIME/size checks, server still verifies bytes). Admin API `uploadPreviewImage` posts `file` and `expectedDraftVersion` to `/showrooms/{id}/assets/preview`. After owner-validated upload, the editor accepts the returned detail/version, applies the returned assetKey to the selected screen, sets `previewInstanceVersion` from its current content binding when present, and saves. Failed final saves keep the local preview assignment dirty and preserve the uploaded resource. Selecting an existing preview image also associates it with the current binding version.

Partial conversion acceptance now calls `POST import-jobs/{jobId}/acknowledge` after the explicit checkbox and before emitting `imported`. Failed acknowledgement never applies the model. Publishing warnings now have an explicit checkbox; both the button and handler gate publication, and the request sends `acknowledgeWarnings`. A new validation result or accepted draft invalidates the checkbox/validation state.

Only admin editor/components and `src/api/showroom/virtualShowroom.js` were edited in this follow-up. Root-owned core/viewer/host/Vite files were read for integration but left untouched. The template picker also accepts the backend's `name` field and excludes non-current device-theme instances from that source mode.

Integration build: `npm run build:prod`, exit 0, 2175 modules, 22.86 seconds. Output: `P1-04-integration-build.log`. No tests/browser QA/staging/commits. The requested conditional artifact cleanup was checked: `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/dist.zip` predates this build (LastWriteTimeUtc 2026-05-18 14:16:54, 2,705,381 bytes) and was unchanged by the build, so it was retained rather than treating it as a newly generated artifact.

## Follow-up: preserve preview only for the exact bound instance version

Changed only admin `editor.vue`: `bind()` now passes an existing `previewRef` only when all three strict comparisons hold: old `contentBinding.templateInstanceId === selectedId`, old `contentBinding.instanceVersion === selected.instanceVersion`, and `previewInstanceVersion === old contentBinding.instanceVersion`. Otherwise it omits previewRef, allowing the backend's existing behavior to clear the image association. The binding dialog shows an explanatory warning before saving, and the successful result tells the user to upload a preview matching the current instance version if the old association was cleared. The same predicate drives both the UI warning and payload construction.

Build after this fix: `npm run build:prod`, exit 0, 2175 modules, 23.06 seconds. Output: `P1-04-rebind-build.log`. No tests/browser QA, no staging or commits, and no broader file changes.

## UI review fix round 1

Addressed the concrete findings from `P1-ui-review.md` within the expanded ownership granted by root:

- `TemplateRuntimeHost.vue` now measures the available dialog body with ResizeObserver and fits an inner viewport using `screen.widthM / screen.heightM`. Live iframe and preview-only image share that bounded viewport; the header remains outside it. The initial iframe URL is assigned after the first measured size is applied, and the observer is disconnected on teardown. Wide and portrait layouts letterbox rather than changing template aspect ratio.
- Host keyboard handling uses explicit iframe-or-close branching; first/last focus guards and a parent focus containment listener keep the close action in the modal tab cycle, with cleanup and prior-focus restoration.
- `ShowroomViewer.vue` lists every enabled screen and hotspot, routing selection through its existing `pick` logic. Hotspot text and image resolution do not depend on a Three runtime, so the list remains functional when WebGL fails, including a hotspot-only showroom. Changing/reloading hotspots invalidates previous asynchronous image loads.
- `uploadPreviewImage` now accepts `(showroomId, screenId, file, expectedDraftVersion)` and includes screenId in multipart data. The editor passes its selected objectId. Backend confirmed that preview provenance is server-owned, captured against the persisted binding, and not exposed in standard ResourceItem fields; the upload note now explains binding first and uploading again after a binding change. Backend validation remains authoritative for any existing-resource selection.
- Safe-area environment offsets protect the host close header/body and the viewer header, navigation, list, touch controls and messages. `showroom.html` enables `viewport-fit=cover`. All offsets have zero fallbacks, preserving desktop spacing.

Final build: `npm run build:prod`, exit 0, 2177 modules transformed, 24.22 seconds. Full output: `P1-04-review-round1-build.log`. No automated functional tests, browser QA, staging, commits, or subagents. No scene-core changes. Wide/portrait mobile rendering, notch/home-indicator spacing, cross-origin keyboard behavior and WebGL-disabled fallback still require the designated manual acceptance stage; build success is compilation evidence only.

## Image format contract tightening

The latest contract supersedes earlier WebP references in this chronological report: stage 1 preview-image upload and provenance support **PNG/JPEG only**. Updated only admin `ObjectProperties.vue` and `editor.vue`: file picker accepts PNG/JPG/JPEG, help states supported formats and asks users to convert WebP first, upload validates the allowed MIME and extension with the existing nonempty/10 MiB limits, and WebP receives a specific unsupported-format message. Existing-image selectors also exclude WebP. No browser-side conversion or new dependency was introduced.

Production build after this change passed: exit 0, 2177 modules, 22.76 seconds. Log: `P1-04-image-format-build.log`. No tests/browser QA, staging, commits or other UI changes.

## Revision history timestamp field alignment

Changed only the revision-history table's 发布时间 column in admin `index.vue` from `createTime` to the REST response field `publishedTime`. Existing timestamp strings remain displayed unchanged. Final production build passed: exit 0, 2177 modules, 22.78 seconds; log `P1-04-revision-time-build.log`. No tests, staging or commits.
