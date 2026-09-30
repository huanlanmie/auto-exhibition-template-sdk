# P3 Task A IFC provider implementation report

2026-09-30. Implementation and static syntax checks complete; source ownership returned to Root for independent review. **No IFC engine was initialized, no source model was parsed/converted, and no functionality/fidelity/quota acceptance is claimed.** The report is not self-approval.

## Exact owned files

All five are new files under `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/`:

| File | SHA256 at handoff |
| --- | --- |
| src/metadata/ifcSource.js | A37B995FF1D14AF7719FAB059139AEE00B1FDA84B66E454F6912B1AC1AC62599 |
| src/metadata/ifcMetadata.js | 886B5AD58C3F55121727FDEDE3C3C334505FCCA193312C21FB6F68AEBE869A5D |
| src/native/ifcFileReader.js | 17066556003A69E8EA79E11446252D37E08793A2D893780E6135C069EAEE51DA |
| src/native/ifcBridge.mjs | 7FD12B1BF0DBA6BBDF1A9D24AB0FC108B8EBFC8CB857CB41BBDC2F74542B0E90 |
| src/converters/ifc.js | 9A8FDABC3EDB6F8F00FF99377E6333B877DDBA01A635F347ACD2B4D1B77871B9 |

No extra source helper, shared/runner/package/Java/UI file, dependency, service state, source sample, Git index or commit was changed by this author. Root-installed web-ifc0.0.78 and Three0.186.1 were read only. This report is the only additional Task A artifact.

## Interfaces and fixed output

`ifcSource.js` exports `IFC_LIMITS`, fixed `IFC_ERRORS` and `IFC_DIAGNOSTICS`, `scanIfcSource(bytes)`, `validateIfcOptions(options,{sourceHash,entryHash},mode)`, small typed predicates/diagnostic/text helpers. Scanner result is private `{records:Map,types:Map,sourceSchema,schema,counts,inputBytes}`; it does not initialize native code.

`ifcMetadata.js` exports `collectIfcMetadata(api,modelID,WebIFC,source,selection)`, `IFC_NORMALIZE`, matrix validation and wrapper disposal. Collector returns typed unit/placement/relationship/filter data, owner-only private element/georef data, safe public summary builder, diagnostics and counts. Its API is used only by the isolated Node bridge, not by Vue/browser bundles.

`ifcFileReader.js` exports `installIfcFileReader()→restore`. Temporary FileReader accepts only Node Blob for readAsArrayBuffer, never a path/URL/string; readAsDataURL/readAsText are rejected. GLTFExporter binary/no-texture path uses the shim; the original global descriptor is restored in finally.

`ifcBridge.mjs` is the boundedNative child entry point; argv[2] must be an absolute regular `request.json`. Payload exact keys: `mode,jobId,sourceFile,sourceHash,options,outputDir`; no extra entryHash payload field is accepted. outputDir must be the regular request directory (realpath checked). The file handles mode analyze|convert, computes actual entry SHA256 and uses parent-trusted package SHA. Options cannot name an executable/WASM/path. Fixed Node dependency is resolved locally, version checked, and Init's locate handler only accepts web-ifc-node.wasm. The OS Job quota must be established by B's runner before launching this module; the bridge does not claim token tape or V8 heap is an OS quota.

- analyze returns `{analysis}` with schemaVersion1, format ifc, hashes, basename entryFile, empty candidates, requiresEntrySelection=false, safe owner analysis ifc schema/unit/project/storey/type/georef-present/origin suggestion/counts plus diagnostics. Root overwrites basename/candidates with the original workspace.entryFile/container candidates; bridge cannot reconstruct an original ZIP-relative path from sourceFile alone. No geometry API is invoked in analyze mode.
- convert writes only `scene.glb`, `ifc-properties.json`, `provider-meta.json` and returns `{providerMeta,files:[...fixed names]}`. result.json is fixed success or `{failure:{code,message}}`; business failure may exit0. Invalid request before outputDir validation exits nonzero. All file writes are exclusive. Parent must validate fixed filenames/size/digest/regular files and admit only the public derived GLB/meta.

`convertIfc(context)` reads only `context.derived.ifc.sceneUrl === '/derived/scene.glb'` and validated providerMeta, never options-derived aliases. It calls convertGltf with reference resolution denied, rejects animations, returns `{scene,animations:[],sourceVersion,units,normalizationHint:m/Y_UP,sourceIdentityConfidence,ifcSummary}` and public report.ifc/warnings. It exposes no private property payload or source datum matrix.

## Admission, schema, selections

Source32MiB; UTF8 fatal decode, null rejection, bounded quote/comment/parenthesis statement scan before OpenModel; one ordered ISO header/HEADER/ENDSEC/DATA/ENDSEC/end envelope, exactly one FILE_SCHEMA. ISO keywords/entity names normalize case while quoted source text stays unchanged. Reject duplicate IDs, dangling refs, nonsimple/multiple DATA/SPF envelopes and malformed comment/quote/statement termination. Entities150k, references1m, aggregate depth128, additional single record cap2MiB.

