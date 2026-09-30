# P1-03 Worker implementation report

2026-09-30. Scope: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker` only. Root owns Java integration and commits. No files were staged or committed by the Worker implementer.

## Implemented

- Node 22 ESM HTTP service; exact dependencies `three 0.186.1`, `playwright-core 1.58.2`, `yauzl 3.2.0`, checked-in package lock.
- Protected `POST /v1/convert` with HMAC-SHA256 exact raw-body digest, epoch-seconds timestamp tolerance 300 seconds, nonce replay rejection, concurrency capacity, stream-disconnect cancellation and conversion deadline.
- Private file acquisition beneath `VIRTUAL_SOURCE_ROOT` using realpath containment, regular-file/size/hash validation. Optional HTTP(S) sources require exact configured origin and cannot redirect. No model-supplied external network fetch.
- Isolated per-job temporary directory and loopback browser resource server. ZIP rejects traversal, links, special files, encrypted entries, case/Unicode collisions, excessive file counts/expanded bytes and excessive expansion ratio. Cleanup occurs on success, failure and cancellation.
- Browser product conversion using pinned Three loaders/exporter: GLB/glTF 2.0, OBJ/MTL/relative textures; Draco and Meshopt from same installed Three version. ZIP is a container, with entry selection when ambiguous. Standalone private filenames without extensions can be inferred by content.
- Explicit OBJ unit/scale confirmation; glTF defaults meters/Y-up. Unit/axis/centering normalization; finite geometry validation; bounds/statistics; GLB export; partial reports for missing materials/textures and Phong-to-PBR approximation. Geometry failure is fatal. Unsupported extension capabilities fail explicitly.
- Each successful worker result returns inline artifacts: `models/{jobId}/scene.glb`, `meta.json`, `report.json`, `manifest.json`. Every artifact carries `assetKey,relativePath,kind,sha256,size,mime,dataBase64`. Canonical `assetKey=models/{jobId}/scene.glb`; `modelVersionId=jobId`. Aggregate decoded artifacts are capped, default 100 MiB. Manifest contains the other three resources, excluding its self digest. Java must verify and persist outputs before marking its job successful.
- GET-only `/showroom/virtual/public/...` runtime-origin proxy to configured backend, stripping `/showroom`, preserving query and `X-Virtual-Read-Ticket`. Cookies, authorization and internal/admin headers are removed by a strict forwarding allowlist; redirects and all non-public routes are rejected.
- `/health` reports configuration/executable readiness, supported formats/containers, versions and actual active conversion slots. Health deliberately does not claim runtime conversion has been manually tested.
- Shipped product hand-test assets in `samples/`: 8 m × 6 m basic room GLB, OBJ centimetre ZIP with MTL/texture, and missing-texture OBJ ZIP. `scripts/generate-samples.js` generates these assets without conversion execution or assertions. README documents M02/M10 manual steps and intentionally wrong-unit comparison.

## Protocol / startup integration

Request fields: `jobId,format:auto|glb|gltf|obj,sourcePackageUrl,sourceHash,options,stagingPrefix?,outputUploadUrls?`. Options: `entryFile,unit:m|cm|mm|in|ft,scale,axis:Y_UP|Z_UP|X_UP,centering:none|floor-center|center`. `stagingPrefix` cannot control filesystem paths; this implementation uses bounded inline outputs and does not consume upload URLs.

NDJSON stages are actual events: fetching → unpacking → parsing → normalizing → exporting → staging. Terminal `result` includes `modelVersionId,assetKey,artifacts,report`; terminal `error` includes `code,message`. Reports carry `status:success|partial`, `warnings`, `errors`, `sourceFormat`, `normalization`. No fabricated percentages.

Start from Worker directory: `npm ci`, `npm run build`, set `VIRTUAL_WORKER_SECRET` to same 32+ character secret as Java, then `npm start`. Default bind `127.0.0.1:9319`; `VIRTUAL_BACKEND_ORIGIN=http://127.0.0.1:9307`; `VIRTUAL_SOURCE_ROOT=../.virtual-showroom/assets` resolved from Worker cwd. Backend runtimeOrigin must be this browser-reachable separate origin. `VIRTUAL_WORKER_HOST/PORT` customize deployment.

