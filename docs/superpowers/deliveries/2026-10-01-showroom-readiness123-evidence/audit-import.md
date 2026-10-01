# Readiness 1 — real CAD/BIM import read-only audit

2026-10-01。平台实际HEAD `e17dacaf8c7e054d289d3149db5dbb89f55247ce`；SDK实际HEAD `b049ba0bdd892a559cafc1d1fdc3a5431a83d725`。本轮仅read-only source/inventory审计；只有本报告写入SDK ignored scratch。没有代码修改、自动功能tests、引擎初始化、模型源内容解析/转换/数值验收、browserQA、平台API/登录/DB、secret读取/输出、启动、Git commit。505与11个原用户文件未写。离线项目仅文件名搜索，没有改其源或资产。

结论：现有providers/dualhash/calibration/partial acknowledgement/reimport CAS链具备部署与手测入口，不能把P4静态Approved或模块存在当作真实CAD/BIM已验收。本轮找到2个明确DXF校准UI错配、1个unitless单位确认缺口，以及1个对真实STEP/IGES大模型有直接影响的保守LOD跳过点。以下是小范围candidate fixes，尚未实施。

## A1 — Important readiness: block映射UI可提交但对应设备图层仍被忽略

路径：`C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/DxfCalibration.vue:69,70,86,101`；Worker `src/builders/dxfSpaceBuilder.js:63,173–174`、`src/cad/dxfAnalysis.js:192–195`。

所有层初始role=ignore。UI只要任一blockForms.kind存在，就把“至少一生成几何范围”判为valid。但builder仅对**role(instance.layer)==equipment且mappings匹配name**的实际INSERT创建基础资产。用户仅选“desk/chair/box”块映射、没有把对应插入层改为设备时，canSubmit会为true；选的块资产全部不生成，若没有其它建模层最终DXF_NO_MODELED_GEOMETRY。即使存在其它墙层，这些已选择块也会静默省略；预检目前blocks只有name/insertCount/xref，界面无法准确说明它在哪些插入层生效。

最小candidate：preflight blocks增加来自真实document.instances的有界 `insertLayers` 或 `layerCounts`（只包含层名/计数，不猜块用途）；DxfCalibration对应block项显示其真实插入层，valid必须至少有一个所选block的实际插入层已设equipment（或有其它明确生成几何层）。无匹配时给具体中文说明，而不是自动改全部层。空insertCount定义不可作为生成条件。payload schema无需加新的建模键，只扩分析信息/UI判断；builder既有严格角色语义保持。

建议ownership：Worker dxfAnalysis.js 与 UI DxfCalibration.vue；不改其它provider、Java、源DWG/DXF。

## A2 — Important UI correctness: 地板输入heightM被构建器忽略，厚度无可编辑入口

路径：DxfCalibration.vue`:34,100`；dxfSpaceBuilder.js`:44–47,170`。

表格label为“高/厚覆盖”，floor与column/equipment都显示heightM，而thicknessM输入只在wall时显示。实际floor挤出高是mapping.thicknessM??0.1，floor.heightM未被使用。用户修改floor的可见“高度”后，不管填0.2或2，仍会得到0.1米厚地板且没有说明；无法在此UI填已有schema支持的floor.thicknessM。

最小candidate：floor行改显示“地板厚度（米）”绑定thicknessM，column/equipment显示高度，wall保高度/墙厚。payload按role移除无效heightM/thicknessM，防止隐藏旧值随角色切换误提交。不改builder物理语义；已有floor thickness schema与有限范围可复用。

建议ownership：只DxfCalibration.vue（以及必要UI校准pure helper，如Root选择拆分）。

## A3 — Important manual-readiness: OBJ/STL未知单位仍默认米直接可提交

路径：ImportWizard.vue`:46,48,56,67,69,85`；STL converter显式source unit要求；analyzeRoute的unitConfirmationRequired对obj/stl为true。

默认options.unit='m'；选择STL/OBJ后只显示可切换的单位下拉，没有必须明确确认单位的门槛。canSubmit在这些format只核文件/格式/部署，不核analysis.unitConfirmationRequired或新的确认状态。由于STL/OBJ没有可靠文件单位，默认m字段不能证明用户知道源CAD常用mm。选择一个mm建模STL后未改默认值即可生成1000倍模型；本地确有一个真实STL候选，但本轮没有读/解析它，**不推断其真实单位是mm**。

