# P1 backend integration report (P1-02, Java P1-03, backend P1-06/07/08)

## Status and verification

Implemented in `C:/Users/Administrator/Desktop/mju-smart-show` on the existing feature checkout. No commit/staging, live SQL, Nacos, Minio policy modification, real-device publishConfig, UI, Worker or SDK source edits were performed by this agent. No automated functional tests were added or run.

Final BUILD-JAVA **SUCCESS**, 14/14 reactor projects, 161 showroom Java source files, `release 17`, `maven.test.skip=true`. Completed **2026-09-30 12:27:14 +08:00**, 7.128 seconds; Maven process exit code 0. JBR25 and the P1-01 temporary Maven settings were used. Log: `P1-backend-integration-build.log`. Existing deprecation/unchecked/resource-plugin validation warnings are non-blocking. This is compilation evidence only; database/deployment/browser/manual scenarios remain to be run by the user.

## Owned files

All paths below are relative to the platform repository.

- Updated new `config/VirtualShowroomProperties.java`: isolated runtime default `http://127.0.0.1:9319`, private storage and budget configuration.
- Updated new `service/virtual/VirtualAssetStorageService.java`: private filesystem/Minio object storage, digest/size descriptors, bounded reads, rooted safe keys and source URLs; no bucket-policy writes.
- Updated new `service/virtual/TemplateArtifactService.java`: authorization and origin-limited instance ZIP, mandatory MD5 check, safe bounded extraction, source-preserving immutable template files with SHA-256 resource manifest. Removed the earlier incorrect per-file `/assets/` rewrite.
- Updated new `service/virtual/VirtualShowroomService.java`: cloned screens alias verified template resources to the cloned screenId, deleted bindings prune template resource entries.
- Added `service/virtual/VirtualModelWorkerClient.java` and `VirtualModelImportService.java`.
- Added `service/virtual/VirtualScreenBindingService.java`.
- Added `service/virtual/VirtualShowroomValidationService.java` and `VirtualShowroomPublishService.java`.
- Added `service/virtual/VirtualResourceSessionService.java`, `VirtualTemplateBootstrapService.java`, `VirtualTemplateRuntimeResourceService.java`.
- Added `controller/VirtualShowroomOperationsController.java`, `VirtualShowroomPublicController.java`.
- Minimal patch to `ruoyi-gateway/src/main/java/com/ruoyi/gateway/filter/AuthFilter.java`: exact external public prefix is anonymous GET-only; clears identity/Authorization/Cookie/internal/runtime-secret headers.
- Added `docs/virtual-showroom/storage-runtime-example.md` with example deployment settings, route/Worker integration, retention and M01–M11 manual steps.

Java paths are under `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/` unless qualified. Existing foundation domain/mapper/XML/SQL were reused without schema changes. Content-update/ticket behavior is consolidated into the binding/session services rather than creating empty wrapper classes solely to mirror brief filenames.

## P1-02 storage and templates

Template selection requires an existing instance, its device-theme config owned by the caller, and the existing template entitlement policy. Only the configured Minio origin may supply its published ZIP; redirects are refused. The published MD5 is required and checked before extraction. ZIP entry traversal, duplicated case-insensitive paths, expanded bytes and entry-count budgets are enforced. Source packages and physical object keys remain private. Config/valueMap are read from the fixed ZIP snapshot, never live instance metadata.

Template resources keep original bytes, relative subtree and stable manifest entries at `templates/{screenId}/...`. Runtime serving replaces root `/assets/` references with the full runtime-origin/session/template-root URL for HTML, JS, CSS and JSON. Relative values inside JSON remain document-relative. Bindings cloned through ordinary draft save alias the same verified bytes under the new screenId, and removed screens drop their template manifest entries.

Admin resource list/binary read requires owner plus query permission. Template resources additionally require the isolated runtime proxy, preventing untrusted HTML/JS from being served executable on the privileged platform origin.

## P1-03 import

Routes follow `/virtual/admin/import-jobs` and `import-capabilities`. Multipart create takes `file`, `showroomId`, JSON-string `options`; required options include format (glb/gltf/obj), unit, axis and centering. ZIP is a container. Java stores the source privately and sends Worker a file URI (rooted by Worker) or signed Minio URL.

