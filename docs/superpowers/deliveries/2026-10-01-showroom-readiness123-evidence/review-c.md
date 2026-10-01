# Task C 独立静态复核

2026-10-01。审阅者stage11_backend_graph（Task B作者，非C作者）。权威showroom-readiness123.md与task-c-brief.md；已读作者报告、review-c-package、七份当前源码及必要固定Three/既有loader/lease接点。平台base e17dacaf，审阅对象working tree。没有自评B。

## Verdict

**Spec compliance：Approved。Code quality：Approved。无未关闭Critical、Important或Minor。** 七份当前SHA独立读取，与task-c-source-hashes.txt/冻结package均相符。

本席只读源与文件摘要、写此报告；未执行构建、tests、browserQA、模型解析/转换、引擎、WebGL、API或进程。Root editor/ShowroomViewer遮挡接入和可选HTTPS LAN属于D，不由本报告代签；加密上下文问题由Root另行处理，C未改crypto。作者build日志不替代本席静态证明或用户实际设备验证。

## 关键核对

1. **active/后台/context闭包** — sceneRuntime.js:19–22把alive/requestedActive/pageVisible/contextLost合成isActive；:168–181在pause停自己的setAnimationLoop、清输入和取消未提交drag，streaming.setPaused同步，恢复previous=null并resetWindow。文档visibility与canvas context listeners逐实例，dispose:234解绑。固定Three WebGLRenderer先注册的contextlost handler执行preventDefault及context标记，restored重建GL状态；C再处理自己时序，未假称丢上下文后仍有有效FPS。SceneCanvas/ViewerScene onMounted在ready前同步active，watch flushsync；初始模型在microtask加载，不会绕初始inactive先排high。

2. **计时真值** — sceneMetrics.js独立保存原RAF now差值，未复用导航dt上限；resetWindow清previous/samples/window并明确warming/paused/closed。profile/renderScale/实际viewport变化皆重置采样，恢复首帧没有后台长间隔。fps/median/P95在inactive为null，不伪造0或旧值；窗口首尾、sampleCount、resetReason可导出。renderer counts与actualcanvas pixels/DPR来自renderer，encoded bytes明确不是GPU容量，JS heap不可用为null。历史最近载入耗时和visualUpdate显式称最近值，不冒充暂停期间实时GPU测量。

3. **仅取消当前画布租约** — streamingModel.js:34 pump同时检查alive/paused；:85 pause清wanted，只unload无root且pending的当前record，保留已加载高精与coarse/业务身份。unload关闭当前record、cancel自身loader handle/lease；既有chunkAssetCache release幂等且refs0才close，既有modelLoader每handle独立AbortController，未恢复FileLoader共享URL abort问题。晚到then检查alive/record.closed/records.get identity，失败/取消finally清pending后pump仍受paused门槛。取消中记录直到settle仍占pending和reservedBytes，防无限替换；UI分loading/cancelling，不假称马上释放解码/GPU。

4. **恢复/换profile与预算** — setPaused(false)强制按当前相机重排；coarse异步完成新建streaming时传paused:!isActive。setProfile更新manifest.policy再force update，world bounds用building.matrixWorld，原距离/视锥排序语义不扩大。mobile/desktop按原manifest18/28米24MiB、30/45米64MiB和queue2，降档移出wanted的loaded先恢复coarse再释放，取消中预留可暂超新cap但pump不再加新项。inactive force update可收敛预算，pump仍不启动。没有重设globalanchors、源坐标或模型版本。

5. **DPR/scale接口** — runtime.setPerformanceProfile仅auto/desktop/mobile，setRenderScale只1/.75/.5，非法及closed忽略。updateDrawingSize使用min(actualdeviceDPR,profilecap)*scale，desktop2/mobile1.5，CSS尺寸与相机aspect仍容器宽高；实际renderer pixelRatio/setSize同步，非场景缩放。auto有pointer变化listener且dispose解绑，manual不受pointer事件覆盖。抗锯齿没有假装动态切换，原single GLB即使无stream也可调profile/scale。

