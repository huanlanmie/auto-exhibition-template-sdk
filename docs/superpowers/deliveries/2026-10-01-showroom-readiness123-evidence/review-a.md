# Task A 独立静态复核

日期：2026-10-01。审阅者 stage11_backend_graph（Task B作者，非A作者）。权威：showroom-readiness123.md、task-a-brief.md；已读 task-a-report.md、review-a-package.md，并独立读取五份当前源码及必要既有builder/report接点。平台基线e17dacaf，审阅对象为当前working tree，不假称已提交。

## 裁定

**Spec compliance：Approved。Code quality：Approved。无可行动的未关闭 Critical、Important 或 Minor。** 五文件实读SHA均与作者锁定报告一致。仅源代码/既有报告/摘要只读，未构建、测试、加载引擎或simplifier、模型解析/转换、API、浏览器QA、启动或改产品源。没有自评Task B；其它Root/C整合由其独立席位负责。

## 逐项静态证据

1. **DXF真实插入图层** — `virtual-showroom-worker/src/cad/dxfAnalysis.js:191–200` 从已展开document.instances逐条累计name与layer，再按block name构成insertLayers{name,count}并稳定排序。既有expand:127按layer0继承求有效layer，:143–155按INSERT数组/嵌套实际placement逐条push，expanded/instance预算在push前执行，因此新字段没有拿block定义数量猜设备。没有实例的定义为[]，xref/非法INSERT仍沿原诊断/拒绝路径。字段安全且只用于预检，不改sourcehash/identity/几何或options schema。

2. **UI与builder交集** — `DxfCalibration.vue:88–95` equipmentInsertLayers仅count>0且该精确层的当前role为equipment；所有选定block映射都独立检查，不能因为另有墙就静默漏设备。没有insertLayers的旧预检不猜设备可用，仍允许已存在实际路径建模。hasModelingPaths排除ignore/door，hasEquipmentBlocks要求上述实际交集。既有 `dxfSpaceBuilder.js:63,173` 用相同instance.layer和mappings，祖先replacement遮盖子块的原规则保留；UI未把父子重复实例宣称都会生成，也没有扩大未知3D实体支持。建模最终几何/选层实体合法性仍由builder核查，预检不是视觉证明。

3. **地板与role字段** — `DxfCalibration.vue:31` floor编辑thicknessM、0.01..5m，与builder:170实际挤出字段一致；wall保height/thickness，column/equipment只height。发送前:110清wallMode非wall、heightM非wall/column/equipment、thicknessM非wall/floor和空值，不残留前一用途隐藏字段。全局墙/门参数、两点reference与单位确认原规则仍在。取消角色不会偷偷改变源图层语义。

4. **OBJ/STL确认撤销与ZIP** — `ImportWizard.vue` needsUnitConfirmation限定obj/stl，unitScaleValid要求明确known unit与finite范围内scale；canSubmit同时要求valid+勾选。invalidateAnalysis在文件选择（含同名重选）、entry和format变化撤销；unit/scale同步watch撤销，不等待下一事件循环。ZIP先auto预检、多候选选定后format同步并触发失效；没有把确认布尔塞到Worker/Java未知options键。原DXF/IFC/DWG/DWG3D校准门槛、DWG票据时限、quality/streaming可用性保留；submit再次以canSubmit守门。

5. **实际限制表达** — upload包预算读取capabilities.maxUploadBytes，streaming block/count/aggregate只显示features实际提供值；缺失不捏造默认已启用。DXF16MiB/native32MiB为既有单入口上限；仅非ZIP原文件可在客户端按此拒绝，ZIP显示单入口含义，真正entrybytes仍由服务端核。没有把压缩包大小当选定entry大小，没有提高后端quota。qualityText是既有档位说明，不是性能检测结果。

6. **中文报告不伪造通过** — 新 `ImportReport.vue` 用实际report.stats/units/normalization/streaming，缺数值显示未提供，不把失败无统计填0。jobStatus FAILED优先“未完成资源登记”，即使已有Worker success/partial报告也不改该事实；ImportWizard仅SUCCEEDED可apply，partial仍显式确认并ack后进入原复核流程。warningsTruncated保原warningCount，missing/unsupported数组缺失显示未提供；简化skip字段与streaming.js:223的{reason,meshes}对应，requestedRatio/maxError/high/coarse/precisionBoundMax均真实报告键。源report.stats保高精目录，不用coarse替换业务高统计。原JSON可展开，Vue文本插值无v-html或任意文件读取。

7. **LOD只开放精确等价case** — `streamingLod.js:26–33` material数组仍skip；单material仅一个group且materialIndex0/start0/count完整index或position才可进入，drawRange依旧start0/countInfinity。NaN/不完整/multiple group不能碰巧满足严格等号。meshTriangleCount先限定safe有效元素，validateGeometry后clone；:91只clone.clearGroups，原high geometry/groups/material/anchor不写。非indexed后续merge仅clone且逐属性核exact；未减面/预算不足返回原geometry（含原groups），finally只dispose temporary/clone。成功compactGeometry生成独立属性/index，沿用single material，既有有限值/至少一有效三角检查保留。

8. **严格浮点/资源界限未放宽** — position量化和double误差、额外Float32 target/return储备先扣减，再Meshopt simplifyWithAttributes+LockBorder+ErrorAbsolute，final combined <= requested +8doubleULP，和此前已审版本一致。128MiB估算工作量、顶点三角总量、source high不变、lazy engine加载默认off全部保留。此次没有执行算法，也不宣称单group真实CAD模型已达到目标ratio/外观或手机帧率。

## 锁定SHA-256（独立读取）

| 平台相对路径 | SHA-256 |
|---|---|
| virtual-showroom-worker/src/cad/dxfAnalysis.js | 9E7532972CF60462474D8A14A45261085E6B76766075835CBF928687EBFD10F5 |
| virtual-showroom-worker/src/pipeline/streamingLod.js | FFF1062CC26C94863C8AF7826E929D176D604A98AF2187F10255B92407120928 |
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/DxfCalibration.vue | A6CE1A48C9A5F9792085052792115A087B1FB916E648D385FA81215660A88BEC |
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ImportWizard.vue | B23B6B3AC5CCE706228DEE1CD29A29D1CCFD8B1CF2F5BAA3BFFFD8042283F4A1 |
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ImportReport.vue | 2B3FEDF542B613D0D371F999FFE1F584F0DE8BF733DEC0184D6508665F9ABDEF |

绝对平台根：C:/Users/Administrator/Desktop/mju-smart-show。用户仍需真实图纸、已知尺寸与设备进行手动验收。作者已有build日志仅作为作者交付证据，本席没有重复执行，静态Approved不替代实际功能或Root最终整合构建。
