# P3 Task B implementation delivery

Date: 2026-09-30. Snapshot: shared working tree; no commit/stage performed. Author scope returned to Root after this report. Independent review remains required.

## Exact owned files

All six are new files under `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/`:

- `src/native/boundedNode.js`
- `src/native/launch-job.ps1`
- `src/native/libredwgBridge.mjs`
- `src/providers/dwgProvider.js`
- `src/providers/dwgCache.js`
- `src/converters/dwg2d.js`

No shared config/package/protocol/API/Java/UI source was edited by this task. No helpers outside the six-file scope were introduced.

## Interfaces and trust boundary

`nativeIsolationStatus()` is configuration-free and returns static Windows x64/launcher availability only. `runNativeJob(moduleName,payload,{directory,signal,timeoutMs,maxMemoryMiB,maxResultBytes})` accepts only `ifcBridge.mjs` or `libredwgBridge.mjs`, validates the source beneath the trusted workspace, creates a random private child directory, writes fixed request/result paths and adds trusted `outputDir`. Launcher executable, Node executable and bridge filename cannot come from upload options. Launch uses no shell, hidden windows and a minimal environment.

PowerShell embeds C# P/Invoke: create a randomly named Job with aggregate `JOB_OBJECT_LIMIT_JOB_MEMORY` and `KILL_ON_JOB_CLOSE`. An independent fixed observer retains a query/terminate Job handle and acknowledges readiness before the launcher may create Node. `PROC_THREAD_ATTRIBUTE_JOB_LIST` assigns Node atomically at suspended process creation; `IsProcessInJob` verifies membership before resume, removing the unassigned-suspended-child race. Normal and exceptional launcher cleanup drains all Job members. After launcher exit (including the 10-second fallback termination), parent signals the observer, waits for its zero-active-process confirmation and verifies fixed `quiescence.flag`; launcher exit by itself is not proof. Missing confirmation raises `NATIVE_CLEANUP_UNCONFIRMED` and disables further native admission; Root must retain that workspace for unresolved cleanup. Isolation failure has no unisolated fallback. Memory default/hard maximum is 3072 MiB, configurable down to 512; JS heap 512 MiB is additional and does not purport to constrain WASM memory.

`launch-job.ps1 -CompileOnly` compiles the C# declaration only and exits before any native Job/process creation. Runtime quota/termination behavior is still **manual-required**.

`dwgProvider.js` exports `dwgDeploymentStatus`, `analyzeDwg`, `prepareDwgConversion`, and `DWG_PROVIDER_FINGERPRINT`. Fingerprint is SHA-256 of fixed version/adapter/cap/scope/read-policy/identity parameters. Analysis runs the fixed private bridge once, verifies regular fixed-name output/hash, and analyzes DXF in existing `cad/analyzeWorker.js` with signal/timeout termination and awaited cleanup. Conversion does not run LibreDWG again: it requires a matching live frozen ticket and copies exactly its DXF bytes into the current workspace.

Analysis token is 32 random bytes encoded as **64 lowercase hexadecimal characters**. `expiresAt` is Unix milliseconds (`Date.now()+900000`). Scope is Java-signed `{ownerId,showroomId}` with canonical positive decimal strings, not UI options. Matching includes owner+room, original package SHA, original selected-entry SHA, provider fingerprint, and actual derived SHA. UI calibration `dxf.sourceHash` remains original package SHA; `dxf.entryHash` is derived DXF SHA. The analysis result is flattened DXF preflight plus `format:'dwg'`, `calibrationKind:'dxf'`, and the contract DWG ticket object.

Cache resides in private trusted `workRoot/.dwg-cache-v1/<opaque-token>/derived.dxf`, not source directories/public assets. Admission serialized within the worker process; 20 records/320 MiB, 15-minute TTL, regular-file/realpath/hash verification on reuse. Timer expires entries; admission/timer sweeps orphan bytes left after restart. Unexpired orphan files count toward capacity; tickets do not survive restart. Cleanup only unlinks fixed files and removes their generated empty directories, without recursive deletion of computed roots. No source URL, owner information or native path is exported with model metadata.

Browser export is `convertDwg2d(context)`, matching Root dispatcher. It accepts only `context.derived.dwg.dxfUrl === '/derived/derived.dxf'` plus checked safe provenance, calls existing `convertDxf` (which hashes actual bytes), downgrades every source anchor to `stable:false/basis:'dwg-derived-handle'`, and emits public `dwg`/`conversionChain` plus a partial warning. It preserves DXF's already-metric/Y-up normalization hint; Root owns the common DWG no-double-scale dispatch rule.

## Native DWG boundary

Pinned `@mlightcad/libredwg-web@0.7.14`; local fixed WASM through `createModule`, no NODEFS mount, lazy FS, URL resolution or xref acquisition. Engine sees only eager MEMFS `/input.dwg` and `/out.dxf`. Host reads are fixed dependency/request/source files; host output is fixed derived/result only.