Only IFC2X3/IFC4/IFC4X3_ADD2 and fixed canonical IFC4X3→ADD2 alias. Both raw and actual GetModelSchema must agree; ALLOW_INCOMPATIBLE_SCHEMA_ALIASES=false, COORDINATE_TO_ORIGIN=false, MEMORY_LIMIT256MiB/TAPE_SIZE16MiB. ADD2 convert separately requires allowAdd2=true; analysis is not a blanket ADD2 geometry certificate.

Convert requires strict options.ifc schemaVersion1, matching actual package/entry hashes and schemaConfirmed=true. Booleans, enum values, unique bounded IDs/types and origin shape are checked. Missing storeyIds selects all contained; [] selects no contained, and includeUncontained=true still selects uncontained. Missing types selects all available product classes except space/opening defaults; [] selects no types. Filters intersect; unknown ID/type rejects. Shared lower-case `axis:'y-up'` is normalized but other axes rejected; source unit comes from IFC, options.unit only absent/auto/empty. Explicit common centering must be false, never true/string aliases. Default origin mode local; latest Root source-mode rule is enforced.

## Typed metadata, identity and privacy

GetLine is shallow and its expressID/type is checked against raw source inventory. NumberHandle.value is a **prototype getter** in the pinned package, so unwrapping correctly uses `value in object`, not Object.hasOwn. GUID inventory visits the entire IFCROOT inherited set before selection. Project must be unique for unit resolution; project/product GUID must be valid22 chars, unique across all source rooted objects and have exact placement to claim stable. Canonical group identity=`projectGuid:productGuid`; invalid/duplicate/missing identity becomes import-local `ifc-local:ExpressID`, stable=false. Fragments carry no duplicate stable anchor.

LocalPlacement chains and Axis2Placement2D/3D, CartesianPoint and Direction reference types/dimensions/finite values/nonzero/nonparallel axes are validated, depth/cycles rejected before calling GetWorldTransformMatrix. Missing ObjectPlacement is explicit inexact, never stable; Grid/Linear/wrong typed placement rejects rather than accept native identity fallback. Relationship references check inherited object definition/type/property definition/spatial sets, complete parent/containment graph is cycle checked even when filters hide a branch. Storey memberships come from real aggregate/nest/containment relations, not guessed nearest elevation.

Public Group names are `${ifcType} #${expressID}`, fragments are generic; storey public label=`Storey #ID`. Source Name/Description, Units definition, storey original elevation/placement, WCS/TrueNorth/CRS/MapConversion/Site/IFC2X3 ePSet georef and source restore matrices exist only in owner-private sidecar. Public summary contains permitted schema/type/IDs/GUID/storey memberships/counts and georeferencing present/appliedfalse, with no exact datum. Public report transform is normalized-local-scene identity.

Basic policy retains typed element metadata and groups=[]; psets adds only Pset_*Common/Qto_*BaseQuantities scalar/bool/finite number/bounded list/enum. Typed valueType can be fixed IFC class names such as IfcLabel/IfcBoolean/IfcLengthMeasure, or list/enum/null. No recursive graph export, no contact/OwnerHistory/document/URI/credential properties, no derived area/cost values. Strings≤2048, lists≤64, properties≤128/element and200k total, properties byte accounting reserves at most8MiB before sidecar16MiB. Over-limit property fields truncate with diagnostics; final oversized sidecar drops property groups and source displayName/Description before a second byte check, otherwise fixed metadata-budget failure. Identity/coordinate core is not silently fabricated or dropped.

Root/C own fifth artifact kind model-private, fixed output registration, public hard-exclusion and owner properties endpoint. C confirmed its validator allows this typed valueType/list shape and import-local identities. Root owns IFC canonical stable whitelist/catalog extras and meta.ifcSummary; source exact GUID/placement proof stays in A. The retained public IFC element map and private sidecar identity are the same strings.

## Geometry, units and coordinates

Typed units require a unique LengthUnit: native-compatible METRE+SI prefix or a no-offset ConversionBasedUnit referencing SI length; nested/offset/ambiguous incompatible conversions reject. Source unit Name is canonical in public fields, raw custom unit label only private definition. Pinned native conversion code is not blindly trusted: first selected usable product calls GetFlatMesh(true/false), matches all fragment geometryExpressID occurrences and complete affine matrices, and proves Ftrue≈S(u)Ffalse. No usable pair cannot establish unit truth. Data size/stride is also checked; all pair flat/vector/geometry wrappers are disposed, and **ResetCache(modelID)** clears processor-owned native geometry before another pair or StreamMeshes. The fixed API returns copied JS buffers only after prechecked sizes.

