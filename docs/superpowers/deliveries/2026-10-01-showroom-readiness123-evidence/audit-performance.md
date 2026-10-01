# Readiness 123 Task 3：桌面/移动端性能与生命周期只读审计

日期2026-10-01。平台HEAD独立读为 e17dacaf8c7e054d289d3149db5dbb89f55247ce；C作者席位本轮只读审计，不实施。范围为当前renderer/streaming/modelLoader/metrics/panel/editor及必要wrapper、preview/resolver/picking/固定Three证据。源范围git status未显示差量；本次唯一写入是本报告。

没有浏览器采样、功能测试、模型parser/转换/simplifier执行、服务/API/平台数据动作、安装、源码编辑或Git commit。505与11份原用户改动未读取改写。以下区分可证明的源码问题与需要人工测量的优化假设；没有FPS、首屏时长或内存节省达标结论。

采用 performance-optimization 技能的测量纪律：真正性能瓶颈须在同release版本、设备/相机路线/质量/网络条件下手动比较。本任务明确只读，不进行技能通用profiler操作；可先修确定的生命周期/指标正确性，再由用户记录基线决定后续优化。

## 结论与第一批建议

现P4已提供真实renderer计数、RAF窗口、chunkencoded预算/lease回收和coarsefallback，关键ABA取消/late decode/globalanchors风险已有实现。用户现在要完成桌面/手机可手测阶段，最小有意义批次是：

1. 补渲染可见性/暂停与恢复、后台/ContextLost采样边界；停止隐藏主画布和无用stream pump，恢复时重置样本。
2. 增手动运行画质/DPR和desktop/mobile运行profile（也适用于旧505单GLB），维持原模型版本/所有业务状态。
3. 修disabled visitor展项仍拉无权preview；可在同批为展项Map/增量更新增加真实applyDocument成本计数。
4. 对移动端模型复核提供单画布前/后切换，避免两个compare再叠一个主编辑器的GPU上下文。

后续应按真实frame/profile数据决定是否做visible-only拾取、stream驻留黏性、碰撞索引或coarse资源租约。不要同时改所有高复杂度算法，也不要凭源码猜CPU/GPU是主瓶颈。

## 源码发现（按优先级）

### F1 P1：后台恢复样本混入前台窗口；ContextLost也可能显示正常FPS

证据：`src/virtual-showroom/scene-core/sceneMetrics.js:3,12,19`，previous跨所有frame持有，frame只按now-previous采样，background仅读取当下document.hidden。场景内没有visibilitychange/reset sampling接口。

如果浏览器在后台暂停/降低RAF，回前台的第一帧dt包含整个后台间隔。该样本time是当前now，不会被“旧time超过10秒”立即剪掉；background此时false，长dt进入前台FPS窗口，初期也可能污染median/P95。数秒间隔是可证明的源码路径，未观察真实设备多久/多低。直接删除大dt也不可取，会掩盖真实前台卡顿；应明确在visibility/active/context边界重置。

固定Three `src/renderers/WebGLRenderer.js:1119,1646`：contextlost设置_isContextLost；render早退。当前sceneRuntime仍metrics.frame(now)，没有contextlost/restored状态，所以RAF继续时可报告callback FPS和旧draw计数，用户会误以为当前画面仍正常绘制。

建议最小文件：sceneMetrics.js、sceneRuntime.js、ScenePerformancePanel.vue。API `metrics.resetWindow(reason)`/`setSamplingState({active,reason,contextState})`；runtime响应document visibility与webglcontextlost/restored。重启采样previous=null、旧窗口清空，warming/paused时FPS N/A，record带有效前台windowStart/windowEnd/contextState/pausedReasons。不要把GPU render早退帧当渲染成功；不fake FPS0或高FPS，也不声称采到GPU时间。

### F2 P1：输入禁用不停止render/stream；复核弹窗下可同时三个renderer

证据：sceneRuntime.js:135–160连续setAnimationLoop，setInputEnabled(:178)只改keys/movement/controls；streamingModel.js:51每加载finally继续pump，未检查visibility/active。没有IntersectionObserver/active prop。editor.vue:9主SceneCanvas常驻，:16复核dialog，ReimportReview.vue:20–21两份SceneCanvas；模板preview同样只是同步输入/保camera，主3D仍render。

CSS-hidden、被大dialog覆盖的canvas依然在当前前台RAF里工作。后台tab的RAF通常由浏览器暂停，但已在途parse完成后的finally pump仍能继续下载/解析queued高块；不能声称每种后台都持续60FPS，问题是没有主动状态约束。

