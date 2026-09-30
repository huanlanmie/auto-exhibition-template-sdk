# P4 发布 / 转换 pipeline 只读架构审计

2026-10-01。范围：平台 Java virtual import、model metadata/review、draft/publication validation、resource sessions/serving 与 Worker normalize/metadata/quality/export/artifact协议。依据现有roadmap/P2/P3契约及Root最新P4方向；**本文是冻结契约前建议，不是实现或验收报告**。只读产品源码并写本文；未安装、启动、构建、测试、样本解析/转换、浏览器QA、API/SQL或Git操作。

## 建议结论

可采用Root提出的有界扩展：streaming默认off；完整high场景先一次全局规范化/metadata，再导出完整coarse `scene.glb`＋最多64个高细节chunk GLB＋固定stream-manifest.json。每chunk≤32MiB，首轮**仍维持Worker全部产物100MiB aggregate默认预算**，IFC中间GLB100MiB边界不变。分区减少运行时高细节驻留，不宣称允许无限源文件/无限转换内存；动态三维DWG另按独立provider范围处理。

旧505/所有没有streaming字段的模型继续原单scene.glb路径，不补写、重导或重新发布。building仍使用modelVersionId＋`models/<version>/scene.glb`，不由UI指定任意chunk/外部URL。新客户端仅在当前resource registry存在固定stream manifest时启用，新字段缺失即legacy fallback。

## 当前约束和精确阻碍

根路径：`C:/Users/Administrator/Desktop/mju-smart-show`。下面Worker路径相对virtual-showroom-worker。

| 位置 | 现行为 / P4需要 |
| --- | --- |
| Worker src/browser/convert.js:82–127 | 完整scene统一单位/axis/centering后采metadata；保留这个顺序，不在chunk内重复 |
| convert.js:139–143 / pipeline/optimize.js:5 | 只export单GLB，单GLB硬100MiB；需新增coarse＋parts输出分支，每part32MiB且合计维持原预算 |
| convert.js:157–159 / browser/runner.js | 一个glbBase64跨Playwright传完整结果；可扩为有界parts数组，不能称这是转换端真正流式内存 |
| api/convertRoute.js:45–60 | **全部**GLB/meta/report/manifest/IFCprivate计config.maxOutputBytes，默认100MiB；任何新JSON/chunk都必须计入，不只计geometry |
| src/config.js:29 | maxOutputBytes默认100MiB，可配置最大256MiB；首轮不静默提高环境值 |
| native/ifcBridge.mjs:167 / providers/ifcProvider.js:40 | native intermediate scene.glb本身100MiB；后置public分区不能绕过它 |
| Java VirtualModelImportService.java:66–85 | assetKey固定scene.glb；artifact仅五fixedname/kind；chunks当前拒绝；需限定新增paths/kinds |
| ImportService.java:172–184 | public manifest resources最多4、只固定文件；需按streaming有界动态集合校验闭包 |
| VirtualShowroomProperties.java:20 | Java maxExpandedBytes默认**256MiB**，不是100MiB；ImportService:77据此检查合计。Worker更小默认已是前置限制 |
| WorkerClient.java:99–118 | result含所有base64 artifacts，一条NDJSON整块buffer，response≤Java maxExpandedBytes×2；64parts不等于Java逐part流式消费 |
| pipeline/metadata.js | full目录一次n00001…分配，20k anchor上限、100k scene node硬上限；分区不能把每part上限当成整个模型上限 |
| MetadataService.java:37/51 | streaming顶层/anchor chunk membership目前不在allowlist，会被owner metadata DTO丢弃；需精确追加safe字段 |
| ValidationService.java:41 | 每资源完整readBytes后算SHA，且检查整个room资源库；parts增多会增加峰值/时延，宜流式digest而不改变所有权与validation digest |
| ResourceSessionService.java:41–63 | 选中modelVersion prefix已经覆盖该版本所有parts；新增kind/path仍须经过注册，private hardexclude继续优先 |
| TemplateRuntimeResourceService.java:48 | 非template资产已经openAsset.transferTo流式serve，无需为了小chunk新增匿名ObjectKey/downloadURL入口 |

