# 展厅 1/2/3 完善实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复实际导入/模板流程缺口，补充可靠性能控制与手测材料，运行项目供用户验证1/2/3。

**Architecture:** 保留现有模型/权限/模板/发布与访客隔离契约；定向修复UI→provider语义、quiz单房间权威和Ebook副本；按画布生命周期与profile调度渲染/分区。材料只创作/复制/构建，不代替实际验收。

**Tech Stack:** 原Java17/Vue/Node22/Three0.186.1/SDK0.2.0及七固定Worker依赖。无新增/升级依赖。

**Spec:** docs/superpowers/contracts/showroom-readiness123.md。用户已选择1/2/3并授权完成后启动；沿用并行执行和用户手动验证，不重复方案许可/TDD流程。

## Global Constraints

- 平台e17dacaf/SDKb049ba0，原checkouts、codex/showroom-readiness123，505 ONLINE/draft6/public2/原digest/模型与11原用户文件保持。原SDK untracked保持。
- 不自动功能测试/浏览器QA/模型解析转换/引擎初始化；允许build/staticreview/纯创作复制/模板编译打包/ownedstartup/read-only保留。真实图纸/模板/终端FPS待用户验收。
- 无生产SQL/Nacos/对象存储/现场/线下/模板原件写入；不snapshot/自动发布/改505，不升级依赖，报告不含秘密。
- 模型原100MiB默认合计、chunk64×32MiB/queue2/high desktop64MiB/mobile24MiB保持；原高身份/坐标与私有IFC排除不变。
- 作者只写指定文件，Root负责shared editor/list/guide/material整合/启动/提交；review交叉不自批。

## Review Focus

1. DXF块effective图层/角色匹配、floor厚度与隐藏旧字段；未知OBJ/STL不能以默认m冒作已确认。
2. 单材质fullgroup与drawRange/index语义，clone-only清groups与既有Float32上限；不能丢face材质/源high。
3. quiz同屏跨房间、master返回首页分数与普通重置语义；访客/owner/物理边界不放宽。
4. inactive→active、visibility、同时复核canvas、取消旧load与node复用，FPS窗口不含暂停；profile→实际DPR和chunkbudget一致。
5. 副本构建/SDKalias/ZIP来源与private路径、readonly原template；静态材料不泄密、不开同管理origin执行模板、不编造验收。

## Task A：导入路径与单材质LOD

**Files:** Worker src/cad/dxfAnalysis.js、src/pipeline/streamingLod.js；UI components/DxfCalibration.vue、ImportWizard.vue；可新增同components的ImportReport.vue用于结构报告，先声明。不得改Runtime/C或Rooteditor/API/B文件。

**Interfaces:** preflight.blocks[].insertLayers固定[{name,count}]来自document.instances；已有options schema不改。复用现有calibration/partial/review接口。

- [x] 设备块实际有效图层与equipment角色交集门槛/显示；floor thickness+role字段清理。
- [x] OBJ/STL确认撤销与提交gate；中文结构报告+原JSON展开，预算仅actual部署能力。
- [x] 严格等价单材质fullrange clone-only group处理，不改其它LOD/identity/Float32约束。
- [x] Worker syntax/UIbuild覆盖，独立report与crossreview，用户手测复现步骤，无engine/tests。

## Task B：真实模板业务链

**Files:** Java service/virtual/VirtualInteractionService.java；UI components/InteractionEditor.vue；template-host/quizAdapter.js；新scripts/virtual-showroom/prepare-readiness-templates.mjs及必要同目录固定patch文件。模板原件只读；副本App.vue修改可由脚本精确patch。

**Interfaces:** 固定QUIZ_SCREEN_MULTIPLE_ROOMS；现有graph/quiz函数协议不加字段。准备脚本最终向Root报告固定ZIP路径和安全manifest，不直接改前端public/数据/发布。

- [x] server唯一membership + UI禁选/可修复已有冲突；返回首页权威清分只在现有授权分支。
- [x] 三真实模板安全副本、SDK已构建当前产物的精确alias、Ebook远程welcome包装、build与独立ZIP/hash清单。
- [x] Javacompile/UIbuild/模板build必要覆盖，原件hash前后报告与crossreview；不安装/执行模板业务/上传/DB。

## Task C：性能与生命周期

**Files:** scene-core/sceneRuntime.js、sceneMetrics.js、streamingModel.js、screenObjects.js（必要仅生命周期）；ScenePerformancePanel.vue、components/SceneCanvas.vue、viewer/ViewerScene.vue。新增pureprofile helper允许先报；不改Rooteditor/list/guide或A/B/Java。

**Interfaces:** runtime.setActive(bool)/setPerformanceProfile(auto|desktop|mobile)/setRenderScale(1|.75|.5)，SceneCanvas.active默认true；metrics新增profile/scale/active状态，Root使用active接点。

- [x] 页面/画布暂停RAF+自己stream队列，恢复重置计时/重排，无别的canvas取消传播。
- [x] profile/DPR/renderScale与实际策略切换、可靠面板/记录，保预算和身份。
- [x] disabled visitor不请求、objectId节点视觉签名差量更新、贴图/迟到/类型变化正确释放。
- [x] UIbuild与独立report/crossreview，不实际采FPS/QA/引擎。

## Task D：Root材料、整合与运行

**Files:** UI index.vue/editor.vue、viewer/ShowroomViewer.vue、新components/ReadinessGuide.vue；新scripts/virtual-showroom/prepare-readiness-models.mjs；public/readiness-materials只safe download模型/ZIP/manifest；start-local.ps1、prepare-lan-preview.ps1/lan-preview.mjs；LAN-only凭据隔离utils/auth.js/views/login.vue，手测docs与SDK文档/证据。

**Interfaces:** D消费C.active与模板ZIPmanifest；模型准备仅已有generated源/hash，资料来源与manual-required标签明确，不调用import。

- [x] 新列表材料入口与三个验证操作/模型下载/模板候选清单，Rooteditor遮挡active接点，不动11文件。
- [x] 纯材料复制、模板安全ZIP下载集成，实际候选真实图纸只给路径/待确认说明，不擅自公开私人Downloads文件。
- [x] 可选HTTPS LAN9443/9444入口仅本机RFC1918精确origin与runtime/public代理；默认localhost，不开公网/CORS通配/防火墙/系统trust。LAN-only admin tabstorage+禁remember密码，默认cookie保留；不能以port隔离cookie。
- [x] fresh覆盖build、independent cross/finalstaticreview、重要问题修复，owned启动与health/505/11hash回读。
- [x] exact本地commit/手测说明与已完成/待用户证据区分，不push/自动发布。

## 执行裁定

直接用户授权和developer持续执行/并行要求优先于skill额外reapproval、强制TDD或串行/删除scratch。同scope的readonly审计先定位证据，冻结此spec/plan后并行三个作者；原3agent上下文复用，交叉review。Root不把未提供真实IFC/DWG、未运行用户终端的证据勾成验收成功。可选路径问题未收到回复，先采用505布局与已有真实模板的独立材料；不借此修改505。