建议最小文件：sceneRuntime.js、streamingModel.js、SceneCanvas.vue、ViewerScene.vue、editor.vue、ShowroomViewer.vue、ReimportReview.vue。新增 `runtime.setRenderActive(active,reason)`，reason集合而非一个互相覆盖的bool（document-hidden/container-hidden/dialog-underlay/context-lost）；active变false清输入、停RAF/调度，stream.setPaused(true)停止新pump，pending采取明示取消或有界完成策略，保持coarse与业务对象。

恢复清previous/采样，ResizeObserver/currentsize更新，强制按当前camera/transform重排stream，继续原camera。wrapper可有 `active` prop，owner确定dialog主underlay是否被覆盖；IntersectionObserver不能检测overlay遮挡，不能仅靠它判断modal后主canvas。

不要dispose/recreate访客roomHost、virtualClientId、quiz、绑定/模板帧；这只是图形层暂停。关闭modal/标签恢复仍同visitor业务状态。不可每一次失焦就丢当前high/coarse导致重复下载。

### F3 P1：mobile只有chunkbytes变化，无可选的实际渲染画质

证据：sceneRuntime.js:19用pointer:coarse固定选择mobile policy，:24所有设备antialias true、DPR=min(devicePixelRatio,2)。policy之后不能更改；panel仅auto/coarse/high（无manifest时选择框disabled）。因此旧505单GLB手机没有可用的低分辨率控制；触屏笔记本/外接鼠标平板的profile也可能不符合操作者意图。

建议 `runtime.setRenderQuality('low'|'balanced'|'high')`（例如DPRcap1/1.5/2，具体默认由Root固定）及 `setPerformanceProfile('desktop'|'mobile')`。分辨率设置只改变renderer像素尺寸；DPR改后重新setSize，记录requested/effectiveDPR、真实canvaspixels/profile。AA是创建WebGLcontext参数，不能假作运行时toggle；先不为AA重建renderer、丢camera/已加载资产。

profile切换对stream更新距离/编码预算并进行安全回收，保持model/version/anchor/businessobject/sceneDoc。模型导入quality决定文件纹理/LOD，运行profile只是当前画布设置，标签必须区分。无streammarker仍可调DPR；不自动换模型或写草稿/发布。

几何事实：渲染像素随DPR平方变化，可记录实际width×height；这不能换算成FPS收益。是否GPU受限仍需用户手动profile/同路线对照。

### F4 P1：disabled visitor展项仍创建preview请求，可能产生无权资源错误

证据：sceneRuntime.js:65为document.objects全部createExhibit，然后才node.visible=false；screenObjects.js:13–14构造时无条件读取previewRef/imageRef。后端VirtualResourceSessionService.activeResources明确跳过enabledfalse对象，而sanitize未从sceneDocument删除这些对象。

存在disabled屏幕带previewRef且该ref不被其它启用对象共享时，公共resolver无该资源key，createExhibit请求会失败并在viewer显示preview error banner。隐藏对象既浪费请求/构造，又污染正常参观提示。

建议sceneRuntime viewer模式在create前跳过disabled（或显式createExhibit loadPreview=false），editor保留半透明编辑能力。切editor/viewer时生命周期必须正确增删/取消；不删除真实document对象、binding或graph，也不通过宽放public resource allowlist修这个问题。最小sceneRuntime.js，必要screenObjects.js。

### F5 P2：每次改一个字段重建全部展项/导航并重复解码图片

证据：sceneRuntime.applyDocument(:61–65)normalize/clearGroup全部exhibits/navigation、再逐个create；screenObjects每次newTextureLoader。SceneCanvas监听document引用；editor execute(:72)每操作创建新文档，undo/redo同样触发。属性名/单对象位置/锚点选择后也会重建无关对象。

建议增selectionId→node Map，按objectId差量create/update/remove；transform/name/enabled变更不换geometry或texture，只有type/dimensions/fitMode/previewRef实际改变时重建对应部分。取消旧preview只绑定旧record/generation，晚到texture处置；不跨canvas共享可变parsedGLB或skin。导航可先保持原逻辑，避免一次同时更改导航碰撞算法。

最小sceneRuntime.js、screenObjects.js；sceneMetrics记 `lastApplyDocumentMs,created/updated/removedExhibits,previewLoads`，用户同样做一个位置/名称编辑，比较framep95和reload次数。不给未经测量的速度百分比。当前建筑outline已缓存global bounds，不要再把“每帧整建筑setFromObject”列为未修问题。