- Source <=32 MiB; ASCII derived <=16 MiB; source header AC1015/1018/1021/1024/1027/1032.
- Raw `dwg_read_file` result is `{error,data}`. Any nonzero/error-invalid flags reject. Audited pointer freed before independent `dwg_write_dxf` call; nonzero writer status rejects separately.
- <=100,000 objects and <=1,024 classes. Conservative standard-class allowlist, fixed-type 2D entity allowlist, proxy/external/unknown rejection, BLOCK_HEADER xref flag/path checks, explicit extrusion/elevation/thickness/selected-point planarity checks. Some legitimate but unsupported classes/entities are intentionally rejected; this is a restricted 2D provider.
- Engine output/log work is bounded by aggregate process quota and deadline; bridge ignores raw log text and caps accepted log volume at 1 MiB. Writer may allocate MEMFS before the 16 MiB post-write check, so the native Job quota is essential.
- Writer success does **not** establish full original-entity coverage. Every success is `partial:true`, completeness `unknown`, with warning. Derived IDs are always heuristic. P2 DXF structural/raw-parser checks still apply after export.

Raw API/field names were checked against the pinned package's `lib/libredwg.js`, `lib/types/common.d.ts`, `lib/converter/entityConverter.js` and block conversion source. BLOCK_HEADER field declarations were cross-checked with the [upstream header](https://raw.githubusercontent.com/LibreDWG/libredwg/master/include/dwg.h) (`flag`, `blkisxref`, `xrefoverlaid`, `xref_pname`). No engine initialization or drawing parsing was used for this research.

## Fixed codes for Root error mapping

DWG: `DWG_ANALYSIS_STOPPED`, `DWG_AUDIT_FAILED`, `DWG_CACHE_FULL`, `DWG_CACHE_INVALID`, `DWG_CALIBRATION_STALE`, `DWG_COMPLEXITY_LIMIT`, `DWG_CUSTOM_CLASS_UNSUPPORTED`, `DWG_DERIVED_INVALID`, `DWG_DXF_ANALYSIS_FAILED`, `DWG_DXF_INVALID`, `DWG_DXF_SIZE_LIMIT`, `DWG_ENGINE_FAILED`, `DWG_EXTERNAL_OR_PROXY_UNSUPPORTED`, `DWG_LOG_LIMIT`, `DWG_OWNER_SCOPE_REQUIRED`, `DWG_PROVIDER_FAILED`, `DWG_PROVIDER_UNAVAILABLE`, `DWG_READ_FLAGS`, `DWG_REQUEST_INVALID`, `DWG_RESULT_INVALID`, `DWG_SIZE_LIMIT`, `DWG_SOURCE_CHANGED`, `DWG_UNSUPPORTED_3D`, `DWG_VERSION_UNSUPPORTED`, `DWG_WRITE_FAILED`.

Native: `NATIVE_CANCELLED`, `NATIVE_INVALID_LIMITS`, `NATIVE_ISOLATION_UNAVAILABLE`, `NATIVE_JOB_FAILED`, `NATIVE_LAUNCH_FAILED`, `NATIVE_LOG_LIMIT`, `NATIVE_MODULE_NOT_ALLOWED`, `NATIVE_OUTPUT_INVALID`, `NATIVE_PROVIDER_UNAVAILABLE`, `NATIVE_REQUEST_LIMIT`, `NATIVE_RESULT_INVALID`, `NATIVE_SOURCE_NOT_ALLOWED`, `NATIVE_TIMEOUT`.

`DWG_CONVERSION_PARTIAL` is a warning, not a failure. Public errors are fixed codes/messages; raw engine exception, source path or source text never becomes the public message.

## License/deployment retention

Bridge is marked `SPDX-License-Identifier: GPL-3.0-or-later`. Root must retain upstream GPL COPYING/license information and corresponding package source reference/retrieval information, plus this adapter's source, with the private deployment notices. Upstream package declares GPL-3.0; source revision researched is `1dd682f46339f37b67c5ff1085d10d04a8c16d7e`, repository https://github.com/mlightcad/libredwg-web. These files must not enter visitor/browser vendor routes or Java/Vue bundles. This is a statement of package facts and architecture, not an overall-project licensing conclusion.

## Verification performed

Final static command exited 0:

- `node --check` for all five owned JS/MJS files.
- PowerShell AST parse of `launch-job.ps1`: zero parse errors.
- Fixed Windows PowerShell `launch-job.ps1 -CompileOnly`: “Native launcher C# compiled; no native job was started.”

No install, services, test suite, sample parse, drawing conversion, WASM initialization, native Job launch, browser QA, staging or commit was performed. Actual DWG compatibility, quota enforcement and lifecycle behavior require the authorized manual acceptance phase; static checks do not prove them.

## B-I5 independent-review fix

2026-09-30: Root separately fixed B-I1 through B-I4. Author modified only `boundedNode.js` and `launch-job.ps1` for B-I5, then returned all six-file ownership. New fixed failure code: `NATIVE_CLEANUP_UNCONFIRMED`. Observer control files and random Job name are generated by the trusted parent; none are upload options. Observer remains outside the quota Job so killing the launcher cannot remove the last supervising handle. No child is permitted before observer acknowledgement. Creation-time Job assignment requires supported Windows; attribute setup failure disables native providers instead of falling back to separate unsafe creation. Node syntax and Windows PowerShell `-CompileOnly` again exited 0. Actual Job execution was not invoked. This author does not independently approve this fix; Task A/reviewer must review it.
