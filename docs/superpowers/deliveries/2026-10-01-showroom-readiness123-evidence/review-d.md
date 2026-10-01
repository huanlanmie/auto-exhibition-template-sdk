# Readiness123 Root D independent static review

2026-10-01. Authority: `docs/superpowers/contracts/showroom-readiness123.md`, including HTTPS LAN and localOnly supplements, and frozen `review-d-package.md`. Reviewer is independent of Root D and does not self-review Task A. Scope: the ten Root source files listed below; limited outside reads for the named token, Vite, Worker public-proxy, and dirty-draft interfaces. Product source remained read-only.

## Verdict

**Specification and quality: Approved.** Important D-I1, Windows PowerShell5 D-I2, and preview-path D-I3 are closed by independent source follow-ups below. No unresolved Critical, Important or Minor finding. Author `task-d-report.md` was subsequently read and agrees with the source boundaries and pending functional/manual acceptance. This is static approval; final build/startup readiness evidence remains Root's responsibility.

## Important D-I1 — LAN-only listeners are probed through loopback

**Path/lines:** `C:/Users/Administrator/Desktop/mju-smart-show/scripts/virtual-showroom/start-local.ps1:14–20,41,130–133,145`; listener `C:/Users/Administrator/Desktop/mju-smart-show/scripts/virtual-showroom/lan-preview.mjs:46`.

**Trigger:** start the approved HTTPS preview with an assigned RFC1918 `LanPreviewAddress`. The HTTPS servers bind `server.listen(port,address)` to that exact LAN IP. Port-Open unconditionally connects127.0.0.1. Services then Wait-Port9443/9444 through the wrong interface, so a correctly running preview is reported as not ready and startup eventually throws. The same fixed probe also fails to preflight an unrelated listener occupying the intended LAN binding; status falsely shows the preview not listening.

**Smallest fix:** add an optional probe/binding address defaulting127.0.0.1 to Port-Open, Wait-Port and Start-Owned; use LanPreviewAddress only for both preview starts and readiness waits. Save the binding address with owned process records so status probes it, defaulting legacy records to127.0.0.1. Continue matching executable and startTicks before stopping a process. This does not require opening firewall rules or widening a bind to0.0.0.0. Root was notified before further review.

## Reviewed source evidence

### Materials and public delivery

`index.vue` adds only the permission-gated materials dialog and ReadinessGuide, not an import/register/publish shortcut. ReadinessGuide clearly labels manual-required and distinguishes generated input from actual CAD and SDK compilation from business acceptance. It explains unit choices, explicit post-conversion review/application, independent template authorization/binding/publication, separate visitor checks, real-device measurements, and the difference between encoded bytes and GPU capacity. There is no false measured FPS, modeled505 result, or completed template handshake claim.

ReadinessGuide only fetches a fixed public catalog with credentials omitted. It validates schema/verification, bounded array counts, allowed fixed relative URL patterns, positive bounded file size, and SHA syntax; Vue interpolates text rather than rendering HTML. Abort/unmount handling prevents stale catalog writes. It exposes no arbitrary local-file read endpoint.

`prepare-readiness-models.mjs` copies exactly four existing generated sample paths without parsing them. Its template manifest input must resolve below the private readiness directory, is capped1MiB, has exactly the three fixed candidate IDs/code/native profile, safe version/ZIP-name/size/SHA shape, no duplicate IDs, and ZIP realpath exactly alongside the manifest. Each ZIP's actual bytes and SHA are checked before copy. Public output is a field-built whitelist; privateEvidence/source paths do not enter catalog. No engine/conversion, API/SQL/import/register/publish call is present. Model inputs are fixed authored files, not user source documents or arbitrary path arguments.

Read-only directory inventory contains exactly catalog.json, four input files under models, and three ZIPs under templates. No unpacked executable template HTML, private manifest, source config, certificate or PFX is published there. All seven public size/SHA values independently match current files; template values include the final B-M1 Ebook SHA. The generated model bytes were hashed only, never parsed or converted. Existing original assets and505 are not source write targets.

