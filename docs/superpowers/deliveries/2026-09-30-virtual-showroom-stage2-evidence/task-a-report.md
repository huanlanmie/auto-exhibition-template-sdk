# Stage 2 Task A — FBX / STL / STEP / IGES converters

Date: 2026-09-30. Implementation ownership returned to root after this report. This is an implementation handoff, not independent approval.

## Owned source files

- `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/converters/fbx.js`
- `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/converters/stl.js`
- `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/converters/occt.js`
- `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/converters/meshImportSupport.js`

No changes to package dependencies, runner, dispatcher, shared normalization/metadata/quality pipeline, backend, UI, SDK, or existing published 505 assets were made by Task A. Root owns integration and dependency/vendor changes.

## Contract and interfaces

Implemented against `docs/superpowers/contracts/virtual-showroom-stage2.md` and its stage2 implementation plan. Entry exports are `convertFbx(context)`, `convertStl(context)`, and `convertOcct(context)`; each accepts the shared context `{entryUrl, manager, report, resolveReference, placeholder, options, files, sourceHash, maxInputBytes}` and returns `{scene, animations: [], sourceVersion, normalizationHint, sourceIdentityConfidence}`, with OCCT additionally returning `units`.

`sourceIdentityConfidence` is always an object. Source nodes use safe `userData.sourceAnchor` with `stable: false`; FBX import IDs, OCCT hierarchy/mesh indices and STL triangle positions never claim stable revision identity. The common pipeline remains responsible for model version IDs, final node IDs/world matrices, quality, centering, additional scale, and export.

All reads are bounded, same-origin `/input/` resources. Providers cap model input at the lower of context.maxInputBytes and 100 MiB, geometry at 10 million vertices, and relevant source hierarchy at 20,000 nodes / depth 128. These checks do not replace the runner's process isolation, memory or timeout limits.

## FBX

- Uses installed Three 0.186.1 FBXLoader. Binary version must be >=6400; ASCII >=7000. Version/encoding and axis settings are reported. A bounded binary metadata walk reads only GlobalSettings axis fields; the pinned loader remains the mesh parser.
- Recognized non-Y/Z up axes, negative up or nonstandard coordinate-X axis/sign reject with `FBX_AXIS_UNSUPPORTED`. Missing up metadata is warned. `loaderOutputAxis: 'Y_UP'` prevents the common pipeline from applying another axis rotation after FBXLoader.
- `options.unit` omitted, null, empty or `auto` uses valid positive FBX UnitScaleFactor * 0.01 meters. Otherwise supported unit values (`m`, `cm`, `mm`, `in`, `ft`, plus helper aliases) explicitly override metadata. Missing/invalid metadata with auto requires user confirmation. Raw UnitScaleFactor, selected sourceUnit, unit basis and metersPerLoaderUnit are retained.
- Bakes skin and morph positions using the loader default pose into plain static Mesh geometry, recomputes deformed normals, removes skin/morph attributes and animation clips. Copies local matrices without flattening, preserving source hierarchy/transforms. Lights/cameras/lines/points retain transform groups but not their nontriangle appearance, with warnings.
- Converts materials to rough, nonmetallic PBR; retains supported color/emissive/opacity, diffuse/emissive/normal textures and basic side/vertex-color settings. Unsupported layered/specular/bump/alpha-map appearance is explicitly warned.
- Private texture LoadingManager forwards all item lifecycle calls to the shared manager. Shared URL policy remains intact. Exact package resource wins; unique basename fallback is reported; ambiguous/missing resources get the shared placeholder. Only PNG/JPEG/WebP are accepted via declared image extension; unsupported/failed images get placeholders. Remote references are rejected. Root must serve the own helper module alongside converters (confirmed with root).

## STL

- Requires explicit unit; never infers a physical unit from STL. Loader output remains source-axis/source-unit for shared normalization.
- Binary classification uses exact `84 + 50 * facetCount == byteLength`, even when its header begins with `solid`. Validates count, finite vertices and bounded geometry before loader allocations. Color extensions are ignored with warnings.
- Otherwise validates bounded UTF-8 ASCII with an explicit solid/facet/loop/three-vertex grammar, finite vertices, complete closing records, node/facet limits; canonicalizes only grammar keyword case for the pinned case-sensitive loader. Parsed triangle count must match preflight.
- Outputs one neutral triangle mesh, recomputes normals, warns about zero-area triangles, rejects wholly degenerate geometry. Multiple ASCII solid labels are deliberately combined and do not become stable identity.

