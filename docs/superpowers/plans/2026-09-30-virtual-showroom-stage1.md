# 虚拟展厅第一阶段实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个可由用户手动验证的完整版本：登录创建展厅，导入 GLB/glTF/OBJ，编辑空间与虚拟显示器，绑定已有模板实例，发布后匿名参观。

**Architecture:** Java 业务在现有 `mju-showroom` 内扩展，Vue 多入口工程新增独立参观页，Three.js scene-core 同时服务后台编辑与参观。独立 Node Worker 生成标准模型；SDK runtime 与平台模板宿主通过认证握手和 MessagePort 通信，发布快照及资源会话固定版本。

**Tech Stack:** 现有 Vue3/JS/Vite、Three.js、Node 22、Java 17 目标字节码、Spring/RuoYi/MyBatis、MySQL/Redis/MinIO；Worker 的浏览器转换环境只用于产品转换/封面作业。

**Spec:** [v0.3 设计与最新手测约定](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/specs/2026-09-30-virtual-showroom-design.md)

## Global Constraints

- 本计划覆盖 P0-01 与 P1-01～P1-09；FBX/STL/DXF/STEP/IGES、DWG/IFC 按总任务表后续推进，不在首个版本假称启用。
- 不新增或运行单元、集成、E2E 自动化测试；构建/编译和导入/发布的产品校验照常实现。用户手测结果独立记录。
- 匿名只读已发布快照；管理请求检查操作权限与本人归属；线上不调用或改写线下设备配置。
- 模板源为已有已发布实例 ZIP；不调用 `DeviceThemeConfigServiceImpl.publishConfig`。
- 固定公开版本、稳定分享码、旧会话固定 revision；草稿保存不影响线上，下架不删除用户草稿。
- 米制、Y 向上、屏幕 +Z 为正面；`objectId` 是屏幕业务 ID，复制创建新 ID，建筑与业务展项分层。
- 不覆盖用户未提交差异。使用新增文件和精确补丁；源仓库各自记录变更，不把全部工作区一次性 stage。
- SQL、Nacos/存储策略和反向代理更新先交付明确文件与说明，不在开发时自动应用到运行中的部署。

## Review Focus

1. 按 ID 读取/编辑/发布的非 owner 和匿名请求同样受服务端限制（P1-01/P1-07/P1-08，手测 M01/M09）。
2. iframe 相对资源与续签必须锁定原 revision（P1-02/P1-06/P1-08，M05/M08）。
3. 顶层模板函数注册发生前配置 browser runtime，初始化过晚明确失败（P1-05/P1-06，M05/M06）。
4. 重复屏幕 ID、保存冲突、发布失败或模型替换不能覆盖已发布内容（P1-04/P1-07，M03/M07/M08）。
5. 两访客/标签页和关闭重开的状态、消息、计时器相互隔离（P1-05/P1-06/P1-09，M06/M11）。

手测用例见 [第一阶段手动验收清单](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/plans/2026-09-30-virtual-showroom-stage1-manual-checklist.md)。所有条目初始未验收。

---

## 1. 文件根与职责地图

以下短名只用于展开精确绝对路径，拟新增文件当前可以不存在：

- `SDK` = `C:/Users/Administrator/Desktop/auto-exhibition-template-sdk`
- `PLATFORM` = `C:/Users/Administrator/Desktop/mju-smart-show`
- `JAVA` = `PLATFORM/ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom`
- `MAPPER_XML` = `PLATFORM/ruoyi-modules/mju-showroom/src/main/resources/mapper/showroom`
- `UI` = `PLATFORM/ruoyi-ui-vue3`
- `WORKER` = `PLATFORM/virtual-showroom-worker`

