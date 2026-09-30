# P3 IFC provider 只读研究

日期：2026-09-30。建议：首轮固定 **web-ifc 0.0.78**，以浏览器 IIFE＋单线程 WASM 接入现有受控 Chromium Worker；沿用 GLB、model-meta、import-report、preview，并按root最新拟定追加私有 IFC属性第五产物。IfcOpenShell 原生进程作为复杂几何的独立后续 provider，不能在首轮失败时无声明自动切换。本报告是实施建议，尚不是批准的 P3 契约或实际转换验收。

已读 SDK roadmap 的 P3-01/P3-03、总体 spec 的 IFC/schema/地理坐标段、P2 契约；已读 Worker convert.js、metadata.js、browser/runner.js、convert.html、build.js。当前本机未安装 web-ifc。没有安装、导入库、初始化 WASM、解析/转换样本、功能测试、浏览器 QA、构建或启动；仅查询 npm/PyPI 元数据、读取源代码/官方文档并写本报告。

## 固定依赖与部署

本机 `npm view web-ifc@0.0.78 ... --registry=https://registry.npmjs.org --json` 得到：版本 0.0.78，MPL-2.0，gitHead `4310503d8618a0870c2166f101471078d528f4c1`；integrity `sha512-LGKMNYFVNyz9vVERN0iz+zvPQJqT7MEGBxslzcuuhwDDOA116LmJLKkg8sZ5SEvQJSc5NRVMWgpRNkDmuoQoJg==`。默认本机镜像得到相同 integrity。上游 main 已为 0.0.79，不能把 main/docs 的变化当成固定包事实。[固定版本 manifest](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/package.json)

包中精确文件：`web-ifc-api-iife.js`（global `WebIFC`）、`web-ifc-api.js`（浏览器 ESM）、`web-ifc-api-node.js`（Node 条件入口）、对应 `.d.ts`、`ifc-schema.d.ts`、`web-ifc.wasm`、`web-ifc-node.wasm`、`web-ifc-mt.wasm`、`web-ifc-mt.worker.js`、`LICENSE.md`。建议 root 为 IIFE/单线程 WASM 添加精确 vendor 白名单，不开放整个 node_modules；在 convert.html 固定脚本初始化后传 API 构造器或读取固定 global。Node 的 `web-ifc` 条件入口会选择 node bundle，不能把该文件送进浏览器。首次不启用 pthread，不新增跨源隔离要求。

建议调用骨架（仅文档，未执行）：

```js
const api = new WebIFC.IfcAPI();
await api.Init((name) => {
  if (name !== 'web-ifc.wasm') throw new Error('IFC_PROVIDER_UNAVAILABLE');
  return '/vendor/web-ifc/web-ifc.wasm';
}, true); // forceSingleThread
const modelID = api.OpenModel(bytes, {
  ALLOW_INCOMPATIBLE_SCHEMA_ALIASES: false,
  COORDINATE_TO_ORIGIN: false,
  CIRCLE_SEGMENTS: 24,
  TAPE_SIZE: 16 * 1024 * 1024,
  MEMORY_LIMIT: 256 * 1024 * 1024
});
// 检查 modelID，提取有界 metadata；StreamMeshes 只传预先验证的选中 IDs。
// finally: api.CloseModel(modelID); api.Dispose();
```

精确 API：`GetModelSchema(modelID)`；`GetHeaderLine(modelID, FILE_SCHEMA)`；`GetLine(modelID,id,false,false)`；`GetLineIDsWithType(modelID,type,includeInherited)`；`GetAllLines(modelID)`；`GetNameFromTypeCode(type)`；`StreamMeshes(modelID,ids,callback,applyLinearScalingFactor)`；`GetGeometry(modelID,geometryExpressID)`；`GetVertexArray(ptr,size)`；`GetIndexArray(ptr,size)`；`GetCoordinationMatrix(modelID)`；`GetWorldTransformMatrix(modelID,ObjectPlacement.value)`；`SetGeometryTransformation(modelID,matrix16)`。`GetLine(...true)` 递归 flatten 与批量 `LoadAllGeometry` 首轮不使用。[固定 API 源码](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/ts/web-ifc-api.ts)

## Schema 边界

