# P4 三维 DWG / 按需原生入口只读研究

日期：2026-10-01。研究者：Task B 席位。仅阅读固定已安装包、官方源码/文档、非秘密安装登记；未初始化引擎、解析图纸、转换、测试、启动 CAD、安装或修改产品源码。没有修改 505。

## 结论

**现有部署可实现独立的“三维网格 DWG”受限 provider，不能据此声称支持全部三维 DWG 或 ACIS 实体。** 最小可靠实现范围为原始 3DFACE；POLYLINE_PFACE、未平滑 POLYLINE_MESH 以及 level-0 MESH 的字段/拓扑在固定源码中可读，但需要新增有界拓扑读取和真正的三角化，不能直接调用当前二维 DXF builder，也不能把控制网格冒充平滑曲面。BREP/ACIS `3DSOLID/REGION/BODY`、曲面、代理和外部引用应明确拒绝；完整实体 provider 保持 disabled。

本机目前未发现 AutoCAD/Core Console/ODA 可直接使用的安装，也没有适用于本服务的商业授权证据。不能通过“安装了 OCCT/web-ifc”推导已具备 DWG ACIS 三角化能力。

## 固定版本和许可事实

| 已安装包 | 版本 / 包声明许可 | 对本研究的实际意义 |
|---|---|---|
| @mlightcad/libredwg-web | 0.7.14 / GPL-3.0 | Node raw WASM 能读取 DWG；沿用私有进程、许可与对应源交付，不能放访客 vendor |
| web-ifc | 0.0.78 / MPL-2.0 | IFC 专用，不是 DWG reader 或 ACIS 内核 |
| occt-import-js | 0.0.23 / LGPL-2.1 | 现有 API 为 ReadBrepFile、ReadStepFile、ReadIgesFile；其中 BREP 是 OCCT BREP 格式，不是任意 DWG 内的 ACIS/SAT |

