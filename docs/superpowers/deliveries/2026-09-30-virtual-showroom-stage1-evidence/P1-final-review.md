# Stage 1 whole-branch final review

Reviewed SDK `22442ce9e81fe40e5e77b72a786ec3d896af74ad..b185d05e727ad84e0b5b76647b10eb07adbc49dc` and platform `3b066c7c90e6fe7447ca9ced098c97590449738c..ffd8993fb7350804905346d568c297f0958832f8` using `whole-branch-review.diff`, in component/interface passes. The v1 contract is authoritative; the stage-1 plan, design, progress rulings, implementation reports, and the four scoped review outcomes supplied context. This verdict does not reopen those approved corrections without a concrete integration defect.

## Strengths

- Draft owner checks and CAS are consistent across ordinary saves, bindings, preview uploads and asynchronous model registration. Import completion registers resources/model metadata and terminal success together; cancellation prevents a late successful registration. Publication and rollback switch immutable revision pointers separately from the editing draft.
- Public resource sessions retain the original scene/resource snapshot and resource-session path during renewal. Public DTOs omit private storage fields; enabled-scene resource filtering excludes unused draft assets. The anonymous viewer uses its own entry/client and omits administrative credentials.
- Worker HMAC inputs match the Java client, returned artifact hashes/lengths are rechecked before registration, and the isolated runtime proxy supplies only the server-owned secret. Template serving requires that secret and installs bootstrap before application execution. SDK and host agree on identity/source/origin validation, window ACK, port envelopes, local function routing and scoped storage.
- PNG/JPEG previews now require decoding and server-captured binding provenance. Three versions are pinned consistently. The expanded ImportReport fields come from the parsed source, applied transform, geometry statistics and actual warnings, and survive the Java report DTO into the UI report display; absent CAD identity is explicitly represented rather than invented.

## Issues

### Critical (Must Fix)

None found in the reviewed scope.

### Important (Should Fix)

1. **[P2] The centering option cannot cross the UI/Worker boundary.**
   - Files: `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ImportWizard.vue:10` and `:26`; `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/browser/convert.js:60`–`:61`.
   - Selecting “水平居中并落地” submits `centering: true`. `VirtualModelImportService.createJob` persists the options unchanged and `VirtualModelWorkerClient.convert` forwards that JSON unchanged. The Worker permits only `none`, `floor-center`, `floor`, or `center`, so `true` always produces `INVALID_CENTERING` after parsing. The default `false` happens to work because `options.centering || 'none'` turns it into `none`.
   - Impact: the offered floor-centering workflow fails for otherwise valid GLB/glTF/OBJ imports. The documented OBJ sample workflow also asks users to choose this behavior.
   - Fix: use the canonical string values `none` and `floor-center` in the selector/default (or explicitly normalize a documented compatibility representation at one boundary), preserving the same representation in reports and instructions.

2. **[P2] Failed import jobs discard the actionable error in the wizard.**
   - Files: `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ImportWizard.vue:13`–`:20` and `:35`; producer: `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualModelImportService.java:82`–`:86`.
   - Worker/conversion failures are represented as a normally returned job with `status: FAILED`, `errorCode`, and `errorMessage`; its report remains `{}`. The wizard only renders status, stage, report, and a local request-error string. A successful polling HTTP response never populates that string, and the template never reads the job error fields.
   - Impact: malformed geometry, unsupported required extensions, unavailable Worker configuration and invalid import options all appear as an undifferentiated failed job with an empty report. Users cannot determine what must be corrected before retrying, even though the backend has the reason.
   - Fix: display terminal `job.errorMessage`/`job.errorCode` in the job panel, with a useful fallback where only a code exists. Keep polling-transport errors separate from conversion failure details.

3. **[P2] Undo after saving a bound-screen deletion creates an unsavable draft.**
   - Files: `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/editor.vue:53`–`:54` and `:65`; enforcement: `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualShowroomService.java:169`–`:181`.
   - Ordinary save deliberately retains command history through `acceptDetail(response.data, false)`. Delete the only screen carrying a particular binding, save, then Undo: the old screen and binding return locally with the new draftVersion. The next save fails `BINDING_CHANGE_REQUIRES_BIND_API`, because `preserveBindings` compares against the now-saved scene and no identical binding remains to authorize the restored screen. Saving the deletion also pruned its template resource aliases.
   - Impact: the enabled undo action appears to restore the screen but cannot persist that restoration, preview it, or publish it through the normal workflow. This is a frontend-history/backend-authorization mismatch, not a reason to relax the ownership/bind guard.
   - Fix: make a successfully persisted binding-removal operation an explicit undo-history boundary, or implement restoration through the authorized binding path together with resource restoration. Do not silently preserve an undo command that can no longer be saved.

### Minor (Nice to Have)

