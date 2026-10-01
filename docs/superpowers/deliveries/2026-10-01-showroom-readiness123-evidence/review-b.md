# Readiness123 Task B independent static review

2026-10-01. Reviewer: Task A author, independent of Task B. Authority: `docs/superpowers/contracts/showroom-readiness123.md`, `task-b-brief.md`, frozen `review-b-package.md`, and `task-b-report.md`. Reviewed current working-tree source and the reported private delivery run. No product source changes.

## Verdict

- **Specification: Approved.** The server uniqueness constraint, old-conflict repair, dirty-draft local application, master-only return-home score reset, isolated native template preparation, and original-source preservation meet Task B's stated requirements.
- **Code quality: Approved.** B-M1 is closed by the narrow source/ZIP follow-up below. No unresolved Critical, Important or Minor finding.
- This is static approval, not handshake/function/visual acceptance. Author build logs and successful source compilation do not prove template business execution. User manual validation remains required.

## Minor B-M1 — Ebook candidate retains a missing absolute favicon

**Location:** `C:/Users/Administrator/Desktop/mju-smart-show/.codex-run/readiness123/templates-2026-10-01T14-55-19-294Z-c2ae72c7/templates/ebook/dist/index.html:5`, packaged as `ebook-native.zip/index.html:5`; preparation code `C:/Users/Administrator/Desktop/mju-smart-show/scripts/virtual-showroom/prepare-readiness-templates.mjs:71`.

The generated HTML keeps `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`, but the ZIP contains no `vite.svg`. A browser loading the native scoped runtime requests the runtime-origin root favicon instead of a registered template asset. `VirtualTemplateRuntimeResourceService.java:36` only rebases root `/assets/` references, so it does not repair this path. This causes a decorative missing-resource request; the JS/CSS references remain correctly relative and business content is unaffected.

**Smallest fix:** remove exactly this favicon link in the isolated Ebook copy (with an exact-context check), or provide an actual relative icon in that copy and package it. Do not edit the Desktop original. Rebuilding the candidate changes its ZIP SHA and requires refreshing the delivery manifest. Root and B author were notified. This is not an Important blocker.

## Source and boundary evidence

### Quiz graph uniqueness and repair

`VirtualInteractionService.java:94–101` derives membership from the frozen graph, rejecting a second membership with fixed `QUIZ_SCREEN_MULTIPLE_ROOMS`. It does not choose a room or consult physical linkage mappings. Missing graph legacy scenes remain an empty membership set. `validate`/`validateDraft` share the check at line130, after existing graph-size validation; normal owner/template/source binding checks and draft freshness behavior remain. Typed member/room/target checks still run and publication has the original strict freshness behavior.

`screenFunctions` line84 also checks uniqueness before creating frozen session function descriptors. Its caller `VirtualResourceSessionService.java:26` covers new preview/public leases. Publication validates through `VirtualShowroomValidationService.java:22,65`; ordinary draft writing through `VirtualShowroomService.java:153` passes prior scene to `validateDraft`. `catalog` catches only the uniqueness ServiceException at lines189–190 and adds a diagnostic, allowing administrators to open an old conflict for repair instead of locking them out.

`InteractionEditor.vue:32–33` prevents selecting a screen already assigned elsewhere while leaving an already-selected conflicting screen removable. Room labels explain ownership, existing conflicts are displayed, and save independently rejects duplicate memberships at lines83–89. Removing members clears a removed master and prunes only quiz targets for that room from nonmember source rules; unrelated targets remain, empty-target rules are removed. Removing a room similarly removes its quiz targets. The UI does not silently resolve a conflict.

### Dirty draft integration and CAS

`InteractionEditor.vue:49–50` defines the narrow `localOnly`/`local-saved` interface. `save` clones the editable graph, validates required rule fields/targets/mappings, strips helper mappingText, normalizes an empty master, and checks membership uniqueness before either branch. Line123 emits only the normalized graph when localOnly is true, without a network save or server-version update. Line124 keeps the original `saveInteractions(showroomId, expectedDraftVersion, value)` branch when false.

