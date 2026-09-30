# P1-01 后端基础、权限与草稿 API

## 状态

实现完成，BUILD-JAVA 已通过：14 个 reactor 项目全部 SUCCESS，退出码 0。未新增或运行自动化功能测试，未执行数据库 SQL、Nacos 更新、提交或暂存。现有用户修改未触碰。

工作仓库：`C:/Users/Administrator/Desktop/mju-smart-show`，分支 `codex/virtual-showroom-stage1`。

## 文件范围

以下路径以平台仓库为根；所有文件均为本任务新增。

- `sql/virtual-showroom-stage1.sql`
- `sql/virtual-showroom-stage1-menu.sql`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/domain/VirtualShowroom.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/domain/ShowroomModelAsset.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/domain/ModelImportJob.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/domain/ShowroomRevision.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/domain/ShowroomScreenBinding.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/mapper/VirtualShowroomMapper.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/mapper/ShowroomModelAssetMapper.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/mapper/ModelImportJobMapper.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/mapper/ShowroomRevisionMapper.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/mapper/ShowroomScreenBindingMapper.java`
- `ruoyi-modules/mju-showroom/src/main/resources/mapper/showroom/VirtualShowroomMapper.xml`
- `ruoyi-modules/mju-showroom/src/main/resources/mapper/showroom/ShowroomModelAssetMapper.xml`
- `ruoyi-modules/mju-showroom/src/main/resources/mapper/showroom/ModelImportJobMapper.xml`
- `ruoyi-modules/mju-showroom/src/main/resources/mapper/showroom/ShowroomRevisionMapper.xml`
- `ruoyi-modules/mju-showroom/src/main/resources/mapper/showroom/ShowroomScreenBindingMapper.xml`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/dto/virtual/VirtualShowroomCreateDto.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/dto/virtual/SaveDraftDto.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/domain/vo/virtual/VirtualShowroomDetailVo.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualSceneDocumentValidator.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualShowroomService.java`
- `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/controller/VirtualShowroomAdminController.java`

## 对外接口与权限

内部前缀 `/virtual/admin/showrooms`，网关对外增加 `/showroom`。

| 方法与路径 | 权限后缀 | 结果 |
| --- | --- | --- |
| GET `/` | list | 本人分页列表，`rows/total` |
| POST `/` | add | 创建初始版本 0 的 DRAFT 展厅，owner 由登录态填写 |
| GET `/{id}` | query | 展厅详情 |
| GET `/{id}/draft` | query | 展厅详情及草稿 |
| PUT `/{id}/draft` | edit | owner + expectedDraftVersion CAS，版本加一 |
| DELETE `/{id}` | remove | 本人记录软删除、设置 OFFLINE |

所有权限完整前缀为 `showroom:virtualShowroom:`。每个按 ID 操作再次检查 owner，不给管理员跨 owner 旁路。不存在和非本人统一返回 404 业务码，不泄露其他 owner 展厅信息。匿名由现有鉴权注解与服务 `AuthUtil.checkLogin()` 拒绝。

详情保持契约字段；ID 与 publishedRevisionId 是 String，sceneDocument/resources 是普通 Java Map/List 的 JSON 值，避免 Spring Boot 4 默认 Jackson3 与现有内部 Jackson2 JsonNode 不兼容。内部仍采用已有 `com.fasterxml.jackson.databind.ObjectMapper` Bean。

## 数据与一致性

五张新增表带主键、归属外键和必要索引；public_code、showroom_id/revision_no、showroom_id/screen_id 唯一，发布 request_id 在展厅内唯一。对象标识使用大小写敏感排序规则。既有表不变更，sys_menu 独立脚本使用自动 ID 与存在性保护，不自动给角色授权。

草稿 SQL 的 WHERE 同时包含 id、owner_id、expectedDraftVersion、deleted=0；0 行返回 `code:409`、以 `DRAFT_VERSION_CONFLICT` 开头并提示保留本地修改/刷新版本的消息。sceneDocument.draftVersion 也必须匹配 expectedDraftVersion。更新不修改 publishedRevisionId/status。父行 CAS 成功后才在同一事务刷新屏幕绑定，任一步失败整体回滚。

普通保存不接受新增或篡改任意模板实例绑定；已绑定对象保持原绑定，复制可以复用本人草稿中已有的完全相同绑定。单独绑定业务通过受信任服务入口，并负责 bind 权限与模板实例授权。删除整个屏幕随草稿原子清理对应绑定。

服务校验 schema、版本范围、变换与归一四元数、正数尺寸、重复 ID、导航/碰撞盒/视点、绑定 ID/来源/兼容模式与私有字段。资源引用必须来自当前展厅内部清单；建筑 modelVersionId 必须属于当前展厅，assetKey 必须匹配该模型版本。空可选图片选择允许继续保存草稿，完整可发布性由后续 publish validator 判定。资源 REST 输出采用字段白名单，objectKey 等内部存储字段不会透出。

软删除保留不可变版本与资源，供会话固定版本与后续保留策略使用；后台导入完成流程必须检查 deleted 状态，更新草稿 CAS 已内置 deleted=0。

## 后续任务接口

`VirtualShowroomService`：

- `requireOwned(Long)` / `requireOwnedForUpdate(Long)` 返回 domain；后者必须由外部事务调用以保留 FOR UPDATE 锁。
- `currentOwnerId()` 服务端身份。
- `getDraft(Long)`、`getDetail(Long)`、`create(dto)`、`saveDraft(id,dto)`、`list(name,status)`、`remove(id)`。
- `persistDraft(id,expectedDraftVersion,JsonNode scene,JsonNode internalResources)`：只给受信任绑定/导入服务使用，无 REST 映射；调用方先校验操作权限及新资源/模板归属，使用与普通草稿相同 CAS、结构校验与绑定事务。
- `readJson(String)`、`toDetail(domain)`、`publicResources(JsonNode)`、`expectedVersion(row,version)`、`conflict()`。