meta/report/private字节也占100MiB，因此100MiB的GLB本身不一定可最终登记。coarse+high几何会重复部分textures/geometry；即使原high GLB小于100MiB，streaming输出仍可能触预算。应给固定错误并要求减小内容/调整参数/重新选择off，不能悄悄成功为legacy又声称分区已生成。

## 可冻结的schema/path建议

共同options新增精确 `streaming={enabled:false,cellSizeM:20,lodRatio:0.35,lodError:0.005}`。未知key、非boolean、非finite或越界值拒绝；cellSize/error在**完整模型已规范化的米制空间**解释，不在源mm/源axis解释。现10mvertices/20k目录/输入/期限/nativequota不因64parts重置。首轮静态triangle场景优先；animation/skin/morph不支持时显式拒streaming并允许用户另选legacy，不静默丢动画。

固定新增public资产：

- `models/<version>/stream-manifest.json`, kind=`model-stream-manifest`, application/json。
- `models/<version>/chunks/c00000.glb` … `c00063.glb`, kind=`model-chunk`, model/gltf-binary；id/path必须generated固定格式，无用户名称、GUID/path模板或URL。
- 原scene.glb/model、meta.json/model-meta、report.json/import-report、manifest.json/model-manifest不变；IFC-only ifc-properties.json/model-private继续第五私有核心文件。新非IFC最多68/69个公共/总descriptor，IFC多一个private，实际按固定集合而不是任意ZIP entry数验。

stream-manifest形状建议：

```json
{
  "schemaVersion": 1,
  "modelVersionId": "job-version",
  "unit": "m", "axis": "Y_UP", "coordinateSpace": "normalized-model",
  "layoutDigest": "sha256-of-coarse-and-chunk-layout",
  "catalog": {"assetKey": "models/job-version/meta.json", "sha256": "actual-meta-sha"},
  "coarse": {"assetKey": "models/job-version/scene.glb", "sha256": "actual-sha", "size": 1},
  "chunks": [{"id": "c00000", "assetKey": "models/job-version/chunks/c00000.glb", "sha256": "actual-sha", "size": 1,
    "bounds": {"min": [0,0,0], "max": [1,1,1]}, "nodeIds": ["n00002"], "statistics": {"triangles": 1, "vertices": 3}}],
  "lod": {"mode": "coarse-full-plus-high-chunks", "requestedRatio": 0.35, "requestedErrorM": 0.005,
    "errorVerified": false}
}
```

这只是schema示意，数值不代表生成样本。coarse/chunk descriptors在public manifest/resources registry中有对应固定kind/mime/实际sha/size；JSON不得含ObjectKey、source URL、owner scope、IFC源名称/属性/CRS/原datum。所有bounds finite/order/合理范围；chunk ids唯一；每part refs不能出当前modelVersion；catalog nodeIds必须存在；sum actual bytes/triangles/vertices受全模型预算，声明数不能代替实际测量。

meta.json仍schemaVersion1，新增safe `streaming={schemaVersion:1,manifestAssetKey,layoutDigest,chunkCount,mode}`，anchor可新增有界`chunkIds:[]`。**不要互相散列形成循环**：先导出coarse/parts和layoutDigest，finalize高目录+streaming metadata计算metaSHA，再生成streammanifest含metaSHA，最后manifest.json登记所有actualSHA；meta不再含streamManifestSHA。model.resourcesJson会冻结streammanifest实际SHA。也可让meta.digest通过layoutDigest绑定part集合，增强既有重导freeze。

## 统一矩阵与锚点不变式