固定生成表列三组布局：IFC2X3、IFC4、IFC4X3；第三组 EXPRESS 文件实际声明 `SCHEMA IFC4X3_ADD2`。API `LookupSchemaId` 在 strict 模式接受 canonical `IFC4X3` 与 `IFC4X3_ADD2`，拒绝其他不兼容别名。默认 `ALLOW_INCOMPATIBLE_SCHEMA_ALIASES=true`，必须覆盖 false。首轮入口严格识别 IFC-SPF 的唯一 FILE_SCHEMA，不以扩展名判定，不把 IFCXML 或未知 schema 当 IFC4；ZIP 沿用现有安全入口选择，不能直接交给 OpenModel。[固定 EXPRESS](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/schema-generator/IFC4X3.exp)，[固定 schema 表](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/ts/ifc-schema.ts)

能力应分别标记 IFC2X3、IFC4、IFC4X3_ADD2 条件支持；`IFC4X3` 仅记录为固定生成器的 ADD2 canonical 别名，不能泛指全部 IFC4.3 历史格式。IFC2X_FINAL、IFC4X1、IFC4X2、IFC4X3_RC1/RC2/RC3/RC4、IFC4X3_ADD1、IFC4X2SCGL 默认明确拒绝。schema 能读取不等于所有实体都能生成正确几何；ADD2 道路/铁路/线性 placement/sectioned solid 须另列限制与手测，不宣称完整基础设施支持。

## 几何、单位与一次归一化

固定 C++ `GetFlatMesh` 先组合 `_transformation * NormalizeIFC * mat`，默认 mat 是工程单位到米的因子；之后组合构件放置、representation/mapped item 变换以及 geometry.Normalize 的局部回补平移。`NormalizeIFC` 明确把源 `[x,y,z]` 转成 `[x,z,-y]`。因此 flatTransformation **不是单纯 ObjectPlacement**，不能再乘一次 placement、单位或 Z-up。[固定处理器](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/cpp/web-ifc/geometry/IfcGeometryProcessor.cpp)，[朝向矩阵](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/cpp/web-ifc/geometry/representation/geometry.h)

推荐平台明确掌握单位：有界解析唯一 IfcProject.UnitsInContext，验证唯一 LENGTHUNIT，首轮支持 SI METRE＋合法 prefix、可解到 SI 的无偏移 ConversionBasedUnit；递归访问需有 visited/depth，缺失、多项目冲突、未知/偏移单位严格拒绝或先进入待确认流程，不能采用引擎内部默认为 1 的因子并报告“源为米”。固定 cache 对 SI/conversion 因子有专门处理，未找到单位时内部因子默认 1；这不证明源文件单位。[固定单位缓存](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/cpp/web-ifc/cache/IfcCache.cpp)，[默认值](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/cpp/web-ifc/cache/IfcCache.h)

按 root 最新拟定路线，采用单一默认策略：`StreamMeshes(..., true)`，严格限制到平台解析与固定 native 单位因子一致的支持单位；flatTransformation 已是米/Y_UP，不再乘 u。返回 `normalizationHint={loaderOutputUnit:'m',loaderOutputAxis:'Y_UP',sourceAxis:'Z_UP',sourceUnit,unitBasis:'ifc-project-unit-assignment'}`。无单位/冲突/未知单位不能将默认 true 输出登记为可信米制。备选 false＋平台缩放只可作为另行明确定义的实现，不能同一次导入混用。任何明确单位 override 若与 IFC 定义冲突，应阻止或显式报告，不把单位冲突隐藏在 additional scale 中。

公共 convert.js 当前单位 hint=m 会使 unitScale=1、Y_UP 会抑制二次转轴；IFC 仍由 common 应用用户 options.scale 与 centering。provider 不再包含 options.scale，区别于 DXF。provider.coordinateTransform.matrix4 应记录源工程坐标到 provider 米/Y_UP 的实际矩阵；最终由现有 rootMatrix×providerMatrix 组合。多模型对齐时 centering=none，origin 必须共用明确 datum，不能每个 IFC 由“首个网格”分别移原点。上述是平台矩阵设计建议，尚未通过模型转换验证。

