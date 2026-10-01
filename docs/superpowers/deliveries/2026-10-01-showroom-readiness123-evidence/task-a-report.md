# Readiness123 Task A — implementation handoff

2026-10-01。Status：**implemented / syntax + Worker/UI build passed / awaiting independent crossreview**。Authority为冻结task-a-brief与 `docs/superpowers/contracts/showroom-readiness123.md`。作者不自行批准视觉/模型/性能或自己的变更。五文件最终source已冻结，所有权返回Root。

## Exact source files / SHA256

平台base `e17dacaf8c7e054d289d3149db5dbb89f55247ce`，SDKbase `b049ba0bdd892a559cafc1d1fdc3a5431a83d725`，原checkout，Root负责Git整合。仅修改以下五源文件，新增Report组件已提前向Root声明：

| Absolute file | Final SHA256 |
| --- | --- |
| C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/cad/dxfAnalysis.js | 9E7532972CF60462474D8A14A45261085E6B76766075835CBF928687EBFD10F5 |
| C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/pipeline/streamingLod.js | FFF1062CC26C94863C8AF7826E929D176D604A98AF2187F10255B92407120928 |
| C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/DxfCalibration.vue | A6CE1A48C9A5F9792085052792115A087B1FB916E648D385FA81215660A88BEC |
| C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ImportWizard.vue | B23B6B3AC5CCE706228DEE1CD29A29D1CCFD8B1CF2F5BAA3BFFFD8042283F4A1 |
| C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ImportReport.vue (new) | 2B3FEDF542B613D0D371F999FFE1F584F0DE8BF733DEC0184D6508665F9ABDEF |

没有改Root editor/list/API/guide/Java、B/C代码、任何Desktop/template原件/副本、offlineproject、package/deps/启动脚本。未触505、11原文件、原SDKuntracked；没有stage/commit。仅正常构建产物和本任务scratch报告/log额外落盘。

## DXF actual insert-layer API / behavior

新增唯一分析API字段：

```js
preflight.blocks[].insertLayers = [{ name:'effective layer name', count:actualExpandedInsertCount }]
```

在existing expand完成后，直接遍历同一 `instances` 数组：按实际instance.name与instance.layer Map聚合（layer-0继承、嵌套、数组实例等都是existingexpand生成的effective layer）。每block按精确name取对应Map，再转换 `{name,count}`、以稳定UTF16字符串序排序。counts真实递增，不从rawblock定义或layer名称猜实例。总聚合成员数被原expandedinstances≤100k限制，没有提高raw/groups/instances/paths预算，也没有truncate此字段后假称完整。未实例化定义insertCount0/insertLayers[]。

不改 `document.instances`、builder行为、原sourcehandle identity/metadata目录/坐标/双hash。新字段仅preflight安全name/count，不加入options。private IFC无涉及。

DxfCalibration新blockInfo map对应实际insertLayers：每已选block mapping须至少一真实count>0插入层被当前精确layer role设为equipment；否则显式中文禁止提交，显示实际层/count/是否已选设备。仅定义、零实例、缺新字段旧预检不猜可用，提示取消映射或重新分析。UI可生成条件为至少一actualpath在有效建模层，或至少一有效设备block；空layer/door候选不能单凭角色名称算有模型。所有已选无效block也单独阻止，避免其它墙存在时选中设备仍静默漏。

preflight缺insertLayers时墙/地板等既有路径仍可正常按原校准生成；只有需块映射的用户需重分析，符合清晰能力判断。嵌套已映射equipment父挡住child的原builder规则保留；有效mapping集合至少有顶层实际可生成单位，没有静默改层用途。

## Floor / role payload cleanup

- floor行只编辑thicknessM，label地板厚度，0.01..5m，默认提示0.1；与原builder实际floor挤出字段一致。
- wall显示heightM/thicknessM；column/equipment只heightM；door/ignore没有无效高度输入。
- 生成payload时wallMode只留wall；heightM只留wall/column/equipment；thicknessM只留wall/floor；null/undefined仍移除。role切换旧隐藏字段不会发给builder。builder固定物理语义、openings、blockMappings、acceptedDiagnosticCodes和unit/reference unchanged。

## OBJ/STL explicit unit/scale confirmation

ImportWizard新local refs/computed：unitScaleConfirmed、needsUnitConfirmation、unitScaleValid（known m/cm/mm/in/ft及finite1e-6..1e6scale）。OBJ/STL新checkbox明确要求从原软件确认单位与extraScale；无可靠文件单位，不从名称猜。

- invalidateAnalysis同时撤销确认，覆盖file选择（即使同名/同格式）、entry、format变更；unit/scale同步watch也撤销。
- checkbox在单位/scale空或非法时disabled，canSubmit须确认+实际值合法。其它格式原DXF/IFC/DWG/DWG3D门槛不放宽、不添加重复确认流程。
- submit仍发送原options unit/scale；local确认flag没有放进options，没有新增Worker/Java不识别的校准键。

## Chinese report component / actual budgets

新组件 `ImportReport({report:Object,jobStatus:String})` 用已返回safe report：source format/version、单位来源与实际root normalization比例、输出axis/centering、有效normalizedbounds尺寸、真实统计、resource missing/unsupported/warnings数量、quality soft预算标记、streaming actual high/coarse/reduced/unchanged/error/reserve/skip原因。缺字段显示“未提供”，失败任务无stats不虚构0个资源或转换通过；原JSON可展开保持诊断。

