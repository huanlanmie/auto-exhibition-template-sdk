# Root D readiness 1/2/3 integration report

2026-10-01。SourceRoot platform e17dacaf，SDK b049ba0；同branch codex/showroom-readiness123。10指定Rootproduct sources plus generated public download materials，no scene/schema migration/SQL/storage publication。

## Implemented source and interfaces

- index.vue adds permission-gated material dialog; new ReadinessGuide.vue loads only fixed read-only catalog URL, validates fixed download paths/hash/size/schema/manual-required, renders three separate user sequences and source provenance. No arbitrary disk-file endpoint. Four existing authored inputs are copied without parsing; rebuilt real template ZIPs only downloadable, not unzipped executable apps on admin origin.
- editor.vue consumes SceneCanvas.active for overlay/busy, includes content updates; ShowroomViewer consumes ViewerScene.active while template/hotspot/expired. C owns actual loop/metrics lifecycle. Dirty interaction edit opens localOnly and applies graph via execute; other local edits/undo remain, main whole-draft save/CAS later. Clean mode keeps existing graph serverCAS.
- prepare-readiness-models.mjs fixed samplepaths/hashes and optional private manifest path under .codex-run/readiness123, strict3candidate ids/code/version/native/zipFile/size/hash. Source realpath ZIP must be alongsidemanifest. Published catalog contains only safe id/code/version/profile/name/size/hash/note andfixedURLs, no privateEvidence/absolute diskpath or ticket. No import/conversion/native engine runs.
- Optional -LanPreviewAddress in start-local.ps1 verifies assignedRFC1918 address via certprepare helper; private memory-generated SHA256/RSA2048 certificate exported PFX/CER, no certificate-store/trustroot/firewall changes. Default stayslocalhost. TLS9443frontend→loopback5173; TLS9444runtime→loopback9319 onlyGET/HEAD fixed publicprefix, strips Cookie/Authorization/service secrets, redirects denied, no WS runtime/private conversion exposure. Host header exactaddress:port, assigned NIC check. Only frontend Vite HMR upgrade to loopback with auth/cookies stripped.
- Java runtime-origin and exactallowedhostorigins overridden onlyownedshowroom CLI, privateworkerurl/DB retainloopback; argumentfingerprints safely reconfigure onlysame exe/startTicks owner and no active importSQLcount. Preview statehash rotates TLS owned process when key changes. Source/sourceprototype/data retainoriginal profiles. Default return stops onlymatchedLAN helper processes, no unrelatedport kill.
- LANsameIPports do not isolate cookies, so utils/auth.js uses origin-tab sessionStorage onlyforassignedprivateIPv4 HTTPS9443 profile; defaultcookie behavior stays. LANlogin.vue skips rememberMe cookies and legacy remember-password reads, no credentialstored in shared cookie. Sessionstorage unavailable is not silently downgraded to insecurecookie. BrowsersecureAPI requirement rationale linked officialMDN inmanual docs; no crypto.randomUUID/SHA downgrade.

## Review and verification scope

A/B/C 的独立交叉静态复核及 Root D、最终集成复核均 Spec/Quality Approved。B-M1、D-I1、D-I2、D-I3 全部关闭，无未关闭 Critical/Important/Minor。最终产品快照以 platform-product-hashes.json 的36个文件为准；历史初始审核摘要由后续明确关闭的最终摘要替代。手测文档另经独立复核。

D-I1 修复 LAN 绑定地址与回环端口探测不一致：Port-Open/Wait-Port/Start-Owned 接收实际绑定地址，默认127.0.0.1，LAN记录和status保留bindAddress。

D-I2 来自实际Windows PowerShell5启动就绪检查。旧返回/JSON管线给数组添加value/Count嵌套包装，深度限制丢失原所有权字段，默认切换因此拒绝占用端口。产品现先显式枚举和验证每个记录的标量身份，再用List<object>及ConvertTo-Json -InputObject整数组落盘。无效旧记录拒绝操作，不在源码内猜测迁移。Root只读CIM核对十个实际进程的exe/唯一命令配置/startTicks后恢复私有记录，随后默认services准确切回localhost；不停止不相关服务，不重做snapshot。A独立静态关闭窄修，最终start-local.ps1 SHA A14E9DF0B16E0814EF564691BC1B17E54352C27C6E65985E7955F6CA25DBAEF8。

