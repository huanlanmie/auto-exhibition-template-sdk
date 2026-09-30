# Task B — DXF auxiliary modeling

Status: DONE, pending independent static review and root integration/build. Source ownership returned to root. No install, conversion, functional test, browser QA, startup, platform API, staging, commit or subagent dispatch.

## Exact files

All production files are under C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/:

- src/cad/dxfAnalysis.js — analyzeDxf(bytes,{sourceHash,parserFactory,limits?}) -> {document,preflight}
- src/cad/dxfGeometry.js — pure matrix, bounds, bulge/arc sampling and bounded preflight contour helper
- src/builders/dxfSpaceBuilder.js — buildDxfSpace(analysis,options,context) -> canonical provider result
- src/converters/dxf.js — convertDxf(context), private input fetch + actual entry-byte digest + analysis/build

No shared entry/runner/protocol/dependency/error/quality files were changed. Root must expose relative cad/builders/converters module paths, provide pinned classic DxfParser in browser or constructor injection, preserve report.dxf/unsupportedEntities, map error codes, collect anchors before clearing userData and compose common centering with provider source transform.

## Interfaces and behavior

Pure analyzer imports no Node APIs or parser dependency. parserFactory must be the pinned constructor supporting parseSync. UTF-8 is decoded strictly; a declared ANSI_936/GBK/GB18030 source may use built-in GB18030 decoding. Binary signature/null payloads and incomplete ASCII group pairs are rejected. Raw inventory retains skipped/unsupported entity records and distinguishes original hex handles from absent/duplicate handles; handle comparison is case normalized. Missing/ambiguous identities remain unstable, never promoted from parser-generated handles.

Source hash is the verified entire package SHA-256. Root's analysis route adds actual entryHash to public preflight. Converter independently hashes fetched entry bytes with crypto.subtle SHA-256, compares options.dxf.entryHash, and supplies this computed value to builder. Builder verifies package sourceHash and selected entryHash. Different DXFs inside the same ZIP cannot share a calibration by package hash alone. Digest context/request fields cannot replace the converter's actual byte hash.

Preflight exposes schema/sourceVersion/units/bounds, exact layers with counts/types/visibility, blocks with insert counts/xref flag, bounded source-WCS path preview and located diagnostics. Original xref paths and filesystem/storage paths are never exposed or fetched. Internal document retains full bounded primitives, transforms, block instances, unsupported records and diagnostics. Preview truncation is explicit and never truncates internal modeling geometry.

Supported planar paths: LINE, ordinary 2D POLYLINE/LWPOLYLINE including positive/negative bulges and closure, ARC with parser radian angles and wrapped CCW sweep, CIRCLE as a complete circle. POLYLINE source elevation is supplemented from raw tags. Nondefault OCS, fitted/3D polyline or mesh, unknown entities, missing/xref/cyclic blocks and nonplanar paths are located; a non-ignore role for an invalid entity rejects construction. acceptedDiagnosticCodes cannot override this gate. Explicitly ignored unsupported geometry remains a partial warning.

INSERT uses nested affine matrices, block base subtraction, degree-to-radian rotation, positive/negative/nonuniform scale and bounded row/column array offsets. Layer 0 inherits insert effective layer; nonzero child layers remain exact. Curves are sampled before applying affine transforms, with local tolerance conservatively adjusted for transform stretch. Genuine handle chains include insert array row/column instance suffixes. Path datum frames use source primitive centers and analytic initial direction so geometry is expressed locally under a source anchor transform, rather than baking every entity under identity anchors. Basic equipment block assets retain their canonical insert transform and explicitly report approximation.

Builder consumes schema-1 options.dxf plus latest entryHash extension. unitConfirmed=true and exact known unique layer names are required. Missing layers are ignore with a warning. Unit factor is user-confirmed options.unit or confirmed header suggestion times options.scale. With reference {a,b,distanceM}, final factor is distanceM/source XY distance and scale/unit are not multiplied again; requested extra scale is reported as overridden. Source XY/Z transforms once to canonical [x,z,-y] meters, shifting a source local origin before float geometry. Heights, wall thicknesses, asset dimensions and openings are already meters, never multiplied by source unit factor.

Roles: centerline walls generate bounded oriented solid pieces; explicit openings cut sill/lintel segments using wallPathRef and along-path meter distances. Overlap, outside-path dimensions and excessive height reject. Outline walls require closed wall footprint contours; their openings explicitly reject because this increment has no general CSG. Floor/column/equipment footprints must be nondegenerate closed contours; self-intersections, intersecting/touching ambiguous contours reject. Nested same-layer contours alternate solid/hole/island. Door layers are candidates only, not inferred openings. Disconnected LINE loops are not automatically stitched into floor/outline footprints. Open paths remain valid centerline walls only.