流式回调中的几何只在该 callback 生命周期有效；固定 StreamMeshes 回调结束会 Clear(true)。顶点为 position/normal 六分量，`GetVertexDataSize` 和 `GetIndexDataSize` 返回 **元素数量**，不是字节；API GetVertexArray/GetIndexArray 内部会复制 `.slice(0)`，必须先检查 size/预算再调用。检查 stride=6、索引整三角、每个值有限、索引范围、matrix16 仿射与非奇异，再构造 Three BufferGeometry。[固定流式绑定](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/cpp/wasm/web-ifc-wasm.cpp)，[固定 geometry buffers](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/cpp/web-ifc/geometry/representation/IfcGeometry.cpp)

首轮仅 color/alpha 近似 PBR；不下载 IfcImageTexture、外部 document/URI、外链分类字典或媒体，不执行任何属性内容。保留有界外部引用存在性诊断，不公开私有磁盘路径。空间/开口默认保留 metadata，默认 StreamAllMeshes 排除 IfcSpace/IfcOpeningElement/OpeningStandardCase；若产品需要显示空间网格，应显式选中 IDs 走 StreamMeshes，不能宣称默认都已转换。

## 稳定身份、层级与属性

建议新增 `src/metadata/ifcMetadata.js`：`collectIfcMetadata(api,modelID,{limits,selectedTypes,storeyGlobalIds})`，返回纯 JSON 的 schema/project、spatial graph、elements、unitAssignment、georeference、diagnostics 与完整性统计。只用浅 GetLine＋显式白名单 references；不要把任意递归 IFC 对象塞入 userData。原始 nullable 字段照实 null；不推算未给的面积、成本、楼层标高或 CRS。

层级建立一次 `IfcRelAggregates`、`IfcRelNests`、`IfcRelContainedInSpatialStructure` 索引；Project→Site→Building→Storey→Element 是常见树，但多重 containment、无父级、cycle 必须定位，不能猜树；相关缺失元素放有诊断的未归类组。仅 preserve 真实 Storey.Elevation，另存单位/placement 世界高度，不能把两者视为同一基准。Psets/数量通过 RelDefinesByProperties、类型通过 RelDefinesByType，保留是否 type-inherited；single value/list/enum/quantity 使用固定类型白名单，其它 complex/reference 值报告未保留。上游 helpers 可供参考，但其递归/全关系查询不替代预算索引。[属性 helpers](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/ts/helpers/properties.ts)

每个真实构件只建立一个可匹配 Group：`sourceAnchor={format:'ifc',id:GlobalId,basis:'ifc-global-id',stable:true}`；若唯一合法 projectGuid 已可靠验证，id可为 `projectGuid:elementGuid`，整个导入固定同一命名空间策略并另保留原始 elementGuid。所有几何片段成为 child mesh，片段 ExpressID/geometry ID 只能 stable:false。GlobalId 必须满足 IFC 压缩 GUID 格式（22 字符且首位 0..3），在整份源文件的 rooted 元素范围确认唯一；缺失/非法/重复均禁止 exact 身份。不能在每个片段上重复写同一个稳定 GlobalId。文件内 ExpressID、名称、Three UUID、片段序号都不是重导身份。跨模型同 GUID 仍需按业务导入资源范围及歧义检查处理。

锚点必须是构件 placement 帧，不能取 geometry.Normalize 产生的片段原点。`GetWorldTransformMatrix(ObjectPlacement ID)` 返回原 IFC 工程坐标的累计 placement，列主序；它不是米制/Y_UP flatTransformation。当单位为 u 时，`Q=N×S(u)×P×S(1/u)` 生成构件规范帧（rotation不被单位污染）。默认 true 的 flat geometry F 已含米/Y_UP，mesh local=`Q⁻¹×F`；groupQ乘child正好恢复F。语义父组真实 Qparent 时，child group local=`Qparent⁻¹×Qchild`，避免层级重新叠加 world placement。共同原点 D 作为所有 IFC 元素之上的 provider 根，metadata 保留原世界 placement与D。无有效放置时不得虚构精确可跟随帧。