| 文件/目录 | 职责 |
| --- | --- |
| `JAVA/controller/VirtualShowroomAdminController.java` | 登录展厅/草稿/绑定操作 |
| `JAVA/controller/VirtualModelImportController.java` | 上传、导入任务与已启用能力 |
| `JAVA/controller/VirtualShowroomPublishController.java` | 固定草稿校验、发布、下架与回滚 |
| `JAVA/controller/VirtualShowroomPublicController.java` | 匿名 manifest、资源会话与续签 |
| `JAVA/domain/{VirtualShowroom,ShowroomModelAsset,ModelImportJob,ShowroomRevision,ShowroomScreenBinding}.java` | 五类持久数据对象 |
| `JAVA/dto/virtual/`、`JAVA/domain/vo/virtual/` | 管理输入、内部作业、公开专用输出 |
| `JAVA/mapper/`、`MAPPER_XML/` 下相应 `Virtual*`/`Showroom*` 文件 | owner 条件、乐观锁、发布版本持久化 |
| `JAVA/service/virtual/` | 存储、模板产物、模型作业、草稿、发布与资源会话服务 |
| `UI/src/virtual-showroom/scene-core/` | JSON schema、模型加载、渲染、拾取、碰撞、资源释放 |
| `UI/src/virtual-showroom/template-host/` | iframe 生命周期、消息路由、访客状态存储 |
| `UI/src/virtual-showroom/viewer/`、`UI/showroom.html` | 不依赖后台身份的独立参观入口 |
| `UI/src/views/showroom/virtualShowroom/` | 登录列表、编辑器、导入向导及属性面板 |
| `SDK/src/runtime/` 与 `SDK/src/sdk/` | 可选 browser runtime、transport 和生命周期 |
| `WORKER/src/` | 受控转换 API、网格适配器、作业目录与标准产物 |

公开前端沿用现有工程 JavaScript/Vue；SDK 保持 TypeScript。Three 对象使用 `markRaw/shallowRef`，场景 JSON 才进入深层响应式状态。

## 2. 固定接口契约

### 2.1 场景与资源

- `SceneDocument`：`schemaVersion:1`、`draftVersion`、`building`、`navigation`、`objects[]`，结构按 spec 第 9.3 节；公开版剔除 owner、设备控制与管理来源字段。
- `ResourceItem`：`assetKey:string`、`relativePath:string`、`kind:model|texture|template|preview|collision`、`sha256:string`、`size:number`、`mime:string`。存储 objectKey 只存在服务器内部清单。
- `ImportReport`：`status:success|partial|failed`、`format`、`sourceVersion`、`units`、`coordinateTransform`、`sourceIdentityConfidence`、`warnings[]`、`missingResources[]`、`unsupportedEntities[]`、`stats`。
- `SaveDraftDto`：`expectedDraftVersion:number`、`sceneDocument:SceneDocument`；任何场景变更和绑定变更均递增草稿版本。
- `ScreenBindingDto`：`expectedDraftVersion`、`source:device-theme-instance|direct-instance`、`sourceConfigId?:string`、`templateInstanceId:string`、`compatibilityProfile:native|legacy-bridge|preview-only`。
- `PublishShowroomDto`：`expectedDraftVersion`、`validationId:string`、`requestId:string`；validationId 关联版本与资源摘要，不允许修改后继续复用旧校验结果。

### 2.2 作业与 Worker

- `ConversionRequest`：`jobId:string`、`format:glb|gltf|obj`、`sourcePackageUrl:string`、`sourceHash:string`、`options`、`stagingPrefix:string`、受限输出上传配置。引用只来自平台本次上传包。
- `ConversionEvent`：NDJSON 一行一个 `progress|result|error`；progress 仅含真实 `stage`，result 含 `artifacts[]/report`，error 含可展示错误代码/说明。
- Worker 内部接口：`POST /v1/convert`，使用服务间签名/时间戳/nonce，返回 NDJSON；不进入公开网关白名单。Java 用有界后台 executor 调用并逐事件更新作业，网络下载和转换不放入数据库事务。
- 导入状态：`QUEUED → RUNNING → SUCCEEDED|FAILED|CANCELLED`；partial 由 report 表示并要求用户确认，不等同于完整成功。取消后拒绝迟到完成结果；重启时失去执行者的任务标记可重试失败。

### 2.3 运行与公开访问

