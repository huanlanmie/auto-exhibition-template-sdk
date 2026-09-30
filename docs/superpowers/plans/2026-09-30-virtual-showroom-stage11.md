# 虚拟展厅第一阶段跨项目软件联动补充计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 补齐访客独立的软件跨屏联动及抢答业务，构建后启动可供用户手测的管理前后端和线上资源服务。

**Architecture:** 保留现有模型/场景/发布基础，场景增加固定的软件规则图，管理端从现场来源做受控映射。浏览器展厅会话拥有多个有限运行实例但只显示一个放大窗口；SDK 保留线下 WS，浏览器通过认证端口交给访客内路由，不连接现场设备。

**Tech Stack:** 现有 Java/Vue JS/TypeScript SDK、Three 0.186.1、Redis、Node22 Worker、本地 Java17+。

**Spec:** [跨项目核对与用户确认](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/specs/2026-09-30-virtual-showroom-cross-project-review.md)、[v1.1 明确契约](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/contracts/virtual-showroom-v1.1.md)。用户已要求按修订方案开始完成并启动项目，本轮直接执行，不再次询问执行方式。

## Global Constraints

- 线上操作只在当前访客范围；真实设备控制和现场状态写入禁止，现场 Electron 项目不做无关改动。
- 规则与实例一同冻结，草稿/CAS/权限/资源会话继续使用第一阶段机制。物理规则只读解析，不原样公开。
- 不新增或运行单元/集成/E2E 自动化功能测试或浏览器 QA；执行构建、静态复核和启动状态检查，由用户手测。
- 现有用户未提交修改保持独立，协调者负责提交；秘密只写忽略的本地配置，不在输出展示。
- 启动授权包含本地服务，保留无关进程；不注册本地试运行服务到现场 Nacos 发现组，不改远端 Nacos 配置或做破坏性数据库操作。

## Review Focus

1. 旧 binding 调用实际到达已映射虚拟屏幕；未映射/硬件目标拒绝，不能把全部非 local 都当硬件。
2. 两个访客/标签页的逻辑屏幕、函数调用、事件、抢答赢家和状态独立。
3. 被调函数必须在固定 manifest 与运行注册表中；旧回复、TTL 循环、未注册目标及多目标结果不丢等待项。
4. 关闭放大窗口后状态保留，离开展厅彻底清理；有限隐藏模板不能无限增长或留下媒体/定时器。
5. 内容源、草稿、公开版和未知现场实装状态区分；启动目标、网关路径、服务端口和私有存储同源配置正确。

## Task 1: 后台规则与内容来源

**Files:** 新建 JAVA/service/virtual/VirtualInteractionService.java；修改 VirtualScreenBindingService、VirtualShowroomService、VirtualShowroomValidationService、VirtualResourceSessionService、VirtualTemplateBootstrapService、VirtualShowroomOperationsController；必要新增 virtual 专用 Mapper，不修改用户正在改的 FunctionLinkage 文件。

**Interfaces:** v1.1 interactionGraph/catalog/interactions REST；私有规则到公开虚拟规则映射；来自固定 config.json 的函数清单。

- [x] 实现授权来源/函数目录及设备主题标签、固定资源读取、内容源/草稿/公开版本对照。
- [x] 校验并持久化规则/组/抢答房间，普通保存与发布也验证；现场规则只提供可映射建议及诊断。
- [x] 公开会话注入固定能力与函数清单，bootstrap 标记浏览器软件路由能力；保持 secret gate 与相对资源。
- [x] Maven compile release17、skip tests；记录产物、任务复核和手测步骤。

## Task 2: SDK 双宿主路由

**Files:** SDK src/sdk/types.ts、runtime/communication/browserHostTransport.ts、templateBridge.ts；docs/api/templateRuntime.md。

**Interfaces:** BrowserHostConfig optional capabilities.virtualRouting；外发软件 targets 与严格收发身份校验，host sdk_ready 逻辑clientId。

- [x] 声明软件路由能力时允许合法非 local 外发，旧默认保持 local-only；不改变本地 WS 行为。
- [x] 入站函数继续限制为当前接收 runtime，清理/等待项/过晚初始化不回归。
- [x] pnpm build 及静态复核；交付原生重建与旧包兼容说明。

## Task 3: 访客宿主、抢答及编辑界面

**Files:** UI virtual-showroom/template-host 下 roomRuntime/runtimeRegistry/roomRouter/quizAdapter 及 hostSession/TemplateRuntimeHost；viewer/ShowroomViewer；管理 editor 新 InteractionEditor，API virtualShowroom；scene-core/schema 最小图默认值。

**Interfaces:** createVirtualRoomRuntime 与 hostSession 扩展按 v1.1；上述后台目录/图 REST；不修改 root-owned vite.config.js。

- [x] 替换单全局活动实例为访客房间注册，稳定逻辑 ID，函数注册白名单，按需目标启动，结果/事件/TTL 及退出清理。
- [x] 抢答房间纯业务适配，匹配实际 quiz-buzzer 的函数/状态；赢家和控制权限正确，不连接现场。
- [x] 管理端软件规则/组/房间编辑与来源映射、更新版本视图；预览和公开端都使用同一房间宿主。
- [x] 有限隐藏实例、媒体处理及原比例前台窗口，关闭保留状态；npm build:prod、静态复核、手测步骤。

## Task 4: 整合、本地启动与交付

**Files:** 平台 scripts/virtual-showroom/start-local.ps1、忽略的 .codex-run 配置/日志、Vite 可选 proxy env、docs/virtual-showroom/stage11-startup.md；本计划进度及手测清单。

**Interfaces:** 实际可访问 URL、运行端口/PID/日志、启动配置和停止指定本次服务方式。

- [x] 整合契约并复核三部分，修正发现的问题，精准提交功能差异。
- [x] 核查依赖与目标数据库，完成非破坏性的启动前置条件；必要阻塞明确说明。
- [x] 启动所需云后台模块、本地云 API 网关、前端、Worker，最小检查确认进程与 HTTP 就绪，不做业务自动验收。
- [x] 返回真实访问地址、入口和服务记录，用户自行手测；保留既有修改和无关进程。