Named Root integration was independently read, not modified: `editor.vue:15` supplies `:local-only="dirty"` and `@local-saved="applyLocalInteractions"`; lines154–155 open without first saving an invalid old graph, apply graph through existing `execute`, and close the dialog. `execute` line72 clones the current whole document, preserving unrelated unsaved edits, adding undo history and invalidating prior validation. Eventual editor `save` at line85 retains whole-draft CAS with current serverVersion. API `saveInteractions` line39 likewise carries expectedDraftVersion. No new backend bypass was added. Newly bound unsaved screens may still need their draft saved before the existing server catalog contains their functions; this review does not claim a new local catalog feature.

### Master-only score reset

`quizAdapter.js:111–121` checks declared room membership and caller identity from the existing registry/port record, and denies forged supplied client/room/round identities. The master check at line170 precedes resetQuestion handling. The new line182 only zeroes the authoritative `state.members` ledger after master-authorized resetQuestion with an explicitly empty roundParticipants array, then notifies from host state. Ordinary resetQuestion and nextQuestion preserve scores. No input member list or score is adopted. The existing new-round reset remains separate and unchanged. Timers/room state remain per adapter/visitor.

### Isolated preparation and native source chain

The script fixes source candidates and output run under ignored `.codex-run/readiness123`. Source traversal rejects symlinks/special files; copies only src/public/index.html/env.d.ts into new copies; excludes original node_modules, dist/build/tests/git/archives and original build configuration. No installation, source-directory junction creation, network API, upload, database or publication operation is present. Generated package/type/config/cache/dist/log/ZIP files stay under the private copy/run. SDK Vite plugin's declaration writer takes resolved copy `config.root` (`src/vite/index.ts:360–365`), so generated declarations do not go back to original templates.

The build uses existing SDK-installed dependencies, `configFile:false`, `envFile:false`, and exact package aliases for SDK main/config/vite. Vue resolves to the same installed runtime. Rollup provenance records the actual current SDK dist module for each bundle and rejects a missing current dist/sdk/index.js. The SDK wrappers resolve to their current dist entries. Private evidence includes all dist files, wrappers and native source files, rehashed before successful manifest output.

All three original main.ts files install the SDK plugin. `src/sdk/index.ts:103–114` obtains the default runtime; `runtimeRegistry.ts:7–17` reads and validates host injection before creating browser mode; `createTemplateRuntime.ts:7–15` selects BrowserHostTransport. Its existing origin/source/identity check and ACK/MessagePort transport remain intact; the browser branch does not fall back to a physical WebSocket. `VirtualTemplateBootstrapService.java:14–23` creates scoped validated native injection and only adds the legacy shim for legacy-bridge. `VirtualTemplateRuntimeResourceService.java:40–46` inserts injection after only an actual leading doctype and before any executable original script. Browser config/valueMap URLs remain template-relative. Thus the rebuilt candidates have a concrete static native bootstrap chain; actual registration and routing await user validation.

Ebook copy App.vue:231–232 has precisely two remote callbacks calling completeWelcome before original goPrev/goNext. Original callbacks are unchanged. The composable's completeWelcome synchronously sets its reading flag. Copy's local welcome callbacks and BookContainer/page navigation remain unchanged. Rapid-navigation animation/visible page behavior is still a manual acceptance point.

### ZIP and provenance checks actually performed

Read-only .NET ZIP entry metadata and index/config text inspection, without extraction or execution, found 5/5/6 file entries; all names are relative, unique and safe, and all method-store expanded sizes match the manifest. Required index.html/config.json/valueMap.json are present. Native code/version declarations match the manifest. The script rejects private filenames, non-delivery extensions, private-key text markers and duplicate case-insensitive paths, caps copy/expanded/count at 64MiB/4096 and caps final ZIP at64MiB. No source files, environment files, maps, archive nesting or private manifest are in the actual three ZIPs.

Independent SHA/size checks:

| ZIP | Bytes | SHA-256 | Entries / expanded bytes |
|---|---:|---|---:|
| tbutton-native.zip | 114442 | 82bab18a98fba88f98d3812ecd585049eb4aeb2abca62b34278e359d515d0e8f | 5 / 113802 |
| ebook-native.zip | 127330 | 920b1d0afd74f1fa44d0e174f9ef848221fdb4b7e899f5f068dd08ddc89d7010 | 5 / 126690 |
| quiz-buzzer-native.zip | 148675 | b2fc9f57f45e05c340e1d656cd6a41459f57cb4c04dea4d9d9d89e00aea22be2 | 6 / 147903 |