**需要 root 共同集成：** 现 pipeline/metadata.js 的 stable whitelist 仅 DXF；须精确添加 ifc/ifc-global-id，并复用长度、歧义、目录上限规则。collectMetadata 清理 userData 后不自动保存 BIM 字段，因此 provider sidecar必须在清理前建立 element GlobalId→采集后nodeId关联。按root最新拟定，公开 model-meta 仅保留安全type/storey IDs/GUID/geometry/必要坐标信息，属性另输出第五产物 `ifc-properties.json`，kind=`model-private`，从public manifest/resources严格排除。GLB extras仍只保留 sanitized sourceAnchor；不能靠任意 userData 逃过清理。shape/placement与语义目录分别标明complete/truncated，私有属性文件也要记录完整性。现有 anchors最大20,000与重导duplicate处理继续有效。第四产物契约扩展与private kind由root负责，provider不能自创公开URL。

固定 GeometryLoader 对 cycle/depth>512 的 placement 会记录错误后返回 identity；平台应在调用前检查 PlacementRelTo 与引用图，避免把该 fallback 当有效放置。首轮 LocalPlacement 支持优先；GridPlacement/LinearPlacement 不宣称精确稳定 placement 帧，拒绝选中不支持构件或明确 partial/manual anchor，ADD2 特别单列。[固定 placement loader](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/cpp/web-ifc/geometry/IfcGeometryLoader.cpp)

## 地理坐标

