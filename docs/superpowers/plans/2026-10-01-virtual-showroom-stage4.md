# 虚拟展厅 P4 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 交付可选大场景分区/LOD/资源回收与可手测指标，以及独立受限三维网格DWG入口，保留未指定原生格式扩展边界。

**Architecture:** 原高模型生成一次全局目录后输出完整coarse＋高chunk＋闭包manifest；客户端按世界距离/预算加载、tokenlease回收和epoch防晚到。三维DWG只由私有quota Node原始网格provider处理，现有二维/IFC/业务/发布不改。

**Tech Stack:** 现Java17/VueJS/Node22/Three0.186.1（含MeshoptSimplifier）、LibreDWG0.7.14；不新增或升级七个已有npm依赖。

**Spec:** `docs/superpowers/contracts/virtual-showroom-stage4.md`；已批准v0.3/roadmap P4。用户继续授权，沿用并行执行，不重复批准流程。

## Global Constraints

- 505当前ONLINE/draft6/public2/model/digest及11原用户bytehash保留，原项目路径与codex/virtual-showroom-stage4分支，不reset/覆盖/重snapshot/生产SQL/Nacos/线下/现场控制/自动发布。
- 用户只手动功能验收，无自动tests、输入解析转换样本验收或browserQA；只构建、pure生成输入、静态独立审与就绪/保留读取。
- 默认aggregate100MiB/GLB100MiB/nativeIFC100MiB不提高；streaming显式optin；global高目录一次，canonical单位完整，normalized米/Yup/建筑transform一次，公私产物隔离。
- 所有新asset固定model/version路径、实际digest/size/kind/引用闭包；同模板访客软件联动/owner权限/CAS/immutable发布保持。
- 新DWG3D只真实已实现原网格实体/partial，不能假盒子/二维挤出/ACIS万能能力；quota缺失真disabled，无商业下载/激活；未指定动画/原生格式不加空成功provider。

## Review Focus

1. 高频切模型、取消/解析晚到、同key新请求：旧lease不得关闭新资源；GPU与Blob都回收。
2. unit/axis/建筑非均匀scale、跨chunk父锚点/不可信IFCGUID：世界距离与全局锚点正确，LOD不重新编目录，binding/ref/CAS不丢。
3. manifest伪路径/多缺chunks/哈希闭环/私有property：登记闭包与public硬排除，metadataSHA关联无循环。
4. DWG实际拓扑/块基点/OCS/负scale/未知INSUNITS/ACIS与binding寿命：不可默认identity或成功替代，不把rawpointer作稳定身份。
5. 实际quality/partial/预算/metrics：有界精度简化与容量失败，不以build/health/假FPS声称手测/perf达标。

## Task A 受控分区和LOD导出

**Files:** 新Worker `src/pipeline/streamingOptions.js`,`streamingLod.js`,`streaming.js`；必要同scopehelper先报Root。不改共同browser/metadata/API/Java/package。

**Interfaces:** 契约 captureStreamingIdentity / async prepareStreaming，返回scene/chunkOutputs（exact name/glbBase64）/streamingManifest模板。Root capture在collect前，prepare在collect/quality后且coarse输出SHA/metaSHA由Root最终填。

- [x] 固定options/caps、global catalog完整/原子组/祖先chunkIds，single坐标副本与coarse marker。
- [x] pinnedMeshopt normal/UV/LockBorder有界LOD与真实统计，不改high对象/源属性/身份，不合并构件或丢材质。
- [x] ≤64×32MiB、合计预算检查、closed manifest/sha、固定安全errorcode与手测边界报告；只syntax，不运行simplifier/模型输入或export验证。

## Task B 独立三维网格DWG

**Files:** 新Worker `src/native/dwg3dBridge.mjs`,`src/native/dwg3dTopology.js`（如必要）、`src/providers/dwg3dProvider.js`,`src/converters/dwg3d.js`。Root负责shared白名单/派发和formats/workspace。不得改P3 dwg2d/native supervisor。

**Interfaces:** analyzeDwg3d/prepareDwg3dConversion、fixednativeP3 payload/result与publicderived scene/provenance；options/sourceunits/localdatum/nodeframes完全按contract，不复用DWG2d校准ticket。

