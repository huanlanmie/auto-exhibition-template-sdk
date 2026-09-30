# P4 Task A — 静态分区 / LOD 实施交接

2026-10-01。依据冻结 `docs/superpowers/contracts/virtual-showroom-stage4.md` 与 `plans/2026-10-01-virtual-showroom-stage4.md` Global / ReviewFocus / Task A。源码仅新增以下三个 Worker 文件，没有修改 shared、package、Java、UI、用户数据或其它 provider：

- `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/pipeline/streamingOptions.js`
- `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/pipeline/streamingLod.js`
- `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/pipeline/streaming.js`

本轮 **仅实现 + 静态源码/API核对 + `node --check`**。没有 import/执行 Meshopt 模块、初始化 WASM、解析/转换输入、运行 GLTFExporter、运行模型或浏览器功能测试、安装依赖、启动/重启、stage/commit、修改505。尚未实际转换或验收，不据语法检查宣称模型正确或性能达标。交接后源码所有权返回 Root，由非作者独立审阅。

## 实际接口与 Root 接点

```js
// pure streamingOptions.js
parseStreamingOptions(spec.options)
// -> {enabled,cellSizeM,lodRatio,lodError}
STREAMING_LIMITS
STREAMING_POLICY
streamingError(code) // Error whose message is a fixed code

// streaming.js
captureStreamingIdentity(root) // -> {canonicalNodes:WeakSet}
await prepareStreaming(root,spec,meta,report,identity,quality)
// -> {scene,chunkOutputs:[{name,glbBase64}],streamingManifest}

// streamingLod.js internal interface
meshTriangleCount(mesh)
await simplifyStreamingMesh(mesh,streamingOptions)
// -> {geometry,highTriangles,coarseTriangles,errorM,reduced,reason}
```

Root 已确认共同流程：归一化完整 high root 后、`collectMetadata` 之前 capture；只采集一次全局目录；`collectMetadata` 与 `applyQuality` 后 await prepare；最终导出 returned scene。spec 至少包含 options、jobId、maxOutputBytes；meta 当前 schema1/modelVersionId/unit m/axis Y_UP/完整 anchors 与 anchorCatalog；quality.maxTextureSize 是既有1024或2048。动画信息由 Root 的 report.stats.animations 输入，helper也检查每对象animations、skin、morph、instancing。

options.streaming 缺省返回 disabled；显式对象必须 enabled 为 bool，只允许 enabled/cellSizeM/lodRatio/lodError。其余三键缺省20/0.35/0.005，null、非数字、NaN/Infinity、越界、unknown keys均拒绝。范围与契约一致：5..200米、0.1..0.9、0.0001..0.02米。enabled:false 路径直接返回原 root、空chunkOutputs、null manifest，不改meta/report/原几何，不初始化简化器。没有把任意源 marker 作为启用条件。

返回 chunks 是 **exact `{name,glbBase64}`**，name固定 `chunks/c0001.glb`..`c0064.glb`。SHA/size/bounds/atomicIds/nodeIds/triangles/estimatedDecodedBytes只在 manifest.descriptor。coarse/metadata descriptor固定assetKey，sha256与size暂为null，必须由Root最终bytes填上；此模板不能直接登记为完整manifest。

Root 最终工作：导出coarse后核单GLB100MiB；填coarse actual SHA/size；serialize最终meta（已含streaming/chunkIds），填metadata SHA/size；serialize streammanifest；公共manifest列前序public descriptors、排除private与manifest本身；**再次核全部 coarse/meta/report/chunks/stream/publicmanifest/private 合计 maxOutputBytes**。helper提前核high actual bytes，不知道Root最终coarse/meta/report/private bytes，不能代替共同合计预算。避免coarse/meta互哈希环：meta.streaming没有manifest SHA。

## 全局身份、坐标、原子与闭包

capture只保留对象 WeakSet，条件raw sourceAnchor.canonical===true且basis===ifc-global-id。包括不可信、重复、缺失GUID的IFC元素父对象，保持整个元素不被分开；**不据WeakSet提高stable**。collectMetadata原有sanitized sourceAnchor/global nodeId/stable决策保留。任意源同形flag最多引起保守原子合并，不能产生IFC稳定身份。

