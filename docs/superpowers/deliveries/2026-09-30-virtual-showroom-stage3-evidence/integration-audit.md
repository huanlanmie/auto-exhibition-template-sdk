# P3 backend / UI integration audit

Date: 2026-09-30. Read-only product-source audit. Only this report was written. No dependency install, test, conversion, process startup, HTTP/API request, SQL/Nacos/Electron action or platform data mutation.

## Authority and baseline

Read SDK docs/superpowers/plans/2026-09-30-virtual-showroom-roadmap.md P3-01/02/03 and docs/superpowers/specs/2026-09-30-virtual-showroom-design.md sections 5.1–5.5, 8.3 and 9.1–9.3. A P3 implementation contract was not present at audit start; the proposals below require root to freeze exact field names and deployment choices before implementation.

P3 target: IFC2x3/IFC4 building geometry + floor/type/property semantics, IFC4x3 ADD2 separately conditional; authorized/deployed 2D DWG entrance feeding the existing explicit DXF calibration. No 3D DWG, new BIM runtime file format, physical device routing or BIM editing/export promise.

Existing P2 has eight canonical formats (glb/gltf/obj/fbx/stl/dxf/step/iges), private HMAC analyze/convert, ZIP entry selection, package + DXF entry SHA, public-safe fixed metadata GET, owner-scoped resources, frozen replacement review and CAS. Success registers resources without replacing the building. First import and reimport both require explicit review/apply, preserving business IDs/bindings/graph/world rows/navigation. IFC/DWG integration can reuse this chain; no new business tables or draft schema revision are necessary.

## Concrete integration gaps

1. Worker src/formats.js, Java VirtualModelImportService.validatedOptions and ImportWizard explicitly accept only the eight P2 formats. Adding provider source alone cannot make IFC/DWG selectable or dispatchable.
2. Worker config.js readiness has only mesh/fbx/stl/dxf/occt providers. Optional providers do not currently emit a structured disabled reason. Java capabilities proxies providers on success, but any HTTP 503 from health throws and collapses the whole response to providers={}; UI drops unknown/unavailable formats and does not display provider boundaries/reasons.
3. Worker pipeline/metadata.js sourceAnchor currently trusts stable identity only for dxf + dxf-handle-chain. IFC GUIDs would otherwise be downgraded despite backend review already supporting generic unique source-entity identities.
4. Java metadata GET whitelists base P2 fields and report dxf/fbx/stl/cad; new IFC summary/property fields and DWG provenance would currently be omitted.
5. IMPORTANT privacy boundary: VirtualResourceSessionService.activeResources (around lines 41–60) exposes every resource under the active models/<version>/ prefix. Import currently classifies every non-GLB artifact as model-meta. Generic resource serving returns raw metadata/report bytes, bypassing the sanitized owner metadata GET. Therefore full IFC properties/OwnerHistory/contact attributes/precise georeference cannot be added to an existing raw meta/report artifact and assumed private.
6. UI property controls currently inspect business objects and building transform. picking.js resolves all building meshes to selectionId='building'; there is no BIM element-pick channel. Minimal property inspection should use a virtualized BIM node directory / currently bound anchor. Mesh picking is optional additional scope, and must not replace business selection IDs.
7. P2 DXF calibration binds both package sourceHash and actual DXF entryHash. A DWG provider converting to DXF twice may change generated headers/handles and derived bytes. A hash of a preflight-produced DXF must be reproducible or bound to a retained private conversion artifact/ticket; blindly reusing the raw DWG SHA as DXF entryHash is wrong.

## Proposed capability contract (keep backward-compatible fields)

Keep health.formats as enabled canonical string array, qualityPresets as existing desktop/mobile, providers as name -> descriptor, ready as core Worker readiness. Optional IFC/DWG failure must not disable the existing eight deployed providers.

Proposed additions per descriptor:

- id/name, enabled:boolean, version, formats:[...], scope/boundary;
- disabledReason:{code,message} or disabledReasonCode/reason (root must pick one shape);
- schemas for IFC: exact normalized IDs IFC2X3, IFC4, IFC4X3_ADD2, with enabled and boundary per schema; never use a blanket IFC4x3 flag;
- sourceVersions/contentModes for DWG: actual provider declaration and contentModes:['2d']; mixed/3D/proxy/xref unsupported diagnostics explicit;
- authorizationConfirmed:boolean and configured:boolean where required, safe deployment state only; no executable path, license/key, command line, credential, local storage root or source URLs;
- verification/acceptance marker 'manual-required' independent of parser deployment. Availability must not imply user acceptance of all IFC schema/entity samples.

Use canonical format ifc and dwg (DWG provider id can be dwg2d); .dwg maps to dwg, UI label always '二维 DWG'. An alternative canonical dwg2d needs an explicit suffix alias contract across Worker/Java/UI; do not let the three layers guess separately.

Java health() should preserve a structured health object for the core-unready 503 case if valid, while still rejecting malformed transport responses. capabilities() should surface safe reasons/providers even when workerAvailable=false. createJob/preflight still require ready and the actual requested provider enabled before source storage. No request can provide executable/provider URLs or enable a provider.

UI should show enabled choices plus explicit disabled IFC/DWG descriptions with provider reason. Missing DWG provider gives '请从原软件导出 DXF 后导入', not simulated parsing progress. Existing accepted formats and aliases stay unchanged.

## Proposed IFC analyze / options / metadata shape

Reuse POST /virtual/admin/import-preflight and Worker POST /v1/analyze. IFC analysis is owner/import-only, no draft/job registration, same private temporary source cleanup, source/entry digest and concurrency/deadline/byte budgets.

Proposed analysis additions (root to freeze):

- format:'ifc', sourceHash, entryHash (actual selected IFC bytes), entryFile/candidates/requiresEntrySelection unchanged;
- ifc:{schema, schemaSupported, sourceUnits:{name,metersPerUnit,basis}, projectGlobalId?, storeys:[{globalId,label,elevationSource?,elevationM?,elementCount}], types:[{ifcType,elementCount}], georeferencing:{present,hasMapConversion,hasProjectedCRS,requiresLocalOrigin}, counts, truncated};
- diagnostics with existing code/severity/message form; unsupported schemas hard reject import, truncation/unsupported elements explicit, no claimed full projection.

Storey/type filters must be explicit and reproducible: options.ifc={schemaVersion:1,sourceHash,entryHash,schemaConfirmed:true,storeyGlobalIds?:[],types?:[],originMode:'source'|'local',localOriginM?:[x,y,z],propertyPolicy:'basic'|'psets'} is a proposal, not authority. Root must choose whether omitted arrays mean all and [] means none (recommended), whether types is inclusion or exclusion, whether uncontained elements need a separate includeUncontained flag, and whether the provider permits Psets in this stage. Worker rechecks every selected ID/type against the actual file, not only submitted analysis.

IFC unit/axis normalization must not be repeated. Preserve source unit/placements/storey elevations/MapConversion/CRS in owner-only metadata; report actual provider output unit and axis through normalizationHint. A selected local origin must have a defined coordinate frame and metres. Keep centering=false when a shared project basis/local offset is being retained; independently centering successive models must not silently erase their relation. An origin offset is not a map projection. No multi-model building API is introduced in P3.

Public scene.meta remains schemaVersion 1 with safe IFC summary and anchor catalog only: schema/type/storey IDs and already normalized display bounds/transforms/counts; no arbitrary Psets or precise site/contact data. Full bounded admin property details and georeference go to fixed private sidecar, e.g. models/<version>/ifc-properties.json, digest-verified and classified as model-private. Exact name/kind/schema must be frozen. GLB extras contain only sanitized sourceAnchor identity; never raw IFC line/OwnerHistory/Psets.

Stable anchor proposal:

- one canonical element anchor per retained IfcProduct with valid unique original GlobalId;
- sourceIdentity {format:'ifc',id:<project-scope + product GlobalId or product GlobalId>,basis:'ifc-global-id',stable:true}; root must freeze project namespace, GUID syntax and grouping policy;
- canonical anchor frame comes from meaningful element placement, not a new Three UUID/expressID/list index/mesh fragment/name. If geometry coordinates are baked, the provider must document an honest frame and its limitations;
- duplicates/missing GUIDs/noncanonical fragments marked stable=false, with diagnostic. Multiple fragments of one product must not produce duplicated stable IDs that disable matching of the canonical parent;
- complete catalog requirement and bounded matching remain as P2. Missing filtered elements become explicit missing rows and require mapping or detach-keep-world, never delete business objects.

## Property inspector and privacy

Recommended first P3 inspector is owner/admin-only. Public visitor model continues rendering geometry and running existing visitor-isolated software; no anonymous property endpoint or business state mutation is added.

Reuse owner metadata GET for IFC summary/storey/type directory. Add one precise read endpoint, e.g. GET /virtual/admin/showrooms/{id}/models/{version}/nodes/{nodeId}/properties, query + owner. It reads only the registered immutable fixed private property sidecar after verifying descriptor hash/size/schema/model/source; nodeId must exist in that version's verified catalog. It returns bounded typed display fields (not raw parser graph), no private storage paths or executable HTML. Property groups should preserve value/unit types and expose plain text via Vue interpolation, never v-html or clickable arbitrary URIs.

Default allowlist candidates: IFC type, GUID, storey, display name if root explicitly approves, safe predefined type/material/quantity scalars. OwnerHistory, person/address/organization/contact/document references, arbitrary URLs, credentials/device fields and raw relations are excluded by default. Owner-only does not justify copying every IFC record. Root must freeze actual Pset allowlist/policy and count/depth/string/byte limits with truncation diagnostics.

A private descriptor must remain excluded from public sessions even if a scene field guesses its assetKey. Prefer explicit public-resource allowlist / hard rejection of model-private kind before broad prefix or generic reference matching. Existing anonymous revisions should continue serving scene.glb and safe existing metadata; 505 receives no migration or revision change. General owner asset routes can read owned private records only under query permission; property endpoint supplies stricter typed output.

Minimal UI: new IfcImportOptions.vue for schema/storey/type/origin confirmation; new ModelPropertyInspector.vue (or IfcPropertyInspector.vue) using virtualized node directory and property groups; mount in ObjectProperties when building selected or a business object is anchored to an IFC node. No sceneRuntime/picking change is required for that minimum. If 3D BIM picking is required, authorize sceneRuntime.js/picking.js/SceneCanvas.vue separately and emit a distinct model-node event based on sanitized GLB extras; never overwrite selectionId/objectId or open template runtime from BIM data.

## 2D DWG -> DXF calibration integration

Use same owner private upload and HMAC analyze/convert path. Provider execution is Worker-owned, fixed deployment configuration; no source-controlled command/executable arguments, external xref fetching, production services or line-of-business Electron linkage.

Analysis outer format remains dwg. Proposed outer dwg:{providerId,providerVersion,sourceVersion,scope:'2d',sourceEntryHash,derivedDxfHash,contentMode,diagnostics}; calibration:{kind:'dxf', ...existing DXF preflight}, or equivalent fixed flattened shape. Source package hash remains original DWG/ZIP SHA; DXF calibration.entryHash must be actual derived DXF bytes. Preserve source-entry hash and conversion parameters/provider version separately. User selects original package entry; internal generated file paths are not UI entries.

ImportWizard renders the same DxfCalibration using the derived analysis and sends fixed options.dwg + options.dxf under format dwg. Java must permit this combination only when dwg provider is enabled and require package/entry/calibration provenance. UI file/entry/provider/calibration setting changes invalidate confirmation. Units/reference/layer roles/centerline openings and all P2 hard errors remain in force; 2D DWG is not a bypass around nonplanar DXF checks.

Root must resolve derived-artifact consistency: deterministic stable-output conversion (with a defined normalized-hash basis that builder independently checks) OR a bounded expiring private preflight conversion ticket locking original package/entry/provider/options/derived digest and permitting reuse of exact bytes. Re-convert without digest equivalence must return DWG_CALIBRATION_STALE, not apply old marks to a new entity order. A ticket should be owner/room-bound by Java before use; no raw Worker ticket is a substitute for management authorization.

