# 虚拟展厅分阶段开发任务规划

> 范围修订：此前 P1 完成指线上三维、共享内容实例与单屏交互基础，功能仍待手测。用户现已确认保留访客内软件联动；需先补跨项目内容/身份映射、虚拟联动规则和独立业务状态，再推进更多 CAD 格式。详见 [跨项目架构核对与修订建议](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/specs/2026-09-30-virtual-showroom-cross-project-review.md)。此补充阶段尚未实施。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有展厅平台增加可公开参观、登录编辑、复用线下模板实例的虚拟展厅，并逐阶段补齐主流模型与 CAD 格式。

**Architecture:** 管理与发布业务扩展 `mju-smart-show`，现有 Vue 工程增加独立参观入口；Three.js 内核供编辑器与参观端共享。模板 SDK 仅扩展浏览器运行实例与通信，模型转换由独立 Worker 承担，线下网关首期不改动。

**Tech Stack:** Vue3/JavaScript、Three.js、Vite、Java 17 目标字节码、Spring/RuoYi/MyBatis、MySQL、Redis、MinIO、Node.js 转换 Worker；CAD/BIM 适配分阶段接入。

**Spec:** [已认可的 v0.3 方案](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/specs/2026-09-30-virtual-showroom-design.md)

## Global Constraints

- 已发布展厅匿名参观；编辑、绑定、发布、下架和回滚检查登录、对应权限及本人归属。
- 线上复用模板实例与配置，访客独立操作，不转发实体设备控制。
- 显示器使用内容预览，点击后放大运行完整模板；电脑优先，参观端兼容手机。
- 线下内容更新只提示，管理员预览后重新发布；发布时固定完整空间与内容版本。
- 米制、Y 向上、屏幕局部 +Z 为正面；建筑、展项、导航分层，业务编号不依赖网格索引。
- 用户已明确暂缓自动化测试：不写、不运行单元/集成/E2E 功能测试；保留构建/编译、产品输入校验及手测清单。
- 每阶段提供启动/配置说明、可手测入口、手测清单及已知限制；不得把未手测功能写为验收通过。
- 不覆盖现有未提交修改，不自动执行生产 SQL/Nacos 更新，不改造或回写线下 `publishConfig`。

## Review Focus

1. 匿名或其他账号请求管理/草稿资源，应被服务端拒绝；归属检查不能只放列表或前端按钮。
2. iframe 相对 JS/CSS/config/valueMap/媒体必须在同一受控资源基址下正常解析，不能只有首页携带访问凭据。
3. 模板在 App 静态导入期间注册函数时，浏览器 bootstrap 必须已经配置 runtime，不能先连接本机 Bridge。
4. 重新导入模型、复制屏幕和并发保存不能破坏业务 ID、模板绑定或已发布快照。
5. 同一模板的多个访客/标签页、关闭重开与旧回包必须保持隔离；不能仅凭 iframe 声称隔离成功。

上述五项分别落入第一阶段任务 P1-01/P1-07/P1-08、P1-02/P1-06、P1-05、P1-04、P1-06 和对应用户手测项。自动化测试暂不安排。

---

## 1. 仓库边界与现状

| 位置 | 本阶段责任 |
| --- | --- |
| `C:/Users/Administrator/Desktop/auto-exhibition-template-sdk` | SDK 浏览器 runtime、通信/生命周期、文档与任务记录 |
| `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-modules/mju-showroom` | 业务数据、导入任务、模板资源、校验/发布、匿名 manifest/资源 |
| `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3` | 登录编辑器、独立 `showroom.html` 参观入口、渲染内核与模板宿主 |
| `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker`（已实现） | 主流模型转换、资源规范化与后续 CAD/BIM 适配 |
| `C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-gateway` | 精确公开路由、匿名请求头清理；不覆盖现有 bootstrap 修改 |
| `C:/Users/Administrator/Desktop/automatic_exhibition_setup_platform` | 首期保持原有线下模板同步/Bridge 行为；只记录兼容检查，不新增真实控制链路 |

当前 Vue 工程已有 index/mall/landing 多入口；新增参观入口沿用这一模式，使用 JavaScript/Vue，不为该功能重建整个后台。

当前 SDK 默认模块级本地 Bridge；浏览器 transport 必须配合 runtime 初始化和默认实例管理，不能只在 Vue install 时传一个 transport。

