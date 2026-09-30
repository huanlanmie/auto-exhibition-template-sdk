# P4 场景内核、前端集成与资源生命周期审计

日期：2026-10-01。审计角色：Task C / stage11_startup_scout。

范围：只读源码与本地固定版本 Three 0.186.1；本次唯一写入为本报告。没有执行测试、模型解析或转换、浏览器 QA、服务/API 请求、安装、启动、平台数据写入或产品源码修改。结论是静态架构判断，不是大场景性能、动画或新格式功能已验收。

权威依据：
- SDK `docs/superpowers/plans/2026-09-30-virtual-showroom-roadmap.md` 的 P4-01/02/03。
- SDK `docs/superpowers/specs/2026-09-30-virtual-showroom-design.md` 已批准 v0.3 方案，尤其三层场景、模型/业务对象分离、稳定标识、资源安全和第10节性能边界。
- Root 本轮方向：可选 streaming；完整 coarse scene.glb 常驻、atomic canonical geometry 的高精 chunk GLB 按需替换；高精全局 metadata/anchors 只采集一次；无新依赖，使用固定 Three 自带 MeshoptSimplifier；特殊动画/skin/instancing 明确 skip/reject；旧505无 manifest 保持原路径；model-chunk 资源必须实现 Blob 释放和请求取消。

## 1. 架构裁定

方向可行，但必须把“视觉分块”与“业务对象/锚点目录”分开。`sceneRuntime` 已有独立 building/exhibits/navigation 三层；将分区控制器放在 building 下即可。旧版单 scene.glb、505 的已发布版与无 streaming manifest 的新导入应继续走现有路径。不得为了开启 P4 自动重导、替换、发布已有模型或迁移已有草稿。

coarse 必须包含整个建筑的可查看表示；高精块成功解析、验证并挂入同一 building 坐标系后，才隐藏其对应 coarse atomic group。移出驻留范围时，先恢复 coarse，再移除高精场景、释放 GPU/解析资源、归还 Blob 租约。加载失败、超预算、取消和网络中断均保留 coarse，因此不会因排队或远块回收形成空洞。

不需要在 SceneDocument 存储高精网格或全部分块目录。目录是模型版本的固定资源，SceneDocument 保持 building modelVersionId/modelToShowroom、业务 objectId/anchorRef/binding、interactionGraph、navigation 的原合同与 CAS。完整逻辑业务对象和碰撞定义不随视觉块卸载；访客 roomHost 的固定成员、virtualClientId、模板帧、注册函数和 quiz 状态也不随视觉距离重建。

当前没有统一的 `assetLoader.js`：下载缓存实际分别位于访客 `publicHttp.js` 与管理员 API 的 `createDraftAssetResolver`；GLB 解析在 `scene-core/modelLoader.js`。实现任务须同时覆盖这三处，单改 GPU dispose 无法完成内存回收。

## 2. 现有接点与可确认瓶颈

平台相对目录以 `C:/Users/Administrator/Desktop/mju-smart-show/` 为根。

