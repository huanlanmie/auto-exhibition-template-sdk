# Task D final metadata/error increment review

Reviewed revision: **working tree**, 2026-09-30. Read-only static follow-up to `review-d-followup.md`, focused on the source-ID truncation fix and CAD/STL reference-frame addition that landed during Task B/C integration. No tests, conversion, build, browser QA, startup, installation, source edits or Git mutation were performed.

## Evidence

Primary file: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/pipeline/metadata.js`.

- Lines 6–8 distinguish the full sanitized source ID from its bounded output. Length >256 now prevents stable=true. Lines 47–49 emit SOURCE_ID_TRUNCATED; line 72 downgrades the aggregate sourceIdentityConfidence. Sanitized extras and metadata anchors share this result. This closes the cross-B/D false exact-identity risk.
- Lines 37 and 55–61 restrict the bounds-center reference frame to STEP/IGES/STL. It retains the normalized node's linear matrix and replaces only its translation with the normalized world bounding-box center. The metadata explicitly identifies `anchorFrameBasis: node-linear-transform-with-bounds-center` and separately retains `nodeWorldMatrix4`. Ordinary formats, including the DXF local-reference-frame groups, continue using node-world matrices.
- Line 73 emits a review warning stating that vertex-baked rotation or shape changes cannot be recovered from this frame. The Stage 2 contract now defines normalizedMatrix4 as the anchor reference frame rather than falsely claiming it is always node.matrixWorld.
- `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelMetadataService.java:51` preserves the additional frame fields. `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ReimportReview.vue:25` explicitly limits the assistance to translation and excludes recovery of baked rotation, scale and deformation.
- `src/browser/errors.js:44`–47 additionally preserves the new bounded-DXF structural failures as fixed public codes. Earlier D-1 through D-6 closures remain applicable; no shared-normalization or source-boundary relaxation was introduced by this increment.

## Assessment

**Approved for the final Task D increment.** No unresolved Critical, Important or Minor issue was identified. The bounds-center frame is an explicitly documented reference choice, appropriate for assisting movement when CAD/STL coordinates are baked into vertices; it is not a reconstruction of absent CAD transforms and must remain subject to the mandatory mapping review. Earlier approval in `review-d-followup.md` plus this increment constitute the Task D static verdict.

Declined to judge: actual geometric correspondence on real CAD revisions, runtime conversions and visual behavior remain user manual acceptance items; Task A provider algorithms are approved only by their independent reviewer.
