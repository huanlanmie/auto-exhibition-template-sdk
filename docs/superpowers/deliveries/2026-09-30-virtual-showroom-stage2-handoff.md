# 虚拟展厅 P2 交付

P2-01至P2-05代码已完成，前后端构建、Worker语法/依赖检查、独立静态复核和本机就绪检查通过。按用户要求没有写或执行自动化功能测试、模型转换验收或浏览器业务QA，实际文件、尺寸、视觉与操作由用户手动确认。

## 已交付

- 原有GLB/glTF/OBJ之外增加FBX静态、ASCII/Binary STL、ASCII DXF辅助空间建模、STEP/STP与IGES/IGS单文件网格化。格式能力来自当前Worker实际provider部署，DWG/IFC仍属于P3。
- DXF先分析，再确认单位/两点标尺、精确图层角色、墙高厚、轮廓、门洞与基础设备块；门图层不自动挖洞。校准同时绑定包SHA与实际条目SHA，避免同ZIP错用标尺。曲线、块展开、结构/实体/预览点均有预算及具体诊断。
- 电脑/手机质量档实际限制贴图2048/1024，分别100万/25万三角与100/40MiB输出软预算。超限提示partial并需确认；不自动减面合并节点，统一GLB硬限100MiB，合计产物另受配置限额约束。
- 模型锚点目录、绑定/解除、15分钟冻结重导复核与服务端位置计算。唯一可信源身份才可精确匹配；路径/名称/几何只是建议。旧锚点逐项映射或明确解除保留世界位置，缺失/歧义不能静默应用。保留业务ID、模板绑定、预览、软件联动、建筑校准和导航。应用修改草稿，发布仍是独立步骤。
- 编辑器和独立导入/恢复任务入口都使用同一复核流程；普通草稿保存不能绕过模型替换复核。管理接口保留归属、权限、资源摘要与草稿CAS。

## 打开与手测

[管理后台](http://localhost:5173/showroom/virtualShowroom/index) → 进入展厅 → 导入建筑。请刷新已打开的后台页面，使用原有账号登录。建议另建CAD手测展厅；[505案例](http://localhost:5173/v/c7e9aef4aca6489483ce83509701bb99) 保留原样。

完整手测步骤和格式边界在 [P2手测说明](C:/Users/Administrator/Desktop/mju-smart-show/docs/virtual-showroom/stage2-manual.md)。输入样本在 [STL ASCII](C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/samples/stage2/box-mm-ascii.stl)、[STL Binary](C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/samples/stage2/box-mm-binary.stl)、[FBX](C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/samples/stage2/box-cm-static.fbx)、[DXF](C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/samples/stage2/lab-plan-mm.dxf)。这些是产品输入，尚未实际转换验收；STEP/IGES使用用户实际单文件手测。

## 验证证据

| 项目 | 实际结果 | 证明范围 |
| --- | --- | --- |
| Java Maven package，release17，maven.test.skip=true | BUILD SUCCESS / exit0，2026-09-30 18:51:42 +08 | 编译和可启动JAR，不含功能测试 |
| Vue npm run build:prod | exit0，Root最终构建完成 | 前端产物，不含渲染/业务QA |
| Worker npm run build | exit0，固定5个依赖、JS syntax/vendor文件可用 | 无模型解析/转换执行 |
| 独立静态复核 | A/B/C/D全部Approved；原Important已闭合 | 实现/接口审阅，不等于手测验收 |
| 本机服务 | auth/system/showroom/gateway health200/UP；Worker200/ready且8格式；UI200 | 配置与进程就绪 |
| 505与用户修改 | 505 ONLINE、草稿6、发布2、模型版本与场景/资源摘要未变化；11个原用户修改文件SHA未变化 | 本次升级数据/文件保留 |

证据保存在 [阶段复核目录](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/deliveries/2026-09-30-virtual-showroom-stage2-evidence/progress.md)，包括实现报告、初始与修复复核、构建日志和无秘密的就绪记录。凭据、配置、数据库、运行日志和case私有回读仍仅在平台忽略目录`.codex-run`，没有复制到交付资源。

## 边界与后续

FBX为默认静态姿态和近似材质；压缩Binary数组在Loader前有流式长度/展开预算。STL必须明确单位。DXF仅平面辅助建模，未知/三维/非默认OCS等需要修正或明确忽略，不能接受诊断后绕过硬限制。STEP/IGES不能证明源完整性、原单位或稳定GUID；节点位置若烘焙在顶点内，bounds-center锚点帧只能辅助平移，不能推断烘焙旋转、尺度或形变。导航保持原值，应用后必须人工复核。

沿用独立本机MySQL/Redis及原`.codex-run/stage11`配置，本次仅重启自身showroom与Worker，其他服务/前端保留。未重新snapshot、写生产SQL/Nacos、改线下Electron或现场设备。代码分支均为`codex/virtual-showroom-stage2`，只提交阶段精确文件，保留其余用户工作区变化。平台产品提交为`752545e8cda4aedf13f23cd69a86d17b65431679`；SDK本阶段仅提交计划、契约和交付证据，无SDK运行时代码变更。

接下来按用户实际文件和手测反馈修复本阶段；下一规划阶段为P3 IFC与具备授权/部署条件的二维DWG，当前未启用。