1. 所有unit/axis/centering/providerorigin/additionalScale在完整high root只做一次；cell/bounds/LOD error从此空间计算。coarse与每high chunk顶层规范空间一致；runtime统一再乘building.modelToShowroom。不得按part重新居中、换源轴或重乘unit。
2. metadata/anchor目录只从high完整原场景采一次；nodeId、sourceIdentity、normalizedMatrix4、bounds、geometrySignature仍基于high。coarse/part克隆不上报第二个anchor目录；不能按part从n00001重排或因resident unload移除anchor。
3. IFC canonical element（包括缺GUID/inexact的元素）作为atomic unit，不拆成多个具有同一stableGUID的parts。collectMetadata清理后raw canonical旗已消失，partition需要内部object→trusted catalog的映射，或精确catalog/basis/id定位，而不是继续读取已删canonical。fragment/LOD只复制源node关联，不重新提升stable。
4. 非叶catalog父group可能跨多个chunk；其chunkIds必须有界array，不能假称每anchor只有一个chunk。canonical IFC元素及其内部片段应在同一chunk，跨区的外层group可有多个。manifest nodeIds宜只列atomic roots，避免ancestor×parts反复复制使manifest膨胀；global meta保存完整目录。
5. 屏幕objectId/contentBinding/anchorRef业务状态保持在SceneDocument，不绑定某个GLTF node对象的驻留寿命；unload只释放建筑visual resources。源P/Q/D和IFCproperties继续private sidecar，public chunks只规范局部geometry与sanitized安全node关联。
6. coarse简化后的包围盒可能缩小，公共navigation/model bounds及anchor帧仍用high bounds；不能让LOD轮廓变动成为业务对象移动或navigation丢失的依据。lodError若算法只提供目标，不提供实际有界误差证明，必须标requested/unverified或明确partial，不写“误差≤5mm已验证”。

## Java注册 / publish / session最小变更

**ImportService / WorkerClient：** 保留result assetKey为scene.glb，新增精确两种kind与固定chunk正则，不允许任意子路径。streamingoff仍要求旧四/IFC五文件并拒多余parts；enabled要求streammanifest与其全部parts存在且无多余未列part。manifest不列private；manifest、streammanifest、meta、actualartifact descriptor四者cross-check同version/hash/path/size/layout/node coverage。GLB仍header/length至少检查，外链不由session任意抓取。验证所有文件和sidecar成功后，才原事务插model、draft CAS、job RUNNING CAS；取消/失败不能只登记一半chunk清单。入口 options.streaming需Java+Worker同步exactschema，不能只有UI验证。

**MetadataService / ModelReview：** 新streaming字段和anchor.chunkIds safe allowlist，GET仍owner/query。冻结source/target digest可继续使用meta bytes，因为meta含layoutDigest；建议snapshot同时验证streammanifest实际sha/closed refs并把resource envelope纳入digest（旧模型保持原兼容）。review/apply现:67/82–84冻结owner/room/draft/source/target；:105–107仍新旧**global normalized** anchor帧重算对象transform，:112–113切version/scene.glb并persistReviewedModel。chunk loading状态不得进review/CAS。缺失/过滤anchors仍需明确map/detach，不从某个未加载part反推“源节点不存在”。

**ValidationService / PublishService：** validate需新增selected model streaming闭包校验：固定manifest、所有declaredparts的registereddescriptor与actualhash、目录映射、预算及shared frame。既有:41资源digest检测应改streamedSHA读取（storage已支持openAsset）；不因分区删除private校验/权限、也不把未加载part当可不验证。现validation digest=sceneJSON+resourcesJSON，Publication:17–20校验/row lock/digest/expectedVersion后复制完整scene/resources到immutable revision，足以固定part descriptors，保留相同流程。所有LOD/parts必须发布前完成，禁止访问时在同version下补导出/覆盖；storage.store当前可REPLACE已有key，因此新version/一次写入是必须的流程约束，不能靠“blob天然immutable”假设。历史snapshot回滚须保留相同part闭包；无法读取不应临时重生成或串到最新模型。