| 文件与证据行 | 当前行为 | 对 P4 的实际影响 |
| --- | --- | --- |
| `ruoyi-ui-vue3/src/virtual-showroom/scene-core/sceneRuntime.js:10,20` | `createSceneRuntime` 建立 building/exhibits/navigation 三层 | 可把分区加载限制在建筑层，保持业务和导航行为 |
| 同文件 `:52–74` | `applyDocument` 深复制文档；每次清空并重建全部展项/导航；建筑只按 assetKey 判定换载，modelEpoch 防止旧异步结果挂入 | 大量展项编辑频繁触发几何/贴图重建；epoch 可扩成版本/块双代际，但现有请求不能取消 |
| 同文件 `:30,74` | 每次查选中对象线扫子节点；setMode 内每个展项再 document.objects.find | 大对象集上形成重复线性扫描，应缓存 objectId→node/doc Map |
| 同文件 `:43,117` | BoxHelper.setFromObject 在选择时及每一帧遍历选中节点；编辑器默认选择整建筑 | 大建筑即使相机不动也会递归计算整建筑包围盒；分块驻留变化还可能让选框跳动 |
| 同文件 `:106–118` | 连续渲染循环；行走细分子步后逐次 canWalk | 不是按变化渲染；粗细块都驻留时仍需准确隐藏避免双 draw |
| `scene-core/picking.js:7` | Raycaster.intersectObjects 对全部 roots 递归，再事后检查 ancestor.visible | 大模型拾取开销；隐藏 coarse group 未必免去所有递归成本，宜直接提供可选可见高/粗根集合并加区域 bounds broadphase |
| `scene-core/collision.js:6` | 每个移动子步扫描全部碰撞盒 | 大导航数据集应缓存空间索引，仍保持全部逻辑碰撞盒，不能按视觉块卸载 |
| `scene-core/modelLoader.js:8–18` | resolveAsset→Blob URL→GLTFLoader.loadAsync，只返回 `.scene`；单个 DRACOLoader 生命周期随整个 runtime | clips 丢弃；没有每模型 load/cancel/release/stats 接口 |
| `scene-core/screenObjects.js:12–29` | 建立每个展项时立即请求预览图，取消仅 alive=false；晚到 texture 丢弃 | 隐藏/disabled 对象也可能请求图；资源未在发布 activeResources 中时可能出现无意义错误；文档重建导致重复 decode |
| `scene-core/dispose.js:1–15` | 单个 root 内去重 geometry/material/texture，texture.close 后 dispose | 未处理 Skeleton.boneTexture、mixer；跨 chunk/克隆共享 geometry、material、ImageBitmap 时无跨 root 所有权管理 |
| `viewer/publicHttp.js:18,33–45` | 当前固定 resources allowlist；全会话 AbortController；Map<key,Promise<BlobURL>> 与 URLs 集合保留到会话 dispose | 卸载高精 GPU 后 Blob 仍累计；只全局 abort 会误伤模板/预览/续租，必须 model-chunk 独立取消/回收 |
| `api/showroom/virtualShowroom.js:39–49` | 管理员 resolver 同样缓存 Blob URL 到 editor dispose；没有 pending 请求 signal | 替换/复核多个模型后的旧 Blob 留到退出；同一个 resolver 被多个 WebGL 上下文使用，不能简单 release(key) 即 revoke |
| `views/showroom/virtualShowroom/editor.vue:42,56,72–74` | 整文档 JSON.stringify dirty 判断、克隆前后快照、60条 before/after 历史 | 大量业务对象会产生 CPU/JS 内存开销；不可把巨大的 stream manifest 塞进文档历史 |
| `components/ReimportReview.vue:20–21` | 前后两个 SceneCanvas；主 editor canvas 仍存在 | 复核可同时三个 renderer/GLB parse/GPU 副本；共享 Blob URL 不等于共享 GPU，统计须按 runtime 标注 |
| `viewer/ShowroomViewer.vue:7,14,16,34–45` | runtime/roomHost 按 visitorSessionId 建立，资源按冻结发布 manifest 读取，续租失败关闭访客模板 | 分区异步结果不能改变访客身份、重新开 modal 或清空 quiz；过期沿用整体退出链路 |

以上是源码可确认的复杂度/持有方式，尚无 profiler 或终端测量。不能据此虚构帧率、下载时间或内存节省比例。

## 3. Root 需固定的模型目录合同

建议目录名固定为模型版本下的 `stream-manifest.json`，schemaVersion 独立为1；名称及字段最终由 P4 authoritative contract 裁定。

最小必要语义：

| 字段/概念 | 必须固定的语义 |
| --- | --- |
| version/schema/modelVersionId | schema1；关联唯一模型版本；backend 注册时验证，不允许 UI 注入另一版本目录 |
| coordinateSpace | 全部 coarse/high/bounds 都为 normalized-model 米、Y-up；building modelToShowroom 只应用一次 |
| coarse | 固定 `scene.glb` 资源描述，真实 bytes/hash/stats；覆盖全部可导入建筑 |
| chunks | 有界列表；每项 chunkId、固定 assetKey、bytes/hash、模型空间 bounds、完整 atomic ID 列表、真实三角/顶点统计 |
| coarse↔high mapping | 每个 canonical geometry occurrence 有唯一 atomic ID；对应 coarse node 的 extras.streamAtomicId，经 GLTFLoader 成为 userData。不能依赖 node.name（loader 会规整/去重）、可变 mesh index、优化后 hierarchyPath 或临时 UUID |
| global metadata | 全高精/源 canonical tree 优化前采集一次；包括完整 bounds、anchors/anchorCatalog、IFC安全summary及其他既有字段；LOD/chunk 不重编号、不重复计数 |
| partial/special cases | 动画、skin、morph、instancing、线/点等的拒绝或保留策略必须明示；不能静默丢掉以换取 streaming success |
| budgets/diagnostics | 最大chunk数、每chunk字节/三角/解析预算、整个产物aggregate预算、coarse预算、目录JSON大小与强制失败/警告分类 |

