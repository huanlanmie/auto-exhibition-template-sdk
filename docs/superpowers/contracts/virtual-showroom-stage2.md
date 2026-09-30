# 虚拟展厅 P2 模型与 CAD 契约

用户已要求继续下一阶段；本阶段落实原 roadmap 的 P2-01 至 P2-05。沿用已批准总体方案和 P1/v1.1 归属、草稿CAS、不可变发布与访客隔离机制。本阶段不写、不运行单元/集成/E2E 功能测试或浏览器业务QA；构建、编译、静态复核与就绪检查保留，由用户手测格式和交互。

## 格式和转换接口

规范格式：`glb/gltf/obj/fbx/stl/dxf/step/iges`，`stp→step`、`igs→iges`；ZIP仍是容器。首次实现FBX静态默认姿态、ASCII/Binary STL、ASCII DXF辅助建模、单文件STEP/IGES。DWG/IFC属于P3，不能作为已启用格式。依赖固定Three0.186.1、dxf-parser1.1.2、occt-import-js0.0.23。

保留ConversionRequest、HMAC及四个转换产物协议。`options.quality` 为 `{preset:'desktop'|'mobile'}`（缺省desktop）；共同options仍有`unit/scale/axis/centering/entryFile`。STEP/IGES的`options.occt`可选 `{linearDeflection:0.001,angularDeflection:0.35}`，线性误差为输出米制绝对值；合法范围线性1e-6..0.1、角度0.01..1.5。未选精度时desktop0.001/0.35、mobile0.005/0.5。

各provider导出`convertFbx/convertStl/convertOcct/convertDxf(context)`异步函数。context=`{entryUrl,manager,report,resolveReference,placeholder,options,files,sourceHash,maxInputBytes}`。产出`{scene,animations,sourceVersion,normalizationHint?,units?,coordinateTransform?,sourceIdentityConfidence?,navigationHints?}`；动画FBX/CAD/STL/DXF为[]。可信的normalizationHint只能由provider生成，不能取请求同名字段：`{loaderOutputUnit:'source'|'m',metersPerLoaderUnit?,loaderOutputAxis:'source'|'Y_UP',unitBasis,sourceAxis?}`。

FBX Loader自动UpAxis转换后固定Y_UP，源单位因子取用户明确单位覆盖或有效`unitScaleFactor*0.01`；缺失时要求单位。STL要求明确单位。OCCT请求输出meter，公共流水线不再乘mm换算，仍按用户确认向上轴旋转并应用额外scale。DXF建模已把源坐标转米/Y_UP，公共流水线不再应用单位/轴/额外scale，仅执行约定居中；DXF最终有效因子须包含用户scale，已知长度校准时直接使用distanceM/sourceDistance，不叠乘单位。报告保留输入依据和变换，不能推断OCCT未提供的源单位/失败面数量/GUID。

资源仍只能来自已验证私有源包；FBX包内basename回退须唯一，绝不抓取外部URI。ASCII FBX版本>=7000、Binary>=6400仅是Loader入口条件，报告静态/材质/蒙皮等降级，不称无损。STL非标准颜色明确报告。节点、输入/展开、字节、几何和期限均受预算限制。

## DXF分析与校准

纯模块`src/cad/dxfAnalysis.js`导出`analyzeDxf(bytes,{sourceHash,parserFactory,limits?})→{document,preflight}`；Node传固定dxf-parser构造器，浏览器传globalThis.DxfParser，不从模块加载Node专用API。preflight可公开，document只留Worker。analysis应含raw ASCII group扫描，不能把parser跳过实体/生成handle视作真实源身份。

