# P4 Task C：前端分区、资源生命周期与性能记录交付

Plan：docs/superpowers/plans/2026-10-01-virtual-showroom-stage4.md，Task C + Global。
Contract：docs/superpowers/contracts/virtual-showroom-stage4.md。
日期：2026-10-01；作者：stage11_startup_scout。

状态：授权源已实现、最终 UI 生产构建 exit0、差量空白检查 exit0；源锁定并返还 Root，等待独立 static review 的最终裁定。本报告不是作者自评替代独立复核。没有执行测试、模型解析/转换、浏览器 QA、服务/API/平台数据动作、安装、启动、stage/commit。505及用户11处改动没有被本任务读取写入或迁移。

## 源所有权（平台 ruoyi-ui-vue3 下，共15文件）

新增：
- src/virtual-showroom/scene-core/streamingManifest.js
- src/virtual-showroom/scene-core/streamingModel.js
- src/virtual-showroom/scene-core/sceneMetrics.js
- src/virtual-showroom/scene-core/chunkAssetCache.js（Root 明确批准追加共用 lease helper）
- src/virtual-showroom/components/ScenePerformancePanel.vue

修改：
- src/virtual-showroom/scene-core/sceneRuntime.js
- src/virtual-showroom/scene-core/modelLoader.js
- src/virtual-showroom/scene-core/dispose.js
- src/virtual-showroom/viewer/publicHttp.js
- src/virtual-showroom/viewer/ViewerScene.vue
- src/virtual-showroom/viewer/ShowroomViewer.vue
- src/api/showroom/virtualShowroom.js（Root确认本阶段API所有权归C）
- src/views/showroom/virtualShowroom/components/SceneCanvas.vue
- src/views/showroom/virtualShowroom/editor.vue（仅资源描述符接点）
- src/views/showroom/virtualShowroom/imports.vue（Root另明确批准，仅setResources接点）

未改 ReimportReview、ImportWizard、Dwg3dImportOptions、任何Java/Worker/sharedSDK/Vite/package/SQL/线下代码。ReimportReview 已有两个SceneCanvas，自动复用新runtime/panel/lease，无需改业务review。元数据/全局锚点、CAS/model review、business IDs/binding/graph/navigation和访客软件通信没有变更。

## 精确接口

### modelLoader

`createModelLoader().startLoad(assetKey, resolveAsset, {urlPromise?,onTiming?}={}) -> {promise:Promise<THREE.Scene>,cancel(),dispose()}`。

旧 `load(assetKey,resolveAsset)->Promise<Scene>` 保留。独立每handle AbortController负责root fetch；GLB读取为ArrayBuffer再parseAsync。Parsing开始后cancel只标记取消，迟到结果register并dispose，不挂入场景。onTiming为 `{fetchMs,parseMs}`，第一阶段是资源URL就绪与root字节读取（包括缓存/lease摘要），第二阶段是GLTF依赖载入/解析/解码耗时，不是CPU profiler值。loader不代替stream manager归还chunk lease。

runtime关闭不立即terminate仍在解码的DRACOLoader workers：pending parse均finally清理后才dispose decoder；避免晚到Promise因worker被提前结束而无法settle。

### chunk lease

公共 `session.resolveAsset` 与管理员 `assets.resolve` 函数挂：
- `acquireChunk(assetKey)->{url:Promise<BlobURL>,descriptor,release(),cancel()}`，同步handle。
- `descriptorFor(assetKey)`，只读固定登记描述符。
- `getChunkStats()`，plain `{cacheBytes,pending,leases,fetchedBytes,completed,cancelled}`。

管理员resolver额外 `assets.setResources(resources)`，由editor acceptDetail/load与独立imports openReview在挂载canvas前装room的public资源描述符。成功import已由backend将old+new资源合并到room，两个比较模型均按固定登记而非sourceURI选择。

只有kind=model-chunk和models/<version>/chunks/cNNNN.glb可拿lease；≤32MiB，size与SHA64形状先验证，实际Blob读完再核size和SHA。公有请求继续credentials omit；管理员保owner API。

每cache record有独立controller、refcount、闭包身份与URL。最后consumer release/cancel才abort pending或revoke已完成URL；不能按key盲删。旧record迟到不能覆盖或关闭同key新record。lease方法幂等，多个canvas共享Blob但各自GPU graph与root读取可独立取消。非chunk预览/模板/coarse继续现缓存合同，分区不释放它们；整会话dispose仍全部abort/revoke。

### runtime与panel

新增 `getPerformanceStats()`、`onPerformanceStats(fn)->unsubscribe`、`setPerformanceMode('auto'|'coarse'|'high')`。保持全部原sceneRuntime接口。

共享panel路径：`src/virtual-showroom/components/ScenePerformancePanel.vue`，props `{runtime}`，在SceneCanvas/ViewerScene内默认收起。public viewer、admin editor、独立imports/前后review都用同runtime；viewer panel位置避开顶部展厅标题。模式为当前runtime偏好，不写草稿或服务器。

`sceneMetrics`从renderer.info和未被行走dt裁剪的真实帧时间采样，1秒级通知，窗口≤600样本/约10秒。实际calls/triangles/geometry/texture counts、DPR/render像素、camera、frame median/P95/FPS、encoded预算/缓存/下载字节、queue与失败/取消状态、最近phase耗时、可用时JS heap。无GPU bytes/FPS达标承诺；JS heap缺失N/A。export只plain指标/浏览器与人工设备/网络备注，不含ticket、source/objectKey或private IFC属性；本地下载JSON，不写平台。getStats fresh读取；关闭runtime发送disposed快照并清subscriber，避免退出后继续显示活动加载状态。