### Dirty local graph and active canvas integration

`editor.vue:15,154–155` passes dirty as localOnly, accepts normalized local-saved graph through existing execute, and closes the dialog. It preserves current whole-document local changes/history and leaves eventual whole-draft CAS to ordinary save. Clean mode remains expectedDraftVersion graph CAS in the existing child. The openInteractions change allows repair of a dirty old conflict instead of requiring an invalid save first. Task B independently approved the other side of this narrow interface.

`canvasActive` line208 includes all existing import/binding/review/validation/template/interaction/loading/saving overlays plus the content-updates dialog. Both renderer active prop and input-enabled state derive from it. The replacement-review component's two preview canvases are untouched; only the obscured main canvas pauses. Viewer explicitly passes active=false while a screen or hotspot is open or a lease expired. The underlying Task C runtime implementation is separately reviewed and is not self-approved here.

### Origin-tab credential boundary

`auth.js:8–14` recognizes only HTTPS private IPv4 on9443. Token and expiry reads/writes/removals use origin-tab sessionStorage in that mode and never fall through to js-cookie. localhost/non-LAN behavior keeps previous cookie flow. Login.vue hides remember-password, suppresses its write branch, and returns from cookie-prefill before reading stored username/password in LAN mode. Its initial password is cleared by getCookie before use. User store and normal router/request token interfaces call these auth helpers, so management requests still get the correct bearer token. The existing mall-only cookie fallback is outside the management/showroom routing scope; this approval does not claim a wholesale unrelated mall credential migration.

This addresses the same-IP/different-port cookie limitation without weakening browser origin isolation or using a password/token on the template runtime origin. No actual cookie, local state, password, token, PFX or passphrase was inspected or printed in this review.

### TLS, public-only runtime, and local configuration

`prepare-lan-preview.ps1` requires a parsed IPv4 in RFC1918 range and a currently assigned local address. It creates an in-memory RSA development certificate with IP SAN, server-auth key usage,30-day expiry, and random passphrase, writing only private PFX/state plus public CER in the ignored runtime directory. It never adds a trust root or firewall rule. The script prints only state-file path. This is development certificate preparation; actual device trust is a user step.

`lan-preview.mjs` repeats assigned-private-address validation, constrains state/certificate realpaths to the fixed private directory, uses TLS>=1.2, binds only the selected IP, and requires exact authority. Frontend targets loopback5173. Runtime targets loopback9319, admits only GET/HEAD under fixed ticket-shaped public prefix, strips cookie/authorization/browser service-secret headers, rejects redirects, and denies runtime WebSocket upgrade. Frontend HMR upgrade requires exact host and vite-hmr and strips cookie/auth before loopback forwarding. Connection abort/close/timeout cleanup exists. It does not provide a private convert/analyze/admin proxy on9444.

Named unchanged Worker defense was read: main.js canonicalizes/decodes public path segments and rejects traversal/double-encoding/separators, whitelists read headers, supplies its own service secret, and whitelists response headers without upstream cookies/challenges/redirects. Its unchanged route currently serves GET public resources; permitted HEAD forwarded by the TLS shim can still receive404 rather than an asset body. This does not broaden private exposure or block existing browser GET resource loading. No network request was sent.

Start-local defaults to existing localhost runtime and exact localhost hosts; LAN only adds exact9443 host origin and9444 runtime origin as mju-showroom command options. It checks owned executable/startTicks before any restart, fingerprints arguments and certificate state, and refuses showroom reconfiguration if local model jobs are queued/running. Java/DB/Redis/Worker/Vite underlying binds stay on prior loopback configuration. Turning LAN off stops only matching owned preview processes. The pre-existing all/snapshot action remains; this review and Root's readiness run must use services, not rerun snapshot. No startup,SQL,Nacos write or configuration preparation command was executed by this reviewer.

## Frozen initial source hashes

All ten independently match the package at initial inspection. Platform root: `C:/Users/Administrator/Desktop/mju-smart-show`.