blockMappings supports box/desk/screen/cabinet/chair for blocks on an equipment-mapped effective layer. Defined meter dimensions create basic assets and dimensionless insert scales/rotations are retained. Known planar block contents are replaced by the chosen basic asset; unsupported/nonplanar content on any modeling role still rejects. The adapter does not convert real 3D CAD equipment or load external references.

Result: scene, animations:[], sourceVersion, normalizationHint {loaderOutputUnit:'m',metersPerLoaderUnit:1,loaderOutputAxis:'Y_UP',unitBasis,sourceAxis:'Z_UP'}, units and coordinateTransform including appliedToGeometry and extra-scale accounting. Common normalizer must not reapply unit/axis/options.scale. navigationHints are meter/Y_UP wall-box suggestions in provider-local-before-common-centering coordinates, marked requiresReview; root stores them as metadata only. No business navigation is overwritten.

Generated source groups carry userData.sourceAnchor {id,stable,basis}; native unique handle chains use basis dxf-handle-chain, generated/ambiguous IDs are unstable. Individual derived mesh pieces do not claim fabricated stable CAD identity. Root collects sanitized node catalogs before userData cleaning.

## Budgets

Contract hard bounds: input 16 MiB; groups 1,000,000; raw/expanded entities 100,000 each; block nesting16; curve segments2048 each; paths20,000; preview points50,000. Caller limits may only lower these. Derived internal points additionally cap1,000,000, single sampled path100,000 points, preflight topology comparisons4,000,000 (explicit incomplete diagnostic), builder topology comparisons8,000,000 (reject), model nodes20,000 including groups/pieces, vertices10,000,000, collider suggestions10,000. Diagnostic previews truncate at1,000 with total counts retained. Root worker-thread isolation adds wall-clock enforcement to synchronous analysis; browser job timeout isolates build.

## Fixed error codes for shared boundary mapping

DXF_BINARY_UNSUPPORTED, DXF_BLOCK_CYCLE, DXF_BLOCK_DEPTH_LIMIT, DXF_CALIBRATION_HASH_MISMATCH, DXF_CALIBRATION_REQUIRED, DXF_CONTOUR_DEGENERATE, DXF_CONTOUR_OPEN, DXF_CONTOUR_OVERLAP, DXF_CONTOUR_SELF_INTERSECTION, DXF_CURVE_LIMIT, DXF_ENCODING_UNSUPPORTED, DXF_ENTITY_LIMIT, DXF_EXPANSION_LIMIT, DXF_GEOMETRY_LIMIT, DXF_GROUP_LIMIT, DXF_INVALID_ASCII, DXF_INVALID_BLOCK, DXF_INVALID_BLOCK_MAPPING, DXF_INVALID_CALIBRATION, DXF_INVALID_DIMENSION, DXF_INVALID_GEOMETRY, DXF_INVALID_LAYER_MAPPING, DXF_INVALID_LIMITS, DXF_INVALID_OPENING, DXF_INVALID_REFERENCE, DXF_MISSING_BLOCK, DXF_NO_MODELED_GEOMETRY, DXF_NONPLANAR, DXF_OPENING_BOUNDS, DXF_OPENING_OUTLINE_UNSUPPORTED, DXF_OPENING_OVERLAP, DXF_OPENING_TARGET, DXF_PARSE_FAILED, DXF_PARSER_UNAVAILABLE, DXF_PATH_LIMIT, DXF_POINT_LIMIT, DXF_READ_FAILED, DXF_SIZE_LIMIT, DXF_SOURCE_HASH_REQUIRED, DXF_TOPOLOGY_LIMIT, DXF_UNIT_REQUIRED, DXF_UNSAFE_NAME, DXF_UNSUPPORTED_ENTITY, DXF_UNSUPPORTED_MODELING_ENTITY, DXF_UNSUPPORTED_OCS, DXF_UNSUPPORTED_3D, DXF_XREF_UNSUPPORTED. Existing INVALID_UNIT and INVALID_SCALE also occur. Runtime hard errors use static messages, not filesystem exceptions or paths; entity failures during analysis become located diagnostics and selected invalid layers reject with DXF_UNSUPPORTED_MODELING_ENTITY.

