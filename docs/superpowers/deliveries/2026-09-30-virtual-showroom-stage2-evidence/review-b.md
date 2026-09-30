# Task B independent static review

Reviewed revision: **working tree**, 2026-09-30. Authority: `docs/superpowers/contracts/virtual-showroom-stage2.md` and Task B in the stage2 plan. Primary scope: platform Worker `src/cad/dxfAnalysis.js`, `src/cad/dxfGeometry.js`, `src/builders/dxfSpaceBuilder.js`, `src/converters/dxf.js`. Installed dxf-parser 1.1.2 source and shared metadata code were read to verify integration. No source changes, conversions, tests, builds, startup, installation or Git mutations were performed. Only this report was written.

## Strengths and reviewed paths

- The analyzer uses a separate raw group scan, retains unsupported entities skipped by the parser, distinguishes generated/duplicate entity handles, bounds expansion/path/preview counts, and reports preview/topology truncation. Unsupported/nonplanar entities cannot silently enter a selected modeling role; an explicit ignore role remains visible in diagnostics.
- ARC angles are consumed as radians from the installed parser; INSERT rotation is converted from source degrees. Bulge arcs are sampled in local coordinates before the full block affine transform, so nonuniform scaling and reflection affect the curve rather than only its center. Nested INSERT composition applies the block base point subtraction and rotated row/column offsets, with cycle/depth/expanded-count checks and layer-0 inheritance.
- Reference calibration directly determines the effective meter factor and does not multiply the extra scale again. User wall heights/thicknesses/opening dimensions remain meters. Provider output advertises m/Y_UP so the common normalizer will not repeat these transforms.
- Centerline openings require an exact wall path and bounded along-path distances; overlap and height checks are explicit. Closed footprints remove duplicate endpoints, reject self intersections and ambiguous overlaps, and form nested holes by containment. Mapped basic assets retain an affine placement matrix and are reported as approximations.
- Converter recomputes selected-entry SHA-256 from actual bytes and requires it alongside the verified package identity. It only reads context.entryUrl from the shared private package server; xref blocks are diagnosed rather than fetched. Navigation metadata clearly labels its pre-common-centering coordinate space and requires review.

## Critical

None identified in this static review.

## Important

### B-1 — untrusted declared vertex count reaches an unbounded third-party allocation loop

Primary file: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/cad/dxfAnalysis.js:85`–87. Raw scan at 12–51 currently checks byte/group/entity counts but not LWPOLYLINE's declared group-90 vertex count against actual vertex records.

Installed dependency evidence: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/node_modules/dxf-parser/src/entities/lwpolyline.ts:78` loops `i < n`; at 81 it can stop the inner scan on a following code 0, yet at 119 still pushes a vertex for every remaining iteration.

Trigger: a small otherwise structured ASCII DXF declares `90 = 2147483647` but supplies one actual vertex before the next entity/ENDSEC. It passes the current small-file/raw-group/entity budgets, then the parser performs enormous allocation before the analyzer's geometry/derived-point checks run. Similarly, the installed POLYLINE parser has a no-progress loop when a vertex sequence reaches an unexpected entity without SEQEND, so sequence structure should be validated before calling it.

Impact: the promised scope budgets do not bound parser work/memory; a tiny source can exhaust a conversion process or analysis worker well before ordinary geometry checks. Worker-thread timeout isolation helps cancellation but is not an allocation budget.

Fix: raw-preflight count-bearing structures before invoking the parser: require integer bounded LWPOLYLINE group-90 counts, match them to actual vertex starts, reject missing/malformed vertex sequences and enforce POLYLINE/SEQEND structure. Apply similar checks to any other supported count field that controls a parser allocation/loop. Keep the existing parent-controlled deadline as a separate defense.

### B-2 — duplicate source sections can assign another entity's geometry to a trusted handle

Primary file: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/cad/dxfAnalysis.js:27`–29 and 95–100.

Installed dependency evidence: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/node_modules/dxf-parser/src/DxfParser.ts:247` assigns `dxf.entities = parseEntities(false)` for each encountered ENTITIES section, overwriting the earlier parsed entities.

Trigger: the raw input has two ENTITIES sections. The raw scan accepts both and accumulates their roots. The installed parser retains only the last section. `byType.get(record.type)?.shift()` pairs the first raw LINE record (handle A, layer WALL) with the last section's LINE geometry (handle B, different layer). The code never checks that the paired parser handle/type/layer belongs to the same raw record. A is then marked stable from its raw handle while containing B's geometry; B later becomes unsupported. If B's layer is ignored, modeling can still produce that incorrect trusted A node.

Impact: malformed input is not merely rejected or marked partial: source identity and geometry can disagree, compromising the exact-match basis used by model replacement.

Fix: make the raw section/sequence state machine reject duplicate or nested standard sections, misplaced ENDSEC/EOF, and malformed BLOCK/ENDBLK or POLYLINE/SEQEND structure before parser invocation. Independently reconcile parser results with raw records (real handle/type consistency and complete accounting); fail closed on a mismatch instead of guessing by type order. Generated handles must remain untrusted.

### B-3 — full DXF handle chains are truncated while retaining trusted stable identity

Producer files: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/cad/dxfAnalysis.js:100` and 124; `src/builders/dxfSpaceBuilder.js:10`.

Shared integration file: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/pipeline/metadata.js:6`–9. Root owns this shared file; this finding arose from Task B's identity output integration rather than a self-review of Task A.

Trigger: supported nesting allows 16 INSERT levels, with raw handles up to 32 hexadecimal characters. Their complete identity chain can exceed 256 characters. The builder correctly passes the full chain and stable=true, but shared metadata truncates id to 256 and still marks it stable. Two chains sharing that prefix but ending in different child handles collapse to one identity. If one old revision and one new revision each contain only one of these distinct entities, a uniqueness check alone cannot detect the truncation collision and can suggest an incorrect exact match.

Impact: long but permitted source hierarchies can produce falsely trusted identities and attach objects to a different source entity on reimport.

Fix: preserve a collision-resistant deterministic identity of the complete chain within the output limit (e.g. digest of the full canonical raw chain, with a readable prefix kept separately), or force stable=false and emit a diagnostic whenever source identity must be truncated. Do not truncate authoritative text while preserving the source-entity claim. The same rule should apply consistently to GLB extras and model-meta anchors.

## Minor

None separately raised. Generic performance/style refinements were not promoted over the concrete boundary defects above.

## Declined to judge

- Task A FBX/STL/OCCT algorithms: separate ownership/review; not part of Task B.
- Task C UI/CAS/model replacement implementation: still assigned elsewhere; the B output contract was reviewed, not the full UI/backend.
- Actual shape appearance, curve fidelity on real exports, measured memory/timeout behavior, mesh triangulation correctness on a model corpus, and manual navigation acceptance: runtime execution is explicitly excluded. Syntax-check reports from the implementer were not treated as proof of these behaviors.
- Navigation colliders as a complete walkable-space solution: the provider explicitly marks them as reviewable hints and the contract does not authorize automatic navigation replacement; no completeness guarantee was assumed.

## Verdict

**Ready to merge: No, pending the three Important fixes and static recheck.** Unit/transform construction and explicit modeling decisions have coherent static implementations, but the parser boundary and trusted identity path need to fail closed before the result can safely feed reimport exact matching. No Critical issue was identified. This is an independent source review, not a functional conversion acceptance claim.