| Platform-relative file | SHA-256 |
|---|---|
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/index.vue | 90293DB140FAEB01C282AFE24EE5FDF7A7A4B341F1366BBF1269F3BC87172996 |
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/editor.vue | 925B66BF1D986C0C919E55F1F252521008F9C47EF3FEE6329D8605B06192E26D |
| ruoyi-ui-vue3/src/virtual-showroom/viewer/ShowroomViewer.vue | 9BF73E6CF849DC3AC601472BA3D3F1091A8F2DFB31F2248C6DFD00591CDB0E82 |
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ReadinessGuide.vue | 214BD1BF0B5057857093ACEC44CFA81FDEE437DC680A8885F61D4923AE76AC02 |
| scripts/virtual-showroom/prepare-readiness-models.mjs | 9D6C73BE3870C727743DB69546B61157550C06D3E4151F6C9D4D3E1D67A9B8A5 |
| scripts/virtual-showroom/start-local.ps1 | 8522EE5E767C5D77E661A67355F3339732A141325AA524F195BA523E103D5CA8 |
| scripts/virtual-showroom/prepare-lan-preview.ps1 | 15583DA40555AD8A107BDFCF3DDA9B781DFED1FF6AE0E455611EBB9652AB1CE3 |
| scripts/virtual-showroom/lan-preview.mjs | E67F73865D45FCD2B7DADCA0941CEB6B9249D69134A5D75D4DB2B0302336AC67 |
| ruoyi-ui-vue3/src/utils/auth.js | 6DA598B9E36CE25A159BF9306AA6831DF2357689096D4D169C5E119425D5C098 |
| ruoyi-ui-vue3/src/views/login.vue | 694EAE7245F71EC0978440D14879C5B3BF1E8F80E36908779B044CFFE65DC7D1 |

No tests, template execution, model parsing/conversion, engine initialization, browser QA, builds,API calls, startup, dependency installation or commits. Only review reports written.

## D-I1 follow-up — closed

Independently read the final source repair: Port-Open now accepts Address default127.0.0.1 and ConnectAsync uses it; Wait-Port threads its third Address argument through every probe. Start-Owned takes its final BindAddress default127.0.0.1, preflights that address, and stores it in the owned record. Both lan-frontend/lan-runtime calls explicitly pass LanPreviewAddress and their Wait-Port calls pass it too. Status uses each record's bindAddress, falling back to127.0.0.1 for older records. Existing loopback application calls omit the new optional parameters and retain their prior behavior. Owned executable/startTicks checks and reconfiguration/job gates remain unchanged. The package's initial start-local.ps1 SHA is superseded by current independently computed `CA773E6C3CF1AA32F33CD97C6B891A2E97C006512BB960F2CD07C640AD87216C`.

The other nine sources remain at their approved initial hashes. Root's task-d-report.md was read after it landed; its source/interface descriptions match the reviewed files and it explicitly keeps final builds/owned-start readiness and user functional checks separate. D-I1 closed without executing a probe, HTTPS server, certificate script or business action. Final specification and quality Approved.

## D-I2 follow-up — closed

Root's actual Windows PowerShell5 startup diagnostics found that returning the JSON process array through the pipeline, then pipeline-serializing array addition, could decorate/nest records as value/Count wrappers and ultimately lose older ownership evidence at JSON depth5. This was a real startup-readiness finding after the initial static approval; it is recorded separately from model/template testing. Root reports it refused an occupied port rather than killing an unrelated process, recovered only ten independently matched owned records, and verified default-mode switching. Those runtime observations are Root's evidence, not executions by this reviewer.

Independently read the narrow product fix in `start-local.ps1:23–31,54–57`: Processes now explicitly foreach-enumerates decoded entries, rejects missing required ownership fields, converts record scalar types, and emits a freshly constructed flat PSCustomObject per entry. A decorated value/Count wrapper lacks ownership fields and is rejected; JSON/type conversion errors terminate under ErrorActionPreference Stop. Start-Owned fully collects Processes before changing a process, then builds a List<object> containing only old nonmatching records plus the new scalar record. `ConvertTo-Json -InputObject ([object[]]$updated.ToArray())` serializes the entire intended array directly rather than pipeline addition. The primitive-field records do not approach depth5. There is no guessed migration/recovery of malformed records in product source.

