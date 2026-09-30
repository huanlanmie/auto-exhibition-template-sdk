# P4 Task B independent static review

2026-10-01。Reviewer A席位，非B作者；不评A自己。**最后差量复核：Spec compliance Approved / Code quality Approved，B-I1已关闭，无未解决Critical/Important/Minor。** 下文保留初轮问题及后续源码证据。使用task-reviewer的scope/spec+quality方法，用户明确只准静态，因此未运行engine/parse/convert/build/tests/浏览器QA/启动/安装/Git操作；产品源码只读。此结论不表示真实DWG已转换验收。

## 锁定范围与证据

读取权威stage4 contract TaskB/Global/ReviewFocus、plan TaskB、精确 `review-b-package.md`、`task-b-report.md` 与 `native-research.md`。package输出在bridge中途因工具输出截断，故为完整判定再逐文件读取bridge/provider/converter（不是扩大范围）；topology完整段已在package读到，用定向rg取得行号。四文件actual SHA与package均匹配：

- `C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/native/dwg3dTopology.js` — `2166BFA30042C8BB759A04FAC61ADA0AAA4D4110F231E49275CE75F8B7551C78`
- `.../src/native/dwg3dBridge.mjs` — `6E30C38AA630CA1E3011D0B46367E26BE639AB7AAE2AC437498B8511573F3FB2`
- `.../src/providers/dwg3dProvider.js` — `C53082C73DB28DFEF07D5295E85CBFB3D0124F076C776DA8C48760B004C4466B`
- `.../src/converters/dwg3d.js` — `B23A7B6F2388AC06E564B6277C6C1D44B74CBEF957D4AE26440FE05AF26E4B28`

范围外只检查具体接口风险：pinned package TS声明/enum/原始entity字段/owned链与owner签名、common source package SHA验证、native固定module whitelist/quota/failure传递、Root convert extraScale/派发和runner public文件许可。没有爬其它业务代码。upstream只读fixed revision `1dd682f46339f37b67c5ff1085d10d04a8c16d7e` primary C++/C/header；无下载安装执行。

## Important B-I1 — owned链不完整时可静默丢已支持几何

**路径/行号：** `dwg3dTopology.js:81–90` owned，`:86–87` ownerhandle条件式略过，`:110–129` polyface owned topology，`:152–165` walk。唯一阻断。已先报Root与B作者。

**Trigger：** 真实DWG的BLOCK_HEADER first/next ownership链为空或仅前缀，另有明确owner属于同一reachable modelspace/INSERT block的supported mesh或INSERT；已有一其它validmesh允许最终nonempty输出。或者polyline child链断裂而留下另一有效face，header advisory numfaces又只产生一般mismatch warning。

**Effect：** 当前owned只信first/next链，并在ownerhandle getter失败或ref=0时放过归属检查。它没有对已扫描records中该owner的真实支持实体做完整集合核验。walk于是可成功生成剩余网格，漏掉本可明确归属的支持几何/嵌套实例，boundsSource/suggestedOrigin也基于遗漏后的几何。source的泛化partial/unknown不代替此具体已知geometry丢失的诊断，也不满足模型空间/已实例化block正确范围承诺。

**Static evidence：** 固定已安装包 `lib/converter/converter.js:286–323` 明确对first_owned返回0和真实writers的partial ownership链提供owner索引补全。`converter.js:434–442` 对entity TIO调用dwg_entity_owner并把BLOCK_HEADER TIO映回block object。其源 [dwg.c](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/src/dwg.c) 的owned iterator按version选择first/last或ref arrays，返回null本身没有证明所有源归属实体已被覆盖。

