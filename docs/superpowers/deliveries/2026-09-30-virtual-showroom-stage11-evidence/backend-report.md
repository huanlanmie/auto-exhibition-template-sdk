# Stage 1.1 backend implementation handoff

Completed initially 2026-09-30 15:17 Asia/Shanghai; independent-review repairs completed 15:42. Java ownership returned to coordinator; no commits or staging performed.

## Independent-review repairs (2026-09-30 15:42)

All four Important findings and the source-status Minor finding from `backend-review.md` were verified against source and repaired:

1. `VirtualTemplateRuntimeResourceService.java` now uses a shared private-routing field set for both valueMap properties and dataSchema/default-bearing fields. It includes plural identities (`clientIds`, `deviceIds`, `deviceCodes`, `sourceClientIds`, `sourceConfigIds`, `ownerIds`, `targetClientIds`, `roomIds`, `endpoints`). The `value`, `default`, and `defaultValue` representations are cleared; array schemas retain empty arrays rather than original identity leaves. Singular visitor `clientId` and virtual `roomId` remapping remains intact.
2. `VirtualTemplateBootstrapService.java` retains its initial 10-second deadline after init/ACK until an authenticated sdk_ready with the expected logical id arrives. Missing or invalid sdk_ready can no longer leave CONNECTING sockets forever. Timeout, MessagePort decode failure, envelope payload serialization failure, ACK failure, and pagehide share cleanup that closes the port and sockets; later synthetic socket construction explicitly fails once the bridge closes.
3. `VirtualInteractionService.java` applies a positive field whitelist to original physical targets before producing any suggestion. Unsupported `templateSessionId`, instance/endpoint selectors and other extra fields produce diagnostics rather than silently losing selectors. Template targets support only endpointType/clientId/functionName/argsMapping; gateway quiz targets support only endpointType/functionName/argsMapping.
4. Every enabled interactive screen now receives owner/template/version/source checks independently of graph participation, including missing/empty graphs. Graph participant count remains separate. The existing `requireValid` publish preflight invokes this full validation again. Direct-instance bindings still permit deliberately pinned older instances; device-theme-instance bindings require the current source pointer.
5. Source status `current` now requires both current instance id and frozen instance version to match. A current pointer with inconsistent config ownership is treated as missing.

Frontend coordination additionally requested authenticated `{type:'host_visibility',visible:false}` handling. The legacy bootstrap validates the boolean and pauses audio/video elements inside its own frame, without forwarding this host message to the template bridge. Native SDK handles the same signal independently.

Repair changes were limited to the original Java scope in these exact files:

- `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualTemplateRuntimeResourceService.java`
- `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualTemplateBootstrapService.java`
- `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualInteractionService.java`

Final repair verification: the same release17, skip-tests Maven compile command below returned BUILD SUCCESS at 2026-09-30 15:42:57 (13 reactor modules). Existing toolchain warnings remain. No functional tests, startup, HTTP/database calls, staging or commits were performed during repairs.

## Delivered

- New `VirtualInteractionService` validates optional schema-1 graphs, ordinary save and graph PUT, authorized fixed instance manifests, source/incoming directions, graph references, mapping paths, quiz template membership, and limits (8 participating interactive screens, 128 rules, 16 targets per rule). Missing graph normalizes to an empty graph. Preview-only screens do not consume graph participants.
- `GET /virtual/admin/showrooms/{id}/interaction-catalog` returns plain Maps/Lists: `screens`, `sourceRules`, `contentVersions`, `diagnostics`, `runtimeCapabilities`. Owner lookup occurs before catalog reads.
- `PUT /virtual/admin/showrooms/{id}/interactions` accepts `{expectedDraftVersion,interactionGraph}` and returns ordinary updated detail. Uses existing owner/version CAS and binding synchronization; never writes physical binding rules or deployed configs.
- Authoritative functions and template code are read from digest-verified private resource `templates/<screenId>/config.json` snapshots, specifically top-level `functions`. Actual `inout` directions normalize to `both` in exposed catalogs. Original served template schema retains `inout`. Params expose descriptive fields only, not source defaults.
- New read-only `VirtualInteractionMapper` owner-scopes physical context/rule reads without modifying existing FunctionLinkage files. A source maps only when theme/device/template/instance context is unique; each template target must also map uniquely. Unsupported conditions, ambiguous targets, missing source data and hardware targets generate diagnostics, never executable targets. `quizArbiter` becomes the known source function only after the source belongs to exactly one declared virtual quiz room. Missing physical tables/relations do not prevent explicitly authored rules.
- Picker adds device name/code/id, theme name/id and template code. Source config id already existed. Content version entries distinguish current source, bound draft, public snapshot, and `deploymentStatus: unknown`.
- Public/preview resource sessions freeze `screenFunctions` and return `{virtualRouting:true,maxRuntimes:8}` capabilities, derived solely from fixed revision resources. Old scenes lacking a graph receive an empty graph. Session renewal preserves the original frozen catalog.
- Bootstrap declares browser software routing capability. Legacy synthetic WebSocket waits for host `sdk_ready` with exact logical `v:<visitorSessionId>:<screenId>` client id, retaining runtime `templateSessionId`, forwarding business messages over the authenticated port and requiring incoming calls to target its own local runtime.
- Served config/valueMap remaps known client/room identity fields to visitor logical ids and the uniquely declared virtual quiz room, strips physical destination metadata/defaults, and retains quiz questions and manifest schemas. This operates on JSON config/valueMap only; arbitrary template JavaScript content is not rewritten beyond existing asset URL rebasing.
- `virtual-showroom.recover-unfinished-on-startup` defaults true and guards the existing import recovery loop. Set false in isolated local overrides when desired.