纯材料准备完成：4个已创作模型输入、3个真实模板副本重建ZIP。最终B manifest run templates-2026-10-01T15-08-20-335Z-238217d3。Tbutton114442/SHA82bab18a98fba88f98d3812ecd585049eb4aeb2abca62b34278e359d515d0e8f；Ebook127273/SHA98972cd6a4331897d952660bffdaa6ad2be9532fbb94296fcda8ccdf7b028cb1；quiz148675/SHAb2fc9f57f45e05c340e1d656cd6a41459f57cb4c04dea4d9d9d89e00aea22be2。公开目录仅固定8个catalog/model/ZIP，无提取HTML、私有manifest和凭据。模板原89文件与SDK31文件结束时hash保持；新包需用户登记授权实例、绑定预览发布，不自动更新505已绑定旧包。

D-I3 是独立文档复核发现的实际LAN草稿预览缺口：原公开code长度下限8误拒Java固定7字preview。lan-preview.mjs现显式允许literal preview或原8..128公开code，并限制43字会话key+/assets/的资源GET/HEAD。其余exacthost/header/loopback/runtime secret/back-end authorization不变，manifest/renew继续走前端网关；不扩大任意短code。node --check exit0，A独立源码复核Closed/Approved；最终SHA B71784AAB13D6867960030769005ED430052C1E0F12C6E01D8011A9A4FB7E5A2。默认LANhelpers已关闭，无自动业务请求验证此修复。

## Fresh builds and operational readiness

- SDK npm build exit0，生成当前dist并供模板副本编译使用。
- 三模板最终Vite/vue-tsc构建打包exit0（task-b-template-build-final.log），Ebook无效favicon已在副本精确移除。
- Worker npm run build exit0：语法、七固定依赖文件就绪，Windows launcher C# CompileOnly，无job/model引擎初始化。
- 平台UI npm run build:prod exit0，2202modules/15.01s。
- Java Maven package exit0，7.894s，JBR25/release-source-target17/maven.test.skip=true；现有resources-plugin验证警告保留日志，不作为业务失败。
- Root脚本语法与PowerShell parser通过；D-I2最后仅启动脚本修正，UI/Java/Worker冻结源未改变，不重复业务运行。

已启动原私有MySQL/Redis和六个应用，未运行prepare/snapshot/all。最终localhost四Java健康UP：system19201、auth19200、showroom9402、gateway19088；frontend5173 HTTP200；Worker9319 ready、activeJobs0，所有新provider/streaming仍manual-required。当前mju-showroom76856/Worker16852/frontend24604/system70700/auth64224/gateway46536。进程记录为平面10条，8个活动拥有进程及2个已停止LANhelper记录。

实际LAN9443/9444曾启动并只做HTTPS前端/login就绪GET（HTTP200，证书校验在该就绪请求中显式跳过）；之后默认services恢复localhost，showroomruntimeorigin为http://127.0.0.1:9319且仅停止自有LANhelper。证书没有安装系统信任、没有真实手机或浏览器业务验证。LAN-only auth/login隔离已做独立静态审核，实际登录仍由用户验证。

505只读前后记录完全一致：room1 ONLINE/draft6/publishedRevision2/model f9b1dc78-90c9-4565-8b92-d425818244a1，draft/resources digest b1f0ef97f988fa6bb9fc6adaa8a5fb110422934ad979bdf6accfdf01a946b682，activeimports0。11原用户文件逐项hash相同，preserved-user-hashes.json已保存并读回11条，不纳入本次产品提交。

没有自动功能测试、浏览器业务QA、模型解析/转换、引擎/简化器初始化、模板实际函数/握手或手机FPS采样。未提供真实IFC/DWG与已知尺寸；代码、编译材料和服务健康完成，真实文件/业务/终端验收仍由用户手动执行。离线网关/客户端及模板原件不变。

最终暂存diff --check发现模板准备脚本末尾多一个空白行，标准化EOF为单CRLF及无BOM UTF8；逻辑与ZIP未变，不重复业务/编译。最终prepare-readiness-templates.mjs SHA C5DE3149EB88EE9B576C407B197F2BBBC4F65615FD9945431A19ECBBCA7E952F，task-b-source-hashes和36文件快照已同步，独立B reviewer通过全文LF/TrimEnd规范化对照冻结源码及已批准favicon补丁，确认无逻辑差异；窄静复核记录于review-b。
