# Spec compliance: Approved

Task 3 final frontend source matches the v1.1 contract within the reviewed static scope. No unresolved Critical or Important finding remains in the UI implementation. Source was reviewed after the frontend implementer explicitly froze and returned ownership, including the last target/TTL/quiz compatibility repairs.

Task quality: Approved. This is a source review and build-evidence review, not a functional or browser acceptance result.

## Strengths and checked boundaries

Paths below are relative to `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/` unless an absolute path is supplied.

- `virtual-showroom/template-host/hostSession.js:5` creates a new runtime id for each iframe while deriving the stable visitor/screen client id. `:21` checks frame source/origin and all identity fields; `:27` checks each port envelope. `:41` sends logical sdk_ready after window ACK. The previous global active session is absent.
- `virtual-showroom/template-host/runtimeRegistry.js:9` caps retained interactive frames at the manifest ceiling and 8. `:47` intersects frozen incoming function declarations with runtime registrations, waits for registration, and fails closed on unsupported functions. Actual Ebook's unannotated runtime registrations work with its fixed `in` declarations, while Tbutton's `inout` declarations are accepted.
- `virtual-showroom/template-host/roomRuntime.js:7` copies the lease manifest before constructing routes. The graph participant check remains distinct from lazy active-frame counting. Visibility changes at `:19` hide rather than move/destroy frames and send authenticated host_visibility. Close retains state; dispose destroys router, sessions, frames, timers and storage. `TemplateRuntimeHost.vue` stays mounted with a nullable screen and computes the foreground viewport from the screen aspect ratio.
- `virtual-showroom/template-host/roomRouter.js:7` rejects malformed/unknown/extra target fields, including array targets and prototype-derived modes. Multicast uses explicit own-property exclusivity. Scope resolution only accepts this visitor's exact virtual client ids or frozen groups. `:127` overwrites sender identity instead of trusting payload from.
- `virtual-showroom/template-host/roomRouter.js:100` installs each child pending record before send and rewrites delivery to the receiver's local runtime target. Responses can resolve only the matching receiving record. `Promise.any` implements first successful transport result, with aggregated failure only after all children fail. The callback registry and disposal paths bound and clean pending operations.
- `virtual-showroom/template-host/roomRouter.js:113` validates requested TTL before deriving the minimum remaining budget from all pending deliveries to that runtime. Bounded recent traces, pending/request limits, per-screen 64-message/second traffic limits, and event burst limits prevent uncontrolled re-emit paths from bypassing all bounds.
- `virtual-showroom/template-host/quizAdapter.js:112` derives member identity from its authenticated record and declared room membership. Master authorization, round/question identity, one winner, winner/solo answer permission, permitted options, trusted score updates and host clock deadlines are enforced. Supplied membership, winners, scores and deadlines are not copied into authority state. Timer disposal is explicit.
- `views/showroom/virtualShowroom/components/InteractionEditor.vue:105` saves through PUT interactions with expectedDraftVersion and accepts normal updated detail. `editor.vue:151` saves pending scene edits before opening the interaction editor; `editor.vue:53` accepts the new version and disposes old preview leases. Preview close keeps the same room until a new draft version or navigation disposes it. Graph pruning for disabled/deleted screens is included in undoable draft edits.
- `virtual-showroom/viewer/ShowroomViewer.vue:14` retains one room host per visitor session; reload, expiry and unmount dispose it. Renewals keep the original frozen manifest rather than adopting a changed public revision. API/schema changes add the two graph endpoints and an optional empty schema-1 graph without changing scene schema version.

## Findings raised during review, now resolved

1. **Actual quiz transport rejection triggered a second local winner/local score.** The shipped `C:/Users/Administrator/Desktop/template/quiz-buzzer/src/App.vue:741` and `:757` fall back to local preview logic whenever buzz/submitAnswer transport rejects. The final adapter uses `denied()` at `quizAdapter.js:59` to resolve ordinary authenticated business denials with `{ok:false,code,message,state}` and synchronize the caller. Winner, deadline and answer denials at `:150–162` use this path; forged identity/protocol errors remain errors. This prevents the normal losing participant from invoking the template's disconnected-preview fallback.
2. **Host-first timeout skipped the real template's automatic next-question transition.** The real template's refreshClock schedules timeout progression, while applyRemoteState only schedules answered progression. Final `quizAdapter.js:52` preserves an already-expired answering transition only for the declared master while authority remains timeout. `:204` consumes a narrowly scoped authenticated acknowledgement for matching room/round/master/index and does not execute a route or copy supplied state. The existing template retains its own autoNext/resultHold behavior. An internal host callback marker separately permits the actual memberJoined handler's input-only sync acknowledgement without expanding the outgoing function allowlist.
3. **Parallel incoming calls could erase inherited TTL.** Final `roomRouter.js:113–119` uses all pending contexts' minimum remaining TTL even when an old template emits a new trace. The hard per-screen traffic window also covers new ids/changing payloads.
4. **Malformed multicast extra selector could be ignored.** Final `roomRouter.js:9–11` validates target objects/mode ownership and enforces clientIds-versus-group by own-property presence. A group plus malformed clientIds is rejected rather than silently using the group.

Critical: none.

Important: none remaining in the final frontend scope.

Minor: no additional change requested for this task.

## Independent SDK host_visibility increment

Approved independently. At `C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/src/runtime/communication/browserHostTransport.ts:259`, the signal is handled only after connected/protocol/identity/payload checks and requires a boolean. Hidden audio/video is paused immediately, and `:292` captures later play events, covering media mounted after the initial hidden signal. Per-element pause failures do not tear down the port. Visible=true does not auto-play media. `:325` removes the capture listener on disposal. No native/local WebSocket behavior or physical network fallback was introduced by this increment.

## Evidence, limits and reviewer independence

- Reviewed v1.1, the final frontend report, the final listed UI source and focused actual Tbutton/Ebook/quiz-buzzer call sites/config functions. Actual template code was read only to resolve concrete compatibility questions about function directions, fallback behavior, question state and clock transitions.
- Read `frontend-build.log`; it records 2181 transformed modules and `built in 14.57s`. The frontend author reports final build exit 0. This reviewer did not rerun the build, tests, browser QA, startup, HTTP or database operations.
- No frontend source, SDK source, Git index, branch or commits were changed by this review. This report is its only UI-review artifact.
- Two separately assigned Java repair increments were implemented by this same agent during the review window: legacy hidden-media capture and the narrow unchanged-binding draft freshness repair. **They are explicitly excluded from this independent approval.** Their ownership was returned to root, and root assigned the SDK reviewer to approve those Java increments independently.
- In particular, the cross-project multiple-stale-binding repair uses a new backend draft validation path; this report approves the UI CAS/repair workflow wiring, not the correctness of that self-authored Java implementation. Publication must remain strict and the Java increment requires its separate review/build gate.
- Real interaction outcomes still require the approved human checks: Tbutton→Ebook lazy delivery, two-screen quiz loser behavior and timeout advance, close/reopen preservation, two visitors' isolation, hidden media and stale-source repair/publish. Static approval does not substitute for those checks.
