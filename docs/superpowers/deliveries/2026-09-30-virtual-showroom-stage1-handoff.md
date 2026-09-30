# 虚拟展厅第一阶段交付与手动验收

本阶段实现登录创建展厅、GLB/glTF/OBJ 导入、空间与显示器编辑、既有模板实例绑定、固定版本发布及匿名参观。暂未启用 DXF、DWG、STEP、IGES、FBX、STL、IFC；二维 CAD 建模和更多格式转换按后续阶段推进。

代码位于 SDK 与平台的 `codex/virtual-showroom-stage1` 分支。构建检查与代码复核不替代实际部署、模型转换或浏览器功能验收。按约定，未新增或运行单元、集成、E2E 自动化测试及浏览器 QA。

## 文件与入口

| 项目 | 位置 / 入口 |
| --- | --- |
| 平台代码 | `C:/Users/Administrator/Desktop/mju-smart-show` |
| 管理界面 | 登录后“虚拟展厅 → 我的展厅”，`/virtualShowroom/index` |
| 匿名参观 | `/v/{publicCode}`；本地也可使用 `/showroom.html?code={publicCode}` |
| 建模 Worker | `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker` |
| SDK 接入 | [模板浏览器 runtime API](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/api/templateRuntime.md) |
| 配置与边界 | [私有存储及运行服务说明](C:/Users/Administrator/Desktop/mju-smart-show/docs/virtual-showroom/storage-runtime-example.md) |
| 代理入口 | [Nginx 参观页示例](C:/Users/Administrator/Desktop/mju-smart-show/docs/virtual-showroom/nginx-viewer-example.conf) |

## 首次启动准备

1. 通过正常数据库部署流程执行平台 `sql/virtual-showroom-stage1.sql` 和 `sql/virtual-showroom-stage1-menu.sql`，为管理账号授予所需菜单和操作权限，重新登录。脚本尚未应用到运行中的数据库。
2. 保持已有 MySQL、Redis、Nacos、模板实例服务和网关可用。模板 ZIP 仍来自原有实例存储，新的展厅资源默认使用私有本地目录，也可使用专用私有 MinIO 桶。不要将展厅源文件目录映射为 Web 静态目录。
3. 按配置说明设置后端 `virtual-showroom` 配置。后端与 Worker 使用相同的至少 32 字符随机 `VIRTUAL_WORKER_SECRET`；`storage-root` 与 Worker 的 `VIRTUAL_SOURCE_ROOT` 必须指向相同实际目录。设置上传请求限额，最大文件 64 MiB。
4. 启动或重启包含新代码的 `mju-showroom` 与 gateway。编译目标为 Java 17；当前系统默认 Java 8 不适用。后台任务协调器第一版按单实例运行。
5. 在 Worker 目录使用 Node 22 执行 `npm ci`、`npm run build`，配置共享密钥、私有源目录和 `VIRTUAL_BACKEND_ORIGIN`，再执行 `npm start`。默认运行端口 9319，后端目标端口 9307。当前机器已有 Chrome；具体执行路径见 Worker README。
6. 启动前端开发服务器或部署 `ruoyi-ui-vue3/dist`。原有 API 前缀仍由 `VITE_APP_BASE_API` 决定；开发 Vite 已将 `/v/{code}` 指向独立的 `showroom.html`，生产代理也需应用对应路由。
7. 将后端 `runtime-origin` 设为浏览器可达的独立源，将实际前端源加入 `allowed-host-origins`。本机默认是 `http://127.0.0.1:9319`，手机不能使用电脑的回环地址，需改为手机可访问的地址；HTTPS 前端需配套 HTTPS 模板运行源。

这些 SQL、服务密钥、Nacos、私有桶与代理配置仅交付说明，没有自动更改线上环境。默认已有前端 API 代理地址也没有被本功能替换。

## 推荐手测顺序

1. 新建展厅，导入 `virtual-showroom-worker/samples/basic-room.glb`，选择米、Y 向上，保存建筑。此样本地面为 8 m × 6 m、墙高 3 m。
2. 添加显示器、热点、入口、视点与墙体碰撞盒，调整位置和尺寸，复制与撤销后保存并重开。撤销/重做作用于未保存修改；成功保存会清空这两组记录，保存失败则保留本地修改。
3. 为屏幕绑定本人有权使用的模板实例。可先选“仅预览图”，绑定后上传 PNG/JPEG；图片需与当前实例版本对应，服务端在上传时记录其归属。WebP 请先导出为 PNG/JPEG。原生交互模板应使用新 SDK 重新构建并上传实例 ZIP；旧纯前端模板可人工确认后选择旧桥接模式。
4. 使用编辑器“预览屏幕”确认图片或完整模板可打开，关闭后视角与输入恢复。线上函数仅在当前模板内执行，设备目标返回不可用。
5. 检查草稿，确认需要接受的警告，再发布。通过列表访问匿名链接，检查空间、图片、热点、视点、手机操作和模板放大。
6. 导入厘米单位的 OBJ 包及缺贴图样本，检查报告；部分转换需明确确认后使用。测试损坏资源、取消与重新提交。
7. 按 [M01～M12 完整清单](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/plans/2026-09-30-virtual-showroom-stage1-manual-checklist.md) 验证归属权限、保存冲突、版本锁定、更新提示、回滚、下架和访客隔离。

