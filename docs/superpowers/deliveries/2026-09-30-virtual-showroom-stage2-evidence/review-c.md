# Task C independent static review

Reviewed revision: **working tree**, 2026-09-30. Authority: Stage 2 contract and Task C plan. No tests, model conversions, browser QA, builds, service startup, installation, source edits or Git mutations were performed by the reviewer. The implementation's compile/build reports were not used as functional proof.

## Scope

Platform Java: `VirtualModelImportService`, `VirtualModelWorkerClient`, `VirtualModelMetadataService`, `VirtualModelReviewService`, `VirtualModelMatrix`; relevant changes in `VirtualShowroomService`, `VirtualShowroomValidationService`, `VirtualAssetStorageService`, and `VirtualShowroomOperationsController`.

Vue: virtualShowroom API, ImportWizard, editor, ObjectProperties, DxfCalibration, ReimportReview, scene-core/anchorMatching, plus the existing user-accessible imports.vue route discovered during call-site tracing. Worker boundary reads were limited to the corresponding entryHash, source-identity, diagnostic-code and anchor-frame contracts.

## Checked implementation and evidence

All relative paths below are within `C:/Users/Administrator/Desktop/mju-smart-show/`.

- **Ownership and permissions:** operations endpoints require import/query/edit as appropriate. Model operations first require room ownership, and catalogs are selected by both room and model version. Current-owner checking has no administrator bypass. Preflight validates options/capability before storing a bounded private source; `finally` deletes only the descriptor under the exact owner/room UUID source prefix. Worker requests are signed using the unchanged raw-body HMAC scheme and do not follow redirects.
- **Capability/options agreement:** Java canonicalizes stp/igs aliases, requires a currently ready deployed format, validates explicit non-FBX/non-OCCT units, quality presets and OCCT numeric ranges. ImportWizard uses the returned formats/presets. FBX defaults to metadata/auto; OCCT emits meters with axis and extra scale still explicit. DXF source-package SHA is compared again on createJob; its selected-entry SHA is carried from analysis through DxfCalibration to the converter, which recomputes it from actual bytes.
- **Calibration invalidation:** ImportWizard synchronously invalidates analysis when file, entry or format changes and discards late responses using generation/file/entry checks. DxfCalibration clears unit confirmation when source unit or extra scale changes. Only ZIP files expose server candidate filenames, avoiding use of temporary UUID single-file storage names on the next upload.
- **Fixed metadata/privacy:** `VirtualModelMetadataService` verifies bounded stored metadata/report bytes against size and digest, checks version/source provenance, enforces 20,000 unique anchors, validates affine matrices and returns allowed catalog/report fields after nested private-key/address removal. Legacy metadata without anchors yields an empty usable catalog. `anchorFrameBasis` and `nodeWorldMatrix4` are now preserved; ReimportReview labels bounds-center frames as translation assistance and does not claim recovery of baked rotation/scale/deformation.
- **Frozen reviews and CAS:** `VirtualModelReviewService:64`–68 stores owner, room, draft version, source/target model IDs and draft/source/target digests in Redis with a 15-minute TTL. Apply locks the owned room, checks the expected version and all frozen identities/digests, requires acknowledged target imports and exact decisions for every anchored row. Unknown/duplicate mappings and changes to world-only objects are rejected. A successful apply increments the draft through the normal DB CAS; replaying the review with an old version fails.
- **Matching:** exact status requires unique trusted source identity on both complete catalogs. Name/path/geometry matches remain suggestions; candidate output is bounded to 50 per row and 10,000 total, with truncation diagnostics. Missing legacy anchors require explicit detach, preserving world placement.
- **Server-authoritative transform:** apply reads business objects and transforms from the locked draft, not request-supplied objects. It computes `AnewWorld * inverse(AoldWorld) * Wold` with the unchanged building modelToShowroom. Matrix helpers reject nonfinite/singular calculations, mirrored/nonpositive results, shear and failed TRS recomposition. The client calculation is explicitly preview-only; the server repeats the calculation against verified catalogs.
- **Preservation and bypass prevention:** apply changes only mapped object transform/anchorRef and building model/asset identity, retaining object ID/name/enabled/content binding/preview references, interaction graph, navigation and building calibration. `requireSameModel` guards ordinary saveDraft and generic persistDraft; only the frozen review service can call package-scoped persistReviewedModel. First import uses the same review/apply path with an empty source catalog. Editor refreshes after import registration and refuses to overwrite dirty local drafts.
- **Anchor binding:** attaching/detaching preserves transform; current-model node membership is verified; draft writes validate anchor membership and publishing revalidates unresolved legacy anchors strictly. The duplication allowance applies to previously held legacy references only during draft editing, not publishing.