LibreDWG package 对应研究源码 revision：`1dd682f46339f37b67c5ff1085d10d04a8c16d7e`。GNU LibreDWG 本体按 GPLv3 或后续版本发布；具体分发应保留现有 GPL notices、桥接源码和对应源信息。进程分离不是整项目许可结论。[GNU 项目](https://www.gnu.org/software/libredwg/)

Open Cascade 官方将 ACIS SAT/SAB 列在另外的商业数据交换组件中；免费 CAD Assistant 中这些组件的导入还附有禁止导出/转换的限制，不能借用其查看能力充当服务转换授权。[官方 CAD Assistant 说明](https://www.opencascade.com/products/cad-assistant/)、[官方附加数据交换组件说明](https://github.com/Open-Cascade-SAS/OCCT/discussions/1157)

## 固定包 API 证据

本地基准目录：`C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/node_modules/@mlightcad/libredwg-web/`。

- `lib/converter/entityConverter.js:177–194` 的 `convert3dFace` 读取 `corner1..corner4`、`invis_flags`，没有构造假盒子。这是可独立抽取真实三维面顶点的直接证据。
- 同文件 `:195–230` 的 `convert3dSolid` 只读取 `version/acis_empty/acis_data/revision/history`；`lib/database/entities/solid3d.d.ts:24` 将 data 声明为专有 ACIS/SAT 数据。未发现三维实体三角化输出接口。
- 同文件 `:1380–1450` 仅提供 POLYLINE2D/POLYLINE3D 转换；3D polyline 是线，不是闭合三角网格。高层 converter 没有实现 POLYLINE_PFACE/POLYLINE_MESH/MESH 输出，因此不能直接依赖 `convert()` 声称这些格式已可用。
- `wasm/libredwg-web.d.ts:393–441` 有 `dwg_model_space_object`、对象枚举、对象 handle、owned entity/subentity 遍历、引用解析；`:538–540` 有 header/entity/common 字段读取。`dwg_dynapi_entity_field_offset(tio,name)` 和 HEAPU8/HEAP16/HEAPU32 也在该声明中。
- `lib/libredwg.d.ts:398–481` 声明多种整数/点数组函数；是否安全可直接使用必须继续看其 C++ 实现，不能只看 TS 返回类型。

固定官方源码链接：

- [字段及内存布局：include/dwg.h](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/include/dwg.h)
- [raw 通用字段 getter 和 offset：binding_dynapi.cpp](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/embind/binding_dynapi.cpp)
- [raw 遍历绑定：binding_func.cpp](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/embind/binding_func.cpp)
- [数组绑定：binding_common.cpp](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/embind/binding_common.cpp)
- [owned subentity 实现：src/dwg.c](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/src/dwg.c)
- [真实字段类型/offset 表：src/dynapi.c](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/src/dynapi.c)

### 三维拓扑可行范围

| 类型 | 可读取证据 | 最小适配边界 |
|---|---|---|
| 3DFACE | corner1..4 是三维点；第三和第四相同表示三角面 | 验证有限值、面积、三角/四边形；四边形需明确共面/凸性或稳健分割策略；invisible edge 不是删除整个面 |
| POLYLINE_PFACE | dwg.h:2724 的 numverts/numfaces，加 COMMON_ENTITY_POLYLINE owned vertices；VERTEX_PFACE.point、VERTEX_PFACE_FACE.vertind[4] | 按真实有序子实体构建坐标/面索引；计数只是提示，必须与实际枚举核对；负索引表示隐藏边，不是负顶点；0 终止一个面 |
| POLYLINE_MESH | dwg.h:2736 的 flag/curve_type/num_m_verts/num_n_verts，VERTEX_MESH.point | 只接收未 curve/spline-fit 的原始 M×N 格网，核对 M×N 与实际点数、两个闭合方向；不从控制网格假还原平滑面 |
| MESH | dwg.h:6047 的 dlevel、num_vertex/vertex、num_faces/faces、subdiv_vertex、edges/crease | 可以设计 level-0 顶点与打包面列表读取；num_faces 是 DXF93 对应的面列表元素数，不能当三角形数量；dlevel>0/无法解释 subdivision/crease 应拒绝或保留 disabled，不冒充最终曲面 |
| POLYLINE_3D / LINE / POINT | 包有对应点/线读取 | 不是三角几何；可列诊断/按确认范围省略，不能挤出任意厚度冒充原模型 |
| 3DSOLID / REGION / BODY / 曲面 | ACIS/SAT 或专有参数数据，没有固定包三角化 API | 独立错误 `DWG3D_SOLID_UNSUPPORTED`；不能用包围盒替代、不能把 wireframe 当实体 |

`src/dwg.c:1318/1368` 明确处理 POLYLINE_PFACE/POLYLINE_MESH 的 first/next owned subentity。遍历带内部 iterator；需循环预算、visited 检查、owner/type 核验，且不可因第一条链不完整就把全文件所有顶点拼到同一网格。模型空间入口和 block 递归要分开，避免未实例化 block 定义或 paper-space 被重复显示。

Autodesk 规定 3DFACE 点为 WCS，四点中后两点重复表示三角形；polyface 索引从 1 开始、负数代表边不可见。[3DFACE 官方定义](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-747865D5-51F0-45F2-BEFE-9572DBC5B151.htm)、[VERTEX 官方定义](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-0741E831-599E-4CBF-91E1-8ADBCFD6556D.htm)。Polyface 的声明 counts 可能不准确，真实拓扑必须独立核验。[官方 Polyface 说明](https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-DXF/files/GUID-96B6288E-F413-46C0-968A-A314171C0AAE.htm)

### 两个必须规避的 binding 陷阱

1. **vertind 不是普通数组指针。** 固定 `src/dynapi.c:4125` 把它描述为内联 `BSd`、8 bytes；binding_dynapi 的通用 getter 没有这个内联四元素类型的分支。不能把 `.data` 当四个有效索引。可用已导出的 `dwg_dynapi_entity_field_offset(tio,'vertind')`，严格验证 offset 与 `tio+offset+8 <= current HEAPU8.byteLength`，同步 DataView little-endian `getInt16` 读取四个值。offset<0 立即拒绝，不猜硬编码 struct 偏移。
2. **通用 numeric array helper 有返回视图寿命风险。** 固定 `binding_common.cpp:139` 用局部 `std::vector<type>` 创建 `typed_memory_view(data.size(),data.data())` 后返回；局部 vector 随函数返回销毁。不能把此视图假定为持续有效的已复制 JS 数组。建议所有索引/count×bytes检查通过后，从当前 WASM heap 的原始字段指针直接同步复制；不在读取过程中调用任何可能分配/增长内存的 WASM API。point3d helper 不同，它逐项创建 JS 点对象；仍需先核 count/pointer/budget。内存范围检查不能证明原 C++ allocation 的真实长度，因此 native quota、严格 readFlags、count 合理性和异常拒绝仍不可缺。

## 单位、OCS 与块实例

- `dwg_dynapi_header_value(data,'INSUNITS')` 可读单位元数据；0/缺失/未知值必须要求用户确认，不默认米。至少明确支持 mm/cm/m/in/ft（其他代码仅在精确定义后加入），报告 headerCode、确认/override 来源、实际 metresPerSourceUnit。INSUNITS 是插入单位约定，并不证明用户实际建模比例正确。[INSUNITS 官方定义](https://help.autodesk.com/cloudhelp/2026/ENU/AutoCAD-Core/files/GUID-A58A87BB-482B-4042-A00A-EEF55A2B4FD8.htm)
- 3DFACE/3D mesh 点在其所属模型/块的 WCS 型坐标中，不应再次对每个三维顶点应用 OCS。INSERT 是 OCS 类型；应结合 extrusion 的任意轴基、ins_pt、rotation、非均匀/负 scale、BLOCK_HEADER.base_pt 形成块到父级的矩阵，再递归累积。不能把所有 DWG 实体统一按一个 OCS 旋转。[官方坐标系分类](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-D99F1509-E4E4-47A3-8691-92EA07DC88F5.htm)、[INSERT 字段](https://help.autodesk.com/cloudhelp/2017/ENU/AutoCAD-DXF/files/GUID-28FA4CFB-9D5E-4880-9F11-36C97578252F.htm)
- 包 `entityConverter.js:762` 明确读取 block_header、ins_pt、scale、rotation、extrusion、num_cols/num_rows、col_spacing/row_spacing；只返回数据，没有给出已烘焙世界矩阵。首版可以明确拒绝 MINSERT、动态块或非支持的变换，而不能忽略其效果。若实现数组，需先检查展开总实例/三角预算和非均匀缩放下间距的原始语义。
- 在 native 或 browser 的单一固定位置完成 metre 与 `[x,z,-y]` Z-up→Y-up；必须输出 trusted normalizationHint，共同层不得第二次乘单位/旋转。若保留用户额外 scale，明确它与源单位转换不同。负 determinant 需正确处理三角 winding/normal；法线使用正确变换或由最终三角面重算。
- handle 可以用 `dwg_obj_get_handle_value` 的 bigint 转十六进制并结合 INSERT chain，但首版仍建议 `stable:false`，直到整个模型身份/重复/重导语义经过独立论证；不能把 pointer 或对象数组序号升级为稳定身份。

## 当前主机事实 / 商业路线

2026-10-01 再次只读核查：PATH 的 acad.exe、accoreconsole.exe、ODAFileConverter.exe、TeighaFileConverter.exe、dwgread.exe、dwg2dxf.exe 都不存在；常见 Autodesk/ODA Program Files 根不存在；HKLM64/HKLM32/HKCU uninstall 未找到相应产品；AutoCAD.Application 与 Autodesk/AutoCAD 安装键不存在。前一日更广应用目录扫描也未找到候选，详见 stage3 `dwg-research.md`。结论限于检查范围，没有声称所有磁盘绝无隐藏/便携安装；未读取许可钥匙。

采用了 `C:/Users/Administrator/.codex/skills/solidworks-automation/subskills/autocad-automation/SKILL.md` 的能力核查原则。技能历史上的 AutoCAD2024 verified 记录不等于本机已安装；未运行其 COM preflight。

ODA Drawings SDK 官方列出 DWG 三维/可视化及 STL/Three.js 等导出能力，可作为将来获得适用授权后的真正广范围方案；免费 File Converter 的 DWG/DXF 转码不等于模型内核三角化或平台服务授权。[Drawings SDK](https://www.opendesign.com/products/drawings)、[File Converter](https://www.opendesign.com/guestfiles/oda_file_converter)。本阶段没有商业工具安装/授权事实，应保留 `needs-deployment`，不能下载或自动启用。AutoCAD CoreConsole 的固定插件路线也必须以实际产品版本和适用授权为前提。

## 建议最小 provider 契约（待 Root 冻结）

1. 仍以 DWG 为源文件格式，单独显式 `mode:'mesh3d'` 或独立 provider ID `dwg3d`；二维 provider 的能力和冻结校准协议保持原样。自动分析可报告存在的实体类型并要求选择适配模式，不静默把三维数据送二维 builder。
2. 私有独立 Node bridge + 现有 Job supervisor；固定 32MiB 输入、strict readFlags、对象/类/顶点/三角/实例/递归深度/输出 bytes 预算、MEMFS、不访问 xrefs、不启动 CAD。三维直接读取 raw 几何并输出内嵌 GLB + 安全 provider-meta，无需绕成二维 DXF。
3. 首版推荐 3DFACE + 实际实现完的 POLYLINE_PFACE/未平滑 POLYLINE_MESH；MESH 只有明确实现 level0 拓扑且 decoder 未报 unsupported 才列入 enabledSubtype。仅枚举里有 MESH 名称不算支持。ACIS solids 等 hard error，不输出替代盒子；全无支持网格立即失败。
4. 颜色可用受界限的 entity/layer true color/ACI 近似 PBR；不声称纹理、动画、精确曲面/实体属性或 BIM 语义。报告包含 supported/omitted/rejected entity counts、单位来源、source version/read flags、坐标归一化、identity confidence，成功仍明确 `completeness:'unknown'` 和相应 partial diagnostics。
5. capability 精确为“DWG 三维网格（列举实体范围）”，`manual-required`；另列 ACIS/代理/xrefs/平滑 mesh disabled reason。不能把代码存在或构建通过写成实际图纸转换成功。

## P4-03 扩展边界

现 roadmap `docs/superpowers/plans/2026-09-30-virtual-showroom-roadmap.md:113` 明确只在实际需求确认后新增动画/原生 provider。本次用户没有指定 SolidWorks/Inventor/Revit/3DM/Parasolid 等具体新格式，因此保持扩展注册接口、unsupported/needs-deployment 与导出 STEP/GLB 等实际 fallback；不为未知格式创建空成功 provider，不推断用户要商业转换器，不为“P4 全部”自行扩大格式承诺。已有 GLB 动画能力也不代表复杂 CAD 动画已支持。将来每个格式须独立固定版本、许可/部署条件、几何/材质/动画/实例/身份/外部引用边界和手测样本。

研究结论仅证明源码/API层面的实现路径及边界。没有任何 DWG/IFC/OCCT 实际加载、解析、转换或兼容性结果；具体 P4 interfaces/实现 scope 等待 Root 契约。