- `RuntimeIdentity`：`visitorSessionId:string`、`screenId:string`、`runtimeId:string`，每次打开/重载创建新 runtimeId。
- `BrowserHostConfig`：`protocolVersion:1`、`hostOrigin:string`、`identity:RuntimeIdentity`、握手参数；禁止通配 origin。
- `TemplateRuntimeOptions`：`mode?:local|browser`、`browserHost?:BrowserHostConfig`、`configJson?:TemplateConfig`、`initialValueMap?:Record<string,unknown>`；browser 模式必须有已校验的 host 配置。
- `TemplateRuntime`：`context:TemplateContext`、`bridge:TemplateBridge`、`ready:Promise<void>`、`dispose():void`。`setDefaultTemplateRuntime(runtime)` 不替换已经开始工作的不同 runtime。
- 握手类型：`exhibition-template-host:ready/init/ack`；校验 origin/source/identity 后使用 MessagePort，业务包装为 `{protocolVersion:1,identity,payload:TemplateBridgeMessage}`。
- `PublicManifestVo`：`revisionId`、`schemaVersion`、公开 scene/resources、`visitorSessionId`、只读 ticket/到期时间、`resourceBaseUrl`；不返回管理身份和原始 ZIP URL。
- resourceBaseUrl 为运行源下 `/showroom/virtual/public/{publicCode}/sessions/{resourceSessionKey}/assets/`。Redis 映射 sessionKey 到固定 revision/会话/有效期；续签保持 sessionKey 与 revision，HTML 相对资源共享该路径，避免为每个静态文件依赖后台 Authorization。
- 临时状态默认内存；持久化通过宿主存储接口，以三段 identity 命名空间隔离。未适配的全局存储/根 Service Worker 不标记为完整浏览器兼容。

### 2.4 错误与路径

- 冲突使用 `DRAFT_VERSION_CONFLICT`；未启动模板 `TARGET_NOT_ACTIVE`；实体目标 `HARDWARE_UNAVAILABLE`；过晚初始化 `RUNTIME_ALREADY_INITIALIZED`；资源越界/会话过期返回对应拒绝码。
- 外部 API 以 `/showroom/virtual/admin|public/...` 开头；Java controller 内部 `/virtual/admin|public/...`，现有网关 StripPrefix=1。
- 管理响应沿用 `AjaxResult/TableDataInfo`；公开客户端仅解包公开 DTO，不复用后台 axios token/401 流程。

## 3. 构建检查配置

以下命令供实际实施任务使用，本次规划未执行构建。功能自动化测试不运行。

| 标识 | 工作目录 | 命令/成功条件 |
| --- | --- | --- |
| BUILD-SDK | SDK | `pnpm build`；SDK bundle 与类型声明成功生成 |
| BUILD-UI | UI | `npm run build:prod`；现有入口和新增 showroom.html 均生成，无编译错误 |
| BUILD-WORKER | WORKER | `npm run build`；转换页面/服务 bundle 成功生成，不启动转换验收 |
| BUILD-JAVA | PLATFORM | Maven reactor 编译 mju-showroom 与 gateway，`maven.test.skip=true`、`maven.compiler.release=17`；不编译/运行测试 |

BUILD-JAVA 在独立 PowerShell 构建进程中使用以下现有工具，不改全局环境：

```powershell
$taskJavaRoot = 'E:\development\java\idea\IntelliJ IDEA 2026.1.1\jbr'
$taskMavenExecutable = 'E:\development\java\maven\apache-maven-3.9.2\bin\mvn.cmd'
$env:JAVA_HOME = $taskJavaRoot
& $taskMavenExecutable -pl ruoyi-modules/mju-showroom,ruoyi-gateway -am -Dmaven.test.skip=true -Dmaven.compiler.release=17 compile
```

若工具链/依赖导致编译不可执行，保留文件并具体记录原因，不声称构建通过，也不改运行中的 Java/Nacos 配置。

---

## Task P0-01：环境、契约和现有差异基线

**Files:** 创建 `SDK/docs/superpowers/contracts/virtual-showroom-v1.md`；更新本任务文档的实施状态。执行时定位 SDK/UI/Worker 锁文件及现有后端差异，不预先修改用户文件。

**Interfaces:** 产出本文件第 2 节契约的正式版本；后续任务消费 schema/protocolVersion 1，不另起字段名。

