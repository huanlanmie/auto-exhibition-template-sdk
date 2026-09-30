# Stage 2 Task C — backend and UI calibration / model review

Date: 2026-09-30. Implementation complete; source ownership returned to root. This report records code/build evidence, not functional acceptance of new formats.

## Exact source ownership

Platform root: C:/Users/Administrator/Desktop/mju-smart-show

Java:

- ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/controller/VirtualShowroomOperationsController.java
- ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelImportService.java
- ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelWorkerClient.java
- ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelMatrix.java (new)
- ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelMetadataService.java (new)
- ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelReviewService.java (new)
- ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualAssetStorageService.java (approved extension: precise preflight-source cleanup only)
- ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualShowroomService.java (approved extension: direct replacement guard and internal reviewed persistence)
- ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualShowroomValidationService.java (approved extension: metadata anchor validation)

UI:

- ruoyi-ui-vue3/src/api/showroom/virtualShowroom.js
- ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ImportWizard.vue
- ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ObjectProperties.vue
- ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/DxfCalibration.vue (new)
- ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ReimportReview.vue (new)
- ruoyi-ui-vue3/src/virtual-showroom/scene-core/anchorMatching.js (new)
- ruoyi-ui-vue3/src/views/showroom/virtualShowroom/editor.vue
- ruoyi-ui-vue3/src/views/showroom/virtualShowroom/imports.vue (approved extension: independent import / restored-job entry uses the same replacement review)

No Task C edits to Worker, SDK/package/Vite, SQL, startup scripts, user FunctionLinkage changes, scene renderer, 505 data, or public revisions. No install, process launch, staging, commit, functional test, browser QA, API mutation, or model conversion was performed.

## HTTP interfaces

Controller base /virtual/admin. UI base /showroom/virtual/admin through existing gateway.

- GET /import-capabilities: actual Worker ready/formats/providers/qualityPresets plus existing upload/container/partial-report limits. Canonical formats glb/gltf/obj/fbx/stl/dxf/step/iges; stp/igs aliases normalized. Unavailable providers are rejected before job creation.
- POST /import-preflight: multipart showroomId/file/options; owner + import permission. A fresh private source descriptor is passed to authenticated POST /v1/analyze and deleted in finally with a checked source key. No job/draft/model rows are written by preflight. Response data is analysis, with sourceHash and optional entryHash/candidates/requiresEntrySelection.
- GET /showrooms/{id}/models/{version}/metadata: owner + query. Reads only fixed models/{version}/meta.json and optional report.json from that model's internal manifest; checks byte size/hash and schema/model/source identity. Output strips private keys/URLs/storage paths and retains provider report diagnostics, anchors, anchorCatalog.complete, anchorFrameBasis/nodeWorldMatrix4.
- PUT /showrooms/{id}/objects/{objectId}/anchor: owner + edit; body {expectedDraftVersion,nodeId}, null detaches. Attaching requires a valid current-building catalog node. Both actions preserve world transform and business fields, using draft CAS.
- POST /showrooms/{id}/model-replacement-review: owner + edit; {expectedDraftVersion,targetModelVersionId}. Redis freezes owner/room/draft/scene-resource digest/source and target version/meta digests for 15 minutes. Returns reviewId, expectedDraftVersion, targetModelVersionId, rows, targetAnchors, diagnostics.
- POST /showrooms/{id}/apply-model: owner + edit; {expectedDraftVersion,reviewId,targetModelVersionId,mappings}. Accepts decisions only; rejects extra business-object fields. Every previously anchored object requires map or detach-keep-world; unanchored rows cannot receive mappings. The server recomputes against fresh verified catalogs and original locked draft, then performs CAS.

Model application preserves modelToShowroom, original business object IDs/names/enabled/contentBinding/previewRef, interaction graph, navigation and world objects. Mapping uses AnewWorld * inverse(AoldWorld) * Wold, with column-major affine checks and precise positive-scale TRS decomposition. Singular, mirrored, sheared or nonfinite results are rejected with detach-keep-world guidance. Target partial reports must have been acknowledged. Ordinary SaveDraft and generic persistDraft cannot change building modelVersionId/assetKey; only internal reviewed-model persistence can do so. New import completion verifies fixed metadata inside its registration transaction and still only appends resources, never selects the building.

Exact matches require a unique stable source-entity identity in both complete catalogs. Path/label/geometry matches are suggestions only. Matching uses prebuilt indices over bounded catalogs; each row has at most 50 displayed candidates, total at most 10000, with explicit truncation diagnostics. Missing legacy catalogs produce missing/canMap=false decisions and require explicit detach. Unchanged refs in an old empty anchor catalog can remain in draft; publishing rejects unresolved nodes. Legal copy compatibility remains owner-scoped and cannot create a new unknown node through the anchor endpoint.

## UI behavior and contracts

ImportWizard consumes deployed capabilities and adds all canonical formats, ZIP entry analysis, desktop/mobile constraints, explicit STL units, FBX auto UnitScaleFactor, already-corrected FBX Y-up explanation, OCCT metre/axis confirmation and metre/radian tessellation precision. New formats are explicitly marked for manual confirmation; no DWG/IFC claim.

DXF calibration uses source WCS XY SVG without unit scaling, exact layer roles, centerline/outline wall choice, optional metre overrides, block-to-basic-asset mappings and explicit centerline wallPathRef openings. Door layers do not automatically make openings. Initial ignored/unmapped layers remain ignored with partial diagnostics; acceptedDiagnosticCodes does not override hard modelling errors. Layer editing is paged and lookup maps avoid path-by-layer scans. Package sourceHash and actual entryHash are retained. File/entry/format changes invalidate analysis/calibration; unit or extra-scale changes revoke unit confirmation. Known-distance calibration sends distanceM/raw source endpoints and does not multiply unit/scale again. Curve error UI limit is 0.25 m, matching the builder.

Editor and independent imports.vue/restored-job entry both fetch a fresh draft and open ReimportReview. The component shows bounded match status, explicit map/detach choices, before/after scene previews, matrix errors and mandatory navigation review acknowledgement. It sends only decisions. ObjectProperties adds a current model anchor picker/status/detach flow; edit permission and CAS are enforced by the API. STEP/IGES/STL bounds-center frames are described as assisting translation only: baked vertex rotation, scale or deformation cannot be inferred.

## Verification evidence

- Java: Maven reactor compile targeting release 17, -Dmaven.test.skip=true; exit 0, BUILD SUCCESS, 2026-09-30 18:48:56 +08:00. Log: C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/.superpowers/sdd/2026-09-30-virtual-showroom-stage2/task-c-java-build.log. Existing deprecation/unchecked and maven-resources-plugin validation warnings remain; no compile errors.
- UI: npm run build:prod; exit 0, built in 12.31s. Log: C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/.superpowers/sdd/2026-09-30-virtual-showroom-stage2/task-c-ui-build.log.
- Owned tracked diff whitespace check passed. Owned files use one final newline and UTF-8 without BOM.
- Independent static review: task-a agent Approved in review-c.md after fixing the independent imports.vue replacement path, curve bound, entry handling and metadata-frame fields. Root also reviewed the catalog/comparison bounds and report privacy surface.

Functional acceptance still requires user-directed manual product checks: unit/axis normalization, DXF selected layers and marked openings, entryHash rejection on wrong ZIP entry, old/new mapped positions under building calibration, ambiguous/missing/legacy detach handling, concurrent draft/review expiry errors and preserved content/navigation. No format conversion or browser interaction has been run by Task C. Root owns final package/service restart and integration; 505 room1 public revision2 / draft6 received no Task C data actions.