Installed executable discovered: `C:/Program Files/Google/Chrome/Application/chrome.exe` (Edge also present). `VIRTUAL_BROWSER_EXECUTABLE` can select another existing Chromium. No browser was launched. In an environment without Chromium, provision a local Chromium/Chrome/Edge and set the executable path; `playwright-core` does not download one. Linux uses the browser sandbox and requires a suitable non-root service user.

## Build evidence and remaining product verification

- `node --version`: **v22.22.0**.
- `npm install --no-audit --no-fund`: exit **0**, five packages added.
- `npm run samples`: exit **0**, the three product hand-test assets generated; no conversions run.
- `npm run build`: exit **0**, JavaScript syntax checks across source/scripts and installed dependency resolution passed. Repeated after final implementation edits, same result.
- No automated functional tests, conversion smoke tests, browser QA, server startup/health requests, or importer runs were executed, as instructed. Runtime conversion/material fidelity, browser sandbox provisioning on other hosts, cancellation and proxy integration remain manual product verification items. No conversion success is claimed from the build.

## Runtime proxy authentication integration

The narrow GET public proxy now injects `X-Virtual-Runtime-Secret` exclusively from configured `VIRTUAL_WORKER_SECRET` for the backend's executable-resource gate. The incoming request allowlist omits that header, cookies, and authorization, so clients cannot substitute it. The response-header allowlist and generic proxy errors exclude the secret; no request headers or secret values are logged. `/showroom/virtual/public/preview/...` is accepted by the existing public-prefix validation, and `/showroom` stripping/default backend port 9307 are preserved. `npm run build` was rerun after this change and passed (exit 0); no functional tests or browser QA were executed.

## Review correction round 1

- Added a pre-loader required-extension capability guard audited against installed Three 0.186.1 GLTFLoader plugins and configured Draco/Meshopt decoders. Unknown required extensions, Basis/KTX2 (no transcoder), and AVIF (not provisioned) fail explicitly; Meshopt-required input also checks decoder availability. Loader warning-only behavior can no longer silently downgrade an unsupported required extension to a partial result.
- Added glTF primitive/accessor validation before loading, allowing triangle modes 4/5/6 only and validating unsigned non-normalized scalar index descriptors and triangle counts. After loading/triangulation, every mesh validates position/index shape, all index values as safe integers within vertex range, complete triangle counts and material-group ranges. Lines/points are rejected rather than silently ignored. Geometry counts are no longer rounded down.
- Replaced error-code blacklisting/path replacement with a typed public error boundary. Only intentional `ConversionError` codes/messages are returned; all other filesystem errors (including EEXIST/ENOTDIR), archive/network/browser failures produce fixed generic responses. Browser validation errors cross as structured failures with allowlisted fixed messages; raw loader/Playwright errors are never serialized.
- Runtime proxy service-secret injection was retained. No files were staged or committed. `npm run build` passed with exit 0 after the fixes (JavaScript syntax and dependency resolution only); no functional tests, conversion runs or browser QA were performed.

## ImportReport contract completion

Successful/partial import reports now retain existing aliases and additionally populate all stage-1 fields: `format` (actual inferred model format), `sourceVersion` (actual glTF `asset.version`; OBJ null because it has no standardized in-file version field), `units` (selected unit, applied factor and explicit/convention basis), `coordinateTransform` (applied normalization TRS and column-major matrix), `sourceIdentityConfidence` (`level:none`, `basis:no-CAD-semantic-identity`, no stable CAD entity IDs), `missingResources` (structured entries from actual missing texture/MTL/material findings), `unsupportedEntities` (actual optional-extension and material-approximation findings), and `stats` (inspected metadata statistics, bounds, animation count and exported GLB byte size). No confidence score or estimated progress is fabricated.

Optional extensions outside the supported capability list produce explicit partial-result findings; unsupported required extensions still fail before loading. Warning lists retain the 200-item display cap with total/truncation fields, while structured resource/entity findings are derived before that display truncation. README explains each field and now instructs manual UI users to select OBJ for the sample ZIP (the Worker API still accepts auto). `npm run build` passed with exit 0 after these source edits. No conversion, automated functional tests or browser QA were run; no files were staged or committed.