一个 IFC product GUID 可有多个几何 occurrence，视觉 atomic ID 与来源 product identity 不应混为同一个键。若一个 chunk 包含多个 occurrence，只有该 chunk 所列完整对应 coarse nodes 全部被高精替换；若一个 occurrence 跨多个 chunk，则需覆盖计数/原子就绪协议，第一版建议禁止这种拆法以保持状态简单。单个巨大 primitive 无法仅靠网格分组取得细区域加载收益，应保留完整 primitive 或明确超预算拒绝，不能宣称已做空间切面。

coarse 和 high 同处一个 building Group。若 Worker 已 bake world transform 到顶点，目录必须明示 chunk transform 是 identity；否则提供固定 local transform 并恰好应用一次。相机距离/门限显示为 showroom 世界米，应对 building rotation/nonuniform scale 正确处理（变换 bounds 或用逆矩阵定位再考虑尺度），不能直接把 normalized-model 距离当世界米。

目录和 coarse/high 必须同版本冻结、固定资源映射、校验digest；不能接受外部URL、绝对路径、父路径、未登记资源或chunk内第二套外部glTF资源。既有源 IFC properties/georef/psets private sidecar 不纳入公开目录。

当前 `VirtualResourceSessionService.java:41–62` 已按选中 `models/<version>/` 前缀收集资源描述，并先剔除 model-private；返回描述符本身不会下载全部 GLB。P4 仍需 backend 为新kind/manifest固定登记和完整引用验证，但 frontend 可以只按目录懒 fetch。必须继续执行 P3 private hard reject，不能把“由目录引用”解释为公开 sidecar 的授权。

## 4. 最小前端接口建议

### 4.1 资源租约，而不是只有 release(key)

保留现有 `resolveAsset(key): Promise<URL>` 给单GLB、预览图和模板。新增仅 `model-chunk` 允许使用的能力，可由公共会话/管理员 resolver 共同实现；不扩大为任意资源的通用 eviction。

推荐接口供 Root 固定：

```text
assetAccess.resolveAsset(key)                        # 现有行为
assetAccess.acquireChunk(key, {signal?}) -> handle   # 同步拿到 handle，以便请求完成前也能归还
handle.ready -> Promise<{url, fetchedBytes}>
handle.release()                                    # 幂等；请求中或完成后均可调用
assetAccess.getChunkStats() -> bounded snapshot
assetAccess.dispose()                               # 全会话退出，与现有行为一致
```

allowlist 中资源必须是新固定 kind=`model-chunk`，既有 resource 元数据 size/hash/owner/session scope 继续由后端约束；公共 fetch 始终 credentials omit，不读管理员 token。资源类由登记描述符决定，不由 UI 参数信任。管理员可从 `listAssets`/模型目录的 verified descriptor 提供同样范围，避免传任意key就认为chunk。

内部按 key 存 `{refs,state,controller,promise,blobURL,bytes,epoch}`。同一key的多个 SceneCanvas 共享下载Blob，但每个消费者各有独立 handle；归还最后一份时才取消底层 pending fetch，或 revoke已完成URL并删缓存。外部 signal 只释放当前消费者，不能取消仍有其他ref的请求。session.dispose 全部中止/撤销；session续租的控制器不与逐chunk控制器混用。失败删缓存以允许明确重试；被释放的旧 Promise 不得稍后重新创建并塞回 URL。字节统计在 revoke/失败/取消后减少，无未消费 handle 泄漏。

这种同步 handle 解决“await URL 后才有release，退出发生在await前”的遗漏。解析后根场景仍拥有该 handle；region卸载时先dispose解析对象再release URL，保证模型/贴图消费者已离开。第一版可零ref即回收，若后续需要LRU保留，须给零ref bytes上限而非无限缓存。

### 4.2 可取消模型加载

保留 `load()` 的小场景调用合同，新增load handle或options以让每个region拥有自己的AbortController/LoadingManager/lease。推荐返回 root、clips（可选，受支持范围约束）、实际加载/解析统计以及幂等 dispose/cancel；避免把所有权隐式塞在 renderer 参数里。

