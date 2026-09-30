# Virtual showroom contract v1

This is the implementation authority for stage 1. No automated functional tests are to be created or run; compilation/build checks are permitted. Product validation must remain enforced.

## Repositories and versions

- SDK: `C:/Users/Administrator/Desktop/auto-exhibition-template-sdk` (TypeScript/Vue3).
- Platform: `C:/Users/Administrator/Desktop/mju-smart-show` (Java 17 target, Vue/JS).
- Worker: `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker` (Node 22.22.0).
- UI and Worker pin `three` to `0.186.1`; addons/decoders from that same package. No runtime CDN.
- Backend controllers use `/virtual/admin` and `/virtual/public`; externally the gateway supplies `/showroom` with StripPrefix=1.

## Scene document

`schemaVersion:1`, `draftVersion:number`, `building:{modelVersionId:string|null,assetKey?:string,modelToShowroom:{position:[x,y,z],quaternion:[x,y,z,w],scale:[x,y,z]}}`, `navigation:{spawn:{position:[x,y,z],yaw:number},bounds?:{minX,maxX,minZ,maxZ},collisionRef?:string,colliders?:array,viewpoints:array}`, `objects:array`.

Each object has `objectId:string`, `type:screen|hotspot`, `name`, `enabled`, `anchorRef:null|object`, `transform:{position,quaternion,scale}`. A screen has positive `widthM/heightM`, `fitMode:contain|cover`, optional `previewRef`, and optional `contentBinding`. Hotspot content is text/image plus an optional viewpointId. Meters, Y-up, local +Z is the screen front, yaw in radians. Collider shape in stage 1 is `box` with `position`, `size` and `yaw`; viewpoints have `id/name/position/yaw`.

Bindings: `source:device-theme-instance|direct-instance`, optional `sourceConfigId`, `templateInstanceId` string, `instanceVersion:number`, `artifactHash:string`, `compatibilityProfile:native|legacy-bridge|preview-only`. Every binding mutation carries expectedDraftVersion and increments the draft. Public scenes strip sourceConfigId, device identifiers and administrative origin metadata.

## Admin response and routes

Use existing AjaxResult `{code,msg,data}` and list `{code,msg,rows,total}` envelopes. IDs serialize as strings, not JS numbers.

`ShowroomDetail` contains `id,name,description,coverAssetKey,status,publicCode,publishedRevisionId,draftVersion,sceneDocument,resources`. Status is `DRAFT|ONLINE|OFFLINE`. Scene/resources are JSON values, not JSON-encoded strings in REST DTOs.

- `GET/POST /virtual/admin/showrooms`, `GET/DELETE /virtual/admin/showrooms/{id}`.
- `GET/PUT /virtual/admin/showrooms/{id}/draft`; PUT `{expectedDraftVersion,sceneDocument}`; response updated detail.
- `GET /virtual/admin/showrooms/{id}/assets` and `GET /virtual/admin/showrooms/{id}/assets/{assetKey...}`: authenticated owner-only draft resource reads.
- `POST /virtual/admin/import-jobs`: multipart `file`, `showroomId`, and JSON `options` (`format/entryFile/unit/scale/axis/centering`); GET `import-jobs/{jobId}`, POST `import-jobs/{jobId}/cancel`.
- `GET /virtual/admin/import-capabilities`.
- `GET /virtual/admin/template-instances`: authorized selectable instances, optionally sourceConfigId; no arbitrary other-user instance access.
- `PUT /virtual/admin/showrooms/{id}/screens/{screenId}/binding`: `{expectedDraftVersion,source,sourceConfigId?,templateInstanceId,compatibilityProfile,previewRef?}`.
- `GET /virtual/admin/showrooms/{id}/content-updates`; device source compares current instance of its sourceConfigId, direct-instance stays pinned.
- `POST /virtual/admin/showrooms/{id}/validate`: `{expectedDraftVersion}` → `{validationId,draftVersion,errors:[],warnings:[]}`.
- POST `publish` with `{expectedDraftVersion,validationId,requestId}`, `offline`, `rollback` with `{revisionId}`; GET `revisions`.
- Authenticated preview manifest `GET /virtual/admin/showrooms/{id}/preview`: isolated draft runtime resources, never publicly routable without a preview session credential.
- `POST /virtual/admin/showrooms/{id}/assets/preview`: PNG/JPEG image upload (up to 10 MiB), `expectedDraftVersion`, optional `screenId`. Bound-screen uploads capture server-only instance/version/artifact provenance; publication verifies that provenance. WebP is deferred until full decoder validation is available.
- Partial model report acknowledgment: `POST /virtual/admin/import-jobs/{jobId}/acknowledge`. Publishing validation warnings requires explicit `acknowledgeWarnings:true`.

Permissions: `showroom:virtualShowroom:list/query/add/edit/import/bind/publish/offline/rollback/remove`. Owner is server-supplied; checking a menu or list is insufficient. DRAFT_VERSION_CONFLICT returns an actionable code/message. No virtual operation calls real device publishConfig.

## Resources and conversion

