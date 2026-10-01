# Readiness 123 Task C 实施交付

2026-10-01。Authority：SDK docs/superpowers/contracts/showroom-readiness123.md、同scratch task-c-brief.md Task C/Global。平台基线e17dacaf，原featurecheckout；本任务仅授权UI7文件。源现锁定返Root，等待独立静态审阅；作者不自批功能通过。

## 精确源范围与接口

平台ruoyi-ui-vue3下修改7文件：
- src/virtual-showroom/scene-core/sceneRuntime.js
- src/virtual-showroom/scene-core/sceneMetrics.js
- src/virtual-showroom/scene-core/streamingModel.js
- src/virtual-showroom/scene-core/screenObjects.js
- src/virtual-showroom/components/ScenePerformancePanel.vue
- src/views/showroom/virtualShowroom/components/SceneCanvas.vue
- src/virtual-showroom/viewer/ViewerScene.vue

无新增helper/依赖；未改Root editor/list/guide/ShowroomViewer、A/B/Worker/Java、raycast/碰撞/距离排序/DB、模型或模板原件、505或原11用户文件。Root负责遮挡active表达式整合和最终fresh build/启动。

接口：
- runtime.setActive(boolean)，非法类型与closed调用忽略。
- runtime.setPerformanceProfile('auto'|'desktop'|'mobile')。
- runtime.setRenderScale(1|0.75|0.5)，严格数值，非法/closed忽略。
- SceneCanvas.active、ViewerScene.active，Boolean默认true；onMounted ready前先同步，watch flushsync；原getRuntime/ready接口保留。
- 内部stream新增setPaused(boolean)、setProfile('desktop'|'mobile')，构造支持paused初值。
- metrics增加runtimeState/getStats/resetWindow/visualUpdate，原subscribe/timing接口保留，输出仍plain无凭据数据。

## 实现行为

### 生命周期与可靠采样

requestedActive、document可见性、contextlost共同决定isActive；每canvas有自己RAF、stream、listener。页面隐藏/父activefalse/contextlost时停该renderer循环，清当前输入；stream只取消本canvas尚未完成highrecords，loaded high/coarse和业务对象/身份保留。其它canvas的共享Bloblease引用不会被传播取消，继续用P4独立rootfetch与record闭包/refcount。

async finally pump也检查paused，不能在标签隐藏或underlay暂停时继续开新高精load。取消decode不可立刻停止时仍在pendingSet/encodedreserved计量到settle，防替代请求失控；loading与cancelling分开显示。恢复重置导航RAF previous与FPS previous/window、按当前camera/transform/profile重排；新加载coarse在inactive完成时创建的stream也是paused，不偷偷先启动high。

document visibilitychange、webglcontextlost/restored和auto pointerprofile监听都有dispose解绑。contextlost样本paused/N/A；恢复先校实际绘图尺寸再resume。profile/scale/实际viewport变化同样清窗口，避免把跨画质/后台长间隔混进当前FPS/P95。windowStartMs/windowEndMs、samplingStatus warming/sampling/paused/closed、resetReason、requestedActive/active/hidden/contextLost/pausedReasons全部plain记录。保原rawRAFdt，不用行走dt clamp伪算FPS。

暂停依赖边界：固定Three TransformControls.detach不结束dragging，reset要求enabled。若遮挡发生在未完成拖动中，原姿态可能只改了3D节点但尚未向父emit保存。runtime使用documented reset回滚开始姿态，结束dragging/axis而不派mouseUp业务提交；applyDocument和试走也先取消未完成gesture。防增量state签名缓存保留未提交pose。恢复editor会重新attach当前选择，保持原camera和文档/导航/绑定。

### 运行profile和像素

auto按原pointer:coarse检测（动态监听），manualdesktop/mobile可覆盖。effective DPR上限desktop2/mobile1.5；actualDPR=min(devicePixelRatio,cap)*renderScale，CSS大小/cameraaspect不随scale变化，只改renderer实际pixels。AA保持初始化值，没有假作动态AA切换或重建context丢对象。

切profile同时更新原manifest policy：desktop30/45米64MiB，mobile18/28米24MiB，queue2原界限。按同原distance/frustum算法收敛新budget，没有重写优先算法；新budget无法容纳的loaded块先恢复coarse再dispose/release。降档时旧已cancel parse可暂时让reservedEncodedBytes超过新cap直到settle，不开启额外请求、也不伪称即时内存回收。inactive时更新profile会安全收敛预算但不pump。

旧无marker单GLB也可选profile/renderScale，不替换模型、不改SceneDocument/源单位/锚点/位置/草稿/发布。指标报告requested/effectiveprofile、scale、actualpixelRatio/pixels，UI手调与本地JSONexport保持现安全范围。

### 业务展项增量与disabled公共行为