Manifest run: `C:/Users/Administrator/Desktop/mju-smart-show/.codex-run/readiness123/templates-2026-10-01T14-55-19-294Z-c2ae72c7/manifest.json`. It correctly says manual-required/native. Its privateEvidence contains local absolute paths and must remain private; Root's public delivery must whitelist only safe material fields and serve ZIP download, never publish this private manifest or extracted executable HTML on the management origin. Root delivery source is outside this approval.

Before/after original-hash record files independently have equal SHA. All 89 recorded current original template files match (21 Tbutton,45 Ebook,23 quiz); no credential-named file was present in these records, and no credentials were read. All 31 recorded SDK evidence files currently match. These checks cover recorded original files, not entire dependency directories or unrelated filesystem changes. A separate exact text comparison confirms Ebook copy App.vue differs from the original only by the two intended callback replacements. This reviewer made no change to originals,505 or the11 protected files.

## Locked source hashes

All match the frozen review package and author report:

| Platform-relative source | SHA-256 |
|---|---|
| ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualInteractionService.java | 8E9705AAF43DC648A1806299DA5D55FE5E5101718034D4B8DD58C9B602769B30 |
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/InteractionEditor.vue | D86D218AE5D7E712FDFFDA147B53453EC45B81D0EB3D8327645E453C77E7E0EC |
| ruoyi-ui-vue3/src/virtual-showroom/template-host/quizAdapter.js | 32EF382C906D2DF0B5C3FD58554A0E7631FA1F28113C765AA23EE2C9574CAA28 |
| scripts/virtual-showroom/prepare-readiness-templates.mjs | A890E16622B1FC520FE0B3E91B2BC888E5AF7E4C16C159431E95CB94A4046205 |

No tests, template execution, source-model parsing/conversion, engine initialization, browser QA, builds, APIs, installs, startup or commits performed in this review. No A self-review. Static approval is scoped to these four files, reported private artifacts, and the named source/bootstrap/CAS interface reads above.

## B-M1 follow-up — closed

Independently reread the authorized script delta: patchEbook now checks that the exact original favicon link occurs once, then removes it only from copy index.html. The source original is never a write target. The two App.vue remote callback replacements and all build/ZIP/native provenance boundaries remain. Updated private patch label describes both copy changes.

Final script SHA independently matches `A5907617A2C0F0C9D6B603215E9C58D2494CF469D242F2444E7494D6E5CA2338`. New private run is `C:/Users/Administrator/Desktop/mju-smart-show/.codex-run/readiness123/templates-2026-10-01T15-08-20-335Z-238217d3/manifest.json`. Read-only ZIP index inspection confirms no vite.svg reference, and relative JS/CSS paths remain. Ebook size127273 and SHA `98972cd6a4331897d952660bffdaa6ad2be9532fbb94296fcda8ccdf7b028cb1` match the new manifest. Other two ZIP sizes/digests match their prior approved values; counts remain5/5/6. New run original-before/after record files have equal independently computed SHA. No executable or functional check performed. B-M1 closed; specification and quality now Approved.

## Final EOF cleanup — Approved

Root's staging whitespace check found an extra final blank line in the preparation script. Its exact cleanup reads the source text and writes TrimEnd()+one CRLF with UTF8Encoding(false), so this is EOF/encoding normalization, not a claim of deleting exactly one raw LF byte. Independent read confirms the final catch block and closing brace are intact; working-tree versus current index diff is empty because cleanup has already been staged, and scoped cached diff whitespace check is clean. Final independent script SHA is `C5DE3149EB88EE9B576C407B197F2BBBC4F65615FD9945431A19ECBBCA7E952F`, superseding A590...2338 above.

For complete source evidence, the current entire script after line-ending normalization and EOF TrimEnd was compared with the frozen review-b-package source plus exactly the already-approved four-line favicon-copy patch and its private patch-label replacement. They are equal; no logic or other source-line change is present. This reviewer independently proves whole-source semantic-text identity, current hash and clean staged whitespace; no reconstruction of a supposed single-byte raw delta is asserted. All other three B source hashes were independently rechecked and remain the values in the locked table. ZIP rebuild/business execution is unnecessary and was not performed; delivered ZIP bytes and original template files are not source-write targets of this cleanup. Root synchronizes task-b-source-hashes.json with the final digest. Specification and quality remain Approved.
