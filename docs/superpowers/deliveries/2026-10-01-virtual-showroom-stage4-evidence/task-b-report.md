# P4 Task B implementation report

Date: 2026-10-01. Snapshot: working tree. Implementation handed back for independent review; no self-approval or commit. Authority: `docs/superpowers/contracts/virtual-showroom-stage4.md` and Task B/Global sections of the stage4 plan.

## Exact source ownership returned

Four new files under `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/`:

- `src/native/dwg3dTopology.js`
- `src/native/dwg3dBridge.mjs`
- `src/providers/dwg3dProvider.js`
- `src/converters/dwg3d.js`

No P3 DWG2D, native supervisor, shared config/protocol/route/runner/metadata, Java, UI, package, installed dependency, source fixture, 505 data or original user file was edited. Root owns shared whitelist/dispatch/capability/error integration. The topology helper is the plan's pre-authorized fourth file and was announced before implementation.

## Actual supported scope

Exactly `['3DFACE','POLYLINE_PFACE','POLYLINE_MESH']` plus ordinary INSERT hierarchy. POLYLINE_MESH must be unsmoothed (curve_type zero and no fit flags). Actual source vertex/face topology is read; there is no DXF conversion, line extrusion or replacement-box path. MESH is **not** advertised: it fails explicitly along with unsupported entities. MINSERT/dynamic-block markers are rejected; ACIS 3DSOLID/REGION/BODY/surface types, proxy/custom classes, unknown types and external references are rejected. Known pure line/annotation entities are counted as omissions. Model-space traversal uses `dwg_model_space_object` and owned entities; instantiated blocks recurse with a visited active set, while uninstantiated block geometry is not emitted. Top-level paper-space entities are counted separately as omitted.

Every accepted output is partial with `completeness:'unknown'`. This implementation is a restricted triangle-mesh DWG adapter, not complete native DWG/ACIS support. No runtime compatibility is claimed.

## API / data contract

- Parent `analyzeDwg3d(request,workspace,signal,progress)` returns format `dwg3d`, original package `sourceHash`, selected DWG `entryHash`, original entry/candidates, safe diagnostics and the contract `dwg3d` analysis object.
- Parent `prepareDwg3dConversion(...)` returns `{derivedFiles:{'scene.glb':absoluteFixedFile},derived:{dwg3d:{sceneUrl:'/derived/scene.glb',providerMeta}}}`.
- Child payload uses only P3 fields `{mode,jobId,sourceFile,sourceHash,options,outputDir}`; **no extra payload entryHash**. Child hashes actual selected bytes; parent independently hashes and compares provenance.
- Native analysis result is `{analysis}`. Conversion writes only fixed `scene.glb`, `provider-meta.json` and `result.json`; result descriptor is `{files:['scene.glb','provider-meta.json'],providerMeta}`. Parent checks exact file list, regular-file/realpath containment, sizes, GLB magic/version/declared length, selected-entry/package provenance and safe metadata fields. It rebuilds public metadata through an explicit field/diagnostic allowlist.
- Browser `convertDwg3d(context)` reads only Root `context.derived.dwg3d`, validates fixed URL/provenance/scope/normalization, reuses `convertGltf` with all external references disabled, rejects animations, downgrades all source anchors to `stable:false`, and returns metre/Y-up trusted hints for common quality/streaming.
- Public report key is **`report.dwg3d`**. Root Java owner metadata should retain this safe report key. Its fields include fixed provider/version/scope, source version, strict readFlags, entity/omitted counts, supported entities, safe diagnostics/statistics and normalized-local coordinate basis. Original source names, object graphs, paths and exact datum are not exported.

## Topology / transformation details

`dwg3dTopology.js` operates on the fixed raw module API; it never uses the high-level whole-database converter. Global object/class enumeration precedes geometry traversal, limits collection sizes, and checks `s_zombie` and block xref fields. Unsupported solid/proxy/custom data fails even if its block is not instantiated, a conservative admission boundary.

3DFACE uses corner1..4; equal third/fourth corner yields a triangle. Triangle/quad triangulation checks finite data, area, planarity, crossing edges and ear/remaining-triangle orientation. Invalid/degenerate/nonplanar faces are rejected rather than silently repaired. Polyface vertices/faces come from bounded owned-subentity traversal. Inline `vertind[4]` uses the pinned exported field-offset API and eight checked heap bytes read as little-endian signed int16, with **no WASM calls while the DataView is used**. Negative indices preserve the surface and encode invisible-edge semantics only; zero terminates the face. Actual valid topology takes precedence over advisory numverts/numfaces counts, with an explicit partial diagnostic on mismatch. No numeric array helpers returning local-vector views are used.