- [ ] 核对各仓库状态、构建工具链与现有 API/Mapper；记录用户原有差异，不覆盖或混入本功能提交。
- [ ] 把第 2 节契约写入正式文档，固定相对资源基址、错误码、运行初始化顺序和导入状态。
- [ ] 固定 UI/Worker 使用同一 Three.js 版本及本地解码器目录；依据实现所需能力锁定精确依赖，不使用 `latest` 或混用 demo vendor 修订版。
- [ ] 记录构建配置与手测前置材料，更新任务状态。此任务完成不代表产品功能完成。

## Task P1-01：数据、权限和草稿 API

**Files:** 新增 `PLATFORM/sql/virtual-showroom-stage1.sql`、`virtual-showroom-stage1-menu.sql`；第 1 节五个 domain、对应 mapper/XML；`JAVA/dto/virtual/{VirtualShowroomCreateDto,SaveDraftDto}.java`；`JAVA/domain/vo/virtual/VirtualShowroomDetailVo.java`；`JAVA/service/virtual/VirtualShowroomService.java`；AdminController。

**Interfaces:** `create(dto):VirtualShowroomDetailVo`、`getDraft(id):VirtualShowroomDetailVo`、`saveDraft(id,dto):VirtualShowroomDetailVo`；详情返回草稿版本与 scene，发布指针独立。

- [ ] 编写五张表的增量脚本，publicCode、展厅/revision、展厅/screenId 唯一；业务表与 sys_menu 脚本分开，不自动在服务器执行。
- [ ] 实现本人归属查询/新建/详情/删除和精确操作权限；owner 由服务端填写，非 owner 的按 ID 操作拒绝。
- [ ] 使用 owner＋expectedDraftVersion 条件更新实现草稿保存；0 行返回明确冲突，绑定写入也使用同一版本规则。
- [ ] 执行 BUILD-JAVA 并记录结果。
- [ ] 提供 M01/M03/M07 的手测入口与预期。
- [ ] 提交本任务新增/修改文件。

## Task P1-02：私有资源与模板产物

**Files:** 新增 `JAVA/service/virtual/{VirtualAssetStorageService,TemplateArtifactService,VirtualTemplateRuntimeResourceService}.java`、`JAVA/config/VirtualShowroomProperties.java`；新增 `PLATFORM/docs/virtual-showroom/storage-runtime-example.md`，复用当前 MinioConfig/MinioClient。只读取现有 TemplateInstanceMapper/DeviceThemeConfigMapper，不改其线下发布方法。

**Interfaces:** `storeSource(input):AssetDescriptor`、`openAsset(objectKey):InputStream`、`materialize(instanceId,profile):TemplateArtifactManifest`、`resolveRuntimeResource(manifest,path):ResourceItem`。

- [ ] 实现来源私有存储、流式读取、摘要与清单；原始 CAD/ZIP 不用公开直链，存储策略示例作为交付配置。
- [ ] 先校验实例/来源归属与模板使用授权，再读取已发布 ZIP；以 ZIP 的 config/valueMap 固定快照，安全展开到独立暂存前缀。
- [ ] 规范相对 HTML/JS/CSS/媒体路径，保存稳定 template 资源子目录；禁止路径越界与任意远程抓取，输出必需资源清单。
- [ ] 实现运行源响应头/资源注入入口：限定 sandbox/CSP/父源，不把后台凭据或实体控制地址带入公开模板。
- [ ] 执行 BUILD-JAVA 并记录结果。
- [ ] 交付运行源配置示例及 M05/M09 所需信息。
- [ ] 提交本任务差异。

## Task P1-03：GLB/glTF/OBJ 导入与独立 Worker

**Files:** 新增 `WORKER/package.json`、`src/{main,protocol}.js`、`src/api/convertRoute.js`、`src/io/jobWorkspace.js`、`src/converters/{gltf,obj}.js`、`src/browser/{convert.html,convert.js,runner.js}`；新增 Java ImportController、`JAVA/service/virtual/{VirtualModelImportService,VirtualModelWorkerClient}.java` 与相关作业 DTO/VO；前端管理 API 的导入部分。