最小candidate：对OBJ/STL增加清晰单位+额外scale确认checkbox；file/entry/format/unit/scale变化同步撤销确认；canSubmit必须确认后有效，或显式先选单位再确认。继续发送既有unit/scale字段，不加入provider不认识的options键、不默认从文件名猜单位。可显示“STL/OBJ无可靠单位元数据，请按原软件确认”。

建议ownership：ImportWizard.vue与必要pure form-state helper；无需修改STL/OBJ解析器或Java schema。

## A4 — Task3 candidate: STEP/IGES单材质full-range groups也使所有LOD跳过

路径：Worker `src/converters/occt.js:85–107`；`src/pipeline/streamingLod.js:27`。

OCCT converter无论单材质还是多材质都调用geometry.addGroup；单材质palette.length=1时Mesh.material是单对象，但geometry.groups仍非空。streamingLod只要groups.length>0即reason material-groups保原。因此普通单颜色STEP/IGES网格也全部unchanged，coarse可能与high一样重；分区仍能按需加载high，但无法改善首屏完整coarse的基础面数/驻留。当前报告如实给unchanged/skip，没有伪称减面，所以这是保守支持边界和性能准备缺口，不是“静态审核通过就达到性能目标”。

最小candidate：仅对**单Mesh.material且明确覆盖完整triangle drawRange的等价单材质分组**作有界识别。最小允许一个materialIndex=0、start=0、count=全索引数的group；只在用于简化的clone clearGroups，源high不改，仍保normal/UV/color/identity/precisionreserve。多材质、多group不明确覆盖、partialdrawrange继续原保守skip。由另一reviewer核语义，禁止为求减面删face材质。

建议ownership：只streamingLod.js（Task3可整合），不必须改OCCT。若UI仅展示skip原因，用户仍需要源CAD减少多材质面数；不能宣传全部CAD低LOD成功。

## A5 — 非阻断hand-off improvements

- ImportWizard`:29–34`成功/partial主要只JSON `<pre>`；capability.boundary/provider大多英文。真实用户手测最好增加中文结构摘要：实际单位/extra scale/规范化bounds尺寸、原高/底模三角数、reduced/unchanged与skip原因、缺纹理/未支持实体数量、确认partial后下一步“复核应用→导航→预览→发布”。仍保原JSON和代码，不能填没得到的stats。可新ImportReport.vue，只消费真实字段，不改server/report结构。
- 格式输入限制未完整展示：全局UI只显示Java upload上限；Worker DXF16MiB、IFC/DWG32MiB以及native输出100MiB、stream32MiB/chunks64/全output100MiB分别约束。可由capabilities增加安全per-provider inputLimit并UI提前提示/尺寸检查，保Worker最终实际bytes核。不可仅提高上传/输出quota声称大源已支持。
- ZIP自动候选路径和entry选择已有：workspace依据实际entry format，dwg3d显式模式对`.dwg`特殊映射；UIformat/entry变更撤销双hash校准。通用GLB/OBJ ZIP仍可能在未分析情况下手动指定format后submit多入口而后端ENTRY_SELECTION_REQUIRED；可让ZIP先完成入口分析或清楚标“尚未分析”，减少已知失败任务。不是要求服务端猜入口。
- ReimportReview load():51–61冻结review15分钟、明确mapping/detach；后台重算世界变换/CAS。没有发现本次Task1需放宽旧锚点或删除内容绑定的理由。editor.openImport:88先save，本地dirty后applyImport:156–166保留local且拒刷新，避免误丢编辑；本轮不把此保护误报为丢数据缺陷。

## 本机真实输入inventory（只文件名/大小/mtime，不读取模型内容）

搜索范围：Desktop全树与指定CAD/viewer/offline工程、Downloads、Documents/temp与SOLIDWORKSComposer。排除node_modules/.git/dist/target/.superpowers/.virtual-showroom、fixtures/samples/generated目录；排除Python .venv中的编译OBJ误报。没有使用原505模型或生成示例冒充真实CAD/BIM。没有全文读敏感/财务/证书/配置文件，inventory仅按CAD/mesh扩展过滤。