### F6 P2：budget+视锥排序能覆盖距离hysteresis，旋转视角造成high反复卸载/重拉

证据：streamingModel.update(:68–77)active在unloadDistance内可以候选，但wanted按visible-first/distance在maxHighBytes里重新挑；任何不在wanted的active立即unload。因此移动较少、只转头使另一组chunks进入视锥时，也能把仍近的active/正在decode块移出预算；转回后重下载/解析。near/far hysteresis不抑制这种budget/frustum抖动。

最多64chunks、200ms调度已有限界，不是无限queue bug。建议记录lastUsed/activated和短minResidenceMs，frustum主要用于新load优先级，已有near驻留在不超budget时优先保留；需要容纳更近块才确定性evict，远>unloadDistance/coarse模式则照旧释放。pending取消后保留当前并发/预留到settle的安全约束不能放宽。

最小streamingModel.js、panel（显示已实际返回cancelled/unloaded）。手动同地点左右转动，看完整下载bytes/cancel/unloaded/active变化和frame间隔，不宣称全部网络流量已统计。

### F7 P2：拾取先raycast隐藏coarse，再过滤visible，CPU重复测试

证据：picking.js:7递归intersectObjects全部roots，命中后才沿ancestor检查visible。固定Three Raycaster.js:240递归只按layers/raycast返回值控制，没有render-style visiblefalse裁剪。P4高块active后对应coarse.visible=false，却仍在building子树，所以pick可测试hidden coarse及active high，再丢隐藏hit。

建议拾取前跳过不可见祖先子树，只向raycaster提供真正可见pickable roots/mesh列表；以applyDoc/streamswap/visibility变更更新有界cache，保原building/objectId选择与nav marker语义。不先加BVH/新依赖。最小picking.js与sceneRuntime/streamingModel的visible roots接点。新增真实pickElapsedMs/hitCandidates；不是每帧热点，优先级依据用户“点击延迟”与手动记录再定。

### F8 P2：多次模型复核的coarse Blob保留到退出；面板只显示chunkcache

证据：api createDraftAssetResolver(:41–56)非chunk cache+URLSet直到editorunmount；publicHttp同设计，但一visitor冻结单模型更有界。editor连续比较多个modelversion时coarse URL仍留cache；ReimportReview两个GLBparse/GPUgraph加主editor共最多3份，并非共享Blob就共享GPU。sceneMetrics.chunks仅getChunkStats，不能用它推断全页缓存或总显存。

第一批建议mobile复核切before/after单canvas，主editor暂停；关闭dialog各canvas.dispose已有正确释放GPU。若要回收旧coarse Blob，需Root明确扩展P4的chunk-only租约合同：例如function.acquireModel仅kindmodel/exactscene.glb，跨canvasrefcount，每份当前coarse一直持有lease，model切换/画布离开才release。不能chunkunload时释放coarse，也不能按assetKey盲revoke杀其它compare消费者。

可先只给genericcache计实际Blob bytes/count，并标context/page scope；coarse acquire/release是额外协议范围，非当前审计已实施。需要files：两个resolver、leasehelper、modelLoader/runtime；保非模型template/preview缓存合同、公有allowlist与visitor隔离。

### F9 P2/后续：碰撞线扫、历史全克隆与drawcalls不随LOD自动下降

collision.js每移动X/Z子步扫描全部colliders且重算sin/cos；editor每command两次clone、多次JSON.stringify、60条before/after全snapshot。nodeFor非building选择也每帧分配children数组再find。这些是可确认复杂度/分配，尚无耗时排名。

先在metrics增加update/stream/pick/applyDocument/renderSubmit CPU阶段耗时和场景规模。碰撞可预缓存yaw basis，真正需要时再给小范围grid broadphase并保disabled/bounds/半径边界；history patch比小Map更大scope，暂不混入生命周期批次。

Meshopt LOD减少三角并不保证降低node/material/drawcalls；currentcoarse/high并未merge所有material batch。如果actualrenderer.calls很高且人工GPU/CPUprofile相符，再设计受限chunk内batch，不能blindmerge跨atomic构件/材质或让globalanchors重编号。

## 指标可信度与建议补充