本地 Three 0.186.1 `LoadingManager.js:286–299` 的 abort 会取消由该 manager 发出的支持abort的loader请求；`FileLoader.js:133` 通过 AbortSignal.any 联合 manager signal（浏览器必须支持）。GLTFLoader 内部使用 FileLoader，但 wrapper 的方法不自动提供所有解码的可取消控制。已进入 GLTF/Draco/Meshopt/image decode 的同步/worker处理不能承诺即时终止；正确实现仍需版本epoch、chunk generation与alive guard，晚到root立即dispose并归还lease，不准再次挂入scene。共享 DRACOLoader 的dispose只在runtime退出，不能某个chunk cancel时干掉其他chunkdecoder。

若解析输入通过ArrayBuffer+parseAsync，可避免第二次BlobURL主文件网络读取，但本地缓存ArrayBuffer和Blob的重复持有须计入内存预算；不能为可取消请求又增加永久双副本。第一版最小实现可保留BlobURL加载，使用perload manager与stale清理。

### 4.3 可观察但不暴露 renderer 可变对象

建议 runtime 增 `setDetailMode('auto'|'coarse')`、`onStats(callback)->unsubscribe`、`getStats()`，并给 `restoreCameraState`/building transform变更/画布恢复可见性调用强制重排调度。旧无manifest模型detail control显示不适用，继续load一次。只允许runtime内部读取 renderer.info，不把renderer可变对象交给Vue业务层。

`ViewerScene` 与管理员 `SceneCanvas` 新增optional streaming descriptor/assetAccess props即可；小场景 required resolveAsset prop保持有效。ReimportReview 同样接optional能力（或显式只coarse的比较模式），不要遗漏独立 imports.vue 的恢复/复核入口。具体hook名称需由 Root 在实施scope前固定，本报告不自主改源码。

## 5. 分区控制器与预算

每块状态应至少为 absent/queued/loading/ready-active/failed/disposed，并保持modelEpoch+region generation。调度优先入口、当前相机/视点、所选建筑附近；限制并发（初版建议1–2可配置）、最大驻留高精块数和字节预算，近远两条门限带 hysteresis/cooldown 防止边缘反复load/unload。按约200ms节流是可行起点，但不是终端实测值。

先加载完整coarse后再开near队列，不在manifest map时把全部high Promise启动。手动“低细节”取消pending高精、恢复全部coarse、卸载全部已加载high；切回自动按当前camera重排。teleport到入口/视点须立即重排，模型/数据版本换载应cancel全部旧queue和requests。模板modal打开可暂停非必要prefetch/行走，不处置访客业务状态。

取budget时，声明文件大小只是下载预算，无法代表解压后的geometry/texture/GPU内存。存在一个big chunk大于maxResidentBytes时，不能无限超预算以求load，应该coarse-only并显示明确reason。加载途中 pending与active bytes均计预算，禁止“同时新旧都ready才算”的短时失控。coarse始终占用预算基础，且coarse全模型的解析/纹理成本不会被streaming神奇消除。

可见性互斥与回收顺序：

```text
开始/失败/取消      -> coarse可见
high完整ready      -> 挂入building -> 高精可见 -> 隐藏对应coarse groups
远离/低细节/预算回收 -> 恢复对应coarse -> 移除高精 -> dispose root/mixer/skeleton -> release chunk租约
换模型/离开         -> epoch失效 -> 取消队列和pending -> dispose全部 -> release全部 -> resolver/session最终dispose
```

metadata和稳定锚点仍常驻全局且独立于高块；business object不是mesh child，不随着animated/coarsegroup隐藏。场景选中 building 的轮廓应依据已验证全局metadata.bounds 缓存计算，在building transform变化时更新，而非依据当前驻留root每帧setFromObject；这同时消除大建筑选框遍历和范围跳动。

## 6. LOD 实现边界与固定库审查

当前 `virtual-showroom-worker/src/pipeline/optimize.js:1–29` 仅desktop/mobile纹理上限与soft triangle/output预算，明确geometryReduction=false/nodeMerging=false。现有 mobile preset不是低多边形LOD，UI不能把它标成已产生geometry reduction。

Three 本地固定 `examples/jsm/libs/meshopt_simplifier.module.js:318–325,397–455` 有ready、supported、LockBorder、ErrorAbsolute与simplifyWithAttributes(indices, positions, stride, attributes, attrStride, weights, vertex_lock, targetCount, targetError, flags)。静态API存在可支持Root无新依赖方向；未执行WASM，也未验证任何模型视觉结果。