Worker transport is actual HTTP POST `/v1/convert`, HMAC-SHA256 over `timestamp + newline + nonce + newline + sha256(raw body)` with timestamp/nonce/signature headers. Secret must contain at least 32 characters. HTTP connection/response deadlines and total NDJSON byte limit are enforced. Only real progress stages are persisted; no invented percentage is returned.

One conversion executor thread plus eight waiting slots, matching the Worker default concurrency of one. Output `dataBase64` bytes are decoded, total size bounded, resource paths constrained to the returned model namespace, duplicate paths rejected, SHA-256/size checked, GLB magic/version/declared length checked, and server-owned verified object keys generated. Backend ignores Worker objectKey as an authority. Job succeeds only after a short transaction locks the owner-scoped room, inserts immutable model metadata, appends resources with current draft CAS, and conditionally transitions RUNNING→SUCCEEDED. Background registration never calls SecurityContext.

Cancel uses owner-scoped atomic SQL from either QUEUED or RUNNING to CANCELLED, verifies the result, then cancels Future and closes the active Worker stream. Late result registration is rolled back. ApplicationReady marks interrupted queued/running jobs FAILED with SERVER_RESTARTED; retry is a new upload/job, never fabricated success. Single active import-coordinator instance is assumed for stage 1; avoid overlapping startup recovery across backend replicas.

Additional endpoint: `POST /virtual/admin/import-jobs/{jobId}/acknowledge`, import permission and owner guard, acknowledges a successful partial conversion. Publish validation blocks unacknowledged partial model reports.

## P1-06 binding/runtime

- `GET /virtual/admin/template-instances?sourceConfigId=...` → AjaxResult data array of authorized owned instances, string IDs and current flag; no download URLs.
- Binding route returns updated ShowroomDetail. Device-source binding requires current instance of the supplied owned sourceConfigId. Direct instance stays pinned. Rebind materializes immutable resources outside draft transaction and saves binding+manifest through owner/version CAS. A previewRef supplied on bind is retained only when its private server-issued resource provenance matches the new binding; otherwise it is cleared. Client previewInstanceVersion is display metadata only.
- Content updates array compares device source current instance with bound instance; direct-instance is not auto-updated. User explicitly rebinds to adopt a new version.
- Native runtime config is injected before scripts. Exact allowed hostOrigin, session visitor ID, screen membership and runtimeId are checked. Compatibility mode comes from stored binding.
- Legacy bridge replaces only loopback port 5176 WebSocket with a synthetic transport, carries original TemplateBridgeMessage types over authenticated identity/MessagePort handshake, never connects actual WS. SDK-ready is emitted on port availability. Page teardown closes ports and sockets; stale identities are rejected. Host implements final local-target and hardware refusal.
- ServiceWorker registration is blocked. CSP disallows worker/frame/object/form and external connect, sandboxes scripts on the isolated origin, and uses exact frame-ancestors. Pure frontend legacy certification remains manual. Unadapted native storage/hardware/network templates must use preview-only.

Added requested image endpoint: `POST /virtual/admin/showrooms/{id}/assets/preview`, multipart `file` + `expectedDraftVersion`, edit permission and owner guard. Accepts PNG/JPEG/WebP up to 10MiB, checks signatures and image structure (ImageIO for PNG/JPEG, RIFF chunks for static WebP), caps PNG/JPEG dimensions/pixels. Saves immutable private image and appends manifest through CAS. Response data `{detail, assetKey}`. Bound-screen upload must include screenId to capture current persisted instance ID/version/artifactHash under the same draft CAS. Images uploaded without a binding cannot certify a later binding, regardless of client previewInstanceVersion.

## P1-07 validate/publish

Validation checks scene schema, selected READY building resource, partial report acknowledgement, stored resource availability/digests, spawn bounds, anchor model version, authorized bound templates, template entry, preview-only image requirement and preview/binding version match. Missing navigation bounds/colliders and legacy compatibility produce explicit warnings. Redis validation credentials pin owner/showroom/exact scene+resource digest for 15 minutes.