`ResourceItem:{assetKey,relativePath,kind,sha256,size,mime}`; private objectKey is server-only. Template files live at `templates/{screenId}/index.html` and preserve relative child paths; normalized model at `models/{modelVersionId}/scene.glb`. Source packages are private.

Jobs: `id/showroomId/status/stage/progress?/report/modelVersionId?/assetKey?/resources?`. States QUEUED/RUNNING/SUCCEEDED/FAILED/CANCELLED. Report status success/partial/failed; partial requires user acknowledgement. Do not fabricate progress. Job success only after backend verifies outputs and draft asset references remain owner-scoped.

Worker `POST /v1/convert` accepts `jobId,format,sourcePackageUrl,sourceHash,options,stagingPrefix,outputUploadUrls?` and authenticates `X-Virtual-Timestamp`, `X-Virtual-Nonce`, `X-Virtual-Signature` using HMAC-SHA256 over `timestamp + "\n" + nonce + "\n" + sha256(rawBody)` with the shared service secret. Replay nonce is rejected; timestamp tolerance 300 seconds. Only configured platform storage source origins are accepted. No arbitrary referenced external fetch.

Response is NDJSON: `{type:"progress",stage}`, `{type:"result",modelVersionId,assetKey,artifacts:[ResourceItem with staging objectKey],report}` or `{type:"error",code,message}`. Artifacts can also provide base64 data for bounded outputs when upload URLs are unavailable; backend validates limits/digests and stores before marking success. Java calls via a bounded background executor, outside DB transactions. Stage 1 supports glb/gltf/obj, ZIP as an asset container, not a model format.

## Visitor manifest and runtime

Public `GET /virtual/public/{publicCode}/manifest` returns AjaxResult data with `revisionId,schemaVersion,sceneDocument,resources,visitorSessionId,ticket,expiresAt,resourceBaseUrl,runtimeOrigin`. Only ONLINE creates sessions. Redis session maps an opaque resourceSessionKey to fixed revision, visitor ID and expiry; no admin credentials. Assets at `/virtual/public/{code}/sessions/{key}/assets/{path...}`, GET `sessions/{key}/renew` with the read ticket renews the same session and revision. Each asset path belongs to the session manifest. A separate runtime origin/port serves templates. Offline denies new/renewed sessions; already downloaded bytes cannot be revoked.

For iframe entry add URL parameters `hostOrigin`, `visitorSessionId`, `screenId`, `runtimeId`. Server validates allowed hostOrigin and screen membership and injects `window.__AUTO_EXHIBITION_TEMPLATE_RUNTIME__={protocolVersion:1,hostOrigin,identity:{visitorSessionId,screenId,runtimeId}}` before app scripts; JSON is escaped safely. Template native/legacy mode is determined by its stored compatibilityProfile, not by arbitrary query flags.

Handshake:
1. SDK/legacy sends `{type:'exhibition-template-host:ready',protocolVersion:1,identity}` to the exact hostOrigin.
2. Host checks origin, source iframe and identity, sends `...:init` containing identity and a MessagePort.
3. SDK binds that port and acknowledges `...:ack`; only then connected. Port envelopes `{protocolVersion:1,identity,payload}`.
4. Existing TemplateBridgeMessage types are preserved (`sdk_ready`,`register_functions`,`invoke_function`,`template_function_call`,`function_result`,`function_error`,`emit_event`,`received_event`).

The host only executes local calls in its single active runtime. Missing/inactive target → TARGET_NOT_ACTIVE; hardware-directed target → HARDWARE_UNAVAILABLE. Stale identities are discarded. Storage requests share the port and use get/set/remove namespaced by visitorSessionId/screenId/runtimeId. Root Service Worker and uncontrolled persistent/global backends are not certified compatible.

## Initialization

SDK `createTemplateRuntime(options)`, `setDefaultTemplateRuntime(runtime)`, optional `TemplateSdkOptions.runtime`; runtime has context/bridge/ready/dispose. First default access consumes injected browser config if present and valid; otherwise local default. Invalid browser config and too-late mode switches explicitly fail, never silently fallback to local WS. Browser bootstrap precedes app import. Pending call registration precedes send; dispose removes listeners/ports/timers and rejects pending requests.

## Frontend core

`createSceneRuntime({container,document,resolveAsset,mode})` returns `applyDocument`, `setMode`, `onPick`, `getCameraState`, `restoreCameraState`, `setInputEnabled`, `dispose`; editor-only APIs may include selection/transforms without changing the shared contract. Public HTTP client has no admin token. UI routes `/v/{publicCode}` use showroom.html independently from admin Layout/permissions. Admin route component paths `showroom/virtualShowroom/index`, `editor`, `imports`.

## Execution rulings

- Manual tests override skill-default test execution; builds are the only automated execution check.
- Preserve existing checkout paths and user edits on feature branches, rather than discarding them into remote-default worktrees.
- Independent SDK/backend/UI/Worker ownership may run concurrently; the root owns integration and Git commits to avoid shared-index conflicts.
- Documentation helper scripts use numeric Task headings but this plan uses P IDs; briefs are extracted with PowerShell and retain the full global contract.