## Critical

None identified.

## Important findings

### C-1 — standalone import route retained the forbidden direct apply flow (fixed during review)

Original file: `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/imports.vue:11` in the first reviewed snapshot.

Trigger: open the list's Import action or resume a job with jobId, finish conversion, then choose “复核并应用此模型”. The old handler changed building.modelVersionId/assetKey and called saveDraft, which the new backend correctly rejects with MODEL_REVIEW_REQUIRED. The route could not use a completed model.

Fix verified in the current file: lines 5–7 use ReimportReview; lines 25–31 read the fresh draft and open the same frozen review; line 34 navigates only after the server's applied event. The direct saveDraft import and building mutation are gone. The backend bypass guard remains intact. **Closed.**

### C-2 / B integration — accepting a 3D diagnostic conflicts with the builder's code regex

Files: `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/DxfCalibration.vue:93`; `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/builders/dxfSpaceBuilder.js:50` in the reviewed snapshot.

Trigger: explicitly ignore a layer containing a 3D polyline, then check the displayed `DXF_UNSUPPORTED_3D` diagnostic to acknowledge it. The UI correctly sends that code, but the builder's `/^[A-Z_]+$/` rejects the digit and throws DXF_INVALID_CALIBRATION. A valid explicit-ignore/manual-review path fails.

Required fix: use `/^[A-Z][A-Z0-9_]*$/` for accepted diagnostic-code shape, consistent with the fixed error mapper, while retaining independent unsupported-modeled-entity rejection. This is a Task B interface repair, not a reason to remove diagnostics or relax geometry validation. Root has been notified; final closure is recorded below when reread.

## Minor findings closed during review

- DxfCalibration.vue:24 exposed chordToleranceM up to 1 while the builder accepts only 0.25. The control now uses max=0.25.
- ReimportReview.vue:25 previously implied recovery of baked scale; current wording states only translation assistance and explicitly excludes baked rotation, scale and deformation.

## Declined to judge

- Task A provider algorithms: this reviewer authored them; separate independent approval is required.
- CAD topology/geometry algorithms beyond the shared input/metadata contracts: covered by the separate Task B report and follow-up.
- Real conversion acceptance, rendering, uploads, permissions exercised over HTTP, Redis expiry timing and browser interaction behavior: functional execution is prohibited. No live-platform or published 505 data was read or changed.

## Assessment

Task C's own reviewed source is statically acceptable after C-1 and the two Minor repairs. The overall calibration path remains pending the single B diagnostic-code compatibility fix above. This is not a runtime acceptance claim; the final closure addendum determines the complete integration verdict.

## Final closure addendum

Reread `virtual-showroom-worker/src/builders/dxfSpaceBuilder.js:50`: acceptedDiagnosticCodes now permits digits (`/^[A-Z0-9_]+$/`), so `DXF_UNSUPPORTED_3D` can be acknowledged. The independent selected-modeling-role rejection remains at lines 65–67; acknowledging a code cannot enable unsupported geometry. C-2 is closed. The repaired imports.vue route, max chord tolerance 0.25, entryHash flow, anchorFrameBasis/nodeWorldMatrix4 passthrough and translation-only explanatory text were all reread from current source.

**Final verdict: Approved for Task C independent static review.** No unresolved Critical, Important or Minor finding remains from this review. This supersedes the provisional assessment immediately above and does not replace user manual functional acceptance.

Final registration increment reread: `VirtualModelImportService` now injects `VirtualModelMetadataService` and calls `metadata.read(job.getShowroomId(), version)` immediately after models.insert within the existing registration transaction, before resource/draft registration and the RUNNING-to-SUCCEEDED CAS. Invalid fixed metadata therefore rolls back model/draft registration rather than creating an unusable READY model. Existing owner-scoped room lock and job-state check remain; this increment introduces no new approval issue. Final static verdict remains Approved.

Final legacy-draft increment reread: `VirtualModelMetadataService.validateAnchors` permits an unchanged existing reference (including the existing allowed copy case) to remain during non-publishing draft edits when the current owned model's verified catalog is empty. This branch follows model-version matching and catalog loading. New binding PUT still requires a real catalog node, review cannot map an unavailable old node, and publishing receives no exemption. The added line does not authorize a new arbitrary anchor or a publication bypass; static verdict remains Approved.