模板实例实体的 valueMap 注释与 Mapper 不一致；以已发布 ZIP 为快照来源，数据库 value_map 用途在实际部署中确认。

环境只读检查：Node `22.22.0`；默认 PATH Java 为 `1.8.0_502`，不可直接用于本项目 Java 17 构建。已发现 Maven `E:/development/java/maven/apache-maven-3.9.2/bin/mvn.cmd` 和 JBR 25 `E:/development/java/idea/IntelliJ IDEA 2026.1.1/jbr`，执行阶段在独立构建进程设置工具链并使用 `--release 17`；不改系统全局 Java。

后台现有未提交修改涉及 FunctionLinkage、TemplateSync、网关 bootstrap、SQL 与 docker/copy；新增功能尽量使用独立文件，必要修改先核对原差异。

## 2. 阶段交付

| 阶段 | 交付结果 | 格式范围 | 本轮规划状态 |
| --- | --- | --- | --- |
| P0 基础约定 | 工具链/文件基线、场景/资源/消息契约、手测规则 | 定义能力清单，不开启未实现格式 | 已完成基线与正式契约 |
| P1 完整业务链路 | 登录建厅编辑、模型导入、模板绑定、公开发布参观、下架/回滚、基础手机适配 | GLB/glTF 2.0、OBJ＋MTL/贴图 | 代码已实现、构建与复核完成，待用户手测 |
| P2 一期完整格式 | 转换报告、DXF 辅助建模、三维 CAD、质量档和重导复核完善 | FBX 受限、STL、DXF、STEP/IGES | 已列任务，独立转换计划在进入该阶段前细化 |
| P3 重点扩展 | BIM 语义与已授权的二维 DWG 直接导入 | IFC2x3/IFC4，IFC4x3 ADD2 条件支持；二维 DWG | 已列任务，授权/部署状态决定启用 |
| P4 专用与规模扩展 | 大场景分区、复杂模型与实际需要的动画/原生适配 | 三维 DWG、其他原生格式 | 保留后续任务，不计入一期交付 |

P1 是第一个可交给用户手测的完整版本；P1＋P2 构成一期。P3/P4 不以“计划支持”代替实际启用。

## 3. 任务清单与依赖

### P0：基础约定

- [x] **P0-01 工具链、契约与变更基线**：确认构建命令与现有差异，固定 `SceneDocument/ResourceManifest/ImportReport/RuntimeIdentity` 和消息协议 v1，记录 SDK/前端/Worker 共用约定。输出可执行构建配置及契约文档；依赖：无。

### P1：完整业务链路

- [x] **P1-01 数据、归属权限与草稿 API**：五张业务表、菜单增量脚本、管理接口、乐观锁保存；输出可登录建厅/读取/保存的后台能力。依赖：P0-01。
- [x] **P1-02 私有资源与模板快照**：MinIO 存储门面、资源清单、安全展开实例 ZIP、独立运行源与相对路径；输出已发布实例的受控网页资源。依赖：P0-01、P1-01。
- [x] **P1-03 主流模型基础导入**：独立 Worker、GLB/glTF/OBJ 包处理、导入任务/报告与能力接口；输出可渲染 GLB＋元数据。依赖：P0-01、P1-02。
- [x] **P1-04 渲染内核与登录编辑器**：建筑/展项/导航层、对象树、变换/复制/撤销、碰撞/视点、草稿保存。依赖：P1-01、P1-03。
- [x] **P1-05 SDK 浏览器 runtime**：显式初始化、BrowserHostTransport、握手/MessagePort、context/bridge 销毁；保留本地默认。依赖：P0-01，可与后端和模型开发并行。
- [x] **P1-06 屏幕绑定与模板宿主**：实例选择、预览封面、iframe 放大/关闭、访客状态隔离、旧模板受限兼容。依赖：P1-02、P1-04、P1-05。
- [x] **P1-07 校验、发布与版本更新**：固定草稿校验、不可变资源、原子发布、更新提示、下架/回滚。依赖：P1-01、P1-02、P1-03、P1-06。
- [x] **P1-08 独立匿名参观入口**：`showroom.html`、公开客户端、manifest/资源会话、漫游/点击/列表、精确网关入口。依赖：P1-04、P1-06、P1-07。
- [x] **P1-09 手机适配、构建与手测交付**：触控/视点/退出、部署回退与运行源示例、跨仓库构建、启动/迁移说明和手测清单。依赖：P1-08；功能反馈优先回到对应任务修复。