Unsmoothed M×N polygon meshes validate the real vertex count, closed-direction flags and per-cell faces. Supported mesh/INSERT block ownership and polyface/mesh child ownership are proven independently of the linked traversal, then their complete raw owned sets must be covered by each reachable owned chain (see B-I1 below). Vertex indices are validated and compacted before emission, so unused source coordinates cannot inflate actual emitted bounds. Depth <=64, expanded visits <=100k, objects <=100k, classes <=1024, total emitted vertices/triangles <=10m, native scene nodes <=20k. Each mesh stores real source-world double positions and triangle indices.

INSERT uses extrusion arbitrary-axis basis, OCS insertion point, raw radian rotation, nonuniform/negative scale and negative block base-point translation, composed recursively. Singular/nonfinite/extreme transforms fail rather than becoming identity. A negative cumulative determinant reverses triangle winding. Normals are rebuilt from resulting triangle geometry. The source has no skinning, animation or texture reconstruction; neutral PBR material is explicitly reported as an approximation.

Before Float32 conversion, each mesh is centered using double precision and assigned a matching normalized local translation; this preserves a meaningful heuristic frame and reduces avoidable far-coordinate precision loss. Float32-collapsed triangles fail. Output normalized-local coordinates are bounded to +/-100,000 metres; an origin error asks for a usable local datum/source partition. This is an explicit additional geometric safety boundary, not a claimed source-size capacity.

## Units / origin / identity

Known INSUNITS mappings: inches (1), feet (2), mm (4), cm (5), metres (6). Other/missing/zero codes are unknown until explicit user unit selection. Options unit accepts `auto/m/cm/mm/in/ft`; auto never silently chooses metres for unknown units. Preflight sourceUnits is `{headerCode,unit,metersPerUnit,basis}` where basis is drawing-insunits or user-override, and unit/factor may be null. Preflight always requires explicit unit confirmation; it offers suggestedOriginM from actual referenced model-space mesh bounds when units are known, otherwise null.

Convert requires exact options.dwg3d keys, schema1, matching package/entry hashes, scopeConfirmed=true, unitConfirmed=true, originMode=local, finite three-number localOriginM (metres/Y-up), locked Y-up and `centering:false`. Child applies source-unit scale then `[x,z,-y]` once and subtracts the confirmed origin. Public report excludes that source datum. Browser hints identify already-metric/Y-up output; common optional extra scale remains Root's one additional application.

Source handles are preserved as lowercase hexadecimal INSERT-chain/entity labels and bounded to the public identity length. Every identity remains `stable:false/basis:'dwg-original-handle-chain'`; raw pointers, object-array positions and source names are never stable identities. Common global node IDs/catalog are still assigned by Root's existing metadata pipeline.

## Caps / isolation / errors

32 MiB regular DWG input; allowed header AC1015/1018/1021/1024/1027/1032; strict raw readFlags=0; 1 MiB engine diagnostic volume; fixed local WASM and MEMFS `/input.dwg`; no NODEFS, lazy external references, remote lookup or commercial tool. Parent uses unchanged P3 `runNativeJob('dwg3dBridge.mjs',...)` with configured <=3 GiB quota and quiescence policy; Root must add only this fixed module to the supervisor whitelist. Native GLB <=100 MiB and also parent <=configured output cap; metadata/result <=8 MiB. Root still owns aggregate output budget and streaming closure.

Fixed failures for Root mapping:

`DWG3D_INVALID_REQUEST`, `DWG3D_SIZE_LIMIT`, `DWG3D_VERSION_UNSUPPORTED`, `DWG3D_READ_FLAGS`, `DWG3D_AUDIT_FAILED`, `DWG3D_COMPLEXITY_LIMIT`, `DWG3D_TOPOLOGY_INVALID`, `DWG3D_GEOMETRY_LIMIT`, `DWG3D_NO_GEOMETRY`, `DWG3D_SOLID_UNSUPPORTED`, `DWG3D_ENTITY_UNSUPPORTED`, `DWG3D_EXTERNAL_OR_PROXY_UNSUPPORTED`, `DWG3D_CUSTOM_CLASS_UNSUPPORTED`, `DWG3D_TRANSFORM_UNSUPPORTED`, `DWG3D_BLOCK_CYCLE`, `DWG3D_UNIT_REQUIRED`, `DWG3D_UNIT_INVALID`, `DWG3D_CONFIRMATION_REQUIRED`, `DWG3D_CALIBRATION_STALE`, `DWG3D_ORIGIN_REQUIRED`, `DWG3D_EXPORT_FAILED`, `DWG3D_RESULT_INVALID`, `DWG3D_PROVIDER_UNAVAILABLE`, `DWG3D_ENGINE_FAILED`, `DWG3D_LOG_LIMIT`, `DWG3D_DERIVED_INVALID`.

