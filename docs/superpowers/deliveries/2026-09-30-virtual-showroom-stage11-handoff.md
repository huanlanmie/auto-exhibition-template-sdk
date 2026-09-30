# 虚拟展厅第一阶段修订版交付（v1.1）

已完成修订后的第一阶段并启动本机前后端。

管理入口：<http://localhost:5173/virtualShowroom/index>。使用原管理账号登录，进入“虚拟展厅 → 我的展厅”。角色权限在独立本机系统库内管理。未重置账号密码。

## 本阶段范围

- GLB、glTF 2.0、OBJ/ZIP 导入，场景编辑、屏幕/热点/视点/碰撞盒，绑定模板及对应预览图，草稿/CAS、预览、发布、回滚、匿名参观。
- 来自管理后台授权实例的固定函数目录和软件规则图，区分来源/草稿/公开版本及未知现场实装状态。
- 每位访客独立的多屏运行宿主，按钮与翻页、虚拟组及广播、抢答业务；稳定逻辑屏幕身份、实际注册函数白名单、有界 TTL/请求/运行实例。
- 同一放大窗口展示原比例模板，关闭保留访客状态，离开展厅清理，隐藏帧暂停媒体。
- 更新多个来源时可以逐一重绑并保留联动图；未改旧绑定允许留在草稿，新增/重新启用/改变绑定及发布严格检查。

`mju-smart-show` 负责管理和发布；SDK 负责认证浏览器端口与模板协议；现有 `automatic_exhibition_setup_platform` 的包加载、软件联动和真实 quiz-buzzer 协议已作为实现参考。线上软件路由在浏览器完成，现场 Electron 项目无需修改或启动。已有模板 ZIP 选择“旧模板桥接”；采用原生浏览器模式的模板需用本次 SDK 重新打包。

DWG/DXF、STEP/IFC 的正式转换器与材质整理、正式手机网络/域名部署留到后续阶段。本机未创建已发布的业务样板展厅；可使用平台 `virtual-showroom-worker/samples/basic-room.glb` 新建展厅手动查看。

## 验证与运行

SDK `pnpm build`、前端 `npm run build:prod`、Java release17/skip-tests Maven package 均完成。独立代码复核通过，代码变更已核对；未新增或运行自动化功能测试，也未做浏览器业务验收，交互行为由用户手动查看。

最终就绪证据：前端 HTTP 200；认证/系统/展厅/网关的健康状态均 UP；Worker ready=true。本机 MySQL13306、Redis16379、前端5173、Worker9319、认证19200、系统19201、展厅9402、网关19088 共八个服务正在运行。数据库是原展厅库与系统库的独立快照，远端 Nacos 未写入且本地服务未向现场注册。既有 11 个用户修改文件 SHA256 保持不变。

完整启动、停止和手动查看步骤：[平台启动说明](C:/Users/Administrator/Desktop/mju-smart-show/docs/virtual-showroom/stage11-startup.md)。私有配置及日志位于平台 `.codex-run/stage11`，已忽略；不要分享其中的凭据及数据快照。

代码提交：SDK `7095036`，平台 `3413afc2`，分支 `codex/virtual-showroom-stage1`。未推送或部署到现场。

证据：[构建、独立复核及就绪记录](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/deliveries/2026-09-30-virtual-showroom-stage11-evidence)。具体手测建议见平台启动说明及前端实现报告。