仅 simplify positions 不足以承诺 UV/normal/材质边界保留。需合理携带attributes/权重/vertex_lock，按每primitive/material group处理，并保留索引与其他attribute映射；使用LockBorder避免atomic边界变化。误差门限必须给单位语义（绝对normalized米或相对scale），report真实output triangle/error/skipped项，不能强制target ratio同时忽略error或假造减面率。

Skin/morph/animated node transform/instancing等如没有完整重复映射保证，第一版应拒绝该模型的streaming选项或保留整份原始coarse+明确无减面（按Root合同）；不得静默删除动画、实例、线/点或材质。每格式 provider 的旧静态转换仍可用，不因streaming特殊case关闭已有全部格式。

## 7. 资源dispose与动画接点

每chunk独立parse产生的对象以chunk为资源owner；不要缓存并共享parsedScene跨visitor，否则动画、Skeleton和userData会互相影响。共享下载bytes是可行的；共享GPU geometry/material/texture需要独立引用计数，第一版避免这种额外机制更小。

`disposeObject` 应在一个解析graph内去重geometry/material/texture、Skeleton与ImageBitmap source；跨多个Texture共享source.close时保证最后owner才close。单个GLB里的shared资源可以只释放一次，跨多个chunk同geometry克隆则不能只按单root Set决定销毁。Skeleton.dispose（本地 `three/src/objects/Skeleton.js:298–306`）释放boneTexture，当前实现未调用。

P4-03 的最小动画浏览能力只能作用于实际支持并保留clips的GLB/FBX合同，不是新原生格式已部署。当前modelLoader丢clips且sceneRuntime无AnimationMixer，需要显式取clips、按runtime创建mixer，受控play/pause/clip/time/speed，不默认自动播放。mixer.update加入同一帧循环，卸载时stopAllAction+uncacheRoot，必要时uncacheClip，再清Skeleton与root；本地AnimationMixer.js:652,796–801已有对应API。

第一版动画与streaming必须有明确互斥/skip规则：不能切断骨架、跨region track binding或morph target。在未定义动态业务锚点跟随前，anchorRef映射与navigation碰撞保持静态全局目录的默认姿态；不得让屏幕默认跟随动态mesh或宣称碰撞同步。源动画带来的root motion与整个building变换关系应由Root合同限定。

## 8. 手动性能观测面板

面板应默认可关闭、只读、不写平台；每runtime独立统计，UI≤1Hz更新，避免每帧触发Vue响应式工作。至少展示：

- `renderer.info.render.calls/triangles/lines/points` 的本renderer真实值；`renderer.info.memory.geometries/textures` 是计数，禁止标成VRAM MB。
- coarse ready/active state，high queued/loading/active/failed/cancelled数；实际leased Blob bytes/refcount，声明总bytes、实际fetched累计bytes分别标注。重复下载计累计流量，驻留cachebytes须在release后减少。
- load/parse耗时、当前detail mode、并发与驻留预算、DPR/canvas实际render像素、camera position；modelEpoch过期资源不计active。
- rAF帧间隔滚动窗口median/p95、近似FPS必须标成当前画布采样，后台tab/throttling标明，不承诺整应用GPU帧时。若采集 `performance.memory`，只在存在时显示可用JS heap，缺失显示N/A，不能填0或当GPU内存。
- 可选decoded geometry bytes根据typedarray真实缓冲计算且去重，纹理decoded/GPU bytes仍为估计，应与download bytes区分。

手动记录需包含设备/浏览器/DPR/画布像素/网络条件、模型版本、质量模式、相机路线、观察窗口、冷/热缓存及步骤。spec的30FPS、约15MB首批只是待设备/样本校准目标，不是此次审计或ready health已达成。首次coarse完整加载若超过15MB，应真实记录，不能把未请求high的bytes当成模型总size。

Template iframe开销不在WebGL renderer.info里。如需显示active/hidden frame数，只增加现有roomRuntime的只读metrics hook，须另明确scope；当前不改访客隔离/上限8/关闭保留语义。ReimportReview多renderer应标上下文或暂缓主画布render/stream queue；不能用一个renderer统计冒充全页面总资源。

## 9. 精确候选实施文件地图

以下是建议范围，尚未获得具体写源授权；Root应以stage4 contract/plan固定。

### 必需已有文件