- [x] 原模型空间/已实例化blocks/3DFACE/Polyface/未平滑mesh真实拓扑、visited/count/内存copy预算、单位/局部原点/负变换正确。
- [x] unknown/ACIS/代理/xref等明确拒绝，稳定身份降级、materialapprox与source completeness未知报告；可支持MESH level0仅实际实现并独审后声明。
- [x] 固定父/子输出验证/errorcodes/provider实体能力登记建议；只Node syntax和static依赖API核，不init/parse/convert/功能测试。

## Task C 前端分区资源与指标

**Files:** 新scene-core streamingManifest.js/streamingModel.js/sceneMetrics.js，新共用ScenePerformancePanel.vue；改sceneRuntime/modelLoader/dispose、公有publicHttp、私有editorAssetResolver（以实际文件为准）、SceneCanvas、ViewerScene/ShowroomViewer、editor.vue仅canvas/metrics/asset句柄接点。Root拥有ImportWizard、Java、Worker共同源，不同时写。可优化outline缓存，其他audit瓶颈按明确必要scope再裁定。

**Interfaces:** coarse generatedmarker/streammanifest；function.acquireChunk同步lease，modelLoader cancel/late dispose，runtime.getPerformanceStats/onPerformanceStats/setPerformanceMode与面板plain数据。先报告实际签名冻结，再写代码。

- [x] 字段/路径/版本/coarseID闭包验证、近远hysteresis/worldbounds/queue2/bytesbudget/mode/coarsefallback，global目录不变。
- [x] token/refcountlease perchunk fetch/cancel/revoke、epoch stale decode/GPU/texture/skeleton释放、applyDoc换版和disposal，无源包任意URL。
- [x] 真实窗口FPS/rendererinfo/bytes/load状态HUD和无凭据手动record导出、editor+viewer入口，适当pixelRatio/outline缓存；UI build:prod和report，不browserQA或data。

## Task D Root 整合、后端与手测交付

**Files:** Workerformats/config/protocol/workspace/route/runner/browser/errors/build与能力、JavaImport/Metadata/必要Validator/ModelStreamingService、UIImportWizard/Dwg3dImportOptions（新增）/API必要展示、pure输入generator/手测manual/sourceNotice/SDK docs/启动与提交。

**Interfaces:** contract所有commonasset descriptor/闭包/SHA与options；Root末次exportcoarse+addchunks/stream+publicmanifest及private，Java先validate后CAS，P3资源/public/session权限保持。

- [x] plan/contract/baseline/Rulings冻结、支持dwg3d显式mode/candidates与native whitelist、A前后元数据/Rootexport接口正确、固定message map。
- [x] Java动态固定artifact注册/GLB/size/SHA、streamclosed manifest/catalog/meta/coarse/chunk验证与public元数据，无新DB字段/生产迁移。
- [x] ImportWizardstreamoptin/native3d预检单位/原点/双hash确认+能力禁用边界，no placeholder成功。
- [x] pure静态GLB手测输入与格式/性能手册，licensed来源记录；build三部分与独立交叉/最终审、重要问题修复。
- [x] 精确commit，当前无active imports后只重启owned改动服务，health/caps/505及原用户修改回读/证据，提供手测入口。

## 执行裁定与独立复核

使用原已保存两project checkout和featurebranch保留热服务/数据，不迁新worktree，原未提交用户差异单独hash；Root单独stage/commit。开发任务互不写shared文件，按developer主动并行要求并行A/B/C，不按skill重复许可/测试/串行实现/删scratch规则阻塞。原agent复用因现有上下文与线程限制，仍交叉静态review避免作者自评；A/B/C分别在交report后审另一个任务与Root部分，必要fresh最终review按可用slot。

P4-03属条件任务：本轮没有具体其他native/动画需求，扩展能力说明/真实fallback保留，未实现格式不能勾成功。本轮完整代码交付范围为P4-02与P4-01受限网格DWG实现及条件扩展边界，不能称整个原生CAD/动画全覆盖。

代码/构建/独立静态复核/本机部署已完成，实际格式与性能待用户手测；P4-03仍是未指定的条件扩展。平台本地提交e17dacaf8c7e054d289d3149db5dbb89f55247ce，详细证据见stage4-handoff。
