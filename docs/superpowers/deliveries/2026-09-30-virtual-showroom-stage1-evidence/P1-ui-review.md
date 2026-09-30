### Spec Compliance

- ❌ Issues found for the UI portion of P1-08/P1-09: template aspect-ratio presentation is absent (`ruoyi-ui-vue3/src/virtual-showroom/template-host/TemplateRuntimeHost.vue:8,36`), and the exhibit-list fallback excludes hotspots (`ruoyi-ui-vue3/src/virtual-showroom/viewer/ShowroomViewer.vue:10-13,25`).
- ✅ The inspected P1-04 editor and P1-06 host code implement the main contract: unique clone IDs, draft CAS/conflict preservation, explicit partial-import and publish-warning acknowledgement, preview-version invalidation, anonymous resource reads, and one identity-checked active MessagePort runtime. Evidence below.
- ⚠️ The UI diff does not verify server authorization, immutable snapshot/resource enforcement, runtime CSP/bootstrap/legacy certification, deployment proxy configuration, or P1-09 delivery documentation/manual-test records. These require the root's backend/Worker/docs gate. No live rendering, gestures, or end-to-end template interoperability was exercised.

### Strengths

- `ruoyi-ui-vue3/src/views/showroom/virtualShowroom/editor.vue:48-65,118-136`: draft mutations use `expectedDraftVersion`; save/bind failure leaves the local document in place; explicit reload warns before discarding edits; clones get fresh IDs while retaining object content.
- `ruoyi-ui-vue3/src/views/showroom/virtualShowroom/editor.vue:39-46,124-130`: preserving a preview on rebind requires matching instance ID, instance version, and preview-associated version. `components/ImportWizard.vue:37-45` and `editor.vue:140-142` explicitly gate partial acknowledgement and warning acceptance.
- `ruoyi-ui-vue3/src/virtual-showroom/template-host/hostSession.js:6-38,44-54`: separate runtime origin, exact window source/origin/identity checks, window ACK before host readiness, identity/version checked business envelopes, single active session, and bounded handshake cleanup. `messageRouter.js:16-34` rejects nonlocal targets and tracks local call results/timeouts; `runtimeStorage.js:2-21` isolates bounded storage in each runtime instance.
- `ruoyi-ui-vue3/src/virtual-showroom/viewer/publicHttp.js:8,16-45`: fetches omit credentials, resources are constrained to the manifest, fetched byte size is checked, URLs are cached and revoked, and renewal keeps using the initial resource-session path.
- `ruoyi-ui-vue3/src/virtual-showroom/scene-core/sceneRuntime.js:62-69,108-136`: stale model loads are disposed, rotated-box movement uses substeps, and the runtime exposes the shared API and tears down render loop/controls/renderer. Three objects stay outside Vue reactive state in `viewer/ViewerScene.vue:7-10` and `components/SceneCanvas.vue:7-13`.

### Issues

#### Critical (Must Fix)

- None found in the inspected UI/host scope.

#### Important (Should Fix)

1. **Preserve the selected screen's aspect ratio in the live template viewport.** `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/virtual-showroom/template-host/TemplateRuntimeHost.vue:8,36`. The iframe always fills a flex area inside a fixed 1280×840 dialog, or the entire portrait mobile viewport below the header. Neither `screen.widthM` nor `screen.heightM` influences the layout. A configured 16:9 or portrait screen therefore opens with a different runtime viewport; fixed-layout templates can crop or reposition controls and display differently from the screen preview. P1-09 explicitly requires template-ratio handling. Add a bounded aspect-ratio viewport using the screen/content dimensions, scale/letterbox it within the available area, and keep the exit header outside it. Manual acceptance should include both wide and portrait templates on a narrow phone.

2. **Include hotspots in the non-3D exhibit fallback.** `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/virtual-showroom/viewer/ShowroomViewer.vue:10-13,25,46-53`. `screens` filters exclusively to `type === 'screen'`, and that same list controls both the only fallback button and its entries. Hotspots can only be selected through a successful canvas pick. When WebGL initialization fails (the explicitly handled case in `ViewerScene.vue:8`), all text/image hotspots become inaccessible; a hotspot-only showroom has no exhibit fallback at all. P1-08 requires an exhibit-list fallback. List all enabled exhibits and route each item through the existing screen/hotspot opening logic; retain hotspot text/image access even when there is no runtime available.

#### Minor (Nice to Have)

1. **Reverse Tab always refocuses the close button.** `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/virtual-showroom/template-host/TemplateRuntimeHost.vue:21`. `iframe.value?.focus() || closeButton.value?.focus()` invokes the second expression because `focus()` returns `undefined`, even when an iframe exists. Thus Shift+Tab from the close button never moves to the iframe as intended. Use an explicit branch, and keep the modal focus cycle contained. This is a concrete keyboard-navigation defect rather than a request for additional styling.

### Review Checks and Boundaries