exhibitNodes按objectId缓存。视觉签名含type/name/屏幕尺寸和fitMode/effectivepreview引用；仅这些改变时cancel旧preview/dispose旧node，再建一份新visual。transform/enabled/其它业务字段不重建几何/贴图，仅改变当前节点状态和可见性/opacity。选择查Map，保原ID优先及building特殊选择；导航仍原定义创建，没有改碰撞/导航算法。

viewer在create前排除enabledfalse，故不请求不在publicmanifest中的disabledpreview；editor仍可见半透明编辑disabled对象。mode切换按同document同步对象集合，不删除真实business数据/binding/graph。

previewresolve前与URL到来后均检查alive，取消后不再开启新的TextureLoader；已进行decode的迟到texture.dispose、不挂到替换后的objectId节点。回调读取该节点当前state，disabledopacity不会被旧闭包覆盖。类型/引用/尺寸变更不复用旧异步到新node。每次真实apply的lastVisualUpdate记录CPU elapsed、created/rebuilt/updated/retained/removed计数，created与rebuilt互斥，便于用户对照同一字段编辑。

## UI和记录

共享panel新增当前画布profile与renderScale（即使单GLB也可用），显示有效档位、samplingstatus/contextlost和说明。高精状态多cancelling列，完整资源读取累计说明中途取消流量未计；资源就绪/载入phase不当作GPU elapsed。geometry/texture仍数量、encodedBlob仍文件容量、JS heap不可用N/A。指标不是全页面GPUmemory或帧率验收证明；无自动达标文案。

## 验证证据与source锁定

最终npm.cmd run build:prod：exit0，built in12.10s，workdir平台ruoyi-ui-vue3。完整同scratch task-c-ui-build.log。源码7份SHA记录task-c-source-hashes.txt；目标范围git diff --check exit0，仅既有LF/CRLF规范提示。Root仍将按其它任务整合后的最终源fresh build。

没有运行自动tests、真实FPS采样、browserQA、模型解析/转换/WASM/engine初始化、API/DB/服务/安装/提交。本次代码/构建不是功能或终端性能手测通过；源锁定后除Root review修复授权外不再改。

## 集成concern（scope外已及时报Root）

Root需将editor遮挡bool传SceneCanvas.active，明确viewer模板遮挡接ViewerScene.active；单setInputEnabledfalse只禁输入，不能替代active。Root主editor/preview/quiz/port状态保持原业务隔离，本任务不会销毁模板room。

可选LAN HTTP入口有既有secureAPI依赖：schema/hostSession/roomRouter直接crypto.randomUUID，streamingManifest/chunkAssetCache直接crypto.subtle.digest；这两API在W3C Crypto接口标SecureContext，getRandomValues可作为强随机UUID基础。普通http RFC1918地址通常无localhost安全例外，LAN手机模板启动/高块摘要路径可能不可用。官方接口依据：[W3C WebCrypto Crypto interface](https://www.w3.org/TR/webcrypto/#crypto-interface)。此为规范与源码交叉判断，不是手机运行测试。

已报Root选择真正可用的secure入口或给对应owner明确fallback scope；不得用Math.random降级port身份或跳过SHA。上述文件不归本C，故未私自修改。UI package只静读已有依赖，未安装或调用加密引擎；不把此concern隐去以声称手机链已验收。

其他audit项（hidden coarse raycast、budget/frustum黏性、coarseBlob长期cache、history/index、drawcallbatch）按brief排除，没有借此扩大改写。

后续集成闭合：Root已冻结并接入editor.canvasActive与viewer.active，采用TLS9443/9444双origin解决既有secureAPI依赖；LAN后台凭据改origin-tab sessionStorage且不读写记住密码cookie。该Root D增量由A独立review-d.md最终Approved，D-I1探测地址已闭单；C七文件由B独立review-c.md Approved。此为静态接口闭合，设备信任/HTTPS连接/模板功能/手机FPS仍manual-required。最终跨接口证据见同目录review-final.md；本C未扩源scope或降级加密。

## 用户手动比较建议

- 同设备/浏览器/画布/模型/相机路线下，先auto/scale1记录，再manualmobile/0.75或0.5记录；待warming重新累积后比同有效窗口FPS/P95、实际pixels、calls/triangles/encodedactivebytes。
- 切后台/前台、开关遮挡、contextloss/restoration分别核paused/N/A和新window，恢复不跳camera/累计长后台dt，不影响另一canvas或quiz/帧身份。
- 代表分区模型profile降档与暂停时看loaded/coarse回退、cancel/cancelling/queue2/reserved settle；无stream旧505只调渲染pixels，不改已发布模型。
- 变单展项位置/非视觉业务字段看retained/updated，变type/preview/尺寸看单份重建，disabled访客不出现无权preview错误；独立前后复核多个canvas取消不互杀。
- 源坐标/真实BIM/模板业务/手机连网/FPS目标均仍由用户手测；没有当前达标数字。
