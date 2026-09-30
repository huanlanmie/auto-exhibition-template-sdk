# P3 Task C — backend / UI integration handoff

Date: 2026-09-30. Status: implementation complete, source ownership returned to root for independent static review. This records implementation/build evidence, not functional acceptance of IFC/DWG. Authority: docs/superpowers/contracts/virtual-showroom-stage3.md and plans/2026-09-30-virtual-showroom-stage3.md.

## Exact source files (15)

All production paths under C:/Users/Administrator/Desktop/mju-smart-show:

1. ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelImportService.java
2. ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelWorkerClient.java
3. ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelMetadataService.java
4. ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelPropertyService.java (new)
5. ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualResourceSessionService.java
6. ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/controller/VirtualShowroomOperationsController.java
7. ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/controller/VirtualShowroomPublicController.java
8. ruoyi-ui-vue3/src/api/showroom/virtualShowroom.js
9. ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ImportWizard.vue
10. ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/IfcImportOptions.vue (new)
11. ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ModelPropertyInspector.vue (new)
12. ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ObjectProperties.vue
13. ruoyi-ui-vue3/src/views/showroom/virtualShowroom/editor.vue
14. ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/DxfCalibration.vue
15. ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ReimportReview.vue (explanation only)

No changes to A/B native engines, Root shared Worker/package/build/vendor/config/protocol/pipeline, SQL, Nacos, physical Electron, startup, SDK/template-host/visitor/picking/sceneRuntime, existing user FunctionLinkage files or 505 data. No installation, conversion/parser execution, functional tests, browser QA, API mutations, process startup, staging or commit were performed. Existing generated dist.zip remains build output for root to exclude from source commits.

## Backend interfaces and safeguards

Existing import-capabilities / import-preflight / import-jobs and metadata APIs remain. Canonical ifc/dwg appended to the existing eight formats; createJob checks actual deployed health formats before storing source. UI cannot submit ownerScope: option keys are bounded and exact. analyze/convert HMAC payloads now receive ownerScope={ownerId,showroomId} from authenticated room ownership / persisted owned import job, never client fields. Positive decimal strings use database Long.toString().

Worker health accepts a well-formed core-unready 503 health document and capabilities preserves safe providers/reasons/nativeIsolation instead of suppressing all descriptions. Actual formats/quality presets remain the existing backward-compatible lists. Optional disabled descriptors and manual-required state are rendered separately from core availability and user acceptance.

IFC options validated against contract: schemaVersion, package/entry hashes, confirmed schema, positive unique storey expressIDs, unique typed IFC type list, includeUncontained, originMode/localOriginM, basic/psets, allowAdd2. Unit must auto, axis y-up, and centering explicitly false per root's final coordinate policy. File upload package SHA must match confirmed sourceHash before creating the import job. Native engine still rechecks actual schema/entry/selected IDs/types/ADD2/geo/source-mode restrictions; Java does not trust UI to determine actual IFC facts.

DWG only permits its own options.dwg plus existing dxf calibration, with 64hex opaque ticket, original sourceEntryHash, derivedDxfHash and providerFingerprint; dxf.entryHash must equal derivedDxfHash. Actual package SHA must match dxf.sourceHash. Java does not interpret ticket contents or cache paths. B validates trusted ownerScope, original entry SHA, provider fingerprint, exact frozen derived bytes and expiry. A failed/expired ticket cannot trigger an implicit native re-conversion with old marks.

Import registration now accepts only fixed public scene.glb/meta.json/report.json/manifest.json and IFC-only ifc-properties.json. Raw Worker kind must match model/model-meta/import-report/model-manifest/model-private respectively; all paths/version/byte size/digests still verified. IFC fifth file limited to 16MiB. Public manifest JSON checked for schema/modelVersion, unique exact public descriptor paths/kinds, required scene/meta/report and no private descriptor/objectKey/sourceObjectKey/dataBase64. All required fixed files must exist. The metadata + private property schema are verified within the registration transaction before draft CAS; import success only registers resources and never replaces the selected building.

Private sidecar validation binds fixed filename, kind, version, actual package/entry hashes and IFC schema. Exact top/element/group/property field allowlists; positive storey/express IDs; unique identities; basic groups empty; Pset_*Common/Qto_*BaseQuantities only; typed primitives/list, unit/inherited shape, per-element128/global200000 properties, text2048, nesting16 and 16MiB byte cap. It is compatible with A's fixed IfcLabel/IfcBoolean/IfcLengthMeasure valueType names, list/enum/null and ifc-local:expressID nonstable identities. Only trusted stable public IFC sourceIdentity of projectGUID:productGUID + ifc-global-id is accepted as stable. Existing P2 matching/count/matrix/CAS code is unchanged.

