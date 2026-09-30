# Startup Static Review

Spec compliance: Approved for the requested static safety scope; no Critical or Important findings. Read-only source snapshot, isolated local DB/Redis, disabled Nacos registration, current secret ignore coverage, local UI proxy and owned-process stopping are present. This verdict is not a claim that services are ready or the JBR workaround has succeeded.

# Verified Boundaries

- prepare-local.mjs:30 fetches only GET Nacos config endpoints. :67 disables config refresh/discovery registration; start-local.ps1:99 repeats disabled bootstrap/config/discovery/register flags on each Java command. No remote Nacos mutations occur in this scope.
- prepare-local.mjs:56 generates local MySQL profile for 127.0.0.1:13306. snapshot-local.mjs:14 verifies both address and port before any import. Source profiles are used only by SHOW TABLES and mysqldump at :44; no source mysql import or execute-write path exists. Dump skips table drops/triggers/events/routines/locks. Local import preserves existing tables and snapshots only missing tables from each source; ready marker prevents rerunning completed setup. Successful multi-DB snapshot is coordinator evidence, not rerun here.
- start-local.ps1:54 binds the private MySQL datadir to loopback 13306; :55 uses Start-Owned and :58 account setup uses only fixed local bootstrap profile. prepare-local.mjs:57 creates Redis configuration bound to 127.0.0.1:16379 with separate generated password; :67 in PowerShell starts that independent instance.
- Generated source passwords, local passwords, worker secret and copied Nacos YAML remain under .codex-run/stage11. git check-ignore confirmed the local state, mysql profiles, app YAML and SQL snapshot are ignored. Ignore source is .git/info/exclude:7 (.codex-run/); outputs inspected did not expose secret values.
- prepare-local.mjs:65 pins service listeners to loopback and :83 converts auth/system/showroom gateway routes to explicit loopback services. start-local.ps1:106 sets UI proxy to http://127.0.0.1:19088; vite.config.js:73 consumes env/process override. Vite is started explicitly on 127.0.0.1:5173 with strictPort.
- start-local.ps1:24 Same-Process requires PID, executable path and exact UTC start ticks. :31 reuses a matching owned process, :32 refuses occupied unrelated ports, :119 stops only records that still match. Auth uses 19200, not 9200. No stop-by-port/name/tree path exists, so an unrelated cpolar on 9200 is outside cleanup.
- start-local.ps1:98 supplies -Djdk.net.unixdomain.tmpdir pointing to a private uncreated directory. The claimed JDK TCP fallback mechanism was investigated by coordinator using official OpenJDK source. This review confirms argument placement only; no JBR launch or runtime readiness was executed.

# Minor Recommendations

1. prepare-local.mjs:17 parses local-state.json without removing a UTF-8 BOM, unlike snapshot-local.mjs:10. Windows PowerShell 5.1 Set-Content -Encoding utf8 in start-local.ps1:65 can write a BOM; rerunning prepare/all then fails JSON.parse. Strip a leading BOM in prepare too, or consistently write UTF-8 without BOM from PowerShell. This is a rerun compatibility issue, not evidence of a source DB write.

2. .codex-run/ is currently excluded only through .git/info/exclude. Add the same rule to tracked .gitignore if these launch scripts are delivered for other checkouts; the repository-local exclude is not cloned and otherwise newly generated credentials could become untracked visible files. Current checkout coverage is confirmed.

3. start-local.ps1:98 relies on nio-unix-unavailable remaining unavailable. Before launch, reject an existing directory at that path (or point at a path that cannot become a socket directory) so future local use cannot silently defeat the selected fallback. Do not delete an existing unexpected path automatically. Actual JBR readiness remains a coordinator validation item.

4. For stronger defense in depth, snapshot-local.mjs:14 can reject duplicate host/port directives or supply fixed --host=127.0.0.1 --port=13306 --protocol=TCP after --defaults-file for every local mysql call. Current generated local profile has the intended fixed directives; no unsafe import target was observed.

# Scope and Evidence

Inspected only requested prepare-local.mjs, snapshot-local.mjs, start-local.ps1 and current vite.config.js diff, plus .gitignore/.git/info/exclude and git check-ignore to verify the named secret-ignore boundary. Read-only commands only. No script execution, business tests, builds, HTTP, SQL, startup, process stopping, secret-file reads, product-source edits or subagent dispatch. Only this review artifact was written.

Base directory for script references: C:/Users/Administrator/Desktop/mju-smart-show/scripts/virtual-showroom/. Vite references: C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/vite.config.js.