1. `ruoyi-ui-vue3/src/virtual-showroom/scene-core/sceneRuntime.js`：optional分区控制器、版本epoch、detail mode、teleport调度、stats订阅、建筑bounds缓存、统一退出回收。
2. `.../scene-core/modelLoader.js`：每load取消/manager、chunk租约持有、stale清理、可选clips、load/parse统计；保留旧单GLB入口。
3. `.../scene-core/dispose.js`：Skeleton/mixer配合与source ownership；不能提前close其他owner共享贴图。
4. `.../viewer/publicHttp.js`：model-chunk-only acquire/release/abort/bytes；现有public allowlist、credentials omit与续租保持。
5. `ruoyi-ui-vue3/src/api/showroom/virtualShowroom.js`：同类管理员chunklease、owner资源登记上下文；旧预览图/模板resolver继续工作。
6. `.../viewer/ViewerScene.vue`、`ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/SceneCanvas.vue`：optional descriptor/assetAccess传递和stats事件。
7. `.../viewer/ShowroomViewer.vue`、`.../views/showroom/virtualShowroom/editor.vue`：低细节切换/面板开关、owned/public frozen descriptor供给、退出协调；不改CAS或保存建筑review链。
8. `.../views/showroom/virtualShowroom/components/ReimportReview.vue`、必要时`imports.vue`：前后预览的optional目录/资源租约接入，默认只coarse比较可减少同时下载；不能让成功job绕过review/apply。
9. `.../views/showroom/virtualShowroom/components/ImportWizard.vue`：streaming opt-in/能力reason、实际LOD/特殊case说明，若Root计划本轮加入动画opt-in同页声明；不能新增未部署native format假入口。

### 建议新增小模块

- `scene-core/streamManifest.js`：固定目录shape/范围/unique atomic/ref解析。
- `scene-core/streamingModel.js` 或 `regionRuntime.js`：有界queue/nearfar驻留/映射互斥/release，不把所有状态塞回sceneRuntime。
- `scene-core/chunkAssetCache.js`：公共/管理员共用lease内部逻辑，fetch策略/授权仍由各resolver提供。
- `scene-core/performanceStats.js`：bounded采样与真实计量。
- `views/showroom/virtualShowroom/components/ScenePerformancePanel.vue`：仅订阅snapshot的展示组件，若public需复用可放virtual-showroom共享components目录。

### 有收益但需明确追加scope的独立优化

- `screenObjects.js`：按objectId增量update、preview resource变化才decode；disabled访客展项不发无权预览请求；真正lazy preview需另定义距离/可见性与assetscope。
- `picking.js`：visible region roots/bounds broadphase，不新增BVH依赖；保留business objectId与building选择。
- `collision.js`：导航改变后缓存空间网格，保持原碰撞box行为。
- `editor.vue` history改为小命令/patch属于另一性能优化，不是streaming必要条件；本轮至少不把目录进历史。
- `schema.js` 不建议增加巨大目录；只有Root明确需要持久化设置时才最小字段扩展。
- `anchorMatching.js` 数学公式与映射合同应保持；目录不替代globalanchors，after preview仍采用同building变换、保留无anchor世界位置。可能只需传descriptor，不需要重写矩阵算法。
- TemplateRuntimeHost/roomRouter/quizAdapter保持；不能为了图形回收重开访客业务runtime。

### 后端/Worker依赖（由Root/其他agent实施）

模型固定多产物登记、chunkkind/预算/digest/meta/公共资源引用验证、owner/admin/public streaming descriptor接口；Worker normalized canonical high采meta→coarse/partition/export流程；IFC source sidecar继续private；3DDWG独立能力与native失败reason；有条件的clips/native支持声明。当前C不自主改这些文件。

## 10. 等待 Root 冻结的决定

1. stream目录具体文件名、schema/atomic extras字段、chunk粒度与坐标/transform、coarse bounds来源。
2. source/global metadata采集顺序以及优化后不重编号的断言；IFC product和geometry occurrence identity区别。
3. 新resource kind、总/单块/coarse/json预算、hash与backend登记拒绝规则；如何在admin detail/owned GET与public manifest内暴露固定descriptor。
4. assetAccess/lease/loadhandle精确interface与stats字段、取消和共享ref语义。
5. 低细节模式是否纯会话偏好（推荐）；old无manifest的控件隐藏/不适用方式。
6. animation/skin/morph/instancing specialcase的streaming skip/reject范围；clip浏览与业务anchor/collider静态语义。
7. 本轮明确采用哪些独立优化（outline缓存必要，拾取/增量业务对象/空间碰撞/historical patch可按规模追加scope）。

本审计完成后等待 Root 精确实施授权；没有改产品源码，没有使用现有505或新格式做功能验收。构建、能力health与人工格式/性能手测仍应分别记证据，不能互相代替。
