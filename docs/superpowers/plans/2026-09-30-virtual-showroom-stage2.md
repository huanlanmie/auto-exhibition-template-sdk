# 虚拟展厅第二阶段实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 完成roadmap P2的模型/CAD导入、质量档与重导复核，提供本机可手测入口。

**Architecture:** 扩展现有私有Worker provider，不重建SDK或线下网关；Java保持归属/资源/CAS负责分析代理及锚点重导，Vue向导负责明确校准和人工确认。模型版本仍由用户确认应用，发布保持不可变。

**Tech Stack:** 现有Java17目标/Spring/MyBatis/Redis、Vue3 JS、Node22、Three0.186.1、dxf-parser1.1.2、occt-import-js0.0.23。

**Spec:** 已认可总体方案、roadmap P2及本轮明确契约 `docs/superpowers/contracts/virtual-showroom-stage2.md`。用户已要求继续后一个阶段，执行本阶段全部既定任务，不再重复询问来源格式或执行授权。

## Global Constraints

- 用户要求仅手动功能验收：不新增/运行unit/integration/E2E/浏览器业务QA；构建、语法/编译、静态独立复核和就绪检查允许。
- 保持既有用户修改、505已发布案例、现场Electron/设备状态；仅精确提交本任务源码。
- 私有源、HMAC、归属权限、不可变资源摘要、CAS及临时工作区预算不减弱；不上传原CAD到第三方服务。
- 唯一单位转换；清晰声明静态/材质/三维混合/非闭合/纹理/几何预算限制，不称转换无损或未手测已验收。
- 后台/前端/Worker共同契约以stage2.md为准；共享入口由root写，agent不自行修改依赖/入口。

## Review Focus

1. FBX axis已转换、OCCT已米制、DXF参考长度覆盖单位：高度/墙厚不得二次缩放。
2. DXF被parser跳过的实体、bulge、INSERT度/弧度/块基点及镜像、混合三维不能静默变成可发布完整墙体。
3. 分析同样守私有源/ZIP/并发/期限边界；sourceHash错配不能套用旧校准；缺失vendor关闭对应能力。
4. 稳定source ID/重复实例/缺失锚点与不可表达矩阵需复核；原业务ID、绑定、导航与公开版保留。
5. 质量档必须实际约束纹理/预算，元数据不能暴露私有字段；发布仍固定模型与完整资源。

## Task A：FBX/STL/OCCT适配（P2-01/02/04）

**Files:** Worker新增`src/converters/fbx.js`,`stl.js`,`occt.js`；可新增同目录small helper，不触碰共同entry/runner/protocol/package。
**Interfaces:** 共同converter context/result/normalizationHint；OCCT classic全局工厂由root提供/vendor白名单。

- [x] 固定Loader版本预检、有界几何/资源、FBX静态烘焙与材质映射、STL法线/颜色边界。
- [x] STEP/IGES单文件解析、米制/精度、节点/颜色与明确identity confidence，不猜库未输出的单位/transform/完整性。
- [x] 交付文件diff、静态复核要点和手测输入建议；不执行转换或功能测试。

## Task B：DXF分析与辅助建模（P2-03）

**Files:** Worker新增`src/cad/dxfAnalysis.js`,`src/builders/dxfSpaceBuilder.js`,`src/converters/dxf.js`；可新增该scope辅助模块。
**Interfaces:** 契约analyzeDxf/preflight/options.dxf与canonical provider result；parserFactory注入Node/浏览器。

- [x] 有界ASCII扫描/编码/实体/图层/块/曲线及混合诊断，sourceHash和真实handle区分。
- [x] 显式校准、角色映射、中心线/轮廓墙、地板/柱、明确门洞、基础设备块、米制高度及对象身份。
- [x] 交付转换边界、手测步骤及具体error code清单；不转换/自动测试。

## Task C：后台与UI校准、重导（P2-03/05业务）

**Files:** Java虚拟模型service/controller/WorkerClient及新ModelReview/Matrix helper；UI virtualShowroom API、ImportWizard、editor、ObjectProperties、新DxfCalibration/ReimportReview、scene-core/anchorMatching。
**Interfaces:** 契约preflight/metadata/anchor/review/apply API、review冻结和CAS、对应UI事件。

- [x] owner/import preflight、真实worker caps/别名；固定meta可读，合理临时源清理。
- [x] 锚点绑定、15分钟复核记录、exact/suggested/ambiguous/missing/world与服务器矩阵计算，原业务对象/绑定不由客户端替换。
- [x] 校准与质量向导、角色/门洞参数、重导确认，替换原直接applyImport路径；首次导入兼容旧metadata。
- [x] Maven release17 skip-tests compile、npm build:prod；交付手测步骤与源码范围。

## Task D：共同流水线、质量与整合（root，P2-05）

**Files:** Workerpackage/lock、protocol/config/jobWorkspace/runner/convert/main/error/build脚本；新增`api/analyzeRoute.js`,`pipeline/optimize.js`,`pipeline/metadata.js`；阶段文档/手测样本。
**Interfaces:** providers分派、真实readiness/catalog、分析JSON、canonical normalizer、meta锚点/质量目录。

- [x] 固定依赖与实际vendor路径，保持安全候选选择/包字节/超时/HMAC/并发及旧格式兼容。
- [x] 唯一单位轴归一化、capture sanitized身份在清理前、实际纹理档/预算/报告、元数据目录。
- [x] 分析路由与多入口选择、DXFbrowser+Node parser桥，错误文字映射，不把不支持entity假作成功。
- [x] 生成产品手测用STL/FBX/DXF样本与说明，不执行自动转换；构建三部分，独立交叉复核并修复Important。
- [x] 仅重启本次所需后台/Worker/前端，读取健康/能力就绪，保留505公开版并返回入口与手测清单。

## 执行裁定

继续使用原项目路径，创建`codex/virtual-showroom-stage2`分支承接P1代码及用户未提交修改。root单独提交；现有三个agent分别实现A/B/C，root实现D，所有实现完成后安排互不自评的静态复核。源码scope/共同接口在开始前固定；临时报告在`.superpowers/sdd/2026-09-30-virtual-showroom-stage2`，最终归档交付目录。日志有生成空格可以原样保存，源码/文档做diff whitespace检查。