Publish body requires expectedDraftVersion, validationId, requestId; when warnings exist also `acknowledgeWarnings: true`. Authorization is rechecked before publication. A short room-lock transaction rechecks owner/version/digest and idempotent requestId, inserts immutable revision and swaps ONLINE pointer atomically. Failure retains old published pointer. Offline, revision list and complete revision-pointer rollback implemented. Editing draft remains separate from revision rollback. No virtual service invokes real-device publication.

Cleanup is conservative: no automatic deletion of referenced or old-revision bytes. Worker cleans conversion workspaces; storage writer removes local partial files. Failed CAS materializations can leave private orphans. Deployment doc defines reachability from drafts/revisions/jobs/unexpired sessions plus lease+grace before cleanup; no destructive collector is enabled.

## P1-08 visitor sessions and routes

`GET /virtual/public/{code}/manifest`: ONLINE-only session creation. Redis stores random 256-bit resource capability, independent ticket hash, immutable scene/resources, fixed revision, visitor ID and expiry. Resource paths must belong to that snapshot. Session manifests contain only current building namespace resources, explicitly referenced active-scene images/previews/collision/cover assets, and enabled bound screen template resources (preview-only contributes its referenced image, not executable template files). Unused imported models/previews and disabled/removed screen resources are excluded from anonymous capabilities. New publication does not mix old visitors into new bytes. Public fields are a positive resource allowlist; scene strips sourceConfigId/device/storage/admin origin metadata.

`GET /virtual/public/{code}/sessions/{key}/renew` requires `X-Virtual-Read-Ticket`; renews same visitor/key/revision, never current pointer. Offline denies new/renew sessions while leased assets remain available until expiry. Responses use millisecond expiresAt.

`GET /virtual/admin/showrooms/{id}/preview` requires authenticated owner query permission and creates a pinned draft capability with code `preview`. There is no public preview manifest endpoint. Assets and ticket renewal use `/virtual/public/preview/sessions/{key}/...`; leaked preview URLs are bearer credentials, so should remain private.

Manifest data fields: revisionId, schemaVersion, name, sceneDocument, resources, visitorSessionId, resourceSessionKey, ticket, expiresAt, resourceBaseUrl, renewUrl, runtimeOrigin, preview. resourceBaseUrl is external `/showroom/virtual/public/.../assets/`. Main-scene client resolves through its API origin/base prefix. Iframe uses runtimeOrigin + exact resourceBaseUrl with no `/prod-api` or `/dev-api` insertion.

Runtime proxy integration: Worker must strip client `X-Virtual-Runtime-Secret` then set its configured shared secret toward backend default 9307. Java requires the secret for template assets. Gateway strips the header on anonymous platform-origin public traffic. Backend direct port must remain private. Root and Worker agent were notified of this interface.

## Remaining deployment/manual limits

- No database schema was executed; tables, permissions, Redis, storage root/private Minio bucket and matching Worker configuration must be provisioned by normal deployment.
- No actual browser conversion/template/visitor runtime was exercised in this task, per no automated functional-test instruction. Manual M01–M11 steps are in the deployment doc.
- Separate runtime HTTPS origin and exact allowed host origins are mandatory deployment choices. Shared source root is required for local Worker mode.
- Legacy template review remains manual; arbitrary persistent storage/device functions are not certified. Preview-only requires a real version-matched preview image.
- Automatic destructive garbage collection is intentionally not enabled; retention conditions are specified for operations.
- Stage 1 startup recovery is a single-import-coordinator design; multi-replica job leasing would require a later implementation.


## Review fix round 1 — complete

Read and confirmed the four important and two minor findings in `P1-backend-review.md`; implemented corrections, plus root's spawn/capacity integration findings. No functional tests, live mutations, toolchain changes, staging or commit.

**Final fix-wave compilation: BUILD SUCCESS, 14/14 modules, release17, tests skipped, 2026-09-30 12:42:29 +08:00, 7.407 seconds, exit code 0.** Log: `P1-backend-fix1-build.log`. Existing Maven resources-plugin/deprecation/unchecked warnings remain; these were recorded, not suppressed or “fixed” by unrelated upgrades.