Mapper 共享方法：`selectById`、`insert`；四个子表另有 `selectByShowroomId`、`deleteByShowroomId`。

- VirtualShowroomMapper：`selectOwned`、`selectOwnedForUpdate`、`selectOwnedList`、`selectByPublicCode`、`updateDraft(id,ownerId,expectedDraftVersion,sceneDocument,resourcesJson,updateBy)`、`updatePublication(id,ownerId,expectedDraftVersion,publishedRevisionId,status)`、`updateStatus(id,ownerId,status)`、`softDeleteOwned`。
- ShowroomModelAssetMapper：`selectByModelVersionId(showroomId,modelVersionId)`、`update(row)` 只修改 acknowledged/status，模型内容保持不可变。
- ModelImportJobMapper：String job ID、`updateIfStatus(row,expectedStatus)` 防止取消后迟到结果覆盖、`selectUnfinished()`。
- ShowroomRevisionMapper：`selectByRequestId(showroomId,requestId)`、`selectMaxRevisionNo(showroomId)`，版本内容只插入，不提供修改接口。
- ShowroomScreenBindingMapper：`selectByScreenId(showroomId,screenId)`。

后台线程没有 HTTP 登录上下文，不能直接调用认证版 persistDraft；导入服务应从可信任务 owner 使用 Mapper 条件更新，并通过事务锁/最新版本 CAS 追加验证过的资源。不要把 owner 从前端表单传入。

## 构建记录

工具为 JBR 25 (`E:/development/java/idea/IntelliJ IDEA 2026.1.1/jbr`) 与 Maven 3.9.2，目标 release17，`maven.test.skip=true`。首次命令使用全局 Maven 配置，长时间逐个尝试 splunk 与多重镜像仓库；仅终止本任务构建后，改用任务目录里的 `P1-01-maven-global.xml` / `P1-01-maven-settings.xml`，保留现有 `E:/development/java/maven/mavenreponine` 缓存、单一 HTTPS 阿里公共镜像。未修改全局 settings、项目 POM 或系统 Java 配置。

```powershell
$env:JAVA_HOME = 'E:/development/java/idea/IntelliJ IDEA 2026.1.1/jbr'
& 'E:/development/java/maven/apache-maven-3.9.2/bin/mvn.cmd' `
  -gs '<task>/P1-01-maven-global.xml' -s '<task>/P1-01-maven-settings.xml' -B -ntp `
  -pl ruoyi-modules/mju-showroom,ruoyi-gateway -am `
  '-Dmaven.test.skip=true' '-Dmaven.compiler.release=17' compile
```

日志：同目录 `P1-01-build.log`（首次中止）、`P1-01-build-clean-settings.log`（最终）。五份新增 Mapper XML 使用禁用外部解析的 XML reader 做静态语法检查，均为 well-formed；没有连接数据库。

**最终编译结果：BUILD SUCCESS，退出码 0，2026-09-30 12:03:52 +08:00 完成，耗时 2 分 05 秒，14 个 reactor 项目全部 SUCCESS。** Showroom 编译了 151 个源文件，gateway 与其依赖也成功；未编译/运行测试。日志存在 JBR25 的 native-access/Unsafe 警告、既有 DeviceThemeConfigServiceImpl 过时 API 提示，以及 maven-resources-plugin 3.3.0 插件校验警告，均未阻塞构建。共享目录中 root 同时新增的基础存储类也由本次编译纳入；此结果不替代后续新文件的最终集成构建。

## 手测入口与预期（均未执行）

- **M01**：账号 A 创建展厅，通过列表/详情/草稿确认只显示本人。账号 B 即使有相同菜单权限，直接 GET/PUT/DELETE A 的 ID 均拒绝；匿名管理请求拒绝。移除 edit 权限时 PUT 拒绝。请求 body 添加 ownerId 不影响服务端 owner。公开匿名入口依赖 P1-08。
- **M03**：在前端编辑页增加屏幕，移动/旋转/调整正尺寸，保存再读取草稿；字段保持，draftVersion +1。复制生成新 objectId，保留已授权绑定。提交重复 objectId、非正尺寸、非归一四元数或他人模型 ID/资源键应拒绝，不改变数据库草稿或绑定。完整模板绑定入口依赖 P1-02/P1-06。
- **M07**：两个页面读取相同版本 N；A 保存返回 N+1；B 携带 N 保存收到 AjaxResult `code=409,msg=DRAFT_VERSION_CONFLICT...`，B 修改由前端保留，A 内容不被覆盖。新建 ONLINE 快照后改草稿，publishedRevisionId 不变；旧 validationId 发布拒绝依赖 P1-07。

## 尚需集成/部署验证

- SQL 仅交付，仍需授权人工部署与角色授权；列表路径 `/virtualShowroom/index`，编辑/导入命名路由与 UI 协调。
- 建模导入、资源存储、单独绑定、发布和访客会话由后续任务接入。本任务没有修改既有线下 publishConfig、FunctionLinkage、TemplateSync 或 bootstrap.yml。
- 创建时拒绝 coverAssetKey，因为新展厅还没有归属资源；后续上传/导入业务可添加验证过的封面更新流程。
- 编译不代表 MySQL 部署、权限/并发、浏览器或发布功能手测通过。