**Fix：** precompute bounded authoritative ownership sets，main supported mesh/INSERT用 `dwg_entity_owner(record.tio)` （不是record.ptr；先前即时消息的ptr建议已更正），返回BLOCK_HEADER TIO通过预建blockTio→record映射核验。对子VERTEX/PFACE_FACE直接核成功ownerhandle/ref解析到所属POLYLINE，不能用此block-owner API替代。每reachable block/polyline的实际owned链与已确认归属支持集合必须相等、无错owner/重复/丢失，无法确认/断链固定AUDIT/TOPOLOGY failclosed；不要按全文件pointer顺序拼网格，不把orphan或未实例化定义猜进modelspace。可保留advisory numverts/numfaces不准确的partial warning，区别于结构owned成员不完整。

[binding_ent.cpp](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/embind/binding_ent.cpp) 与 [dwg_api.c](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/src/dwg_api.c) 确认该签名：generic entity TIO入，block TIO出，显式owner其次entmode MSPACE/PSPACE。VERTEX owner为POLYLINE且entmode0不会被这个API当block返回，需单独核子所有权。

## 已核符合项 / strengths

- topology支持范围exact 3DFACE/POLYLINE_PFACE/POLYLINE_MESH（`:4`）；global admission拒solid/surface/proxy/xref/dynamic/MINSERT/未知3D（`:60–79`），没有DXF、挤线或box替代。MESH未advertise且明确拒。paper/modelspace入口与instantiated block递归分开（`:152–176`），存在cycle/depth/instance预算。B-I1闭包仍须补。
- 3DFACE真corner、重复第三/第四表示三角；quad finite/planarity/nonzero/selfcross/ear orientation（`:20–43`）。PFACE inline vertind通过field_offset+checked current heap 8bytes、little-endian signed16同步读取，DataView使用中无WASM call（`:112–119`），负索引只取绝对引用保面，零终止；indices range/unique/triangulation严格（`:122–130`）。header advisory counts mismatch明确warning，不默认生成不存在的面。
- pinned `dwg.h` inline `BITCODE_BSd vertind[4]` 与 `dynapi` getter无四元素分支已核；没有使用危险numeric vector-view helper。primitive/mesh counts和typed-array分配边界有先核：objects/classes/depth/visits/geometry/nodes（`:48–49`,`:92–104`,`:136–143`,`:153–155`）。native OS aggregate quota负责总体分配，不把heap bounds检查当C++ allocation证明。
- INSERT `A(extrusion)×T(ins_pt)×Rz(rotation)×S(scale)×T(-block.base)`（`:144–151`），三维顶点WCS型不额外OCS转换，递归累计parent matrix（`:159–160`），负det翻三角winding（`:100–104`），非finite/singular/extreme scale拒绝。Float64真实source/world位置先取得；bridge最终米/Yup、每mesh double中心rebase、Float32面退化拒绝、computeVertexNormals（bridge`:59–87`）。没有默认缺失transform为identity。
- INSUNITS known5种或显式auto/override，unknown不默认米（bridge`:21–28`）；convert dualhash/schema/scope/unitConfirmed/localOrigin米Yup/axis锁/centeringfalse（`:30–39`）。N×u与localOrigin仅native一次（`:65–72`）；browser hint m/YUP防重做units/axis，Root common additionalScale仍只一次（converter`:13` / commonconvert`:76`）。公共coordinate report只有normalized-local-scene，不含source datum。
- handles真实hex+INSERT链且stablefalse（topology`:70–72`,`:104`，bridge`:81`，converter`:10–13`）；不把rawptr/index当source稳定身份。Root global目录原流程仍负责n IDs。neutral material明确approximation/partial/completenessunknown。
- Parent→child固定payload字段/固定scene.glb/provider-meta/result文件（provider`:20–26`,`63–72`，bridge`:115–121`），derived URL exact `/derived/scene.glb`、外部资源拒绝（converter`:6–9`）。actual entry bytes SHA由child和parent独立核；package SHA由原 `src/io/jobWorkspace.js:47` 核。metadata rebuilt positive allowlist+fixeddiagnostic messages（provider`:28–46`,`67–72`），no raw source names/tickets/object graphs公开。
- Native source/output regular-file/realpath约束、32MiB input/header/readFlags0/log cap/MEMFS与100MiB GLB（bridge`:92–106`,`85–87`；provider`:12–26`,`65–66`）；Root boundedNode已加exact dwg3dBridge module（`:9`），仍≤3072MiB、quiescence proof后返回、DWG3D failure prefix与NATIVE_CLEANUP_UNCONFIRMED传递（`:23–26`,`88–105`），没有新fallback物理引擎或无quota启用。这里只核必要交接，不重评P3 supervisor全部实现。
- Root runner新增browser converter/streaming pure helper白名单，native/topology/Node provider不在访客app文件许可；config精确scope/支持实体且solidprovider disabled。capability不宣称全部3D DWG。