prepare有界遍历≤100k节点/depth256，拒绝完整目录缺失、totalEligible不一致、重复/未对应n00001目录对象、ANCHOR_CATALOG_TRUNCATED。只取最顶层canonical父节点，其他取最顶层Mesh subtree；选中后不再选其子对象，保证原始mesh覆盖不重复，≤20k单位。单位生成独立 `a00001`.. ID，按原对象/clone树顺序映射，不按源名称或mesh index猜。coarse与高chunk该原子root恰各保留同一streamAtomicId，原有sourceAnchor保清洗后的有限字段，不存private IFC SourceName/Psets/原地理datum。

每单位bounds中心XZ / cellSizeM聚类。单位再大也不切其内部。dense cell按geometry byte估算先分组；实际GLB>32MiB且多个原子时二分并重新导出；单原子>32MiB明确拒绝。总chunk≤64。此预算按实际输出，包括重复贴图，不生成盒子替代失败几何。

高chunk的cloneAtomic把原子原始matrixWorld写成clone顶层matrix、matrixAutoUpdate=false、child locals不变，挂在identity Group。coarse保持完整原树/完整root变换，仅替换成功简化的geometry。二者同属 normalized-model米/Y-up，helper不再次scale/axis/center；客户端building transform只施加一次。全局meta.normalizedMatrix4/bounds/sourceIdentity/锚点nodeId完全来自原高root，不重新采集metadata或改绑定。

每 descriptor.nodeIds 是单位内部所有目录节点 **加有目录的祖先** 的并集。因此跨区父group可出现在多个descriptor，且该父节点未必作为实际对象复制到高chunk：descriptor是全局目录关联，非仅实际GLB node集合。meta.anchor.chunkIds 与此双向关联闭包一致，必须每anchor至少一chunk、≤64。canonical父及其全部片段属于一个原子/一个chunk。 Root后端/C读取需按此契约处理祖先关系，不能要求父group副本存在于每chunk。

coarse marker只在collectMetadata清理完毕之后新增：

```js
coarse.userData.showroomStreaming = {
  schemaVersion:1, modelVersionId:spec.jobId,
  manifestAssetKey:`models/${spec.jobId}/stream-manifest.json`
};
meta.streaming = {
  schemaVersion:1,manifestAssetKey,chunkCount,
  layout:'normalized-model',coarseLod:true
};
```

GLTFExporter对Group输入使用scene wrapper，marker位于规范化root节点extra；客户端按tree读生成marker并核唯一性，不能假定gltf.scene.userData顶层wrapper总是带marker。

## LOD pinned API / 精度 / 保留规则

静态查阅实际 `three@0.186.1/examples/jsm/libs/meshopt_simplifier.module.js`：`simplifyWithAttributes` lines397..455，flags表317..326包含LockBorder与ErrorAbsolute，返回indices+error。调用只在enabled、首次可简化mesh时lazy import并await.ready；Root已确认vendor既有addons路径覆盖此文件。无sloppy、Prune、Permissive、WithUpdate、构件合并或无界新增依赖。

常规单材质BufferAttribute且完整drawRange可简化。material array、groups、partial drawRange、不支持属性/布局或估算临时量>128MiB原样保留并记录原因。可支持position/normal/uv/uv1/uv2/uv3/color/tangent；normal/UV/颜色/tangent均进attribute度量（UV权重1、其它0.25），防止仅position减面丢这些信息。copy+compact后保持每attribute原constructor/raw typed array/itemSize/normalized/name/usage/gpuType；不把量化或颜色属性统一转float，不删除材质/UV/颜色。Float16BufferAttribute因pinned Three的getComponent与getX/Y/Z/W半浮点解码语义不同，列为unsupported-attribute原样保留，不伪称支持半浮点简化。

非indexed在clone上`mergeVertices(...,Number.EPSILON)`，之后逐源vertex/attribute核对welded索引对应值 **完全相同**。任何近似weld不进入简化，保原网格并记录nonindexed-weld-inexact，从而不把未计入Meshopt误差的welding误差当作≤5mm。源geometry不被改，临时clone/merge在finally dispose，成功coarse只有新geometry归该scene持有；high资源从不dispose。

position度量用mesh.matrixWorld的3x3 linear变换（归一化米制，包括节点/根scale），减去首顶点reference避免平移引起Float32精度下降，不修改输出坐标。独立审阅发现Float32度量量化尚未被Meshopt返回误差覆盖，已补：实际逐顶点测double→Float32向量round-trip误差，另按8×Number.EPSILON×线性乘积/参考量级保守预留double算术误差；总metricAllowanceM=2×(maxQuantization+maxDoubleArithmetic)，覆盖两端误差。若余量非finite或已用尽lodError，保原geometry并记metric-precision-budget；否则Meshopt targetError=lodError−metricAllowanceM。normal度量使用world normal matrix；源属性本身保持不变。调用 `simplifyWithAttributes(...,targetTriangles,errorTarget,['LockBorder','ErrorAbsolute'])`，≥1三角形，核actualindices/count/range/finite返回error+余量≤目标与至少一个非退化面，再compact实际引用顶点并重算bounds。目标ratio不保证达到；error/border约束导致未减面照实统计。