现有强项：RAFrawdt没有用导航clampdt假算FPS；renderer.info是当前renderer实际calls/triangles与geometry/texture计数；encoded budget与GPUnotmeasured明确；JSheap不可用N/A；独立rootfetch取消、不互杀共享URL；chunk ABA/refcount/lateGPUdispose/coarsefallback不需重写。

应补：
- visibility/context samplingStatus、pause reasons、warming、真正窗口起止和runtimeContext（public-main/editor-main/review-before/review-after固定标签）。
- runtime renderQuality/profile/actualpixels；contextlost不能继续当正常frame样本。
- bounded真实CPU阶段 `updateMs,renderSubmitMs,streamScheduleMs,pickMs,lastApplyDocumentMs`。renderSubmitMs不是GPUelapsed；无扩展timer/query支持时GPU时间N/A，不根据CPUms推算GPU。
- 图形可见性与stream暂停状态、pending/active/queued/failed/cancelled/unloaded；lastfailure已恢复时清旧message，避免failed0仍提示未加载。
- chunk fetchedBytes只包括完整Blobbody，包括摘要失败完整body；中止到一半的流量未计，重命名/tooltip为完整资源读取累计，不宣称链路真实transferBytes；cachebytes是编码Blob，不是decode/GPU。
- 非chunk/modelcache实际计量与多个canvas scope（若本批只chunk，不要显示成全页内存）。

## 推荐最小运行时API（待Root授权冻结）

```text
runtime.setRenderActive(active, reason)              # 原因集合；不改变业务session
runtime.setRenderQuality('low'|'balanced'|'high')    # 当前DPRcap，单GLB也有效
runtime.setPerformanceProfile('desktop'|'mobile')  # 更新stream policy/preset，不保存草稿
runtime.getPerformanceStats()/onPerformanceStats() # 延用并增sampling/context/phase/plainfields
stream.setPaused(boolean)                          # 禁止后台asyncfinally继续开新load
stream.setProfile(preset)                          # budget安全收敛、coarse-before-release
metrics.resetWindow(reason)/setSamplingState(state)
```

可保旧调用默认active/auto与旧resolve function。SceneCanvas/ViewerScene active/quality optionalprops由owner传；editor modal/preview给主canvas underlay状态；ReimportReview在mobile只挂当前before或after canvas（desktop两边同屏可保）。visibility/size/profile变化只更新图形层，暂停/恢复不dispose访客模板host、重开ports、丢quiz或改变virtualClientId。

## 文件地图与实施顺序

平台绝对root：C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/

第一批核心（无新包/场景schema/SQL）：
- src/virtual-showroom/scene-core/sceneRuntime.js：active/context/window、DPR、disabled对象、phase instrumentation。
- src/virtual-showroom/scene-core/sceneMetrics.js：validsampling/reset/CPUphase/plainrecord。
- src/virtual-showroom/scene-core/streamingModel.js：paused/profile与安全budget，必要驻留黏性。
- src/virtual-showroom/components/ScenePerformancePanel.vue：手动画质、profile、真实状态/指标标签。
- src/views/showroom/virtualShowroom/components/SceneCanvas.vue、src/virtual-showroom/viewer/ViewerScene.vue：optionalactive/visibility。
- src/views/showroom/virtualShowroom/editor.vue、src/virtual-showroom/viewer/ShowroomViewer.vue：underlay暂停/恢复保持camera/业务状态。
- src/views/showroom/virtualShowroom/components/ReimportReview.vue：mobile单canvas比较，desktop仍支持两边。

可有明确后续scope：screenObjects.js增量、picking.js visible-only、collision.js index/history改法；api/showroom/virtualShowroom.js/publicHttp.js/chunkAssetCache.js若扩coarse modellease；modelLoader/dispose只在证明有缺口时扩，不重开P4已关闭C-I1。streams/oldGLB不需重导或改505发布版。

手动交付记录至少分：旧505单GLB、代表静态分区模型、editor/reviewbeforeafter、模板modal全流程；同设备/浏览器/DPR/画布尺寸/相机路线/窗口/冷热cache/网络。用户切profile/质量前后导出，对照FPS窗口与CPUphase、calls、triangles、完整读取bytes、active/cancel/unloaded；后台恢复/ContextLost/Mobile复核单画布单独验证采样状态。不要由构建/ready或一个小模型推导全部原生CAD和实际终端性能达标。

本次审计结束；源码未修改。以上只是最小可实施建议，等待Root精确任务授权。没有当前FPS样本、GPUprofile或新的desktop/mobile验收数字。