Same-Process still matches executable plus startTicks before any stop/reconfigure path; unrelated occupied ports remain refused. D-I1's selected-LAN-address preflight, waits and recorded-address status are preserved; existing loopback defaults are unchanged. Services/default-mode and stop enumerate records before their process-action loops. No new startup scope, firewall/trust/Nacos/DB write or original-asset access was introduced by this fix.

Final independently computed start-local.ps1 SHA is `A14E9DF0B16E0814EF564691BC1B17E54352C27C6E65985E7955F6CA25DBAEF8`, superseding the D-I1 hash. All other nine frozen D file hashes were rechecked and still match. D-I2 closed; specification and quality Approved. Reviewer only read source and hashed files; no PowerShell script/probe/process action, business/model execution or credential access was performed.

## D-I3 follow-up — closed

Final documentation's independent reviewer found a real contract mismatch: the initial LAN runtime public-prefix regex required a code of8–128 characters, while authorized administrator draft previews use the literal seven-character `preview`. It therefore rejected the correct preview iframe/resources before their existing session checks. This was missed in the earlier static approval; it is explicitly recorded and narrowed here rather than treated as a user business-test result.

Independently read `lan-preview.mjs:26–27` after Root's fix. Runtime admission remains GET/HEAD and is now limited to `/showroom/virtual/public/(?:preview|[A-Za-z0-9_-]{8,128})/sessions/[A-Za-z0-9_-]{43}/assets/`. The extra preview alternative does not admit manifest,renew,admin,analyze,convert or arbitrary public subroutes. Selected-address binding, exact Host, private TLS/certificate paths, auth/cookie/service-secret stripping, loopback upstream, redirect rejection and disabled runtime upgrade remain unchanged.

Named interface checks support this exact path:

- `VirtualResourceSessionService.java:22` preview uses owner-authorized requireOwned and create(room,"preview",...). Its token() is32 random bytes, URL-safe Base64 without padding, therefore43 characters; get() enforces the same43-character syntax, matching record code and expiry. resourceBase() is exactly `/showroom/virtual/public/{code}/sessions/{key}/assets/`. Public showroom codes are32 UUID hex characters (`VirtualShowroomService.java:80`) and still fit the ordinary alternative.
- `VirtualShowroomOperationsController.java:64–65` administrator preview endpoint retains query permission and calls sessions.preview. Editor first saves its draft then obtains this manifest through the management API. `hostSession.js:8–13` appends `templates/{screenId}/index.html` to manifest.resourceBaseUrl at manifest.runtimeOrigin, with identity/hostOrigin query values. Thus preview and public native iframe asset URLs both fit the corrected prefix.
- `publicHttp.js:4–9,16–17` keeps manifest/renew and model/blob resource requests on the frontend management/public API path with credentials omitted; it does not require runtime TLS to admit manifest or renewal. Existing createPublicSession resource URL shape matches the same sessions/assets structure.
- The unchanged Worker GET public proxy canonicalizes decoded path segments and rejects dot/traversal/encoded separators; it supplies the service-owned secret and whitelists forwarded/read response headers. `VirtualShowroomPublicController.java:15–20` then looks up the bearer session, resolves only its frozen active-resource manifest, rejects private IFC paths/kinds, and calls the runtime resource service. Template assets still require the service secret. No owner/record/source lookup is replaced by accepting the literal preview code.

Final independently computed lan-preview.mjs SHA `B71784AAB13D6867960030769005ED430052C1E0F12C6E01D8011A9A4FB7E5A2` supersedes its initial hash. Other nine D hashes independently match their last approvals, including final start-local A14E9...AEF8. D-I3 closed; specification and quality Approved. No regex execution, network request, server/startup action, business/template/model execution or credential inspection was performed by this reviewer.