**Interfaces:** Worker 消费 `ConversionRequest` 并流式输出 `ConversionEvent`；Java `createJob(upload,options):ImportJobVo`、`getJob(jobId):ImportJobVo`、`cancelJob(jobId):void`、`getCapabilities():ImportCapabilitiesVo`。

- [ ] 创建 Worker 隔离作业目录与受保护转换接口；读取平台受控 source URL，限制解包目录/大小，输出先进入暂存区。
- [ ] 实现 GLB/glTF 2.0 与 OBJ/MTL/贴图包解析、单位/朝向确认、材质映射、规范 GLB＋meta＋清单＋报告；缺失必需几何阻断，材质降级明确记录。
- [ ] 实现 Java 上传/作业状态、有限执行队列、真实阶段进度、取消/失败重试、结果摘要复核；重启丢失作业可重试，不静默标成功。
- [ ] 为用户交付一个基础房间 GLB 和 OBJ 资源包作为手测材料；提供单位/缺贴图操作示例，不新增自动化测试工程。
- [ ] 执行 BUILD-WORKER 和 BUILD-JAVA 并分别记录结果。
- [ ] 交付 M02/M10 的样本、导入入口和报告说明。
- [ ] 提交本任务差异。

## Task P1-04：共享内核与登录编辑器

**Files:** 新增 `UI/src/virtual-showroom/scene-core/{schema,sceneRuntime,modelLoader,screenObjects,picking,collision,dispose}.js`；`UI/src/views/showroom/virtualShowroom/{index,editor,imports}.vue`；`components/{ObjectTree,SceneCanvas,ObjectProperties,ImportWizard}.vue`；`UI/src/api/showroom/virtualShowroom.js`。必要新增后台隐藏编辑路由，保留现有菜单模式。

**Interfaces:** `createSceneRuntime({container,document,resolveAsset,mode}):SceneRuntime`，返回 `applyDocument(document)`、`setMode(editor|viewer)`、`onPick(handler)`、`getCameraState()`、`restoreCameraState(state)`、`setInputEnabled(boolean)`、`dispose()`；编辑 JSON 消费固定 SceneDocument。

- [ ] 实现建筑/展项/导航三层与模型异步加载、拾取/高亮、资源释放；默认不叠加 demo 房间，视图不深度代理 Three 对象。
- [ ] 实现屏幕/热点新增、数值与 gizmo 变换、复制/删除、命令式撤销重做；复制生成新 objectId，禁用/变换不丢内容绑定。
- [ ] 实现入口、预设视点和简化碰撞体编辑；第一版单行走层平面漫游，支持经过校准的旋转盒碰撞，不声称自动还原全部建筑导航。
- [ ] 接入草稿读取/版本保存和对象局部更新；退出提示未保存修改，冲突不覆盖本地修改。
- [ ] 执行 BUILD-UI 并记录结果。
- [ ] 交付 M02/M03/M04/M07 的编辑流程。
- [ ] 提交本任务差异。

## Task P1-05：SDK 浏览器 runtime、握手与销毁

**Files:** 新增 `SDK/src/runtime/{createTemplateRuntime,runtimeRegistry}.ts`、`context/runtimeKeys.ts`、`communication/{transport,browserHostTransport}.ts`；修改 `src/sdk/{types,index,useTemplateBridge}.ts`、`runtime/context/createTemplateContext.ts`、`communication/{localBridgeTransport,templateBridge}.ts`；更新 SDK README/API 文档。

**Interfaces:** `createTemplateRuntime(options:TemplateRuntimeOptions):TemplateRuntime`、`setDefaultTemplateRuntime(runtime):void`；runtime 含 `context/bridge/ready/dispose()`；`TemplateSdkOptions.runtime?` 可选。`BrowserHostTransport` 实现现有 TemplateTransport；原 localBridge 文件保留类型转导出兼容。