preflight=`{schemaVersion:1,sourceHash,format:'dxf',sourceVersion,sourceUnits:{code,suggestedUnit,basis},bounds:{min:[x,y,z],max:[x,y,z]},layers:[{name,entityCount,types,bounds?,suggestedRole?}],blocks:[{name,insertCount}],paths:[{entityRef,layer,points:[[x,y,z]],closed,sourceType,stableId?}],diagnostics:[{code,severity:'info'|'warning'|'error',message,entityRef?,layer?}],limits,truncated?}`。允许额外统计，但私有路径不能进入公开结果。图层名必须精确匹配，不使用正则/eval。先支持WCS XY平面、默认法向的二维实体；非默认OCS、不支持三维实体、xref、未闭合/自交轮廓须明确定位；不能静默拉墙。LINE、二维POLYLINE/LWPOLYLINE（含bulge）、ARC、CIRCLE、INSERT嵌套/块基点/缩放/旋转/阵列/图层0继承需有界展开。曲线先在源坐标系离散再作块仿射变换，ARC弧度、INSERT旋转度。

`options.dxf={schemaVersion:1,sourceHash,entryHash,unitConfirmed:true,reference?:{a:[x,y],b:[x,y],distanceM},wallHeightM:3,wallThicknessM:0.12,doorHeightM:2.1,chordToleranceM:0.02,layers:[{name,role:'wall'|'floor'|'door'|'column'|'equipment'|'ignore',wallMode?:'centerline'|'outline',heightM?,thicknessM?}],blockMappings?:[{name,kind:'box'|'desk'|'screen'|'cabinet'|'chair',heightM,widthM?,depthM?}],openings:[{id,wallPathRef,centerDistanceM,widthM,heightM,sillM:0}],acceptedDiagnosticCodes:[]}`。独立复核补强：preflight追加`entryHash=SHA256(实际entry bytes)`，options必须带回并由converter重新计算核对；包hash一致不能把同ZIP其他DXF条目的校准套用。Node分析在可终止worker_thread执行，父请求signal负责期限/断连。

Builder `src/builders/dxfSpaceBuilder.js`导出`buildDxfSpace(analysis,options,context)→provider result`；converter读取文件、analyze、调用builder。校准sourceHash必须匹配实际包摘要，不能复用其他文件分析结果。门图层仅给候选，开口必须由明确wallPathRef/沿墙距离定义，不自动猜最近墙或把门扇弧认作洞口。墙高/厚/开口均为米，合法高度0.1..20、厚度0.01..5；柱/地板须闭合有效轮廓。equipment/blockMappings生成有标识的基础资产。未映射图层视为ignore并报告；映射到建模角色的非平面/未知实体阻止转换，明确忽略后为partial。预算：DXF16MiB，groups1,000,000，raw/expanded实体各100,000，嵌套16，曲线段每曲线2048，总paths20,000，preflight预览点50,000；截断明确报告不能假装完整。

## 分析接口与能力

Worker新增`POST /v1/analyze`，使用相同HMAC/源hash/私有工作区/期限/并发预算；普通JSON返回`{type:'analysis',analysis:preflight}`，不产已应用建筑，不写DB。多入口时返回有界candidates及`requiresEntrySelection:true`，供界面选择后再分析。非DXF返回入口/格式/单位注意事项，CAD详细分析仅DXF。health返回真实已部署formats、provider版本/边界，不因单个扩展provider缺失而伪称可用。

Java新增`POST /virtual/admin/import-preflight` multipart`showroomId/file/options`，owner+import权限；存有界私有源、worker analyze、返回公开analysis，不修改草稿。源文件仅做临时私有存储并清理，不写现场配置。`GET /import-capabilities`结合Worker health返回实际formats和quality presets；createJob后端允许列表与能力一致，拒绝未部署provider。分析和转换均不能读取上传目录以外路径、外部引用网络或磁盘文件。

## 质量与锚点目录

`src/pipeline/optimize.js`导出`applyQuality(root,options,report)→{preset,maxTextureSize,budgets,...}`：desktop纹理最大2048、mobile1024；分别三角预算1,000,000/250,000，输出预算100MiB/40MiB，单文件统一硬上限100MiB。实际GLTFExporter执行纹理上限，报告几何/贴图尺寸、预设、输出字节、超预算。本阶段不自动减面/合并节点，避免破坏CAD身份及屏幕UV；几何超软预算为partial需人工接受，硬上限仍拒绝。