`measuredErrorMax`保持实际Meshopt返回的 **归一化米制position + 加权attribute组合度量**，另外report.precisionBoundMax记returned error+余量（成功减面）的max，report.metricAllowanceMax记最大precision reserve；manifest保契约原有lod字段，不加未知键。未减面回原geometry时其coarse实际位置误差为0。它们不是测量过的Hausdorff误差，也不是用户模型性能证明。Root已裁定lodError与UI/manual一致标米。临时128MiB是数组工作量 **估算门槛**，不是OS/WASM硬quota或整个browser峰值内存证明。native IFC/DWG Job硬quota继续由原provider/supervisor负责。

报告streaming含enabled、cellSizeM、atomicUnits、chunkCount、highGlbBytes、requestedRatio/maxError/reducedMeshes/unchangedMeshes/highTriangles/coarseTriangles/measuredErrorMax、errorBasis、skipped[{reason,meshes}]、aggregateLimitBytes。必加STREAMING_APPROXIMATE_LOD warning并标partial；Root最终status整理不能删此warning。quality仍原高场景一次计算，公开LOD统计另有记录。estimatedDecodedBytes仅几何attribute/index原始估算，不包含精确纹理/GPU/JS峰值，不能作硬内存达标结论。

## Manifest / byte 上限

schema严格沿契约：version/layout/unit/axis/bounds、coarse、metadata、固定desktop/mobile/maxConcurrent2 policy、chunks descriptor、lod。chunk实际bytes经browser crypto.subtle SHA256，size就是导出ArrayBuffer byteLength。每chunk≤32MiB、high累计≤min(spec.maxOutputBytes,100MiB)、单coarse100MiB由Rootfinal export核；64chunk/unit20k/geometry10mvertices+triangles；manifest最终上限1MiB，helper预算时用64位hex SHA+固定最大size占位预留parent fields。manifest超限明确失败，无隐式截断catalog/nodeIds/atomicIds。

几何副本没有脚本、任意URI、private IFC sidecar、ticket、objectKey或源地理transform。binary exporter沿原固定textureembedding路径；clone exact userData subset，再添加固定生成extra。公共resources版本由spec.jobId固定，root不从用户options读取输出路径。

## 固定错误码（Root error map 接点）

| Code | Trigger / 用户处理 |
| --- | --- |
| STREAMING_INVALID_OPTIONS | streaming形状/四键/数值范围，或非预期normalized输出输入；修改明确选项 |
| STREAMING_STATIC_REQUIRED | 动画、skin、morph、instancing、非triangle primitive；关闭streaming或源软件静态烘焙 |
| STREAMING_CATALOG_INCOMPLETE | 高目录缺失/截断/重复/引用不闭合；减少源目录或关闭streaming，不伪称完整 |
| STREAMING_NODE_LIMIT | 节点>100k或depth>256；源软件分区 |
| STREAMING_GEOMETRY_LIMIT | 总顶点/三角>10m；源软件减面或分区 |
| STREAMING_INVALID_GEOMETRY | 非finite geometry/matrix/bounds、无三角、无有效位置/索引；修源模型 |
| STREAMING_UNIT_LIMIT | 原子>20k；源软件整理结构 |
| STREAMING_CHUNK_LIMIT | 需要>64块；增大cellSizeM或源软件分区 |
| STREAMING_ATOM_SIZE_LIMIT | 单完整原子输出>32MiB；源软件缩小完整元素/贴图，不拆IFC片段 |
| STREAMING_OUTPUT_SIZE_LIMIT | high actual累计已超共同预算；减少源/贴图，不放大默认限额 |
| STREAMING_MANIFEST_SIZE_LIMIT | 闭包manifest>1MiB；减少目录/分区或源软件分区 |
| STREAMING_EXPORT_FAILED | chunk binary exporter或固定SHA能力失败；没有成功假替代 |
| STREAMING_LOD_UNAVAILABLE | pinned Meshopt缺失/WASM不支持/init失败；明确失败，不伪造减面 |
| STREAMING_LOD_INVALID_RESULT | 简化器异常/无效索引/finite/error/退化结果；明确失败，不隐藏整个原子 |