## 静态限制 / Root gate

本次Task B静态没有其它Critical/Important/Minor。B-I1修复差量需独立复读/锁hash后才能Approved。原作者node --check结果仅语法证据；本review没有重跑syntax/build/模型，真实3DFACE/PFACE/mesh、OCS/嵌套/镜像、unknownunits、失败病例仍待用户手测。

Root负责最终共同error map、Java/UI的dwg3d schema/capability/双hash/owner metadata、aggregate100MiB/publicclosure、server重启与505保留；未以这四文件替代跨层最终复核。

## B-I1 修复独立复读 — Approved

修复仅 `dwg3dTopology.js`。实际SHA256再次只读核对为 `A5A2FE78F86CEE9FB583568FB9BD2485FF1DBB6953C462B9059C7E534C4A1210`，与B返源消息一致；其余三文件不属于该修复增量，初轮已匹配锁定包。

- 新`:84–96` 建block TIO映射、blockOwners/requiredByBlock，全源supported mesh与INSERT均通过正确的 `module.dwg_entity_owner(record.tio)` 得到真实BLOCK_HEADER TIO；未知owner固定DWG3D_OWNERSHIP_INVALID，不猜orphan modelspace。
- 新`:97–103` 对所有VERTEX_PFACE/PFACE_FACE/MESH核common ownerhandle getter成功、非0、ref解析为对应真实POLYLINE subtype；subOwners/requiredByPolyline来源于全源records，不调用只返回block的owner API来猜subvertex归属。
- 新owned `:106–120` 有界链visited、每支持成员owner一致，结束时必须覆盖该owner的所有known required raw成员。主链中来自其它owner的mesh/INSERT/注记不能通过，polyline其它face/vertex不能通过；链空/前缀丢raw支持成员直接固定错误。缓存完整闭包列表，也避免重复实例再使用有内部iterator状态的库链；未实例化block没有发射几何，唯一模型空间递归入口原封不动。
- 原advisory numverts/numfaces mismatch的warning保留新`:161`，但实际遗漏owned VERTEX/face先在闭包核验失败，无法用该warning掩盖B-I1。原rawheap复制、face indices、三角化、transform、预算、origin和单位实现未扩张到另一pipeline。

没有新增Important。fixed `DWG3D_OWNERSHIP_INVALID`沿现DWG3D native failure prefix可传播，Root需补其安全message map/手册提示“不完整或无法确认的原始ownership，请源CAD修复/另存受支持STEP/GLB”，不建议猜测几何恢复。静态锁定通过，实际engine/模型手测仍未执行。

## B-C1 后续大坐标predicate精度修复 — Approved

Task C独立指出quad signed area使用绝对坐标乘积，对大工程坐标中的小面存在消减。Root授权作者仅topology修后返回。实际最新SHA256核为 `DA38AF0E47962B49D92DB5411EF5223BF377006C90616BD6C2A71CC53E308F84`，与修复报告一致。

只读复核triangulate新`:31–38`：先按主法线轴投影，再把所有临时2D predicate点减去同一projected[0]，交叉/交点/area/ear均使用这个相对坐标。原3D vertices并未改；triangle直接返回、plane检查、emit source世界坐标、bounds和native origin rebase保持原定义。无新增Important，B最终Approved仍成立。此修复减少算法额外消减，不能恢复原输入double已丢失的精度；本轮没有任何数值/模型执行。