Public privacy is enforced twice: activeResources excludes model-private or ifc-properties.json even if the scene guesses its asset key; VirtualShowroomPublicController rejects such request paths and descriptor kinds before generic serving, including existing session records. No private sidecar enters anonymous session resource manifests or raw public asset delivery. Source Psets/Name/Description/exact georef stay private. Owner metadata GET adds public ifcSummary and public report.ifc/dwg/conversionChain; private routing/ticket/source datum keys are stripped from metadata responses.

New endpoint:

GET /virtual/admin/showrooms/{id}/models/{modelVersionId}/nodes/{nodeId}/properties

UI gateway base /showroom/virtual/admin. Requires query + owner. Reads the same room's registered READY fixed/digest-verified sidecar; verifies catalog node and sourceIdentity association. Unknown nodes reject; non-IFC or fragment nodes without property association return available:false with an actionable message. Return {available,modelVersionId,nodeId,element,ifc,diagnostics,truncated}. Only the selected typed element is returned. Owner sourceCoordinateTransform placement is limited to that identity; large geography arrays are capped at 50 with explicit TotalCount/Truncated fields. No client ObjectKey or arbitrary storage path input.

## UI behavior

ImportWizard lists actual enabled canonical formats and disabled provider descriptions. IFC / DWG disabled reasons, boundary/version/schema/source scope/native isolation and manual-required distinction remain visible. Unavailable DWG suggests exporting DXF in the original software. IFC/DWG are not listed as universally accepted or lossless.

IfcImportOptions consumes actual preflight schema/unit/storeys(expressID)/types/origin suggestion. Defaults local origin + all contained/default visible product types + includeUncontained + basic attributes. Explicit empty arrays retain their contract meaning; UI explains intersection and no-geometry cases. IFC4X3_ADD2 requires separate checkbox, all formats require schema/filter/origin confirmation. Georeferencing present/requiresLocalOrigin disables source mode. Original units auto, Y-up fixed and extra scale common once; independent centering locked false. Origin suggestion is described as placement-derived, not a converted geometry bound or map projection. Property policy describes owner-only limited Pset/Qto fields.

DWG uses the same existing DxfCalibration with the flattened derived preflight and actual derived entryHash. It explains unknown source completeness and mandatory partial report review. Ticket is opaque and sent only in the private import request; current time is refreshed and expiration disables submit. File, package entry or format changes clear analysis/calibration; new analysis clears the old component; unit/scale changes revoke DXF unit confirmation. Internal derived filenames are not presented as user entries. Existing DXF unit/reference/layer/opening hard rules remain.

ModelPropertyInspector is mounted only in authenticated editor ObjectProperties for an IFC building or business object's bound anchor. It uses a virtualized canonical node directory and owned GET, presents typed plain text/groups/private source names and bounded geography; never v-html or arbitrary URI navigation. Read generations suppress stale replies after node/version changes or unmount. It does not modify business ID, anchor, template binding, visitor state, scene picking or native engine.

P2 first import, independent/restored imports page, frozen review and apply remain shared and unchanged. ReimportReview only adds the explanation that GUID confidence is conditional and filtered/missing elements require map or detach decisions. Navigation/world objects/interactionGraph/contentBinding/previewRef preservation and existing partial acknowledgement/CAS continue.

## Build / review evidence

- Maven reactor compile, release17, -Dmaven.test.skip=true: exit0 BUILD SUCCESS, final 2026-09-30 23:06:06 +08:00, 7.024s. Log C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/.superpowers/sdd/2026-09-30-virtual-showroom-stage3/task-c-java-build.log. Existing deprecation/unchecked and resources-plugin validation warnings remain.
- npm run build:prod: exit0, built in 24.42s. Log C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/.superpowers/sdd/2026-09-30-virtual-showroom-stage3/task-c-ui-build.log.
- Owned tracked diff --check passed; source normalized UTF-8 without BOM / single terminating newline.
- Independent static review requested from root after handoff; this report is not self-approval. Changes compile without starting Spring/services or executing IFC/DWG engines.

Root owns final engine/shared integration, cross-agent static review/fixes, exact commit, local service package/restart and deployment readiness. User-directed manual checks remain required for IFC schemas/units/placement/GUID/properties/filtering/geography, DWG source/derived/ticket/expiry/3D refusals/partial report, quota handling and eight-format/505/visitor compatibility. No 505 room1 draft6/public revision2 data action or automatic publication was made by Task C.