1. **Preview validity:** added shared `VirtualPreviewSupport`. Publication requires a nonblank previewRef for preview-only screens. Any attached bound-screen preview must be an owned `kind: preview` resource with PNG/JPEG/WebP MIME and matching actual image signature/content structure. PNG/JPEG decoded under pixel/dimension limits; static WebP RIFF/chunk/codec header/dimension checks. Empty strings, models/nonimages, missing assets and MIME mismatches block publication; draft saving remains permissive for work in progress.
2. **Preview provenance:** preview multipart now optionally includes `screenId`. For a supplied persisted screen with binding, upload captures templateInstanceId, instanceVersion and artifactHash in private `previewProvenance` resource metadata (including originating screenId) and appends through the expected-draft CAS. The client never writes this metadata. Unbound/general uploads have no proof and cannot become certified previews merely by changing scene previewInstanceVersion. Rebind retains an explicitly supplied image only if server proof matches the selected binding; otherwise it clears previewRef/version. Validation compares proof to actual binding. Identical binding clones may reuse the verified image. UI agent was notified and sends screenId for bound-screen upload; proof remains excluded from standard public/admin ResourceItem DTOs.
3. **Cancellation:** mapper XML/Java gained `cancelActive(id, showroomId, ownerId)` with status IN ('QUEUED','RUNNING'). The database transition completes before any Future/stream interruption. Affected rows and current terminal state are inspected; controller now returns actual job data. If completion wins first, its true terminal status is returned; if cancellation wins, late RUNNING-to-SUCCEEDED fails and rolls back model/draft registration. This closes QUEUED→RUNNING race.
4. **Rollback entitlement:** owner/revision membership and current template authorization are checked before rollback transaction. Under room lock, owner/revision membership and exact scene/resource snapshot identity are checked again before atomic ONLINE pointer update. Existing visitor leases retain their original policy; rollback cannot reopen revoked template content for new visitors.
5. **Bootstrap ordering:** inject immediately after a true initial simple HTML5 doctype (only whitespace/BOM may precede it), otherwise prepend. A literal head tag in a comment or executable script before head cannot precede injected runtime. No HTML head search is used.
6. **Idempotent response:** revisionId/revisionNo identify the original operation, while `status` and additional `publishedRevisionId` report the current room state/pointer. New publish/rollback update in-memory response state after successful SQL. An old request replay after offline therefore reports OFFLINE and does not pretend it changed the pointer.
7. **Spawn/collider parity:** validation now applies radius 0.22m to bounds and the exact viewer oriented X/Z box calculation, 1.6m eye-height feet, collider vertical interval and enabled=false exclusion. Invalid initial position produces SPAWN_IN_COLLIDER or SPAWN_OUTSIDE_BOUNDS.
8. **Capacity parity:** Java executor now one active job + bounded eight queued jobs, matching Worker VIRTUAL_MAX_CONCURRENT default one. Avoids ordinary second upload failing immediately with Worker busy. The deployment doc was updated.

Deployment doc verified to exist at `C:/Users/Administrator/Desktop/mju-smart-show/docs/virtual-showroom/storage-runtime-example.md` (not ignored by Git). The earlier reviewer diff package omitted it; include it in the next diff package. No further backend edits are in progress after this report.

## Review fix round 2 — PNG/JPEG-only preview policy

The scoped rereview correctly found that WebP RIFF/codec header checks cannot establish decodable pixel data. Per stage-1 ruling, removed all WebP acceptance/verification branches rather than adding a decoder dependency. `VirtualPreviewSupport` now accepts only PNG/JPEG after actual ImageIO pixel decode and the existing size/dimension limits; null decoded output is rejected. WebP bytes return explicit `UNSUPPORTED_PREVIEW_IMAGE`, and publication's MIME allowlist is PNG/JPEG only, with the same actionable unsupported-image error for existing WebP records. Controller stores only `.png`/`.jpg` preview output. Convert WebP externally to PNG/JPEG before uploading. The deployment doc was updated; template-media MIME mappings and CAD/model import formats are unchanged.

No tests or dependencies added, no Worker/UI edits, no live changes/staging/commits. **Fix-2 BUILD-JAVA SUCCESS: all 14 modules, release17, tests skipped, exit 0; 2026-09-30 12:51:57 +08:00, 6.783 seconds.** Evidence: `P1-backend-fix2-build.log`. Existing Maven plugin/deprecation/unchecked warnings remain recorded. This section supersedes earlier report claims of supported WebP previews.
