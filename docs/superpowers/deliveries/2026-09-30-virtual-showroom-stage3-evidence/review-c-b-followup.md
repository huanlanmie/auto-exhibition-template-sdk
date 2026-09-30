# P3 C 与 B 修复独立静态复核

日期：2026-09-30。独立复核席位：/root/stage11_sdk_routes（不是 C/B 作者；不在这里自评 A）。依据完整 stage3 contract/plan、task-c-report.md、task-b-report.md、原 review-b.md 与当前锁定源码。

**最终 Verdict：Approved，限定于 Task C 与列明的 Task B 五项修复。无剩余 Critical / Important / Minor 阻断。** C-I1、C-I2 在本次审阅中发现并由 Root 修复后复读关闭；原 B-I1～B-I5 全部关闭。此为源码静态结论，不代表 IFC/DWG 几何、Windows quota/退出时序、浏览器交互或格式手测验收。

只读源码/本机固定依赖声明，查阅 Microsoft 原生 API 官方文档，读取文件摘要并写本报告。未改 C/B 产品源码，未调用引擎、解析/转换模型、运行测试/构建/启动/HTTP/API/SQL，未操作 Git。Root 报告的构建/就绪与505保持结果不作为本席位的模型功能证据。

## C 已关闭 Important

**C-I1：属性组不是无条件允许列表。** 原 VirtualModelPropertyService.java:68 仅当 group.name 已以 Pset_/Qto_ 开头才检查后缀，其余 CustomGroup 等可通过注册，违反有限 Pset_*Common/Qto_*BaseQuantities 契约。当前 :68 改为无条件 `name.matches("Pset_[A-Za-z0-9_]+Common|Qto_[A-Za-z0-9_]+BaseQuantities")`，任意其它组拒绝；basic的空 groups 仍通过。已复读关闭。

**C-I2：合法空源名称/描述导致整个 IFC 注册失败。** 原 :79 对 optional displayName/description 复用非blank的 text()；合法 IFC 源 `Name=''` 或 `Description=''`/空白经 provider 私有文本保存后会在事务 validate阶段拒绝。当前 :79 对这两个 optional字段仅检查 textual＋length≤2048，nullable/缺省照旧允许；identity/group/propertyName 的非blank检查仍独立保留。UI 本来已有 `||'未提供'` 与普通文本显示，故没有空字段展示漏洞。已复读关闭；该一行的新编译由 Root 执行，本复核没有运行编译。

## C 源码证据