固定warning：STREAMING_APPROXIMATE_LOD。skipped reasons仅内部有限集合 material-groups/draw-range/unsupported-attribute/lod-work-budget/nonindexed-weld-inexact/metric-precision-budget/error-or-border-limit，无源任意文案。

## 静态验证与锁定证据

最后三次命令 `node --check src/pipeline/streamingOptions.js`、`node --check src/pipeline/streamingLod.js`、`node --check src/pipeline/streaming.js` 均exit0/无输出；只syntax，不加载import依赖。静态确认pinned库API及BufferGeometryUtils merge实现。无自动/功能测试与实际export。

锁定SHA256：

- streamingOptions.js `9E7B94FCD390E4020B7DE3D98FADA739E124B3C2ACA423C9D4A461EE80A48799`
- streamingLod.js `DDE8D8FAC658DF310F534D4DCEC840FCCF8C15B0A0497B425CE04E1C45771A10`
- streaming.js `E62EDDB127D93D8A9F1403AF36FE86B4ECF4B233A1A9A9D7877B87CF6D02F279`

交接前独立preliminary reviewer已静态复读quantization-reserve差量，确认其A-I1已解决；本报告是作者交接说明，最终独立Approved以review-a报告为准。另已接受其half-float/gpuType nonblocking建议并在锁定版本实现。

## 用户后续手测建议（本轮未执行）

1. optout：同旧505或旧GLB单scene无marker/额外产物；不改变全局锚点或资源会话。
2. optin静态多网格：cell分区coarse首次完整可见，近处high加载隐藏同aID coarse，远处卸载恢复；teleport/切换版本/取消后旧decode不得挂入新building；Blob/GPU释放均观测。
3. 同全高源导入optout/optin比n目录/sourceIdentity/normalizedMatrix4/bounds，非均匀building变换仍世界距离正确且transform一次；全局祖先anchors有多个chunkIds，IFC无/重复GUID父元素仍完整一chunk。
4. 单材质normal/UV/color/tangent、非indexed重复与近重复、multi-material groups、不支持attributes、工作量skip：看actualratio/error/skip日志，不能只看目标比率；选中业务展项位置不随coarse/HLOD改变。
5. 大纹理导致densecell实际超32MiB可整原子二分；单原子超限、>64块、catalog截断、manifest1MiB、总预算100MiB应明确拒绝；无盒子/自动涨quota替代。
6. 动画、skin、morph、InstancedMesh应streaming硬拒绝；关streaming按原格式兼容规则处理。
7. 发布固定全部公共chunks/coarse/meta/manifest descriptors，private IFC仍无法匿名取得；重导stage/review/apply CAS与原高目录来源不变，未加载高块不导致绑定消失。

待独立复核和Root构建/整合，模型转换与真实性能验收仍由用户手动执行。

## 最后精度契约对接修复（Root再授权，仅 LOD helper）

Java D独立审中，注册校验改为实际measured≤请求maxError+8 double ULP。此前helper末端1e-5relative容差可能接受被Java拒绝的Float32 target/return边界，Root授权A仅重开 `streamingLod.js`，未更改另外两个pipeline文件或Java。

新逻辑在扣完两端position量化/double算术余量后，以remaining实际target增加保守 `16 * 2^-23 * remaining` Float32 target/return rounding reserve（下界16×最小Float32 subnormal）。总metricAllowanceM包含此reserve；不可用/耗尽仍保原geometry并记metric-precision-budget。Meshopt errorTarget再次扣此reserve，不靠扩大已输出误差容差。最终 `combined errorM <= options.lodError + 8*2^(floor(log2(lodError))-52)`，与Java Math.ulp在契约正数normal范围一致；原1e-5relative acceptance已移除。manifest.measuredErrorMax仍只实际return，report.precisionBoundMax/metricAllowanceMax沿原接口自动包含完整余量。不声称floatreserve或算法metric是实测Hausdorff。

最后唯一源变化 `streamingLod.js` SHA256 **`301A2B20EEB5B84EFE1FBA67725273E7EA894E8C1E7F0700BE1ED9CDB1502EC6`**；其它两文件前述锁定hash不变。`node --check src/pipeline/streamingLod.js` 单独exit0/无输出。未import/init/simplifier/转换/tests/browserQA/build。此源码所有权再次返回Root，待B独立增量Approved与Rootfreshbuild；作者不自行批准最后差量。