- [ ] 抽出 transport 类型并建立 runtime registry；本地未配置仍保持原默认，过晚切换已初始化实例明确报错。
- [ ] 标准浏览器资源在 App 主脚本前注入 `window.__AUTO_EXHIBITION_TEMPLATE_RUNTIME__` 的 BrowserHostConfig；SDK 首次默认 runtime 访问优先读取并校验它，缺失时才走原本地模式，存在但无效时拒绝。使已编译模板中的 SDK 自己创建 runtime，避免另一份 SDK bootstrap 导入导致 registry 副本。
- [ ] 实现浏览器 ready/init/ack 与 MessagePort，校验父源/source/identity/协议，握手完成才连接；首期禁止真实目标，非活动目标返回规定错误。
- [ ] context 返回 ready/setValueMap/dispose，移除监听并避免旧异步读取覆盖新快照；浏览器配置更新走已认证通道，本地相对文件加载/同源预览保持兼容。
- [ ] Bridge 先登记 pending 再发送，发送失败/销毁清理等待项和订阅；销毁后不回退本地 WS。Vue setup 优先取注入 runtime，顶层调用使用显式默认。
- [ ] 文档给出 bootstrap 先创建并绑定 runtime、再动态导入 App 的顺序；构建 SDK 后消费其新产物，不假设旧 ZIP 会自动升级。
- [ ] 执行 BUILD-SDK 并记录结果。
- [ ] 交付 M05/M06 的手动调用及旧本地模式核对方法。
- [ ] 提交本任务差异。

## Task P1-06：显示器绑定、模板宿主与受限旧模板兼容

**Files:** 新增 `UI/src/virtual-showroom/template-host/{hostSession,messageRouter,runtimeStorage}.js`、`TemplateRuntimeHost.vue`；后台 `components/{TemplateInstancePicker,ScreenContentProperties}.vue`；新增 `JAVA/service/virtual/VirtualScreenBindingService.java` 与绑定 DTO；运行资源层的 bootstrap/legacy bridge 生成器拆为独立文件。

**Interfaces:** `open(binding,manifestContext):Promise<void>`、`close():void`、`reload(binding):Promise<void>`；`storage.get/set/remove(identity,key)`；Java `bindScreen(id,screenId,dto)` 返回新草稿版本和绑定摘要。

- [ ] 从已授权发布实例/设备主题来源选择内容，保存 instance/hash/version/profile；直接实例固定，设备来源保留 sourceConfigId；版本更新写草稿，不回写线下。
- [ ] 实现内容封面/预览与单活动模板容器；首期允许管理员选择对应封面，自动截图作为产品作业可逐步接入，预览必须标记绑定版本。
- [ ] 创建新的 runtimeId 后加载运行源 iframe，安装 bootstrap/宿主消息；打开暂停漫游，关闭/重载销毁旧 port/frame 并恢复原视角，拒收旧代消息。
- [ ] 对未升级 SDK 的已发布实例提供受限 loopback WebSocket 兼容桥，在主脚本前安装、只代理模板 Bridge 协议；实际网络受 CSP 约束。该路径只对已人工确认的纯前端模板启用。
- [ ] 实现访客存储命名空间及硬件/非活动目标拒绝；未适配直接持久存储或内网写接口的模板标为 preview-only，不承诺完整隔离。
- [ ] 执行 BUILD-UI/BUILD-JAVA 并分别记录结果。
- [ ] 交付 M04/M05/M06/M11 的手测步骤及待验证的模板兼容性。
- [ ] 提交本任务差异。

## Task P1-07：校验、固定快照、发布与内容更新

**Files:** 新增 `JAVA/service/virtual/{VirtualShowroomValidationService,VirtualShowroomPublishService,VirtualContentUpdateService}.java`、PublishController、`dto/virtual/PublishShowroomDto.java`、`domain/vo/virtual/{ValidationVo,PublishVo}.java`；后台 `components/{PublishPanel,ContentUpdatePanel,RevisionHistory}.vue`。

**Interfaces:** `validate(id,expectedDraftVersion):ValidationVo`、`publish(id,dto):PublishVo`、`offline(id):void`、`rollback(id,revisionId):PublishVo`、`getContentUpdates(id):ContentUpdateVo`。