model-meta保持schemaVersion1，追加`sourceFormat,sourceHash,sourceIdentityConfidence,anchors,quality,navigationHints?`。`anchors[]`=`{nodeId,label,hierarchyPath,sourceIdentity:{format,id,basis,stable},identityConfidence:'source-entity'|'hierarchy-path'|'none',normalizedMatrix4:[16列主序],anchorFrameBasis,bounds:{min,max},geometrySignature?}`。normalizedMatrix4为米制规范空间中的锚点参考帧；普通格式为node-world。独立复核补强：STEP/IGES/STL顶点可能包含全局位置而node为identity，使用node-linear-transform-with-bounds-center帧（保持nodeworld线性部分，平移用world bounds中心），另存nodeWorldMatrix4，明确它不是原node.matrixWorld。辅助平移跟随不代表能推断烘焙在顶点中的旋转/形变。目录在userData清理/质量处理前采集，不把Three UUID/meshIndex/名称当稳定身份；raw DXF handle链可标source-entity，FBX导入ID和OCCT名/序号仅启发式。max20,000锚点，超限截断诊断并禁用完整匹配假设；源ID超过256字符则截断并强制stable=false/诊断，不能截断后判exact。保留sanitized sourceAnchor extras，不公开任意原userData。

## 重导与管理接口

所有接口相对`/virtual/admin/showrooms/{id}`：

- GET `/models/{modelVersionId}/metadata`：query权限+owner，读取该厅已验证固定meta，返回公开目录/报告，不泄露存储路径。
- PUT `/objects/{objectId}/anchor`：edit权限，`{expectedDraftVersion,nodeId}`（nodeId:null解除），仅绑定当前建筑模型合法锚点，保持世界位置。存`anchorRef:{modelVersionId,nodeId}`，不改变绑定/业务ID。
- POST `/model-replacement-review`：edit权限，`{expectedDraftVersion,targetModelVersionId}`。生成15分钟reviewId，固定owner/room/draft/sourceModel/targetModel/digest。返回`{reviewId,expectedDraftVersion,targetModelVersionId,rows:[{objectId,name,status:'exact'|'suggested'|'ambiguous'|'missing'|'world',suggestedNodeId?,candidates:[],message?}],targetAnchors,diagnostics}`。
- POST `/apply-model`：edit权限，`{expectedDraftVersion,reviewId,targetModelVersionId,mappings:[{objectId,action:'map',targetNodeId}|{objectId,action:'detach-keep-world'}]}`。后台从原草稿及固定old/new目录计算，不接受客户端提交对象/绑定。每个anchored row必须有明确决策；world行原样保留，无自动丢对象/清模板。

映射公式`Wnew = AnewWorld × inverse(AoldWorld) × Wold`，A含保持的建筑modelToShowroom。矩阵必须有限可逆；剪切/非正scale/不适配TRS等不可表达结果拒绝并提示手动解除锚点保留位置。exact仅唯一可信source identity；路径/名称/几何匹配只是建议；歧义/缺失必须选节点或明确解除。原objectId/name/enabled/contentBinding/previewRef/interactionGraph保持，导航默认保持并显示需复核提示；保存及发布仍沿用已有校验。首次导入也走review/apply，不能在editor中直接覆盖building后自动save。旧model-meta无anchors时返回空目录，仍支持world保留/明确解除旧anchor。

UI新增DxfCalibration.vue、ReimportReview.vue、scene-core/anchorMatching.js；ImportWizard增加preflight/layer角色/单位或两点校准/门洞/质量与OCCT精度，档位提供实际限制文案。ObjectProperties显示锚点选择/状态/解除。没有验证成功的新格式界面标记“需手动确认”；不声明DWG/IFC启用。当前505已发布案例、数据、模板及访客软件联动不被自动重导或重新发布。