StreamMeshes(...true): native F already includes N=[x,z,-y], unitu, placement, representation and geometry Normalize translation. Exact product frameQ=N·S(u)·P·S(1/u); child local=Q⁻¹F. D=T(-originM) for local (originM is metres/Y_UP), sourceD=I. Public group is **Q'=DQ**, scene rootidentity, child unchanged: result=DF. This bakes the exact original D out of exported root transforms; originalP/Q-related restore data is owner-only. Public GLB does not contain explicit source datum fields. Source mode is forbidden for georeferencing.present or requiresLocalOrigin; coordinates/frames above100,000m demand nearer local origin. This also limits very large/project-frame-baked models rather than exporting huge cancelling matrices.

Private sourceToProvider=D·N·S(u), inverse restores engine-world source units; common root additional scale is applied once afterward and centeringfalse. No map projection/MapConversion/TrueNorth rotation is applied, and unit/axis/placement is not repeated. Matrix layout column-major. No stable placement promise is made for missing placement, geometry-fragment offsets or unsupported placement forms.

Native vertex layout6 floats(position+normal); counts/stride/pointers/index count and total budgets checked before JS view copies/Three buffers. Values and transformed coordinates finite, index range checked, no external textures/animation. Color/alpha approximate PBR warning always emitted; native no-mesh selected elements diagnosed, completeness not-certified, manual-required. Missing all geometry fails. Wrapper cleanup occurs within the callback before native Clear(true), with CloseModel/Dispose in bridge finally.

Budgets: source32MiB/records150k/refs1m/depth128,20k scene nodes,total10m vertices/30m index elements,100k relationships,200k properties,private16MiB,500diagnostics; intermediate GLB100MiB. Actual process/WASM memory quota remains B's3072MiB Job Object. Native single-product allocations precede callback limits and are constrained by that OS quota; these data budgets are not advertised as peak memory.

## Fixed failures / diagnostics

Failure codes: INVALID_IFC; IFC_SCHEMA_UNSUPPORTED; IFC_CALIBRATION_HASH_MISMATCH; IFC_CONFIRMATION_REQUIRED; IFC_ADD2_CONFIRMATION_REQUIRED; IFC_PARSE_BUDGET; IFC_UNIT_UNSUPPORTED; IFC_PLACEMENT_UNSUPPORTED; IFC_REFERENCE_CYCLE; IFC_INVALID_FILTER; IFC_INVALID_OPTIONS; IFC_ORIGIN_REQUIRED; IFC_GEOMETRY_BUDGET; IFC_METADATA_BUDGET; IFC_GEOMETRY_INVALID; IFC_MISSING_GEOMETRY; IFC_PROVIDER_UNAVAILABLE; IFC_NATIVE_FAILED; IFC_EXPORT_FAILED; IFC_INVALID_REQUEST. Exact fixed public messages are IFC_ERRORS in ifcSource.js, never raw exceptions.

Warning codes: IFC_PROJECT_GUID_UNSTABLE; IFC_SOURCE_IDENTITY_UNSTABLE; IFC_PROPERTY_DEFINITION_OMITTED; IFC_PROPERTY_VALUE_OMITTED; IFC_PROPERTIES_TRUNCATED; IFC_ELEMENT_GEOMETRY_OMITTED; IFC_NORMALS_RECOMPUTED; IFC_MATERIAL_APPROXIMATION. All messages fixed; entityRef only ExpressID. Diagnostics capped with total/truncated flags.

## Verification / pending manual inputs

Executed only `node --check` on each of the five owned files, latest combined command exit0. No module import/init/parse/convert, functional tests, browser QA, installation, build/startup or Git mutation. Read actual package APIs/types and fixed upstream C++ for typed value getter, FlatMesh/Vector lifetimes, ResetCache, normalization, placement fallback and native unit scaling. C independent reviewer identified lower-case P2 axis mismatch; A corrected normalization before source handoff. Independent approval is still required; Root controls shared fixes/build/commit.

Manual cases (not run): IFC2X3/IFC4 known5m box in meter/mm with nested rotated placements; no-offset foot conversion with native pair proof (engine mismatch must reject); ADD2 explicit confirmation and RC/ADD1 refusal; filters missing/[]/uncontained intersections and unknownIDs; duplicate/missing/invalidGUID and changed ExpressID source revision; source Name/Description/Pset/contact values absent in GLB/provider-meta/publicmeta but owner private typed fields readable; local large-coordinate/common datum restoration, source georef rejection, centering rejection; grid/linear/typedwrong/cycle/deep placements; unsupported/no geometry, missing normals, budget/sidecar truncation; parser malformed/duplicate/dangling/deep input; process timeout/abort/quota by isolated runner. Geometry/visual fidelity and native unit compatibility have **not** been functionally accepted.