**ResourceSession / PublicController：** activeResources现按active modelVersion prefix选择所有part/streammanifest并先拒private，可复用；建议对新kind/path/version再exact check，防把library其它model、source staging或私有sidecar误授权。session内部descriptor带ObjectKey，response仍六字段positive projection。manifest从published revision生成，renew保持既有租约scene/resources，不在每次part fetch查询“最新version”。继续在Controller同时hard-exclude private路径与resolvedkind，包括旧session；新增streammanifest不能间接引用private资产。

**API：** 当前session assets/{path}已可安全读取登记chunk，非template流式serve可继续，不需要新匿名ObjectKey endpoint。runtime可从building.modelVersionId derive固定streammanifest路径，但必须先见到当前授权resource descriptor，缺省legacyfallback，损坏存在的streamingmanifest应给明确加载失败并保coarse，不能默认为许可无限外链。可追加session/model metadata的streaming能力/descriptor，不必改building主assetKey或业务model-review API；如新增building字段，必须由registered model server派生并纳入requireSameModel/asset reference检查，而非任意UI字符串。

## 有界规模和生命周期说明

最多64×32MiB不是2GiB授权：aggregate仍100MiB且含coarse/JSON/IFCprivate。max files/manifest bytes/目录关联sum需要独立限额；建议publicmanifest与streammanifest分别≤1MiB，meta仍≤32MiB、private≤16MiB，重复映射达到限额明确reject/truncated，不能漏part后写complete。单个atomic IFC元素超过part上限应明确失败/用户另选legacy，不偷偷拆GUID。

分区只改善浏览器高LOD驻留，当前converter仍先完整parse/native bridge scene＋Playwright内scene＋base64数组，不能称转换端streaming或更大input支持；IFC/DWG/native原预算与10m全geometry硬上限仍适用。file bytes不是CPU/GPU已解码驻留量；runtime residency应单独计geometry/texture估计、request并发、coarse永久驻留及high峰值，显示手测未验证状态。

供runtime契约：先coarse可见；按high bounds加载相应part，high替换同atom coarse可见性，而非coarse+high同时重影；generation+AbortSignal防旧version结果attach，失败/卸载保coarse fallback。geometry/material/texture需引用计数或明确独占dispose，不能因卸载一个part销毁coarse共享texture。editor/visitor退出、model替换、session过期要cancel并释放所有parts；callback卸载不改virtualscreen/runtime/业务对象。自动导航碰撞不由coarse可见网格生成，保留已有业务navigation。

## 冻结后实现文件建议与手测边界

Worker Root共有：browser/convert、runner、pipeline metadata/quality/newpartitioner、convertRoute/protocol/build。Java：ImportService、WorkerClient（如transport改）、MetadataService/newstream validator、Validation/Storage streamed digest、ResourceSession/public serving适配。ModelReview公式/业务CAS与Publish主体可复用，重点扩展validated model envelope与manifest闭包。UI/runtime由另席位负责解析/驻留/回收；模板SDK/nativehost不需要为建筑分区改变。

手测计划而非执行：旧505/legacy单GLB不变；新static多区模型coarse先显示、邻区part加载/失败/卸载/重入；high anchor目录在parts未加载时可绑定、属性owner读取和GUID重导稳定；同version/wronghash/缺part/超64/单atomic>32MiB/aggregate>100MiB均明确拒；公开guess IFCprivate path/manifest引用private不可读；source地理datum不在coarse/chunks/publicJSON；部分报告ack、draft并发CAS/取消注册、发布回滚固定旧part集合；静态unsupported animation/skin明确提示；用户记录帧时间/驻留资源峰值及长时间进出回收。

产品源码本轮保持只读。等待Root冻结P4契约/实施scope后再进入实现，不提前启用streaming或修改旧505。