首轮建议 **local-engineering＋保留 georef**，不自动执行投影。记录真实 IfcGeometricRepresentationContext.WorldCoordinateSystem/TrueNorth、IfcProjectedCRS、IfcMapConversion（以及不支持子类的类型与诊断）、Site 经纬度/RefElevation。IFC2X3 的 ePSet_MapConversion/ePSet_ProjectedCRS 若存在则原样有界保留，不由经纬度猜 EPSG。MapConversion 是比例、平面旋转与平移，不是经纬度地图投影；也不能再与 TrueNorth 重复旋转。[buildingSMART 定义](https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/lexical/IfcMapConversion.htm)，[IfcOpenShell IFC2X3 georef 说明](https://docs.ifcopenshell.org/autoapi/ifcopenshell/util/geolocation/index.html)

Georef metadata 建议 `{mode:'local-engineering',applied:false,crs:null|fields,mapConversion:null|fields,sourceContextId,localOriginM:[x,y,z],basis,unresolvedReasons:[]}`。按root最新拟定，`localOriginM` 明確为 **米/Y_UP**，不是源单位或投影ENH；provider直接减该向量，`D=T(-localOriginM)`，不能再乘u或N。source模式D=I；local模式provider根D，下级groupQ与childQ⁻¹F不再含D，最终几何是D×F，不会重复平移。MapUnit与工程LengthUnit分别保留。很大world translation留在double matrix，先减统一datum再构造最终Float32；超出precision policy要求明确origin，不能静默截断。multi-model共同datum应由业务选项/已有场景定义，provider不得各自选择。

精确原点恢复：对provider米/Y_UP点v，工程源world点=`S(1/u)×N⁻¹×D⁻¹×v`。common若还应用extra scale/centering，则先乘共同rootMatrix⁻¹。因此provider.coordinateTransform.matrix4=`D×N×S(u)`，common report记录`rootMatrix×D×N×S(u)`；placement P与片段表示残差留各element元数据，不能把一个元素的P写成整个文件根矩阵。原始storey标高及MapConversion参数仍按各自单位记录，不能由重定位后的Y值反造源值。

## Root最新分析/选项路线与 typed placement

Node child analyze与browser convert可共用同一纯 metadata helper，注入固定Node/browser IfcAPI，不静态导入Node API到browser模块。child只OpenModel与浅metadata，不生成几何；root负责kill deadline、固定provider部署状态与纯JSON返回。analysis建议包含schema/storeys/types/unit/georef/诊断/counts、包sourceHash与实际entryHash。convert重新计算entry bytes SHA256；双hash匹配、schemaConfirmed严格boolean true，并核实际schema，不能信options里的schema或hash。storeyExpressIds/types ID列表须唯一/有界/类型正确；缺include数组表示all，[]表示none，不自动回退全选。includeUncontained必须定义与空storey数组的优先级，不默默把[]解释为all；basic|psets属性policy只控制私有侧文件，不能改变公开属性隔离。originMode=source|local、localOriginM为米/Y_UP，source模式不能偷偷保留另一个origin平移。

typed placement最低校验：ObjectPlacement须真实Handle、正安全ExpressID且引用存在；首轮仅IfcLocalPlacement。沿PlacementRelTo迭代/visited≤128，每一父引用须同为合法LocalPlacement；RelativePlacement严格为IfcAxis2Placement3D或允许的2D。Location须IfcCartesianPoint且Coordinates维度与placement匹配、每值有限；Axis/RefDirection缺省遵循schema的默认轴，非缺省引用须IfcDirection且DirectionRatios有限/非零/正确维度，3D两轴不得平行。未知/错误型、循环、缺引用、非有限或奇异矩阵明确拒绝，不能接受native identity fallback。取P后再核16列主序仿射/有限/非奇异。schema已有LinearPlacement生成类不代表首轮能安全精确放置：固定native只读取其部分参数，GridPlacement没有对应case，二者先列placement unsupported，不用unit/axis补丁“修正”。

源码位置（固定gitHead，HTTP直接读取）：web-ifc-api.ts Init:386、settings:499、strict schema:518、OpenModel:549、GetWorldTransformMatrix:1377、arrays:1386、StreamMeshes:1423；web-ifc-wasm.cpp callback/free:101–128、排除space/opening:180–195、GetWorldTransformMatrix:329–344；IfcGeometryProcessor.cpp flat composition:1932–1948、最终F:2023；geometry/representation/geometry.h含NormalizeIFC四列；IfcGeometryLoader.cpp GetLocalPlacement:3919起、cycle identity:3921–3924。引用位置来自固定源的直接HTTP行号；在线main/生成docs可能随版本改变，不能替代固定代码。

## 预算与失败策略（建议初值）

| 边界 | 建议 |
| --- | --- |
| 单 IFC-SPF 输入 | 32 MiB，仍受共同 ZIP/input caps；文件过大先拒绝 |
| raw STEP entities/references | 500,000 / 1,000,000；有界字符串/参数嵌套扫描先于 OpenModel |
| 层级/placement深度 | 128；visited cycle 检查；禁止引擎 identity fallback |
| 选中产品、Three nodes | 各20,000；stream IDs已验证、不能传任意用户ID |
| 关系、属性 | 100,000关系；每构件1,024属性、总200,000；单文本4,096字符 |
| 公开 IFC metadata | 8 MiB；诊断最多500，截断标记与实际计数 |
| WASM tape | TAPE_SIZE16 MiB、MEMORY_LIMIT256 MiB，固定不由请求覆盖 |
| 网格 | callback sizes先检查；总10m vertices，精确indices/count/matrix检查；复用共同quality/output limits |
| circle tessellation | 固定24或按quality档12/24；不开放无界请求 |
| 期限 | 复用父 AbortSignal→销毁每任务 Chromium，不能指望 setTimeout 打断同步 WASM |

**内存限制要如实登记：** MEMORY_LIMIT 只转换成解析 token tape 的 maxChunks，不是几何堆/进程 RSS cap；固定 CMake 开启 memory growth，MAXIMUM_MEMORY=4GB。streaming 减少全模型持有，却仍在回调前由 native 生成单个构件，callback 预算不能阻止其前置几何分配。现 runner 每任务独立 Chromium 有 deadline/外网阻断，尚无实际进程内存 quota。面向不可信大模型的生产启用应配套真实容器/cgroup 或 Windows Job Object 进程树限额；仅传 MEMORY_LIMIT 不能在交付里称完整内存隔离。[固定 tape loader](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/cpp/web-ifc/parsing/IfcLoader.cpp)，[固定 WASM 构建参数](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/src/cpp/CMakeLists.txt)

建议固定公开 errors：IFC_PROVIDER_UNAVAILABLE、INVALID_IFC、IFC_SCHEMA_UNSUPPORTED、IFC_UNIT_UNSUPPORTED、IFC_PLACEMENT_UNSUPPORTED、IFC_REFERENCE_CYCLE、IFC_PARSE_BUDGET、IFC_METADATA_BUDGET、IFC_GEOMETRY_BUDGET、IFC_GEOMETRY_INCOMPLETE、IFC_ORIGIN_REQUIRED。缺GUID/重复GUID、属性/材质省略和选择过滤为具体诊断；模型含 Representation 却无生成网格须比较 selected products 与 observed callbacks，不能以“回调没有报错”宣称完整。错误字符串只固定映射，不泄漏源路径或 native 异常。

## IfcOpenShell 备选

官方 PyPI 当前0.9.0，2026-09-29发布，Python3.10..<3.16，有 Windows x64 与 Linux glibc2.31+ x64 wheels；示例固定候选 `ifcopenshell-0.9.0-py311-none-win_amd64.whl`，SHA256 `82939fe4e85ce6880d94804b041af1c930f7991569346e3eba4bb92021dfdfc3`。本机未检查/安装匹配 Python 或 wheel，不把可下载当本机可运行。[官方发布](https://pypi.org/project/ifcopenshell/)

可部署为独立 Python 子进程：`ifcopenshell.open(privatePath)`＋`ifcopenshell.geom.settings()`＋`ifcopenshell.geom.iterator(settings,model,threads,include=selected)`；读取 shape 的 GUID、局部verts/faces、transformation，再输出 GLB/metadata的 provider-neutral 中间结果，或由官方 IfcConvert生成 GLB同时另提语义。需固定 meter/unit和local/world-coords一次策略；`use-world-coords=true`烘焙placement之后不能再乘 shape transform；默认工程源单位不能由输出米反推。[官方几何处理](https://docs.ifcopenshell.org/ifcopenshell-python/geometry_processing.html)，[IfcConvert 参数](https://docs.ifcopenshell.org/ifcconvert/usage.html)

IfcOpenShell 文档声明 IFC2x3 TC1/IFC4 Add2 TC1 丰富几何支持，其他 schema 的 parsing 能力不能直接等同 ADD2完整几何。选择0.9.0也仍需单独核其 schema registry/代表几何，不代替样本验收；本研究没有解析验证它的 ADD2覆盖。原生隔离容易接系统进程 quota，但额外 Python/OCCT原生部署成本比既有Chromium＋WASM高。

许可：web-ifc 上游 MPL-2.0，保留发行文件/license和修改源的相应告知；IfcOpenShell 库 LGPL-3.0-or-later。IfcConvert/其他组合工具须核各组件许可，不能把 Bonsai 的 GPL标签套到库，或把整个发行组合一律称 LGPL。报告没有提供法律结论。[web-ifc LICENSE](https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/4310503d8618a0870c2166f101471078d528f4c1/LICENSE.md)，[IfcOpenShell 官方许可/能力](https://docs.ifcopenshell.org/ifcopenshell.html)

## 手测样本计划（本轮未获取/转换）

1. 小型自有 IFC2X3建筑：米与毫米两份、墙/门洞/楼层、已知5m尺寸、旋转平移 LocalPlacement。核网格尺寸、Y-up、storey原始标高、placement帧、GUID与属性。
2. 自有 IFC4建筑：mapped representations复用、多色/alpha、类型pset、枚举/list/quantity、缺可选字段；核一个构件Group对应多个mesh、无重复稳定ID、unknown字段保持null。
3. 保持GlobalId、只移动/旋转构件及改变STEP ExpressID顺序的两版：核业务屏幕/绑定跟随真实placement；重复/非法/缺GlobalId另作手测拒绝exact匹配。
4. 高程/投影坐标大值、明确MapConversion/CRS、无CRS、IFC2X3 ePSet、两模型共同datum：核保留原始georef、local origin和共同相对位置，不自动宣称地图投影。
5. 固定上游 ADD2 小夹具可候选：`tests/functional/fixtures/primitives-and-voids/ifc4x3_add2-block.ifc`、`tests/functional/fixtures/sectioned-solid/ifc4x3_add2-sectioned-horizontal.ifc`、circle/cylinder等；需先检查每个样本版权/FILE_SCHEMA并登记hash，用户手测。RC2 road sample只作为应拒绝输入，不能转成功后列ADD2验收。
6. malformed SPF、schema aliases、cycle、deepplacement、超record/property/input/native geometry预算、外部IfcImageTexture URI、断连/期限、仅不支持representation：核固定错误、无外网、完整性/partial诊断与资源释放。上述全是手测清单，不授权自动执行。

实施准备 scope 可拆：provider/IFC metadata作者拥有新增 ifc.js/ifcMetadata.js；root拥有依赖pin、vendor、schema/health、共同metadata stable whitelist/sidecar/normalizer；UI作者拥有IFC过滤/georef/options；另安排独立schema/matrix/identity/预算静态复核。没有必要改模板SDK或业务发布内容。