## 使用边界与实施决定

- 保留现有两个工作目录，在功能分支开发，以便沿用手测路径；原有未提交修改保持独立。
- Three.js 在前端和 Worker 固定为 0.186.1，本地附带同版解码器，不混用参考 demo 的版本。
- 模板可执行资源只通过独立运行服务读取；需要匹配的服务密钥及私有后端网络。管理员凭据不传给模板。
- 发布后的模板实例和资源固定版本，原访客会话保持原版本。线下更新只提示，管理员预览后重新绑定和发布。
- 模板自身使用的全局持久化、原生插件或外部设备能力需要适配与人工确认；不能兼容时使用预览图。宿主存储与函数消息按访客、屏幕、runtime 三段身份隔离。
- 第一版保留草稿、历史版本和有效会话资源，未启用破坏性自动清理；私有孤立文件的空间回收按文档规则另行运维。
- 导入重启恢复按单个后端协调器设计，多副本部署需要后续增加任务租约。
- Java 默认一个转换执行任务、八个排队任务，与 Worker 默认容量一致；增加吞吐前需匹配两端配置。
- 预览图只接受完整解码验证的 PNG/JPEG，暂未启用 WebP；模板更新后需要重新上传对应版本图片。
- 保留现有 Maven/JBR 构建警告，不为本功能升级全局工具链。

## 构建记录

| 部分 | 检查 | 实际结果 |
| --- | --- | --- |
| SDK | `pnpm build` | Bundle 与 TypeScript 声明生成成功；两项 SDK 复核问题修正后通过 |
| 前端 | `npm run build:prod` | 最终修复后 exit 0，2177 模块；index、mall、landing、showroom 四入口生成 |
| Worker | `npm run build` | JavaScript 语法与依赖解析通过；最终居中别名修正后 exit 0 |
| Java | Maven compile，release17，`maven.test.skip=true` | 最终 14/14 模块成功，6.783 秒；未编译或运行测试 |

现有 Maven resources-plugin 校验、JBR/既有源码弃用与 unchecked 提示没有阻塞编译，也没有通过无关升级隐藏。上述结果不证明数据库部署、转换执行、浏览器效果、模板兼容、权限并发或手机性能已通过功能验收。

M01～M12 仍均为“未执行”，由手动验收填写实际结果。任务级与整分支静态复核已通过，最终三项衔接问题修正后再次批准；完整记录见 [最终复核报告](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/deliveries/2026-09-30-virtual-showroom-stage1-evidence/P1-final-review.md)。

## 实施决定及影响

以下为开发过程中做出的全部实施取舍，按发生顺序保留：

| 决定 | 原因 | 如果需要改变 |
| --- | --- | --- |
| 在现有工作目录建立功能分支 | 保留用户原有修改及手测路径 | 可在本地调整分支或搬迁补丁 |
| 手动功能验收，允许构建检查 | 遵循明确测试约定 | 浏览器、转换和部署行为需人工确认 |
| 按独立目录并行开发，仅协调者提交 | 缩短开发时间，避免共享 Git 索引冲突 | 共享接口修改必须顺序整合 |
| 前端与 Worker 固定 Three 0.186.1 | 版本由 npm 元数据确认，避免混入参考 demo 的旧版 | 更换版本需同步解码器与消费端 |
| 可执行模板只经独立运行服务读取 | 避免模板代码在管理员源执行 | 需匹配服务密钥和后端私有网络 |
| 保留不可变私有资源，暂不自动破坏性清理 | 历史版本与有效会话仍需访问 | 私有孤立资源会占空间，需按文档回收 |
| 第一版单个后端导入协调器 | 尚未实现分布式作业租约 | 避免并行启动协调器副本 |
| 上传时从已保存绑定记录预览图归属 | 客户端版本字段无法证明内容来源 | 切换绑定后重新上传图片 |
| Java 一个执行任务加八个排队任务 | 与 Worker 默认一个并发任务匹配 | 提升吞吐需匹配两端容量 |
| 保留已有构建警告，不升级无关工具链 | 编译成功且修改范围可控 | 现有工具链诊断继续显示 |
| 预览图先支持 PNG/JPEG | 能完整解码验证；WebP 仅检查头部不足以证明有效 | WebP 先转为 PNG/JPEG，后续可加真正解码器 |
| 撤销/重做以成功保存为边界 | 已删除绑定的恢复需要可信服务端授权，不能只重新提交客户端旧字段 | 暂不能撤销已成功保存的操作；后续可增加受控恢复流程 |
