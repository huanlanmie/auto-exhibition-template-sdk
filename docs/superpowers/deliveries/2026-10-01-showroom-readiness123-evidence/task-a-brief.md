## Global Constraints

- 平台e17dacaf/SDKb049ba0，原checkouts、codex/showroom-readiness123，505 ONLINE/draft6/public2/原digest/模型与11原用户文件保持。原SDK untracked保持。
- 不自动功能测试/浏览器QA/模型解析转换/引擎初始化；允许build/staticreview/纯创作复制/模板编译打包/ownedstartup/read-only保留。真实图纸/模板/终端FPS待用户验收。
- 无生产SQL/Nacos/对象存储/现场/线下/模板原件写入；不snapshot/自动发布/改505，不升级依赖，报告不含秘密。
- 模型原100MiB默认合计、chunk64×32MiB/queue2/high desktop64MiB/mobile24MiB保持；原高身份/坐标与私有IFC排除不变。
- 作者只写指定文件，Root负责shared editor/list/guide/material整合/启动/提交；review交叉不自批。

## Task A：导入路径与单材质LOD

**Files:** Worker src/cad/dxfAnalysis.js、src/pipeline/streamingLod.js；UI components/DxfCalibration.vue、ImportWizard.vue；可新增同components的ImportReport.vue用于结构报告，先声明。不得改Runtime/C或Rooteditor/API/B文件。

**Interfaces:** preflight.blocks[].insertLayers固定[{name,count}]来自document.instances；已有options schema不改。复用现有calibration/partial/review接口。

- [ ] 设备块实际有效图层与equipment角色交集门槛/显示；floor thickness+role字段清理。
- [ ] OBJ/STL确认撤销与提交gate；中文结构报告+原JSON展开，预算仅actual部署能力。
- [ ] 严格等价单材质fullrange clone-only group处理，不改其它LOD/identity/Float32约束。
- [ ] Worker syntax/UIbuild覆盖，独立report与crossreview，用户手测复现步骤，无engine/tests。

Authority: docs/superpowers/contracts/showroom-readiness123.md. User1/2/3selected and authorized execution. No tests/engine/browser QA; source author reports are not functional acceptance.