| 原始绝对路径 | 字节数 | 说明 / 可用路线 |
| --- | ---: | --- |
| C:/Users/Administrator/Desktop/SolidWork/output/practice_7_3/Practice_7_3_Tray.step | 281034 | 同名SLDPRT旁的STEP候选（用途来自文件名/路径，未核源内容）；可供用户小CAD手动导入，不能称真实实验室建筑BIM。原文件只读 |
| C:/Users/Administrator/Desktop/SolidWork/output/practice_7_3/Practice_7_3_Tray.SLDPRT | 461273 | 原SolidWorks文件，本部署不支持直接SLDPRT；同目录已有STEP路线，不安装商业CAD/无授权自动导出 |
| C:/Users/Administrator/Desktop/web3d-viewer/public/model/plane.obj | 9276419 | 实际已有OBJ；同目录未找到MTL/texture，不能据文件名猜工程单位/比例/材质。用户确认单位后可做通用mesh路线 |
| C:/Users/Administrator/Downloads/50W小米快充支架.stl | 52884 | 实际已有STL；源单位未知，需用户人工确认，不能默认mm/m |
| C:/Users/Administrator/Downloads/6cb8f543-285c-491a-8cfd-57a1160dc9ab.glb | 120484 | 已有GLB，可手动通用mesh输入；来源/语义未知，不自动把它绑定到505 |

**在上述搜索范围未发现非生成/非依赖fixture的真实 IFC、DWG、DXF、FBX、IGES。** 不声称整机其它磁盘/网盘没有这些文件。既有 `Desktop/虚拟展厅/public/samples/floorplan.dxf` 是samples目录，排除真实材料计数；P3/P4生成输入也排除。当前拥有的是可做STEP/STL/OBJ/GLB人工验证的小输入，不是“大真实BIM”验收材料。

真实IFC/DWG适配验收仍需要用户自己的有效输入/已知尺寸/目标楼层与实体范围；不能用生成fixture或构建health补足此证据。本任务禁止解析与转换，所以无法预判这些candidate实际成功、单位、vertices/materials或partial报告。

## 当前格式路线与限制（来自actual source，非运行结果）

1. glb/gltf/obj：已注册Three0.186.1 triangle pipeline；GLB/Gltf外部资源受package白名单，required unsupportedextension硬拒；missingtexture显式placeholder partial。OBJ缺MTL有固定warning；单位需用户确认。ZIP用于完整resource包，不是模型语义格式。
2. fbx：真实单位metadata/轴one-pass；静态defaultpose，skin/morph bake与animation omitted报告明确，材料PBR approximation。不能称支持源动画/BIM稳定ID。
3. stl：实际binary84+50n或ASCII结构边界；中性材质/明确单位，source无CAD语义稳定ID。
4. step/iges：pinnedOCCT0.0.23 meter tessellation/finitegeometry/actualhierarchy，precision m/radian有有限设置；single-file外部CADrefs不解，sourceunit完整性未知、默认partial。SLDPRT等不能靠扩展名替代STEP importer。
5. dxf：ASCII planar辅助空间建模，支持LINE/LWPOLYLINE/POLYLINE/ARC/CIRCLE/INSERT，双hash、explicitlayer/标尺/墙洞预算；binary/nonplanar/nondefaultOCS建模硬拒。A1/A2是UI→existingbuilder错配，不应为此放宽几何限制。
6. ifc：32MiB SPF、150k实体/1mrefs/node/geometry budgets、schema2x3/4与ADD2条件确认；typedplacement/localorigin/单位consistency校验、GUID namespace、privateproperties。当前manual-required，unsupportedplacement/单位/外部schema有固定拒绝。没有真实IFC输入证明实际兼容性。
7. dwg：私有quotaLibreDWG0.7.14二维→冻结DXF票据，32MiB/header固定6种/strictflags、源ownerScope双hash/TTL，模型只辅助且unknowncompleteness；不自动变3D。
8. dwg3d：单独显式mesh模式，真实3DFACE/PFACE/未平滑mesh、ownership闭包/heap寿命/OCS/negativebasepoint/unit/localorigin限制；ACIS/MESH/proxy/xref/dynamicblock明确不支持。无商业完整DWG engine，solidcapability仍disabled，不由health伪补。

建议Root后续小scope优先A1+A2+A3；A4进入Task3性能准备；A5报告/limits展示可同ImportWizard小改。所有实际模型导入、业务完整流程、桌面/手机运行和性能由用户手动验证，项目运行准备由Root负责，不自动发布505。