- **权限与固定资源：** OperationsController.java:22–23 的 query permission 调 properties.get；PropertyService.java:23 先 requireOwned，再 MetadataService.read(roomId,version)读取本room READY模型。:38–51 只从模型已登记 descriptors 找固定 `models/<version>/ifc-properties.json`/model-private，重复路径拒绝，16MiB＋size/digest＋schema/version/package/entry hash均核。客户端没有 ObjectKey 参数。:26–30 按已验证 catalog anchor.sourceIdentity.id关联唯一 element；fragment/无关联明确 available:false。
- **先验证再 CAS：** ImportService.java:67–85 仅允许固定四公开产物和 IFC-only第五私有产物，kind/path/size/hash校验；:87–94 事务锁room、检查RUNNING，在model插入后 :91 验证 public catalog与private sidecar，再 :93 draft CAS与 :94 job CAS。失败可回滚注册，不直接替换建筑或发布。
- **私有边界：** ImportService.java:172–184 public manifest只含固定 public descriptors，无private/objectKey/dataBase64。ResourceSessionService.java:56 在所有selected资产判断之前 hard-excludes private kind或固定私有路径，即使scene猜assetKey也不可授权。PublicController.java:17 在路径层拒ifc-properties.json，:19 再拒resolved resource的私有kind/path，覆盖旧session记录。没有增加visitor属性endpoint。
- **有界属性与 owner 响应：** PropertyService.java:48/53/57/66/71 exact field allowlists；每构件128/全局200000、typedprimitive/list、2048文本/16层/16MiB与blocked字段检查。当前白名单和空文本修复见上。:85–96 仅复制所选element；:98–111 地理数组最多50且显式截断，sourceCoordinateTransform只返回该identity对应placement，不能借node参数返回整份private元素。
- **公开 metadata 相容：** MetadataService.java:37/64 追加ifcSummary/publicifc/dwg/conversionChain，:17 PRIVATE keys递归清理sourceCoordinateTransform/localOriginM/票据等；:56–57 IFC stable身份格式/basis严格。实际 visitor raw GLB/meta/publicsummary是否只含安全字段由 Root/A-D独立审阅负责，本报告不自评 A 的生成正确性。C不会把private sidecar作为model-meta注册。
- **trusted ownerScope：** WorkerClient.java:38–49 analyze从owned room构造scope；:82–84 convert从persistedjob owner/room构造，:123–125 只接受正Long串。ImportService.java:118–119 UI options精确键集合不含ownerScope，无法覆盖trusted HMAC body。上传真实package SHA与校准 sourceHash在:37–40重新比对，IFC实际entry/schema/native事实留给固定provider复核。
- **options 与旧格式：** ImportService.java:116–169 只追加ifc/dwg，实际health formats约束。IFC unitauto/y-up/centeringfalse、双hash/schemaConfirmed/ADD2/includeUncontained/basic|psets/filter/origin shape；DWG opaque64hex ticket、原entry/derived/fingerprint与DXFentry一致。analysis保留未确认的预检入口，不把client确认等同native事实。原八格式路由与P2冻结review/apply公式没有本次改写。
- **UI 状态：** ImportWizard.vue:60–71 文件/entry/format变化撤销分析，异步 generation避免旧分析覆盖新文件；:50 的毫秒expiresAt时钟持续刷新，DWG票据到期禁submit；:79仅传契约校准/ticket字段。IfcImportOptions.vue:35–47 双hash、selection缺省/空集合语义、finite米/Yup原点、source-mode georef限制、ADD2独立确认，筛选/原点变更撤销schema确认。格式watch固定ifc auto/y-up/centeringfalse，与Root已修的provider大小写兼容。DxfCalibration仍保actualderived entryHash与unit/scale确认撤销。
- **owner Inspector：** api虚拟room/node properties路径各segment编码，ObjectProperties只在已登录editor的IFC建筑/对象挂载；Inspector.vue:24–35 使用目录/绑定node、代次与unmount防旧回复，所有源字段用Vue文本/JSON显示，无v-html/URI执行/visitor改动。ReimportReview只加GUID/缺元素人工处理说明，未改业务ID/template/nav保存逻辑。

## B-I1～B-I5 关闭证据

1. **B-I1 quota硬上限**：boundedNode.js:26与launch-job.ps1:65明确reject>3072；C#JobMemoryLimit由该受限值设置。共同config.js:34上限3072、:35拒<512。4096不再可用，更低合规配置可保留。
2. **B-I2 proxy class**：libredwgBridge.mjs:35现在只允许 `s_zombie` 为 false/0；缺失/其它类型、true/1或非standardClass拒绝。已核固定package的 common.d.ts `Dwg_Class.s_zombie:boolean` 和converter同字段，旧不存在的is_zombie已消除。
3. **B-I3 block基点Z**：libredwgBridge.mjs:59读取mandatory base_pt并planar校验；字段读失败、非finite或超既有二维epsilon的Z拒绝，不能靠DXF平面标高检查漏过去。xref flag检查仍保留。
4. **B-I4 cache orphan预算**：dwgCache.js:33–37 stale orphan unlink/rmdir若非ENOENT错误，sweep/admission failclosed；仅真实删除成功/不存在才continue。尚未到TTL的孤儿仍:39计实际file size（缺file则保守MAX_DXF），remove吞异常不再能使存留bytes逃admission统计。freeze/read均通过serialized expire/sweep；失效票据不重做native转换。
5. **B-I5完整树等待**：launch-job.ps1:54–59独立observer先OpenJobObject并写ready；launcher:73–74等待ready。:76–87使用creation-time `PROC_THREAD_ATTRIBUTE_JOB_LIST`（0x2000D）原子归Job＋CREATE_SUSPENDED，无未分配suspended子进程窗口，IsProcessInJob成功才Resume。:50–51/102–103/108–119正常与exception cleanup调用TerminateJobObject并等待ActiveProcesses=0/主进程退出。observer保留另一个Job handle，在launcher被fallback杀死时仍可Drain并写quiescent proof。boundedNode.js:81–90只有observer exit0和确切proof才接受clean termination；缺proof设置isolationFailed，后续native admission禁用。Root analyzeRoute/convertRoute对NATIVE_CLEANUP_UNCONFIRMED保留workspace，不被abort通用码覆盖，未确认时不清工作区。若observer在进程创建前失败，launcher无法得到ready故不能创建Node。证明并非仅PowerShell close事件。

