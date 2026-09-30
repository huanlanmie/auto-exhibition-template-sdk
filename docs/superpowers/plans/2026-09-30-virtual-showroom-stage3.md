# 虚拟展厅 P3 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 完成P3-01 IFC、P3-02二维DWG和P3-03实际provider登记与手测交付。

**Architecture:** 独立Node/Windows Job子进程加载固定BIM/DWG WASM，产统一GLB/元数据；保持原Java归属/CAS/不可变发布、Vue编辑器与访客隔离软件。IFC私有属性与公共模型分离，DWG冻派生DXF复用现校准。

**Tech Stack:** 原Java release17/Vue JS/Node22/Three0.186.1 + web-ifc0.0.78 / @mlightcad/libredwg-web0.7.14；固定Windows Job quota，当前63.8GiB主机。

**Spec:** 已认可总体spec/roadmap P3，具体接口 `docs/superpowers/contracts/virtual-showroom-stage3.md`。用户已直接要求继续，沿用并行执行方式，不设重复许可/设计批准循环。

## Global Constraints

- 用户只手动功能验收，不写/跑测试、解析/转换样本或浏览器业务QA；构建、源码静态独立复核和就绪保留。
- 保留505以及11个用户修改bytehash；branch codex/virtual-showroom-stage3；不reset/迁workspace，不写生产SQL/Nacos/线下或自动发布。
- Optional缺依赖/quota真实禁用，不伤P2；不能用token tape或V8max堆假称WASM quota。
- IFC坐标/单位一次，GUID仅可信canonical锚点；DWG派生IDs仅启发式；原点/CRS是工程局部而非地图投影。
- 属性/地理信息private定点sidecar、public hard排除；源码输入不能选择executables/宿主refs/共享缓存scope。

## Review Focus

1. FILE_SCHEMA/RC别名、单位缺失、深度cycle及linear/grid native fallback不能默认成功；LocalPlacement/FlatGeometry不得二次u/axis/placement。
2. Psets/OwnerHistory/精确georef不能进入公开raw meta/report/manifest/GLBextras；privatekind即使被引用也拒绝public读。
3. Windows suspended Job assignment与abort/quotafailure必须kill+wait、不能不受控fallback；child paths/outputs/size和无hostFS来源不绕过。
4. 原DWG/derivedDXF/包SHA/configfingerprint/ownerRoom/过期票据必须一致；conversion不得重跑后沿用旧校准或伪称三维DWG。
5. GUID重复/fragment/generatedIDs/源过滤与旧8格式兼容、原绑定/导航/业务ID不被替换；真实caps和manual-required独立登记。

## Task A IFC provider

**Files:** 新Worker `src/native/ifcBridge.mjs`,`src/native/ifcFileReader.js`,`src/metadata/ifcMetadata.js`,`src/metadata/ifcSource.js`,`src/converters/ifc.js`；必要同scope小helper需告知root。不改shared入口/package/runner。
**Interfaces:** contract child分析/转换payload/result与固定三产物；common converter读取Root派生scene/providerMeta返回canonical scene+public summary；raw/typedmeta辅助原子预算。NodeGLTF FileReader shim仅Blob。

- [x] raw结构/预算/严格schema、typed单位/placement、空间关系/过滤与basic/Pset私有元数据。
- [x] 有界StreamMeshes、Q/frame/DF/GLB归一化、unique project/productGUID和可信/失真诊断。
- [x] 报告精确API、errors/固定文件/输入手测；只node --check，不运行parser/转换。

## Task B DWG与隔离

**Files:** 新Worker `src/native/boundedNode.js`,`src/native/launch-job.ps1`,`src/native/libredwgBridge.mjs`,`src/providers/dwgProvider.js`,`src/providers/dwgCache.js`,`src/converters/dwg2d.js`。不改shared入口/package/protocol/config/browser runner。
**Interfaces:** contract共享NativeAPI、mode payload/fixedresult、dwgDeployment/analyze/prepare与opaque scope/hash冻结票据。将IFC bridge纳入固定module白名单但不编辑A源。

- [x] Job硬quota/suspended启动/killwait/输出限制与外部OSdisabled状态，静态语法/编译审阅，不启动转换。
- [x] 固定包MEMFS readFlags/objects/classes/2D审计→ASCII DXF、sourceversions及永远partial完整性unknown。
- [x] TTL15m/20条320MiB派生缓存、ownerScope及三hash/fingerprint/expiry、browser不叠scale与派生IDs降级。
- [x] 写报告、error清单与部署/许可证对应源指引，不安装/执行/commit。

## Task C 后台UI与隐私

**Files:** 改VirtualModelImportService/WorkerClient/MetadataService/OperationsController/ResourceSessionService/必要公开资源controller硬拒绝；新VirtualModelPropertyService；UI API/ImportWizard/IfcImportOptions/ModelPropertyInspector/ObjectProperties/editor/DxfCalibration/ReimportReview（仅说明）。必要其他virtual文件扩scope先报Root。
**Interfaces:** contractpublic/privatekind固定artifact+node properties GET+IFC/DWG选项/health/scope。P2review/apply不改业务规则。

- [x] formats/schema/options/ownerScope受信传输、privateartifact定点注册/验证/事务、public hardexclude、owner属性GET。
- [x] actualprovider状态/disabledreason/手测标记、IFC楼层/类型/原点/属性，DWG derived校准双hash+ticket透传和失效清除。
- [x] 虚拟目录属性Inspector/绑定节点读取，无访客属性endpoint/新BIM picker/sceneRuntime修改。
- [x] Maven compile skip-tests和UI build:prod，报告所有文件/手测边界，不启动/写数据。

## Task D Root共同pipeline、部署与交付

**Files:** package/lock/build、formats/protocol/config/jobWorkspace/analyzeRoute/convertRoute/browser runner+convert/errors/pipeline metadata+public summary；新增`src/providers/ifcProvider.js` shared dispatch，样本/文档/启动说明。
**Interfaces:** NativeIFC父验证/派生精确routes；DWG父adapter；原HMAC/jobs/slots及private fifthartifact。公共4manifest不列private。

- [x] 完成plan/contract/baseline后pin安装不跑脚本，sharedcaps/schema/manual-required和可用memory平台登记。
- [x] IFC/DWG native preflight/convert准备、精确派生白名单、normalization/anchors/public BIM目录与安全artifact输出。
- [x] 生成自建IFC文本输入/手测清单，保许可证+对应源，不跑转换；三部分build和互不自评的task/final静态review，修Important。
- [x] 精确提交；仅重启自身改动服务、health/实际formats就绪/505摘要保留检查；提供登录入口和手测文件。

## 执行裁定

继续原保存项目路径，P2已提交基线平台752545e8、SDKd48f8f4。原用户授权优先于skill额外approval/TDD gates，仍保留构建和静态review。原agent因历史线程限额复用为A/B/C实施，交叉review不得批准自身scope；必要新review席位按可用并发/线程限额裁定。Root独自shared修改、stage与commit；临时报告权威在`.superpowers/sdd/2026-09-30-virtual-showroom-stage3`，最终归档。不删除先前阶段scratch或用户文件。

## 最终核对

实施代码与构建完成；独立静态复核问题逐项关闭。实际IFC/DWG解析、转换、几何、属性和Job限额效果尚待用户手动验收。最终证据与服务/数据保留见阶段交付记录。