Do not infer stable original DWG anchors from converter-generated DXF handles. Keep original sourceFormat dwg and report provenance. Only a proven original-entity mapping can mark source-entity stable; otherwise use heuristic suggestions and explicit review. Reject 3D/mixed inputs or report explicitly accepted ignored contents under the provider's proven 2D boundary; no dwg3d entry in this scope.

## Minimal exact file scope proposal

Task C backend:

- ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelImportService.java — formats/options/provider state, artifact kind/provenance validation.
- .../VirtualModelWorkerClient.java — structured safe health failures, existing analyze/convert protocol only; ticket transport only if chosen.
- .../VirtualModelMetadataService.java — IFC/DWG summary/report and property-sidecar digest/schema boundary.
- .../VirtualModelPropertyService.java (new, optional split from metadata helper) — bounded fixed owner property reader.
- ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/controller/VirtualShowroomOperationsController.java — one owner/query property GET.
- .../VirtualResourceSessionService.java — essential private artifact exclusion / public allowlist. This is the required scope extension for IFC privacy.
- .../VirtualModelReviewService.java — only if root freezes stronger identity scope validation; generic P2 identity/count/matrix logic can otherwise stay intact.

Task C UI:

- ruoyi-ui-vue3/src/api/showroom/virtualShowroom.js — property GET.
- src/views/showroom/virtualShowroom/components/ImportWizard.vue — actual providers/reasons, ifc/dwg format options, preflight branches.
- .../IfcImportOptions.vue (new) — schema/storey/type/origin selection.
- .../ModelPropertyInspector.vue (new) — owner-only bounded directory/property display.
- .../DxfCalibration.vue — minimal derived-DWG provenance text; preserve calibrated entryHash logic.
- .../ObjectProperties.vue and editor.vue — current IFC directory and bound-node inspector wiring.
- .../ReimportReview.vue — only explanatory IFC filtering/GUID/frame diagnostics; no new business-object payload.
- imports.vue and anchorMatching.js need no functional changes if the common wizard/review remains shared.

Root/Worker scope (coordinate, do not overlap C): config.js/formats.js/protocol.js/api/analyzeRoute.js, api/convertRoute.js/browser/convert.js/browser/runner.js, pipeline/metadata.js, provider deployment adapter, IFC converter/metadata and DWG2D converter. Existing io/jobWorkspace.js may need DWG/IFC entry recognition and controlled derived artifact handling. package/build/vendor/deployment docs remain root owned. No SDK/template-host/visitor runtime/SQL/Nacos/physical Electron changes proposed.

## Fields root must freeze before implementation

1. Canonical dwg vs dwg2d format and exact health descriptor/disabled-reason/schema structures.
2. IFC analyze tree, exact source/entry hashes, schema identifiers and storey/type filtering semantics including uncontained elements.
3. IFC coordinate/origin frame, map-conversion metadata privacy and interaction with existing common unit/axis/centering.
4. Canonical IFC anchor grouping, project GUID namespace, GlobalId validation, fragment/duplicate handling and meaningful placement frame.
5. Public IFC metadata allowlist vs private sidecar filename/kind/schema; hard exclusion rule for public resource selection.
6. Property inspector API field/count/depth/value/unit policy and whether Psets are included by default, opt-in or omitted.
7. Authorized DWG provider/exact configured deployment readiness and safe reasons; provider source-version/content limits.
8. DWG original/derived digest and calibration envelope; deterministic conversion vs expiring exact-derived-source ticket; owner/room/hash binding and expiry.

Implementation can begin once these are fixed. Keep all P2 CAS/frozen-review/partial-ACK semantics, unchanged legacy no-anchor compatibility, existing eight-format normalization, untouched 505 publication/draft and isolated visitor software routing. No acceptance claims before user-directed manual schema/entity/property/coordinate/DWG samples are actually reviewed.