None added. No speculative polish findings.

## Review boundaries and evidence

- Static review only. No builds, tests, conversions, browser QA, startup, live SQL, network calls, Git mutations, or source/document edits were performed. The only write is this report.
- The supplied reports record SDK build/declaration success; Worker syntax/dependency resolution success after the rich ImportReport change; UI production build success with 2177 modules; and Java success across 14 modules with release17 and tests skipped. These are reported build results, not new execution evidence from this reviewer or proof of functional acceptance.
- Third-party decoder bytes and binary manual samples were omitted from the review hunks as declared by the package. Their inventory/version provenance was present; binary behavior was not certified here.
- Outside changed source, inspected only the existing UI permission-route registration and AppMain lifecycle to investigate the concrete possibility that the new menu/static route overlap could retain a stale editor. The inspected route key/no-cache arrangements did not establish an additional defect.

## Declined to judge

- GLB/OBJ conversion fidelity, actual browser handshake ordering, mobile touch/rendering, real-template compatibility and M01–M11 end-to-end outcomes: reserved for the explicitly required user manual acceptance; automated functional execution is forbidden for this task.
- FBX/STL/DXF/STEP/IGES/DWG/IFC, automatic CAD semantic identity and multi-layer navigation: outside the approved stage-1 format/navigation scope.
- WebP preview support: explicitly deferred by the approved real-decoder ruling; the implemented rejection is correct for this stage.
- Multi-replica import recovery, destructive orphan collection and deployment provisioning: explicitly recorded stage-1 operational constraints. The code/docs require a single active coordinator and retain referenced private bytes; no production provisioning was requested or performed in this review.
- Final startup/release handoff documents and marking the manual checklist/plan status: root-owned delivery work beyond the supplied committed source package. This review does not certify those final delivery updates as already complete.

## Recommendations

Correct the three interface defects before approving the whole-branch gate, then perform a scoped static rereview of those corrections. Keep the existing authorization/CAS protections. The user's manual acceptance should include both centering selections, a failed import with a visible reason, and undo behavior across a saved bound-screen deletion. Deployment still needs deliberate SQL/menu/configuration/proxy application, private storage/Redis/Worker provisioning and rebuilt or manually certified template artifacts as documented; these are delivery prerequisites, not claims that deployment has occurred.

## Assessment

**Ready to merge? With fixes. Whole-branch approval: withheld pending the three Important corrections.**

The implemented stage-1 architecture and previously approved corrections are coherent by static inspection. The three concrete cross-component defects prevent approving the complete implemented phase as-is; resolving them can support “implemented, build-checked, pending user manual acceptance,” but cannot establish production deployment or functional acceptance.

## Scoped final rereview — consolidated fix wave

Reviewed platform `ffd8993..b4788404` from `final-fix-review.diff` and `P1-final-fixes-report.md`. Scope is the three original findings and direct Critical/Important breakage from their corrections, not another broad review. This section supersedes the withheld approval above.

1. **Centering boundary — ADDRESSED.** `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/browser/convert.js:61` now explicitly normalizes `true` to `floor-center` and `false` to `none`. Existing valid string values continue into the same allowlist, and invalid values still reject at the following check. Normalization/report generation consumes the resulting string, so the existing UI boolean choices now reach the intended conversion branches without changing the rest of the import protocol.
2. **Terminal import diagnostics — ADDRESSED.** `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ImportWizard.vue:15` renders a FAILED-job alert. The computed value at `:30`–`:34` includes the backend code/message, handles code-only or missing-message cases, and uses a text prop rather than HTML. Retry guidance is displayed and polling transport errors retain their separate alert. This closes the normal-successful-poll/failed-job gap.
3. **Undo across saved binding removal — ADDRESSED under the recorded history-boundary ruling.** `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/editor.vue:66` now calls the existing `acceptDetail` default, whose `:50` implementation clears both history and future. The note at `:7` explains that undo/redo applies to unsaved changes. A failed validation/request does not call that helper and therefore retains local edits and history; a successful deletion save no longer leaves an unusable binding-restoration command enabled. Backend binding authorization and resource pruning are unchanged.

**New Critical/Important fix regressions: none found by static inspection.**

The fix report records Worker syntax/dependency build exit 0 and UI production build exit 0 with 2177 modules. Those are the implementer's recorded checks; this reviewer ran no build, test, browser, conversion, service or network operation. Only this report was appended. The original manual/deployment boundaries remain in force, and the root's final handoff/status documentation is separate from this three-file code range.

**Ready to merge? Yes, for the reviewed stage-1 source. Whole-branch static review: Approved.** All three Important findings are addressed, with no new Critical/Important defect established in the corrections. This supports “implemented and build-checked, pending user manual acceptance”; it does not certify runtime acceptance or production deployment.
