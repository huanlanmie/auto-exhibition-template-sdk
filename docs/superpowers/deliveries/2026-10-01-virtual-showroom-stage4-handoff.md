# P4 大场景与三维网格 DWG 交付

日期2026-10-01。沿用批准方案继续下一阶段，实际范围为 P4-02 静态大场景与 P4-01 受限原始网格 DWG。P4-03 动画/其他原生格式未指定，保留实际扩展与导出回退；没有启用未实现的完整实体 DWG provider。

## 实际功能

- 后台导入向导新增默认关闭的分区选项：原始高精模型生成一次完整全局目录，输出完整近似底模、原始高精分块和固定资源清单。IFC 构件作为完整单位；分块不重新分配业务锚点或改变绑定。LOD 用现已固定的 Three/Meshopt，包含位置/属性及浮点储备的误差度量，近似结果必须接受 partial 报告再复核。
- 编辑器、重导双预览与匿名参观均支持按世界距离/预算加载高清，近远迟滞、两个并发请求、省流/自动/优先高清模式。单个加载句柄独立 fetch 与 AbortController，共享 Blob 用记录/引用数lease；换版本/离开/迟到解析同时释放 GPU 与 Blob，失败保留完整底模。
- 性能面板默认收起，显示真实帧窗口、renderer计数与队列/编码资源量，可导出无凭据 JSON。编码字节不代表 GPU 实测或手机帧率达标。
- 独立“三维网格 DWG”仅支持真实原始3DFACE、POLYLINE_PFACE和未平滑POLYLINE_MESH及受支持普通INSERT。自动 `.dwg` 保持二维；三维模式需分析并确认单位/局部原点/网格范围/双hash，单位/轴/native归一化一次，共同额外缩放一次。未知单位不默认米；ACIS实体/曲面、MESH、动态/MINSERT/代理/xref等明确拒绝并提示源CAD导出STEP/GLB。结果始终partial、source completeness unknown、身份heuristic。
- Java 独立验证固定资源路径/kind/实际SHA/size/MIME、public闭包、原高目录与chunkIds双向集合、m/Y_UP、用户 LOD 目标与实际度量上限、explicit opt-in→实际产物；完成后才原事务/CAS登记。发布再验证资源图/流式实际摘要；私有IFC文件继续硬排除，无新表/迁移。

## 边界和手测

旧505默认单GLB，无迁移、无自动替换/发布。分区最多64块×32MiB，源和合计产物默认100MiB预算保持。静态模式拒动画/skin/morph/instancing/线点；不支持的简化属性保持原几何并记录，目标面数比不保证达到。三维DWG native源32MiB/Windows x64真实Job3GiB与现有超时取消；缺同等quota部署时该native provider禁用。七个固定npm依赖未升级，未安装商业CAD。

纯手测输入：平台 `virtual-showroom-worker/samples/stage4/static-hall-80x60m.glb`，80×60米地面+96个环形普通网格、442380个authored triangles，116604 bytes/SHA d25d73b657682bded4a6cb16e3d6725a2400900a6eca7fdc5a9ef8acc88e9c02。生成器仅直接创作输入，不解析或转换它，也不初始化简化器/native引擎。DWG使用用户真实源文件，无伪造DWG。

用户手测步骤见平台 [P4手册](C:/Users/Administrator/Desktop/mju-smart-show/docs/virtual-showroom/stage4-manual.md)。包括coarse/near/far/失败回退/双画布取消/晚到释放/切模型/手机/非均匀建筑变换、锚点复核/CAS/不可变发布/IFC私有权限、真实DWG拓扑/块变换/未知单位/solid拒绝。没有执行自动功能测试、模型解析/转换验收、引擎/简化器初始化或浏览器业务QA。构建/就绪只证明其各自范围，实际效果与性能待用户手测。

## 构建与本机

最后Worker `npm run build` exit0：JavaScript/MJS/CJS语法、七固定依赖及文件就绪、Windows launcher C# CompileOnly，无Job/model进程启动。Vue `npm run build:prod` exit0，2198modules/12.37s。Java Maven release/source/target17、maven.test.skip=true package exit0，6.696s。无SDK产品源变化，不重复运行其功能测试。

只对确认为原记录exe/startTicks的Worker与showroom重启，继续 `.codex-run/stage11` 配置/数据；没有prepare/snapshot/SQL/Nacos/线下项目修改。当前showroom72464/Worker5632；system56716/auth70244/gateway72484/frontend36796保留。四Java actuator UP、frontend HTTP200、Worker ready11formats含dwg3d，streaming.enabled=true；nativeIsolation windows-job-object/3072MiB，所有新能力verification manual-required。健康不会初始化引擎。

只读505前后完全一致：room1 ONLINE/draft6/publishedRevision2/model f9b1dc78-90c9-4565-8b92-d425818244a1，draft/resources digest b1f0ef97f988fa6bb9fc6adaa8a5fb110422934ad979bdf6accfdf01a946b682，active imports0。11原用户修改bytehash逐项相同，保留在工作树且不会纳入P4提交。

打开 [管理后台](http://localhost:5173/showroom/virtualShowroom/index)，刷新后登录并另建手测展厅。已有 [505案例](http://localhost:5173/v/c7e9aef4aca6489483ce83509701bb99) 保留原版。

## 证据与提交

实施契约/计划见 `../contracts/virtual-showroom-stage4.md` 和 `../plans/2026-10-01-virtual-showroom-stage4.md`。最终任务报告、独立复核、精确49产品文件hash、构建/启动日志、无凭据readiness和505/11hash保留证据在相邻 `2026-10-01-virtual-showroom-stage4-evidence`。

A/B/C、D Java、D Worker/UI与最终架构均独立静态复核Approved，无未关闭Critical/Important/Minor。平台精确49文件本地提交e17dacaf8c7e054d289d3149db5dbb89f55247ce；原11修改留在工作树，未push。已修问题包括Float32双端/target返回精度储备、DWG实体归属完整链/大坐标多边形谓词、共享加载取消传播/Draco生命周期，以及LOD用户目标和opt-in反向闭包。作者不批准自己的范围。