Microsoft 官方说明 JOB_LIST 在创建时指定jobs，且 Job kill-on-close依赖最后一个handle关闭；observer保留handle的设计因此是必要的。源码中的ActiveProcesses查询/Drain与proof是额外退出确认，不能把TerminateJobObject调用返回视为几何或实际时序验收。[创建属性 API](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-updateprocthreadattribute)，[Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)，[TerminateJobObject](https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-terminatejobobject)

原 B 报告已审的冻结票据链也复读保持：provider原/派生/package SHA+fingerprint+owner/room+TTL与realfile/digest；转换复制冻结DXF；browser仅受信derivedURL，实际DXF重新hash，stable全部降false，完整性unknown/partial始终记录。新增exact INVALID_IFC允许穿过native固定code边界，不再被误改成NATIVE_JOB_FAILED。没有放开任意可执行路径或无quota fallback。

## 最终快照

平台根 `C:/Users/Administrator/Desktop/mju-smart-show`；Worker下述路径均相对 virtual-showroom-worker。C全部15文件按task-c-report范围逐项阅读；关键最终修复文件摘要：

| 文件 | SHA256 |
| --- | --- |
| VirtualModelPropertyService.java（C-I1/C-I2最终） | CC92ACB640BE89B13C35CBD34AF4FFF1E8824128A19563CFE08817825119AAD1 |
| VirtualModelImportService.java | 8A4AB72A72CB86CD68BA15D492DAEBA1E17A66A2D85E9042A2F3976AF33416BA |
| VirtualModelWorkerClient.java | 733B3377AE14CDF69419F51FF9980AFC3110A2E319770CF316BDFD09BCCA5419 |
| VirtualModelMetadataService.java | 933534E146B88AE8BD32FBF7F6D5185F9A482EBB2E6C0CFB169D790B75810A2D |
| VirtualResourceSessionService.java | 42B4A402C2CEE20BF36B2E29E00E3DDF8EC0BB620C27A10A472AA909F0231153 |
| VirtualShowroomPublicController.java | 4AC63C016AA0319E97A59169A63E071F8DB79401D2489F6288996BC5C7000E1C |
| src/native/boundedNode.js | B93ADCA65A04E8143CFAC08CA300FE6CA5DEC6F8D89AAE3B71DFA00F3EE005A9 |
| src/native/launch-job.ps1 | BC0B91E7CFE7CFB5F0DAEE09E13665BB688F0CC20E6EE281C1ECB7F11C25295E |
| src/native/libredwgBridge.mjs | 77DED7E1B88F3A93FB8500DCA1F4F6034FEE6FC0BBCCDEABDA45C79024A50C57 |
| src/providers/dwgCache.js | 9D90BA213A0248DFEB96CCBF2F24EA366B586162AE7D1FB252E42DA6FF164B3D |
| src/providers/dwgProvider.js | F0B710DCE5944E5169CBCD47F275596E0829A08FC04F8F8E715D087CEC0A96BA |
| src/converters/dwg2d.js | A411C870E96480705B11D1DC14C819340CC462CA0D2D804EBAA9186DE02A7A78 |

Approval does not extend to unreviewed future changes or A's own source. Actual manual checks remain schema/unit/placement/GUID/filter/properties/georef, DWG writer fidelity/2D rejection/frozen calibration, quota/abort timing, user-visible editor/visitor behavior and old-format compatibility. No automated functional acceptance was performed.
