# P4 Task B core 独立静态复核

日期：2026-10-01。审阅者stage11_startup_scout（Task C作者，非B作者）。依据stage4 contract/plan Task B+Global，独立读四份最终source、task-b-report.md、native-research.md及固定libredwg-web 0.7.14声明/现有converter ownership实现。

## 当前裁定

**Approved：仅下列四份锁定B core源码；B-C1已修复静态关闭，当前无未解决Critical/Important/Minor。** 不提前批准Root仍在改的shared route/native supervisor/config/Java/ImportWizard/产物闭包集成；该部分待Root review-package。此报告可作为后续全包review的core证据。

未执行引擎初始化、图纸解析/转换/export、数值或功能测试、浏览器QA、服务/API/数据动作、安装、构建、Git mutation。B作者已有syntax记录，只查报告，不替他重跑。静态Approved不证明真实DWG版本/几何/性能/平台应用手测通过。

## 锁定文件与本席独立SHA256

平台worker根：C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/

- src/native/dwg3dTopology.js：DA38AF0E47962B49D92DB5411EF5223BF377006C90616BD6C2A71CC53E308F84
- src/native/dwg3dBridge.mjs：6E30C38AA630CA1E3011D0B46367E26BE639AB7AAE2AC437498B8511573F3FB2
- src/providers/dwg3dProvider.js：C53082C73DB28DFEF07D5295E85CBFB3D0124F076C776DA8C48760B004C4466B
- src/converters/dwg3d.js：B23A7B6F2388AC06E564B6277C6C1D44B74CBEF957D4AE26440FE05AF26E4B28

## B-C1 Important：工程绝对坐标下quad面积相消 — 已关闭

原triangulate投影p为源绝对坐标，用x_i*y_j-x_j*y_i累加signed area。source允许高工程坐标，单位/明示localOrigin在后面的exportScene才应用，normal/span/cross虽用差值，signed area却先做巨大乘积相消。有效小quad可能先归零或符号失真，导致错拒绝或耳剪方向判断失真，不能由后续localOrigin挽救。

本席只报Root/B，不改作者源、不执行数值或模型输入。Root批准B仅reopen topology；现代码先将二维projected各点减projected[0]，再做cross/intersection/signed area/ear predicates。独立复读最新topology及上述SHA确认。平移仅作用于predicate坐标，原3Dvertices、实际world矩阵、输出positions完全未改；planarity原本已在相对点差上判定。B-C1静态关闭。

## 核心证据

1. 实际scope仅3DFACE/POLYLINE_PFACE/未平滑POLYLINE_MESH与普通INSERT。MESH不列support；ACIS/REGION/BODY/曲面、代理/未知、xref/custom类、动态块/MINSERT明确拒绝。known线注记/纸空间计omission，成功仍partial/completeness unknown；没有二维DXF挤出、placeholder盒子或完整DWG能力假标签。未实例化block不输出，但全库不支持数据的前置拒绝是报告已声明的保守准入。

2. 全库100k objects/1024classes、strict readFlags0、s_zombie/xref检查；model-space/block owned链与每次实例展开depth64/visits100k受界。真正原网格indices/vertices到double世界positions；geometry总顶点/三角10m、native scene nodes20k；无numeric-array局部vector view helper。inline polyface vertind以固定offset和checked HEAP8字节DataView立即复制signed int16，无同view生命期WASM分配调用，负索引仅边可见性语义，不删面。

3. Polyface零终止、unique/range/faceplanarity/degenerate/crossing/ear方向验证；3DFACE重复第三第四点转triangle；polygonmesh按M/N数量与closed flags建真正cell topology，不把smooth控制网格当曲面。invalid/nonplanar可能保守拒绝，这是contract允许的边界，不承诺任意quad都可转换。

4. B-I1 owner completeness增量已独立读：supported mesh/INSERT经dwg_entity_owner(entity TIO)查实际BLOCK_HEADER TIO，并映射raw block对象；native owned链必须覆盖所有实际supported owner成员。VERTEX_PFACE/FACE/MESH的common ownerhandle另解析到正确POLYLINE父，wrong/missing/uncovered拒绝。不用BLOCK_HEADER-only owner API误认subentity。固定包lib/converter/converter.js约397/437行确认owner调用TIO语义；固定wasm/lib .d.ts也确认field offset/common/ref函数。cache仅在证明coverage后保存链，不修补/reorder缺失拓扑来假装success。

5. INSERT矩阵包含任意轴basis、OCS ins_pt、radian Z rotation、非均匀/负scale、negative block basepoint，再递归parent transform；singular/nonfinite/extreme与cycle明确失败。3DFACE/mesh顶点按contractWCS处理，不二次OCS。累计负det调整winding，最终真实三角geometry重算法线；没有动画/纹理/BIM保留承诺。真实CAD坐标语义与version样本仍需用户手测。

6. INSUNITS仅声明known in/ft/mm/cm/m；unknown/zero/missing不默认米，auto在convert要求known或用户explicitunitoverride。options.dwg3d schema1+exactkeys+package/actualentry SHA+scope/unitConfirmed+local origin严格要求；centeringfalse、axisY-up受限。native source-unit一次乘米，再[x,z,-y]和用户明示原点一次；double meshcenter后写Float32，collapsed face拒绝。normalized位置±100000m安全限制明示，不无限容量。browser可信hint m/Y-up供common额外scale一次。

7. source handle chain最多256且stable=false heuristic，raw pointer/index/名字不当stableID。public provider/report是安全allowlist：safeunits/version/entities/counts/diagnostics/statistics与normalized-local basis，没有源datum、路径、名称、任意属性图。preflight bounds/origin仅owned分析结果；private/public endpoint权限与最终清洗归Root集成需另审。

8. parent由选中workspace exact regular entry求actualSHA、realpath containment、32MiB/header白名单，再固定native module payload（无多余entryHash字段）；childhashactualbytes，parent复核provenance。只接受fixed scene.glb/provider-meta.json result列表，output regularfile/realpath/size、GLB magic/version/length及safe metadata再返回fixed derived /derived/scene.glb。转换browser只该fixedscene、禁externalresolver、rejectanimations、sourceAnchor全部stablefalse。

9. childMEMFS fixed /input.dwg，localWASM locateFile白名单，日志1MiB/fixedcode，maxnativeGLB100MiB。无NODEFS/externalrefs/商业CAD、访客vendor引擎或任意workerpayload路径。失败fixedcodes不透native log；parentboundary保DWG3D/NATIVE固定codes，包括cleanup-unconfirmed。真quota/whitelist/quiescence属于现Supervisor与RootD，不由Bcore自己假装实现。

## 继续集成复核/手测边界

Root review-package到来后还需检查dwg3d显式mode与原auto DWG2D分离、actual caps禁用reason/solid needs-deployment、native module白名单与quota/固定message表（含新增DWG3D_OWNERSHIP_INVALID）、derived mount/browser/package私有隔离、Java owner/canonical options/report.dwg3d公开安全保留、Root后端产物stream闭包与aggregate100MiB、ImportWizard单位/原点/双hash撤销及错误源导出引导。

真实DWG手测仍应涵盖支持实体/未知units/嵌套非均匀和镜像INSERT/工程远坐标小quad/owner链缺失/ACIS拒绝/partial与reimport/streaming组合。本席没有执行这些输入，也没有把syntax/build/health等同手测。源码任何变化需按新hash复读才能沿用本报告。