Other diagnostics: DXF_HIDDEN_OR_PAPERSPACE, DXF_UNSTABLE_ID, DXF_CURVE_APPROXIMATION_LIMIT, DXF_OPEN_PATH, DXF_PREFLIGHT_TRUNCATED, DXF_TOPOLOGY_PREFLIGHT_LIMIT, DXF_NO_SUPPORTED_PATHS, DXF_UNIT_UNKNOWN, DXF_MULTIPLE_ELEVATIONS, DXF_REFERENCE_SCALE_OVERRIDE, DXF_AXIS_CANONICAL, DXF_UNMAPPED_LAYER, DXF_IGNORED_ENTITY, DXF_BLOCK_ASSET_APPROXIMATION, DXF_DOOR_CANDIDATE, DXF_IGNORED_LAYER, DXF_NAVIGATION_TRUNCATED, DXF_AUXILIARY_MODEL. Diagnostic acceptance does not clear partial reports or suppress hard geometry gates.

## Validation performed

Only JavaScript syntax checks: node --check for all four modules, exit0. No module evaluation, parser calls, scene building, exported conversion or functional assertions. Scoped git diff --check output had no errors; files are newly added/untracked, so root's review package/full build must include them explicitly. No automated functional evidence is claimed.

## Manual boundary checklist

1. Known-size mm/m drawings and a two-point reference; nondefault options.scale must affect unit mode exactly once, and be explicitly overridden in reference mode. Wall/column heights and door dimensions remain meters.
2. Positive/negative polyline bulges including closing segment; ARC crossing 0 angle; CIRCLE; old POLYLINE elevation; curve segment limit and huge coordinates.
3. Nested INSERT block bases, 90-degree rotation, mirror/nonuniform scale, row/column arrays, effective layer0 inheritance and duplicate original handles. Block-array identities remain unique.
4. Missing block/xref/cycle, nondefault OCS, 3D polyline/mesh/solid and nonplanar LINE on a selected role reject. Set offending layer to ignore with another valid role and inspect explicit partial omissions.
5. Closed floor/column/outline footprint, holes/islands, open contour, bow-tie self-crossing and touching/overlapping contours. Centerline junctions remain approximate and require review.
6. Explicit wallPathRef opening at known meter distance, sill/lintel, wrong reference, overlapping/out-of-bounds openings and outline-wall opening rejection. Door drawing does not independently make a hole.
7. Explicit equipment block mapping retains placement and creates declared basic asset, without claiming original equipment geometry.
8. Multi-DXF ZIP: calibrate a.dxf then choose b.dxf in the same package. SourceHash matches but actual entryHash differs, producing DXF_CALIBRATION_HASH_MISMATCH. Correct calibration passes the identity gate.
9. Preview/diagnostic/topology/geometry truncation and hard limits are visible; changing source file requires analysis again. Generated IDs never become exact stable reimport matches; native source datum frames move/rotate attached-anchor matrices.

No open implementation blocker; independent reviewer should scrutinize affine array placement, source datum frames, contour topology/holes and provider/common normalization composition. These are deliberately unverified by functional execution under the approved constraints.

## Independent review repair — parser-front allocation guard

Task A identified that pinned parser's LWPOLYLINE loop trusts group90 before post-parse geometry budgets. Raw scan now requires exactly one positive integer90, no more than the raw vertex budget, and exact agreement with actual group10/group20 coordinate counts. This runs before constructing/calling parserFactory, preventing oversized declared counts from entering the library loop. Raw POLYLINE sequences also require VERTEX/SEQEND continuity and a terminating SEQEND before any subsequent record; actual VERTEX count remains bounded before parse. New fixed errors: DXF_INVALID_VERTEX_COUNT and DXF_INVALID_POLYLINE. No functional parse/conversion/test was executed; repair checked statically and with node --check only.

## Independent review repair — section grammar and parser identity pairing

Task A identified that duplicate ENTITIES sections would accumulate raw records while the pinned parser overwrites its section result. Raw scan now enforces exactly named, non-nested, unique sections (including unknown declared sections), matched SECTION/ENDSEC and a single final EOF, without records after EOF. BLOCK/ENDBLK must be correctly nested in BLOCKS; loose VERTEX, orphan SEQEND and incomplete POLYLINE sequences reject before parser invocation. INSERT attribute-follow sequences are tracked through ATTRIB/SEQEND for structural completeness; unsupported attribute geometry still participates in the existing diagnostics/role gate.

Per-container raw/parser type queues now fail closed when a supported raw entity is missing, a parsed original string handle/type differs, a missing-handle entity is not parser-generated numeric identity, or parser entities remain unmatched. Original native string handles are verified against the installed pinned handler/scanner source; generated numeric handles are never upgraded to stable. Duplicate ENTITIES therefore cannot let source handle A claim geometry from handle B. New fixed errors: DXF_INVALID_STRUCTURE and DXF_PARSE_IDENTITY_MISMATCH. No parse/conversion/tests executed; syntax validation only.
