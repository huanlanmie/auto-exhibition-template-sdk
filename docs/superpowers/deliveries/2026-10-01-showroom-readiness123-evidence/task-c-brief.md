## Global Constraints

- 平台e17dacaf/SDKb049ba0，原checkouts、codex/showroom-readiness123，505 ONLINE/draft6/public2/原digest/模型与11原用户文件保持。原SDK untracked保持。
- 不自动功能测试/浏览器QA/模型解析转换/引擎初始化；允许build/staticreview/纯创作复制/模板编译打包/ownedstartup/read-only保留。真实图纸/模板/终端FPS待用户验收。
- 无生产SQL/Nacos/对象存储/现场/线下/模板原件写入；不snapshot/自动发布/改505，不升级依赖，报告不含秘密。
- 模型原100MiB默认合计、chunk64×32MiB/queue2/high desktop64MiB/mobile24MiB保持；原高身份/坐标与私有IFC排除不变。
- 作者只写指定文件，Root负责shared editor/list/guide/material整合/启动/提交；review交叉不自批。

## Task C：性能与生命周期

**Files:** scene-core/sceneRuntime.js、sceneMetrics.js、streamingModel.js、screenObjects.js（必要仅生命周期）；ScenePerformancePanel.vue、components/SceneCanvas.vue、viewer/ViewerScene.vue。新增pureprofile helper允许先报；不改Rooteditor/list/guide或A/B/Java。

**Interfaces:** runtime.setActive(bool)/setPerformanceProfile(auto|desktop|mobile)/setRenderScale(1|.75|.5)，SceneCanvas.active默认true；metrics新增profile/scale/active状态，Root使用active接点。

- [ ] 页面/画布暂停RAF+自己stream队列，恢复重置计时/重排，无别的canvas取消传播。
- [ ] profile/DPR/renderScale与实际策略切换、可靠面板/记录，保预算和身份。
- [ ] disabled visitor不请求、objectId节点视觉签名差量更新、贴图/迟到/类型变化正确释放。
- [ ] UIbuild与独立report/crossreview，不实际采FPS/QA/引擎。

Authority: docs/superpowers/contracts/showroom-readiness123.md. User1/2/3selected and authorized execution. No tests/engine/browser QA; source author reports are not functional acceptance.