Warnings: `DWG3D_PARTIAL`, `DWG3D_MATERIAL_APPROXIMATION`, `DWG3D_DECLARED_COUNTS_DIFFER`, `DWG3D_ANNOTATIONS_OMITTED`, `DWG3D_PAPER_SPACE_OMITTED`. Existing `NATIVE_*` failures pass through unchanged, including cleanup-unconfirmed so Root retains workspace. Exceptions use fixed codes only, never raw native log/source text.

## Verification and review limits

`node --check` passed for all four files; final syntax command exit 0. No module was imported/executed for testing, and no WASM initialization, source parse, conversion/export, test, browser QA, service, install or Git mutation occurred. Pinned API checks were static reads of installed declarations and the source references documented in `native-research.md`.

Required independent review focus: block/OCS coordinate interpretation, raw subentity ownership and version-specific topology, inline field offset/heap lifetime, conservative class acceptance, output/metadata closure, locked units/origin and common extra scale, real native lifecycle integration. Actual drawings (3DFACE/polyface/unsmoothed mesh, nonuniform/mirrored/nested INSERT, unknown units, missing/proxy/ACIS cases) remain user manual acceptance. Static syntax does not prove those conversions.

Retain the new private bridge/topology source in the existing GPL source/notices process. They must not enter browser/vendor routes. The private Node parent and browser converter must stay on their intended sides of the Root whitelist.

## B-I1 independent-review repair

Root authorized only `src/native/dwg3dTopology.js` to reopen after independent Task A reviewer identified possible empty/partial native owned chains. Strict readFlags=0 does not prove chain completeness. The fix pre-enumerates every supported raw mesh/INSERT's actual owner using `dwg_entity_owner(record.tio)`, maps its returned BLOCK_HEADER TIO to the raw block object, and requires the reachable block's linked list to contain that complete set. The pinned native owner API handles ownerhandle then entmode 2/1 model/paper-space fallback; the adapter does not guess an orphan into model space.

VERTEX_PFACE/VERTEX_PFACE_FACE/VERTEX_MESH use a separate strict common ownerhandle/ref resolution to the correct actual POLYLINE parent. Missing/failed/zero ownerhandle, wrong parent type, unresolved pointer, or an omitted child/face in the subentity chain now rejects. These vertices do not incorrectly use the BLOCK_HEADER-only owner API. Ordered native lists are cached only after proof; the adapter does not repair/reorder missing topology or use inaccurate advisory numfaces to mask missing raw owned faces.

New fixed failure: **`DWG3D_OWNERSHIP_INVALID`** (Root mapping needed). This conservative rule may reject legacy files whose subentity ownership cannot be proven; it does not silently succeed with missing supported geometry. Exact pinned API evidence is `binding_ent.cpp:9`, `src/dwg_api.c:24645`, and installed converter.js's orphan-index implementation. Reviewer and author agreed on entity **TIO**, not Dwg_Object*, for the block owner call.

Repair static verification: `node --check src/native/dwg3dTopology.js` exit0; final SHA256 `A5A2FE78F86CEE9FB583568FB9BD2485FF1DBB6953C462B9059C7E534C4A1210`. No module import/engine/source parse/conversion/test executed. Four-file ownership returned to Root; independent reviewer must verify this repair, not its author.

## B-C1 supplementary precision repair

Task C independently noted that the quad signed-area predicate multiplied absolute projected coordinates; valid small faces at large engineering coordinates could suffer cancellation before the later origin rebase. Root authorized a topology-only repair: translate the temporary projected 2D points by projected p0 before area/cross/ear predicates. Original 3D vertices, world transforms, emitted positions, source bounds and final localOrigin semantics are unchanged. This improves predicate precision without attempting to recover precision already absent in the input doubles.

Only `dwg3dTopology.js` changed. `node --check` exit0; updated locked SHA256 **`DA38AF0E47962B49D92DB5411EF5223BF377006C90616BD6C2A71CC53E308F84`**. No engine, input parse, numerical/model test or conversion was executed. Ownership returned to Root; Task A/C were notified for independent closure. Earlier B-I1 hash documents its earlier reviewed snapshot; this hash identifies the latest narrow follow-up.