ImportWizard仅terminal SUCCEEDED/FAILED接入它，传jobStatus。FAILED优先显示“未完成资源登记”，即使Worker曾返回success/partial report而随后登记事务失败，也不把Worker转换报告误称已登记。partial确认checkbox、ack API、imported/review事件与父页面CAS原样保留，仍提示应用→导航→内容预览→发布的用户后续步骤。sourceReport私有IFC属性本来不在此public report，未新增source/private props/任意URI读取或v-html。

预算显示不拿默认值当部署成功：global上传上限用capabilities.maxUploadBytes；streaming块数/单块/aggregate来自actualfeatures字段，缺字段不伪造。DXF16MiB与nativeIFC/DWG/DWG3D32MiB是actualprovider固定单入口上限，UI分别标包上传与单入口；原raw单文件超这fixedentry时在analyze/submit前明确拒，ZIP不拿整个包去套单entry限，entry actualbytes仍由服务端最终核。所有后端/Worker预算保持，没为“大模型”涨quota。

## Equivalent single-material full-range LOD

只改eligibility条件：material须单对象（material array仍skip），groups为空走原路径；groups非空只有**一个** group且 materialIndex===0/start===0/count===完整 index.count 或无index position.count才允许。完整drawRange要求仍start0/countInfinity；多组/多材质/partialrange/非法group继续reason material-groups/draw-range保原。

在validateGeometry后先clone，**只clone.clearGroups**，再原nonindexed exact merge、pinnedMeshopt/attribute metric/compaction逻辑。original high groups/material/geometry/sourceAnchor/normalizedmatrix没有变。失败或未減面仍返回originalgeometry，其原groups还在；成功coarse复用原single material、new compactgeometry，不丢face palette。Float32 position quantization/double算术+16epsilon32 reserve/8doubleULP final cap原封保留；没有改所有global vertex/chunk/aggregate/workbuffer预算。

本轮没有init Meshopt或执行一次简化/导出；“可进入受控简化路径”是静态逻辑事实，实际ratio、error、视觉和性能仍待用户。

## Commands / actual outcomes

1. Worker `node --check src/cad/dxfAnalysis.js` exit0/无输出；`node --check src/pipeline/streamingLod.js` exit0/无输出。
2. Worker `npm run build` exit0：`BUILD-NATIVE passed: launcher C# compiled only; no job/model process launched.` / `BUILD-WORKER passed: JavaScript syntax and pinned dependencies resolved. No conversion or browser QA executed.` build脚本syntax+resolve/access固定deps，Windows只CompileOnly，没有加载model engines。
3. UI首轮 `npm run build:prod` exit0，2202 modules；工具输出497lines被截断，因此不拿首次stdout断言所有警告情况。
4. 最后增加FAILED登记状态准确显示与unit/scale empty gate后，再UI `npm run build:prod` exit0，完整log保存 `C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/.superpowers/sdd/2026-10-01-readiness123/task-a-ui-build.log`。实际summary：2202 modules transformed，built in12.30s；log匹配warning/WARN/error/ERROR未返回错误/警告项。并行C/Root UI源码会变化，Root最后必须freshbuild其完整冻结快照；本次build不是其它任务最终验收。
5. 只读Get-FileHash核以上五source；只读git diff --stat四tracked文件，显示正常LF→CRLF Git提示，不做staging/lineending改写。新增Report尚untracked由Root处理。

没运行自动tests、源模型parse/conversion、nativejob或WASM/simplifier初始化、HTTP、BrowserQA、服务启动、sourceDesktop复制或Git mutation。构建不是图纸/模型/模板/设备性能验收。

## Concerns / review focus

- 请独立核preflight effective layer聚合与UIequipment精确交集，不要把“有raw定义”误作“有设备实例”。既有DXF非平面/unknownrole建模仍由builder硬拒；UI诊断勾选不绕约束。
- LOD仅单group完整等价路径，review须核original immutable/clone清group、indexed/nonindexed完整元素、fallback返回originalgroups不丢。多材质保守skip是故意边界，不承诺所有STEP减面。
- 单入口caps是existingprovider常量，actual Worker配置可能额外更严；最终服务端bytes核保持。不能把ZIP总包与选定entry size混淆。
- 真实IFC/DWG尚缺本机非fixture输入与known尺寸，仍使用readiness audit结论；此次界面修复不提供不存在的真实BIM兼容性证明。

## User manual reproduction (not run)

1. 有INSERT的DXF预检：只选desk映射、所有层ignore应中文禁提交；把真实insertLayers中的层改equipment后才有效。未实例化block/不同设备层/嵌套layer0继承需要对照原图；源手动文件变化重新双hash校准。
2. 同层role floor填0.2厚度，人工观察0.2m挤出；改wall/column/equipment检查提交payload无无用hidden字段、wall高度/墙厚行为保持。
3. STL/OBJ选文件后未确认不能导入；unit/scale/entry/file/format改任一个立即撤销；scale清空不可确认，恢复valid后明确确认才导入；用源已知长度手查实际尺寸，不默认模型mm/m。
4. completed partial显示中文实际摘要/缺纹理/skip并可展开JSON；未返回stats显示未提供；登记失败即使保留success转换report也显示未登记且无apply动作。
5. 单材质完整group STEP/IGES、无group普通mesh、multiple groups/material/partial drawRange对照：仅受控equivalentcase进入LOD，source/high组不改；看实际reduced/error/reserve/材质/UV/边界/锚点/绑定，不能仅看目标ratio。
6. 后续复核应用→保旧objectIDs/bindings/interaction/navigation→预览再发布由用户执行；505在本轮一直保持原model/digest/版本，不自动更新。