## OCCT STEP / IGES

- Requires root's pinned classic `globalThis.occtimportjs` 0.0.23 factory and `/vendor/occt-import-js/occt-import-js.wasm`. Root serves classic JS at `/vendor/occt-import-js/occt-import-js.js`. No dynamic package installation or alternative URL fallback.
- Canonicalizes extensions locally: step/stp -> step; iges/igs -> iges. STEP requires ISO-10303-21 syntax and records FILE_SCHEMA where exposed in the bounded header; IFC schemas are rejected. Does not invent a STEP source version from the provider version.
- `ReadStepFile` / `ReadIgesFile` receive `linearUnit: 'meter'`, `linearDeflectionType: 'absolute_value'`, and strict precision parameters. Desktop defaults 0.001 m / 0.35 rad, mobile 0.005 m / 0.5 rad. Allowed ranges: linear 1e-6..0.1 m, angular 0.01..1.5 rad. Extra OCCT option keys reject.
- Reads actual 0.0.23 output: root.name/meshes/children; mesh attributes.position/normal arrays; index.array; mesh.color; brep_faces first/last/color. No guessed matrices/GUIDs/unit metadata. OCCT has already applied face locations. Shared normalization retains the user-selected source axis and extra scale, and receives loaderOutputUnit=m to prevent duplicate unit conversion.
- Validates finite geometry, indices and inclusive face ranges; fills uncolored range gaps, coalesces adjacent equal-material ranges. Inclusive endpoints map to `(last - first + 1) * 3` index count. Supports empty face ranges (`last == first - 1`) with review warnings. Rejects malformed hierarchy, duplicate mesh references, unreachable nonempty meshes and invalid indices.
- Caps face ranges at 200,000 and material colors at 2,048; excess colors use neutral fallback with warning. Preserves available hierarchy labels and mesh/face colors. Source unit remains explicitly unknown, output unit is m, identity confidence is low. Warns that returned mesh counts cannot certify source completeness; external references are not resolved.

## Fixed failure codes for root mapping

Shared: `INVALID_UNIT`, `EXTERNAL_RESOURCE_NOT_ALLOWED`, `MODEL_READ_FAILED`, `INPUT_SIZE_LIMIT`, `MISSING_GEOMETRY`, `GEOMETRY_LIMIT`, `INVALID_TRIANGLE_COUNT`, `INVALID_GEOMETRY`, `INVALID_GEOMETRY_INDEX`, `NODE_LIMIT`, `UNIT_CONFIRMATION_REQUIRED`.

FBX: `INVALID_FBX`, `FBX_VERSION_UNSUPPORTED`, `FBX_AXIS_UNSUPPORTED`, `FBX_PARSE_FAILED`, `FBX_STATIC_BAKE_FAILED`, `FBX_MATERIAL_INVALID`.

STL: `INVALID_STL`.

OCCT: `INVALID_QUALITY`, `INVALID_OCCT_OPTIONS`, `INVALID_CAD_FORMAT`, `INVALID_STEP`, `UNSUPPORTED_CAD_SCHEMA`, `OCCT_UNAVAILABLE`, `OCCT_IMPORT_FAILED`, `INVALID_CAD_OUTPUT`, `CAD_FACE_LIMIT`.

Existing shared resource-policy failures such as `UNSAFE_EMBEDDED_RESOURCE` may also propagate. Unknown loader/factory exceptions are reduced to the relevant fixed provider failure; generic fetch/runtime failures remain covered by the shared conversion failure handler.

## Verification and remaining review

Executed only `node --check` on all four owned files: all passed, exit 0. No actual conversion, unit/functional test, build, service startup, browser QA, installation, staging or commit was performed. A scoped git diff whitespace check exited 0 but new untracked files are not represented by normal git diff, so this is not claimed as substantive whitespace verification.

Independent review should focus on FBX static pose and matrix handling, private/shared texture-manager lifecycle, metadata-only binary node offsets, source-unit override semantics, STL binary/ASCII preflight and normalization, and OCCT actual schema / inclusive face ranges / meter normalization. Real files remain necessary to assess authored materials, failed CAD shapes, source completeness, retained hierarchy, assembly colors and known dimensions. Animated FBX is deliberately a default-pose approximation; CAD is display tessellation, not engineering reconstruction. Original files and the common reimport/manual-review workflow remain authoritative.