6. **取消拖拽不提交半成姿态** — 固定Three TransformControls.reset:831只在enabled且dragging时恢复_positionStart/_quaternionStart/_scaleStart，发change/objectChange而非mouseUp；C cancelDrag暂开enabled调用reset，再dragging=false/axis=null。固定pointerUp:773只有仍dragging+axis才发mouseUp，故遮挡后迟到pointerup不会把未提交pose写回业务。applyDocument/setWalking在重用缓存前先cancelDrag，避免签名相同而保留上次未提交节点变换；原document/绑定/导航数据没有被取消动作改写。

7. **disabled不请求与节点复用** — syncExhibits:71–89在create前跳过viewer disabled，非公开预览资源不被resolve；editor保留半透明disabled可编辑。objectId Map、signature(type/name/screen尺寸fit/effectivepreview)与state(mode/enabled/transform)分开：业务字段或transform变化复用原node/texture，只有视觉变化重建。移除/重建先cancelLoad再disposeObject并清Map；type或preview更换不会复用上一node异步加载。navigation仍旧逻辑，不借此改碰撞或raycast。

8. **异步贴图与释放** — screenObjects.js在resolve前、URL后与texture到达后分别检查alive；cancel后不启动新TextureLoader，已开始的late texture只dispose。updateState保持current对象，late贴图按当前enabled/尺寸/fit处理；尺寸fit变更本来触发新signature，旧回调不会挂新node。contain pictureMaterial保存在该node私有闭包，enabled改变刷新其透明度；map与material在node整体dispose路径释放。每次apply计created/rebuilt/retained/updated/removed，created/rebuilt互斥，CPU耗时真实performance.now差。

9. **面板与旧版兼容** — shared panel使用runtime API，导出getPerformanceStats即时值而非仅订阅旧snapshot；profile/scale为当前画布运行状态，不写SceneDocument。P4旧marker路径、singleGLB fallback、epoch模型换版、coarse/high原子互斥与dispose既有机制保持。导出仅当前统计/手填设备网络记录，无资源ticket/privateObjectKey。无自动“达标”判断、虚构FPS或移动端实测。

## 源摘要

以下相对 `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3`：

| 文件 | 独立读取SHA-256 |
|---|---|
| src/virtual-showroom/scene-core/sceneRuntime.js | 120F03BC1F7881CE2BC7AB6B3E3D011DDFD2516ED4224F4E0071D2A32F762CA5 |
| src/virtual-showroom/scene-core/sceneMetrics.js | 1857C8ED656D14A1141DCAAEB274B71C05D49879125F192AD69C81A8D689DD58 |
| src/virtual-showroom/scene-core/streamingModel.js | 4638EE6B491C6C49FA93A0995B48F12984F2763EBE164FA1DB6B34ED10EE74B7 |
| src/virtual-showroom/scene-core/screenObjects.js | A936248D90905735A7274988007C1A7A8D116CDD4042EBA0DDF62FD7D063B5CA |
| src/virtual-showroom/components/ScenePerformancePanel.vue | E5A8926061FA77F17DB6FB13170E7A581A43C148D80B6D045CB5496CCB459E2E |
| src/views/showroom/virtualShowroom/components/SceneCanvas.vue | A2EC826E929144F52971A653F5231B48B2C84AE3CF59242946E3BB1B8A1B80A9 |
| src/virtual-showroom/viewer/ViewerScene.vue | 0EFAC5BE53759B50B40D7347578E412D9CDB7B407863A768D62A7222AF222A53 |

Root最终构建、D接点、505/原11保留与用户设备手测另行收证。本次批准只说明所列静态代码符合冻结要求，没有把背景/多画布/contextloss/真实手机FPS用自动手段验证过。
