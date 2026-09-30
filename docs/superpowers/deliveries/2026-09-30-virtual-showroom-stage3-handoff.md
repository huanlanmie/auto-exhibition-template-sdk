# 虚拟展厅 P3 交付

P3-01、P3-02、P3-03代码与本机部署已完成：新增IFC建筑导入、二维DWG冻结校准导入、私有BIM属性查看和真实provider能力展示。最终前后端/Worker构建、独立静态复核与服务就绪检查已完成；按用户要求，没有执行自动化功能测试、模型解析/转换验收或浏览器业务QA。实际文件、尺寸、视觉、属性、权限和quota/取消效果仍由用户手动验收。

## 本阶段结果

- IFC2x3与IFC4：预检文件单位/楼层/构件类型/局部原点，选择后转换统一GLB、元数据和锚点目录；IFC4x3 ADD2单独确认且条件支持，不承诺完整基础设施或Grid/Linear placement覆盖。严格schema/预算/引用与单位处理；不会把未支持schema兼容别名当成功。
- 唯一project+product GlobalId与精确placement才形成可靠主构件身份，网格片段/expressID/重复GUID不升级为稳定锚点。P2重导复核继续保留业务ID/模板/导航与草稿CAS，缺失或过滤掉的旧锚点需明确映射/解除。应用只改草稿，预览/发布另行操作。
- IFC基本元数据与有限Pset_*Common/Qto_*BaseQuantities保存在固定私有第五文件，目录按当前构件归属查看；源名称/描述/精确地理信息不进入公开模型。匿名资源会话和公开文件读取分别硬拒绝私有kind/路径，公开manifest仍只列公共产物。局部原点输入为米制Y_UP工程坐标，无地图投影或TrueNorth/MapConversion重复变换。
- 二维DWG使用固定开源LibreDWG WASM，识别AC1015/1018/1021/1024/1027/1032；严格二维、代理/自定义类/外部参照/非零Z等拒绝。一次预检生成ASCII DXF，校准票据15分钟且绑定owner/room、原包/条目/派生摘要和provider fingerprint；转换用同一份冻结DXF，过期/换源必须重分析。所有DWG成功结果仍为partial，原图完整性unknown，派生handle保持启发式。
- Node子进程在Windows Job中受aggregate最多3072MiB限制，建桥前独立观察进程持有Job，创建时原子挂入Job且suspended，确认后resume。正常/异常/launcher被终止都等待全Job退出确认；无法确认时禁用后续native admission并保留私有workspace。此路径仅静态复核和C#编译，真实限额/退出时序待用户手测。
- 10种格式由本部署health登记，版本/范围/禁用原因与manual-required在后台可查看。其它OS未部署同等quota时只关闭IFC/DWG；原8格式保留。许可证及对应源码指引已随Worker保留，没有配置商业AutoCAD/ODA运行时。

## 打开与手测

[管理后台](http://localhost:5173/showroom/virtualShowroom/index) → 登录 → 建议新建“BIM手测展厅” → 导入建筑 → 选择IFC或二维DWG → 分析 → 确认 → 导入/复核。请刷新已打开的后台页面。[505案例](http://localhost:5173/v/c7e9aef4aca6489483ce83509701bb99)保持原发布版本。

[P3手测说明](C:/Users/Administrator/Desktop/mju-smart-show/docs/virtual-showroom/stage3-manual.md)包含逐项检查与实际限制；可先用 [IFC4毫米输入](C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/samples/stage3/lab-ifc4-mm.ifc)。样本目录有8份纯文本生成输入和摘要：米/毫米、2x3/4/ADD2、移墙、地理datum、重复GUID和不支持ADD1。这些输入未执行解析/转换验收，不是“已通过”的样本；真实DWG使用用户原图或在原CAD软件将P2 DXF另存DWG。

## 最终证据

| 项目 | 实际结果 | 证明范围 |
| --- | --- | --- |
| Maven package，release17，maven.test.skip=true | BUILD SUCCESS / exit0，2026-09-30 23:29:55 +08 | 最后空描述兼容修复后的编译/JAR，测试跳过 |
| Vue npm run build:prod | exit0，24.43s | 最终前端构建，未做渲染/业务QA |
| Worker npm run build | exit0，七项固定依赖+JS/MJS/CJS语法+Windows启动器C# CompileOnly | 未启动任何Job或模型引擎 |
| 独立静态复核 | A/D、C/B修复、D三份最终Approved，所有Important关闭 | 接口/实现静读，无格式/quota手测证据 |
| 本机服务 | Java4项200/UP，UI200，Worker200/ready10格式；Windows Job配置3072MiB/manual-required | 部署文件、配置、进程健康就绪 |
| 数据与原用户文件 | 505 ONLINE/draft6/published2、原模型版本/摘要未变；11个原用户文件bytehash未变 | 升级保留范围 |

完整报告、初始与最终复核、公开源码研究、构建日志和无秘密就绪记录在 [阶段证据目录](C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/docs/superpowers/deliveries/2026-09-30-virtual-showroom-stage3-evidence/progress.md)。最后只修改build-info证明范围文字，不改变引擎/业务路径，并再次构建。C-I1组名白名单、C-I2空源名称/描述、IFC字段/轴约定与DWG5项隔离/代理/二维/缓存/退出问题均已关闭。

505固定为房间1、模型 `f9b1dc78-90c9-4565-8b92-d425818244a1`、草稿6、公开版本2；scene/resources SHA256 `b1f0ef97f988fa6bb9fc6adaa8a5fb110422934ad979bdf6accfdf01a946b682`。没有转换/应用/重新发布该案例。仍沿用原私有MySQL/Redis/.codex-run/stage11配置，不重新snapshot，不写生产SQL/Nacos，不改线下Electron或现场设备。

两仓库分支均 `codex/virtual-showroom-stage3`。平台产品提交 `c7c142040ed54bf1d30abbd4732ab7b1b231c7f7`，56个精确阶段文件；11个既有用户差异与dist.zip仍在工作区且未提交。SDK本阶段仅提交契约/计划/交付证据，SDK运行时代码无变化。私有配置/秘密/运行日志不进入交付目录。

P4三维DWG/大场景LOD分区/专用原生格式尚未实施。后续优先处理真实输入和手测反馈，再按实际需求推进P4，不把当前二维DWG或最小ADD2样本扩展成未实现能力。