- Read the P1-04/06/08/09 briefs, authoritative v1 contract, and P1-04 implementation report. Inspected the supplied diff inventory and the current changed source with line numbers in passes (scene/editor, viewer, host). Method deviation: source files were read directly rather than exclusively from the full-source diff; no source mutation or Git-state change was made.
- Focused cross-repository protocol check: inspected SDK `src/runtime/communication/browserHostTransport.ts:104-172`, `templateBridge.ts:226-338`, and target types to verify ACK direction, local target fields, function-result routing, and storage envelopes match the UI host.
- Focused backend response checks: inspected `VirtualResourceSessionService` response/renewal fields to verify the UI's URL/ticket/expiry assumptions, and `VirtualShowroomService` binding/resource synchronization to check whether duplicating a bound screen can retain authorized content. Those checks did not uncover a UI integration mismatch.
- No tests, browser QA, builds, staging, commits, or subagents were run. The reported successful production build remains compilation evidence only.
- Declined to judge: runtime-origin server security and legacy-template certification are owned by the backend gate; deployment/docs deliverables are absent from this UI diff and remain a root integration check; real fixture rendering and mobile-browser behavior remain the required manual-validation stage.

### Assessment

**Task quality: Needs fixes.**

The core editor, anonymous client, and scoped host architecture are consistent with the contract by inspection. The two P1-08/P1-09 usability requirements above are missing from the implementation and should be completed before marking this UI task gate approved.

### Implementation follow-up — round 1

The implementation agent addressed both Important findings and the Minor keyboard defect after this review: ratio-fitted inner iframe/image viewport with ResizeObserver cleanup; enabled screen/hotspot exhibit fallback independent of WebGL; explicit iframe-or-close focus handling with modal guards. Root's related review requests were also applied: multipart preview screenId for backend provenance, reupload guidance after binding changes, viewport-fit=cover, and safe-area offsets for runtime close/header and viewer navigation/touch controls. No scene-core files were changed.

Production build passed with 2177 transformed modules in 24.22 seconds (exit 0); see `P1-04-review-round1-build.log` and the appended P1-04 implementation report. No automated tests or browser QA were performed. This is the implementer's repair record, not a new independent approval or a claim of manual visual acceptance.

## Fix round 1 scoped re-review

### Spec Compliance

- ✅ Prior Important 1 — **ADDRESSED**. `ruoyi-ui-vue3/src/virtual-showroom/template-host/TemplateRuntimeHost.vue:8-12,26-32,45-57` fits an inner iframe/preview viewport to `screen.widthM / screen.heightM`, bounds both dimensions to the available body, applies the first measurement before starting the iframe, observes resize changes, and disconnects the observer during teardown. The close header stays outside the fitted viewport.
- ✅ Prior Important 2 — **ADDRESSED**. `ruoyi-ui-vue3/src/virtual-showroom/viewer/ShowroomViewer.vue:10-11,25,46-55` includes enabled screens and hotspots in the exhibit list. Selection reaches the existing text/image hotspot logic independently of a Three runtime; optional runtime calls do not block fallback content. Reload/change also invalidates stale hotspot-image completions (`:30,45,53-54`).
- ✅ Prior Minor 1 — **ADDRESSED**. `ruoyi-ui-vue3/src/virtual-showroom/template-host/TemplateRuntimeHost.vue:4,14,34-44,57` replaces the `focus() || focus()` expression with an explicit branch and adds focus guards/containment with teardown and prior-focus restoration.

### Direct Regression Check

- No new Critical or Important regression found in the scoped fix package by inspection.
- `ruoyi-ui-vue3/src/api/showroom/virtualShowroom.js:22` and `src/views/showroom/virtualShowroom/editor.vue:69-88` consistently pass the captured target screen ID with file and expected draft version; the subsequent asset assignment uses that same ID. Server-side provenance validation remains the separate backend review's responsibility.
- `ruoyi-ui-vue3/showroom.html:2`, `src/virtual-showroom/template-host/TemplateRuntimeHost.vue:62-64`, and `src/virtual-showroom/viewer/ShowroomViewer.vue:68-74` add viewport-cover support plus safe-area offsets for the principal controls. The template fitting measures client dimensions, excluding the safe-area borders, so those borders do not inflate the fitted viewport.

### Checks and Assessment

- Read `ui-fix-review.diff`; recovered its truncated editor/property section from that same package and read the appended implementation report. Did not read backend source or broaden the gate.
- No tests, builds, browser QA, Git operations, or subagents were run. The implementer reports `npm run build:prod`, exit 0, 2177 transformed modules; this remains compilation evidence only.
- ⚠️ Actual wide/portrait rendering, cross-origin iframe keyboard traversal, safe-area device layout, and WebGL-disabled fallback remain designated manual acceptance checks.
- **Task quality: Approved for this scoped fix round.** All three prior findings are addressed in the reviewed code, with no direct Important regression found. This supersedes the earlier Needs fixes verdict for those findings; the original backend/deployment/manual-validation boundaries remain unchanged.