## 模型路径与闭包

遍历coarse树查唯一generated showroomStreaming marker（包括normalized-root node，而不只gltf.scene wrapper）；schema/version/固定manifest路径与coarse key匹配。无marker继续旧单GLB。异常marker/multiple marker、manifest加载或校验失败保留已加载coarse并显式提示。

登记manifest先查kind=model-stream-manifest与≤1MiB实际描述，再读固定Blob并核实际size/SHA；严格schema字段、m/Y_UP/normalized-model、64chunk/32MiB、固定desktop/mobile策略与并发2、bounds/finites、uniquechunk路径/ID、atomic闭包、nodeID形状/计数、LOD范围、coarse/meta/chunks登记kind/size/SHA。coarse真实streamAtomicId各一次、总≤20000并与manifest集合一致；high解析后再次检查该chunk完整atomic集合，拒绝嵌套marker/多缺atomic。frontend不重采metadata或重排全局node/IFC GUID目录。

high Group在building下identity；每chunk同normalized-model坐标，building.modelToShowroom一次。调度对chunk bounds施加building.matrixWorld，再算camera到AABB的showroom米距离；相机/视点恢复、gizmo transform与document apply使调度重新排序。近load/远unload hysteresis，优先视锥内/最近，队列最多同时2个network/parse，active+pending编码bytes受对应preset上限。high模式也受queue/bytes；省流取消高精、恢复coarse。

每块完整ready且当前record仍有效才append high并隐藏对应coarse；卸载先恢复coarse，再dispose GPU图和release lease。换建筑/清空/dispose更新epoch，cancel旧controller、stream queue与modelhandle，所有迟到root立即dispose。decode不能即时取消时保持pending并发/预留，避免无限启动替代请求。失败一次列diagnostic，保coarse；改变模式可明确重新尝试。

Viewer会话到期同时结束runtime/session，释放queue/GPU与Blob；ready时已过期也关闭，不再加载。原访客roomHost身份/成员/quiz/帧保留语义未改，视觉chunk回收不影响业务对象/导航/collider。

## 资源所有权与必要outline优化

每成功解析root登记其geometry/material/texture/Skeleton及ImageBitmap source的WeakMap引用计数；dispose按最后owner释放，跨root共享image不会被先关闭的一份提前close。单root各资源Set去重；dispose父scene/group时先处置登记root，避免再次释放；同root幂等。Skeleton.dispose释放boneTexture。

building outline改用Box3Helper+缓存normalized bounds，初次coarse计算一次，manifestready后使用原高globalbounds；building matrix或选中对象变化才重算，不每帧遍历整建筑、不随驻留块跳动。没有扩展全展项incremental、Raycaster/BVH、碰撞索引、history patch或动画provider。

## 独立复核修复

B预审发现 C-I1 Important：固定Three FileLoader按URL全局合并pending请求，旧GLTFLoader.loadAsync(sharedBlobURL)+manager.abort可能一份复核canvas取消而终止另一份仍活的同URLcanvas。已静读FileLoader loading[url]分支确认并修复：各handle独立fetch Blob URL/AbortController→ArrayBuffer→GLTFLoader.parseAsync，cancel不调用manager.abort共享依赖；保late parse dispose与lease refs。另推迟decoder.dispose至pending清理结束，防提前terminate worker留下悬空decode。

已通知B与Root复读该增量。本报告提交后等待B最终review-c；不以作者自评/构建代替他的裁定。

## 构建与边界

最终：`npm.cmd run build:prod`，workdir平台ruoyi-ui-vue3，exit0。完整日志：同scratch `task-c-ui-build.log`。源空白检查 `git diff --check`（授权C15文件范围）exit0，仅Git既有LF/CRLF规范提示。UI build会产生原构建产物，不stage/commit。

同scratch `task-c-source-hashes.txt` 记录源锁定SHA256，供Root/独立review对应最终差量。

未运行任何自动tests、浏览器、parser/simplifier/model conversion或平台业务请求；尚无实际模型coarse/high视觉、手机性能/帧率、网络取消/回收手测结果。P4手测必须覆盖首次coarse、近远加载、预算省流、teleport、非均匀building scale、同URL多canvas取消、失败回退、换版/离开、GPU与Blob、公共权限与IFCprivate、全局锚点/review/CAS，以及真实终端记录。build通过不能称手测或性能达标。

## 范围裁定/后续

- Root同意共用chunkAssetCache新文件与imports descriptor接点；scope外不改。
- 已批准plan的manual-only/no-tests/no-commit/no-new-worktree约束优先于skill通用测试/提交步骤；保留scratch与源SHA供独立复核，不删除证据。
- 已有全展项重建/preview eager、线性拾取/碰撞、history大复制等audit发现仍保留，待后续明确scope；未借P4扩大改写。
- P4-03没有具体动画/新原生格式需求，本任务没有假provider/clip入口；保留原静态兼容与Root手册实际边界。
- 源所有权返Root后不再改源，除Root新发review修复授权；继续待命交叉静态复核其它任务。

## 最终独立复核结果

B 最终独立静态复核 Approved，review-c.md 已存同 scratch；15份源 SHA 均独立对齐，C-I1 已关闭，无遗留 Critical/Important/Minor。Reviewer没有执行build/运行时/QA，本作者最终UIbuild证据保持独立。源锁定之后没有改产品文件。
