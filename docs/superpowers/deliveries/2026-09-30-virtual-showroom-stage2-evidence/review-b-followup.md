# Task B follow-up independent static review

Reviewed revision: **working tree**, 2026-09-30. This follows the three Important findings in `review-b.md`, plus the accepted-diagnostic compatibility issue found while reviewing Task C. No tests, conversions, builds, browser QA, startup, installation, source edits or Git mutations were performed; only this report was written.

All source paths below are under `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/`.

## Finding closures

- **B-1 resolved:** `src/cad/dxfAnalysis.js:61`–65 checks exactly one decimal integer LWPOLYLINE group-90 declaration, safe positive bounded count, and equality with actual X/Y vertex starts before `parser.parseSync`. A tiny input can no longer ask that parser loop for billions of vertices. Lines 28, 56–58 and 73 enforce POLYLINE/VERTEX/SEQEND order/completion before the third-party parser; vertex collection is separately bounded. Existing worker/browser deadlines remain in addition to these pre-allocation checks.
- **B-2 resolved:** `src/cad/dxfAnalysis.js:25`–58 adds unique, nonnested named sections, matched ENDSEC/EOF, active BLOCK/ENDBLK boundaries, and compound attribute/vertex sequences. The duplicate-ENTITIES trigger is rejected before parser overwrite can occur. Lines 60 and 128–130 reject conflicting raw handles, mismatched parsed type/original handle and missing supported parsed entities; generated parser handles are only accepted in the no-source-handle case and remain untrusted. Line 179 rejects unmatched parser results. This preserves unknown-entity diagnostics while no longer attaching a mismatched supported geometry to a trusted handle.
- **B-3 resolved in shared metadata:** `src/pipeline/metadata.js:6`–8 retains the pre-truncation length and forces stable=false for a source identity longer than 256 characters. Lines 47–49 emit SOURCE_ID_TRUNCATED and line 72 downgrades aggregate identity confidence. Both model-meta and exported sanitized sourceAnchor extras use the same downgraded identity. Even if the readable prefixes collide, they can no longer produce an exact source-entity match.
- **C/B diagnostic integration resolved:** `src/builders/dxfSpaceBuilder.js:50` now accepts digits in acknowledged diagnostic codes, including DXF_UNSUPPORTED_3D. Its modeled-role rejection remains independent; code acknowledgement only records review and cannot admit unsupported entities.
- **Error interface checked:** `src/browser/errors.js:44`–47 contains fixed safe messages for the newly added vertex-count/polyline/structure/identity failures, so both Node analysis and browser conversion preserve actionable codes without raw parser text.

## Remaining findings

No unresolved Critical, Important or Minor issue was identified in these repairs. The original unit/geometry/transform/door/contour/asset/hash review remains as documented in `review-b.md`; this follow-up does not claim model execution or visual acceptance.

## Declined to judge

- Task A provider algorithms: independently reviewed elsewhere; this reviewer authored Task A.
- Full Java/UI behavior: separately reviewed in `review-c.md`.
- Real model conversion, memory/timing measurements and navigation usability: functional execution is prohibited and remains manual acceptance work.

## Verdict

**Approved for Task B independent static review.** The three original Important findings and the later diagnostic-code integration defect are closed in the reviewed working tree. This supersedes the blocking verdict in `review-b.md` while retaining it as the initial record.