- [ ] 校验固定草稿的资源、单位、入口/碰撞、ID、锚点、模板授权/兼容和预览版本；阻断项不能忽略，提示项需明确处理。
- [ ] 事务外准备不可变资源/快照，短事务内核对 owner、draftVersion、摘要和幂等 requestId，再插入 revision 并原子切换指针；失败保留旧发布内容。
- [ ] 实现下架、完整版本回滚与未引用暂存资源清理规则；旧会话资源按租期保留，不随新发布立即删除。
- [ ] 按 sourceConfigId 比较设备来源新实例，提供逐屏保持/更新；重新生成匹配版本预览并再次发布，直接实例只手动改选。
- [ ] 执行 BUILD-JAVA/BUILD-UI 并分别记录结果。
- [ ] 交付 M07/M08 的冲突、失败发布、更新、回滚与下架操作。
- [ ] 提交本任务差异。

## Task P1-08：公开接口、资源会话与独立参观页

**Files:** 新增 PublicController、`JAVA/service/virtual/{VisitorTicketService,VirtualResourceSessionService}.java`、`domain/vo/virtual/PublicManifestVo.java`；新增 `UI/showroom.html`、`src/virtual-showroom/viewer/{main,router,publicHttp}.js`、`App.vue`、`components/{ShowroomViewer,TemplateModal,ViewpointNav,ExhibitList}.vue`；修改 UI vite 多入口；精确修改 gateway AuthFilter，新增部署配置示例，不覆盖 bootstrap 用户差异。

**Interfaces:** 公共 GET manifest、`sessions/{sessionKey}/assets/{path...}`、资源会话续签；front `fetchManifest(publicCode)`、`resolveAsset(assetKey,manifestContext)`、`renewSession(manifestContext)`，全部固定进入时 revision。

- [ ] 用公开专用 DTO 返回在线当前版本并创建 Redis 资源会话/只读票据；根据清单解析资源，不接受任意路径/旧 revision 查询；续签保持原版本。
- [ ] 匿名分支清理用户/内部来源头，公开前缀仅保留访客读取/续签功能；管理前缀仍鉴权，配置示例明确 StripPrefix 与运行源规则。
- [ ] 新建不引用后台 main/router/permission/store/request 的 showroom entry；独立客户端不携带管理员 token，未开放页面不弹登录。
- [ ] 接入共享内核、漫游/点击/预设视点、模板容器与展项列表降级；离开页面销毁内核/宿主，固定版本资源不混用。
- [ ] 执行 BUILD-JAVA/BUILD-UI 并分别记录结果。
- [ ] 交付 M01/M05/M08/M09 的匿名入口与资源路径说明。
- [ ] 提交本任务差异。

## Task P1-09：手机、部署示例与阶段交付

**Files:** 完善 viewer/TemplateModal/场景内核输入；新增 `PLATFORM/docs/virtual-showroom/stage1-startup.md`、`runtime-proxy-example.conf`、`stage1-release.md`；更新本目录手测清单与任务状态。

**Interfaces:** `/v/{publicCode}` 回退到 showroom.html；独立模板运行源；环境配置包括 API、runtime origin、Worker URL/服务密钥、私有资源存储与会话租期，密钥不进入前端 bundle。

- [ ] 完成触控视角/热点视点、模板比例与 iframe 外固定退出控件、安全区域；电脑漫游不因手机输入改动失效。
- [ ] 提供本地启动、SQL/菜单/白名单/存储/反向代理应用说明；公开路径刷新仍到参观页，后台路径保持后台入口。
- [ ] 分仓执行 BUILD-SDK/BUILD-WORKER/BUILD-JAVA/BUILD-UI，记录命令、结果和环境限制；不执行功能测试，也不把构建结果当手测通过。
- [ ] 更新用户手测清单的入口/样本、已知限制和反馈格式；以任务 ID 标记“已实现/构建检查/待用户手测/反馈修复”。
- [ ] 只提交本功能差异，交付第一阶段说明与可访问入口；用户反馈的问题回到对应任务，不隐藏到下一阶段。

## 4. 实施与交付顺序

P0-01 完成后，P1-01/P1-02 与 P1-05 可以并行，P1-03 在资源契约稳定后开始；P1-04～P1-08 按依赖集成，P1-09 汇总交付。实现者与复核者使用同一契约，不能各自发明 SDK 初始化或资源路径。

任务实施状态目前全部未开始；本次仅完成可审阅计划和手测清单。执行前由用户审阅此计划并选择当前会话执行或按任务委派子代理的方式。