详细任务、文件地图、接口和构建命令见 [第一阶段实施计划](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/plans/2026-09-30-virtual-showroom-stage1.md)。

### P2：一期完整格式

- [ ] **P2-01 FBX 受限转换**：新增 Worker `src/converters/fbx.js`，静态节点/材质映射、版本预检、内外贴图与降级报告。消费 `ConversionRequest`，产出 `ConversionResult`；用户手测几何/材质/坐标，动画不作完整保留承诺。
- [ ] **P2-02 STL 几何转换**：新增 `src/converters/stl.js`，ASCII/Binary、单位校准、法线及默认材质。复用导入向导；用户手测已知尺寸和单位缺失提示。
- [ ] **P2-03 DXF 辅助建模**：新增 `src/converters/dxf.js` 与 `src/builders/dxfSpaceBuilder.js`，前端新增 `components/DxfCalibration.vue`；图层/块/墙高厚度/门洞/轮廓问题复核。用户手测至少线、多段线、圆弧、块、开口和二维/三维混合文件。
- [ ] **P2-04 STEP/IGES 三维 CAD**：新增 `src/converters/occt.js`，接入 OCCT 系列解析器、精度/单位与模型树/颜色报告。用户手测毫米/米、装配及失败曲面，必要展示材质由编辑器补齐。
- [ ] **P2-05 质量档与重导完善**：新增 `src/pipeline/optimize.js`、`scene-core/anchorMatching.js`、`components/ReimportReview.vue`；电脑/手机资源档、锚点可信匹配/歧义/缺失复核、转换预算。用户手测重新导入后屏幕编号与模板关系保持，以及质量档差异。

五项均依赖 P1 的转换/资源/草稿契约；FBX、STL、DXF、OCCT 解析器可以并行开发，最后统一回到 P2-05 和手测清单。

### P3：重点扩展

- [ ] **P3-01 IFC 建筑转换**：新增 `src/converters/ifc.js`、`src/metadata/ifcMetadata.js` 和前端 `components/IfcImportOptions.vue`；几何、楼层、GlobalId、属性与局部坐标。IFC2x3/IFC4 与 IFC4x3 ADD2 分别声明、手测；产物仍为 GLB＋metadata。
- [ ] **P3-02 二维 DWG 直接入口**：新增 `src/converters/dwg2d.js` 与 provider 配置；选定授权/可部署转换器后启用。未部署时仅提示原工具导出 DXF，不宣称直接支持。
- [ ] **P3-03 转换器部署与能力登记**：完善 Worker provider 自检、版本/实体范围、授权状态、能力 UI 与部署说明；启用状态来自本部署实际能力和用户手测结果。

P3-01 可独立于 P3-02 推进；P3-03 汇总已完成适配，不为未部署 provider 生成成功结果。

### P4：专用与规模扩展

- [ ] **P4-01 三维 DWG 专用适配**：独立 `src/converters/dwg3d.js`，验证三维实体、代理对象、外部引用与标准输出；不沿用二维能力标签。
- [ ] **P4-02 大场景分区与资源预算**：区域拆分/LOD/延迟加载、资源回收与真实终端预算，以手动性能记录校准。
- [ ] **P4-03 按需动画/原生格式入口**：仅在实际需求确认后新增 provider，分别声明转换范围，不计入 P1/P2 完成条件。

## 4. 第一阶段并行方式

P0-01 先固定契约。后端草稿/资源、SDK runtime 可并行；模型 Worker 在资源协议固定后接入；编辑器、模板宿主、发布及公开参观依次集成。涉及同一文件的任务顺序修改，不让多个实现者同时编辑入口、schema 或 SDK registry。

每个任务交付：明确文件差异、接口说明、构建结果或环境限制、对应手测步骤。使用任务 ID 更新状态，阶段手测问题归回原任务；不在状态表中预先勾选功能通过。

## 5. 本次规划的完成范围

已完成方案认可记录、仓库/工具链只读核对、21 项任务拆分、P1 详细实施计划及用户手测清单。未新增产品代码、安装产品依赖、执行数据库/网关配置或运行功能测试。

后续先执行 P0-01 和 P1；P2/P3 转换模块采用独立详细计划，沿用这里已固定的依赖、接口和交付范围，不重新询问来源格式。