## Interfaces for frontend

`screenFunctions[screenId] = {templateCode,functions:[{name,direction,label?,params?}]}`.

`sourceRules` entries are directly applicable contract rule objects; `ruleId` is `source_<authorized physical numeric id>`. Unsupported rules appear only in `diagnostics:[{sourceRuleId,message}]`.

`contentVersions` entries contain `screenId,draftVersion,draft:{templateInstanceId,instanceVersion,artifactHash},publicRevisionId?,public?:{...},source?:{templateInstanceId,instanceVersion},sourceStatus:current|updated|missing|unavailable,deploymentStatus:unknown`. Catalog screen entries additionally expose `sourceStatus:ready|stale`. A stale screen's frozen functions remain visible to its authorized owner, while rule validation requires rebind/update.

Legacy host must send authenticated `sdk_ready.clientId` exactly `v:<visitorSessionId>:<screenId>`. All inbound host function calls, including quiz adapter emissions, must have `target:{mode:'local',templateSessionId:<receiver runtimeId>}`.

## Build and static verification

Final Maven compile completed with BUILD SUCCESS at 15:17:44, 13 reactor modules, Java release 17, all tests skipped:

```powershell
$env:JAVA_HOME = 'E:/development/java/idea/IntelliJ IDEA 2026.1.1/jbr'
& 'E:/development/java/maven/apache-maven-3.9.2/bin/mvn.cmd' -gs 'docs/virtual-showroom/maven-global.xml' -s 'docs/virtual-showroom/maven-settings.xml' -B -ntp -pl ruoyi-modules/mju-showroom -am '-Dmaven.test.skip=true' '-Dmaven.compiler.release=17' compile
```

Existing Jansi/Unsafe/resources-plugin warnings remain; no compilation error. Node JavaScript parser accepted the embedded legacy bridge (syntax only, no execution). `git diff --check` reported no whitespace errors. No unit/integration/browser/HTTP functional tests, service startup, database queries/mutations, installed-service manipulation, staging or commits were performed.

## Coordinator review and manual checks

1. User manually compares picker labels/source versions, then creates explicit cross-screen rule/group/quiz room, saves via both raw draft and graph PUT, checks stale-version conflict and invalid function/physical destination errors.
2. User publishes then changes/rebinds draft; public revision still uses its fixed catalog and graph until next publish. Lease renewal remains pinned.
3. User checks legacy and native template handshake with stable logical ids, actual mapped software binding delivery, quiz room behavior, two independent visitors, and local-only receiver rewriting.
4. User checks missing physical source rules show diagnostics while manual rules remain editable. Quiz source import intentionally requires a declared virtual quiz room before suggesting a gateway rule.
5. Coordinator handles all local startup/HTTP readiness and final integration review. Source rule SQL, mapper discovery, actual database schema and browser runtime behavior remain unverified by this task, as requested.

## Owned changed Java files

All are under `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/`:

- `mapper/VirtualInteractionMapper.java` (new)
- `service/virtual/VirtualInteractionService.java` (new)
- `service/virtual/VirtualShowroomService.java`
- `service/virtual/VirtualShowroomValidationService.java`
- `service/virtual/VirtualScreenBindingService.java`
- `service/virtual/VirtualResourceSessionService.java`
- `service/virtual/VirtualTemplateBootstrapService.java`
- `service/virtual/VirtualTemplateRuntimeResourceService.java`
- `service/virtual/VirtualModelImportService.java`
- `controller/VirtualShowroomOperationsController.java`
- `config/VirtualShowroomProperties.java`

Existing user edits to FunctionLinkage*, TemplateSync*, SyncDataVo, bootstrap files and SQL were not modified by this task.
