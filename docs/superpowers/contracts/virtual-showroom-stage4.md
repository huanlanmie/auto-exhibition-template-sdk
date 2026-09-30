# P4 专用与规模扩展契约

日期2026-10-01。用户继续已批准roadmap的下一阶段，授权P4实现；沿用P3业务/隐私/发布/跨项目边界和并行实施方式，不重复许可流程。暂按大场景优先推进，同时实现有实际原始网格读取API的受限dwg3d。其它原生格式/动画尚未指定，只保留扩展与实际fallback，不伪造新provider。用户手动功能验收；不写/运行自动测试、模型解析/转换样本验收或浏览器业务QA。允许纯输入生成、编译/构建、独立静态复核和就绪/数据保留只读检查。

## 共同范围

平台P3基线c7c142040ed54bf1d30abbd4732ab7b1b231c7f7，SDK1e12cb4abb3ccdf3e206f6f78ce72fdeaae3846d。原checkouts/codex/virtual-showroom-stage4分支，保留505（当前ONLINE/draft6/public2/原model与digest）及11个原用户修改，不写生产SQL/Nacos/线下客户端/网关、不改现场设备、不重新snapshot或发布。保留Node22/Three0.186.1与七个固定npm依赖，无商业CAD下载/安装。模型源/产物原有100MiB默认合计预算、GLB100MiB硬限及IFCnative前置100MiB仍有效；分区改变加载方式，不宣称无限大源或无限内存。

## A 可选静态分区/LOD输出

新增Worker `src/pipeline/streamingOptions.js`,`streamingLod.js`,`streaming.js`；Root共同convert/runner/meta/artifact派发消费。API：`captureStreamingIdentity(root) -> {canonicalNodes:WeakSet}`须在collectMetadata清除raw extras前调用；`async prepareStreaming(root,spec,meta,report,identity,quality) -> {scene,chunkOutputs,streamingManifest}`。Root只采集一次原高精全局metadata，归一化/坐标/quality仍一次；helper不调用collectMetadata、不重新分配n00001…、不修改原高geometry。scene为完整低细节coarse GLB场景，chunkOutputs固定`[{name:'chunks/c0001.glb',glbBase64}]`，size/SHA/bounds/IDs等descriptor统一在streamingManifest.chunks；streamingManifest为下面安全JSON，无private IFC内容。

`options.streaming={enabled:true,cellSizeM:20,lodRatio:0.35,lodError:0.005}`。缺省/false走原单GLB，不生成额外产物、不改变旧505。只允许四键，cellSizeM有限5..200米，lodRatio0.1..0.9，lodError0.0001..0.02；启用由管理员明示近似低LOD，报告必为partial。streaming有动画、skinned、morph或InstancedMesh时明确STREAMING_STATIC_REQUIRED，不静默删除；原legacy格式仍按原规则导入。catalog不完整/截断时拒绝STREAMING_CATALOG_INCOMPLETE，避免分块引用伪称完整。

高精原子单位：raw IFC canonical元素整个parent及其所有几何片段（包括不可信GUID）是一单位；其它静态几何按最顶层Mesh subtree单位。遍历不可重复选父子。每单位唯一`streamAtomicId:'a00001'`，不同于GUID/nodeId；coarse与所属高chunk的原子副本都保留该extra，不能按name/mesh-index匹配。全局node目录/normalizedMatrix4/bounds/sourceIdentity全部来自原高模型。每anchor `chunkIds:[c....]`是单位及所有祖先关联的有界并集；canonical元素恰一chunk，跨区父group可多chunk。分块复制单位顶层matrixWorld到自身matrix，再置于identity输出root；子local transforms保留，所有产物为同一个normalized-model米/Y-up空间，不能每块独立居中。building.modelToShowroom在客户端只施加一次。

按单位bounds中心XZ的cellSizeM网格聚类；大单位不切穿构件。总unit<=20000、chunk<=64，超限拒绝并提示加大cell或源软件分区。单chunkGLB<=32MiB、coarse<=100MiB、全部产物仍受Root配置合计限（默认100MiB）；贴图跨chunk可能重复，明确实际bytes预算失败，不提高旧默认限额。helper应按原单位三角数/估算数据量细分同cell或明确拒绝超大单位；不得生成包围盒来替代未能导出的原网格。

LOD使用Three0.186.1自带MeshoptSimplifier（无新增npm包），复制/有界静态三角数据，normal/UV加入simplifyWithAttributes度量，LockBorder，报告actual返回error/triangles；不得使用不受界限的sloppy简化。单材质、常规BufferAttribute可简化；多材质groups/不支持属性保持原几何并记录跳过，不能丢材质/UV/颜色或伪称减面。非indexed先在clone上mergeVertices，保护原高geometry；compact实际引用顶点并重建同类型/normalized attributes。保证至少一有效三角面、索引/finite/bounds正确，低LOD不可改变单位/frame、global锚点、sourceID/业务绑定。目标ratio不保证实际达成，不自动隐藏整个构件。

coarse输出scene root生成`userData.showroomStreaming={schemaVersion:1,modelVersionId:spec.jobId,manifestAssetKey:'models/<id>/stream-manifest.json'}`；collectMetadata后才加，源extras不能选择它。coarse/high只给固定原子ID/已清洗sourceAnchor，不把IFCprivate SourceName/Psets/地理datum复制进去。streaming helper不添加script、外部纹理URI或其它格式engine到访客/vendor。

## 产物闭包与后端登记

保留公共scene.glb/meta.json/report.json/manifest.json；enabled时追加固定`stream-manifest.json` kind=model-stream-manifest及`chunks/c0001.glb`..`c0064.glb` kind=model-chunk。IFC仍只有固定ifc-properties.json kind=model-private且不列公开manifest；dwg3d无私有第五文件。所有assets都在models/<jobId>/下，带实际size/SHA/MIME且固定exact路径；禁止任意source/options路径。旧模型无需迁移。

Rootbrowser最终返回`{glbBase64,meta,report,chunkOutputs,streamingManifest}`，A chunkOutputs固定`{name,glbBase64}`即可，其他descriptor均放streamingManifest。Root先计算coarse/chunk SHA及meta bytes：meta.streaming仅含`{schemaVersion:1,manifestAssetKey,chunkCount,layout:'normalized-model',coarseLod:true}`，不存streamManifestSha，防止互相散列循环。streamManifest JSON为`{schemaVersion:1,modelVersionId,layout:'normalized-model',unit:'m',axis:'Y_UP',bounds,coarse:{assetKey,sha256,size},metadata:{assetKey,sha256,size},policy:{desktop:{loadDistanceM:30,unloadDistanceM:45,maxHighBytes:67108864},mobile:{loadDistanceM:18,unloadDistanceM:28,maxHighBytes:25165824},maxConcurrent:2},chunks:[{id,assetKey,sha256,size,bounds,atomicIds:[a...],nodeIds:[n...],triangles,estimatedDecodedBytes?}],lod:{requestedRatio,maxError,reducedMeshes,unchangedMeshes,highTriangles,coarseTriangles,measuredErrorMax}}`。helper可返回未填coarse/metadata实际digest模板，由Root最终填。sha/size来自实际最终bytes，metadata仅固定meta.json。所有finite计数整数/范围、bounds min<=max，chunk ids/path/bijection唯一、atomic/node预算和catalog覆盖必须核。

Root convertRoute addscene/meta/report/chunks/stream后才生成publicmanifest，manifest列所有前序public descriptors（不列自己/private），总公开项<=68；除mandatory三项外exact对应stream+chunks。Java validatePublicManifest扩大固定范围并交新`VirtualModelStreamingService.validateImport(snapshot)`核：实际descriptor SHA/size/kind一致、stream schema/version/layout/units/policy/caps正确、coarse/meta hash关联、chunk集合无多缺项、nodeIds为当前完整high catalog且meta anchor.chunkIds引用闭合、atomic IDs唯一、sourceIFC私有数据不入任何公开manifest。先完成验证再原draft/job CAS，不自动应用模型。VirtualModelMetadataService owner视图安全返回meta.streaming与anchors.chunkIds及report.streaming，不回传private源码/票据。

Public resource session继续按selectedmodel prefix授权固定已登记公共chunk/stream；不能下载所有chunk作首屏preload，不能重新允许privatekind。PublicController沿P3双拦截；新stream manifest不能引用其它模型/source/scripts/私有文件。Showroom validator/model选择仍要fixed READY登记，不增加可由草稿选择外部URI的入口。数据库无新表/迁移，发布快照固定全部chunk descriptors。

## C 客户端分区与性能手测

新增 scene-core `streamingManifest.js`,`streamingModel.js`,`sceneMetrics.js`（按职责拆），改sceneRuntime/modelLoader/publicHttp/adminassetresolver/SceneCanvas/ShowroomViewer，新增共用`ScenePerformancePanel.vue`。Root保持ImportWizard与Java/Workershared所有权，C不改它们。旧文档/旧GLB没有generatedmarker则原单GLB路径。对生成marker逐字段和model version/path核，fetch固定manifest（max1MiB）并验证closed paths/id/bounds/count/size/caps；加载失败明确保留coarse和提示，不伪称完整高清。对应coarse原子ID必须各一次，manifest atomic IDs和coarse实际集合一致，不靠名称猜。

高chunk按camera到其bounds的showroom世界米距离选优先级：bounds经当前building.matrixWorld变换，不能用未经building scale的model坐标距离。自动模式近<=loadDistance才排队，>unloadDistance卸载，hysteresis防抖；可选省流（coarse-only）与优先高清（仍受budget/队列约束）。同时加载<=2，resident高chunkencoded bytes按preset限制，coarse基础bytes单列；该bytes不是GPU实测。优先最近且在视锥/缓冲范围的块，当前camera恢复/teleport/建筑transform重新排序。chunk append完成且epoch当前后才隐藏对应coarse原子；卸载/失败/取消恢复coarse，不修改全局anchors/场景业务对象/导航/collider。所有high位于identity highGroup作为building child，chunk已normalized，building transform一次。

每building换版/清空/dispose递增epoch，取消队列/请求，对已开始不可取消decode迟到结果dispose；所有资源release恰一次，不得将旧chunk挂入新场景或取消别人屏幕资源。modelLoader增加可取消load并在Parsing迟到时释放几何/材质/texture/skeleton；独立每GLB资源所有权，禁止共享ImageBitmap被一次dispose误关其它存活对象。stop时控制输入/Renderer loop沿既有行为。

publicSession/adminassets resolve函数保持`resolve(assetKey)->Promise<blobURL>`兼容；新增挂在同一函数上的同步`acquireChunk(assetKey)->{url:Promise<blobURL>,descriptor,release(),cancel()}` lease，仅descriptor.kind=model-chunk和固定chunk路径可用。其它preview/template/model/coarse不由分区释放。每缓存record独立AbortController/不可混用的generationtoken/refcount；lease closure操作它的原record，最后lease取消/释放才abort/delete/revoke，旧record回包不得复写或关闭同key的新record（必须cache.get(key)===record才删除/插回）。session.dispose取消全部；不要只GPUdispose而Blob仍永久缓存。stream manager每chunk单lease，loading解析晚到dispose后release只针对旧lease，不按key删新的模型请求。没有acquireChunk的旧resolver只保coarse并提示不启用高chunk，避免无限缓存。

指标通过实际renderer.info/真实frame时间窗口、已实际fetch/排队/chunk与编码bytes统计，1秒级更新，面板默认收起且仅手动查看/调整。帧率不用导航截断dt推算，decoded/GPU容量只能标估算，不编造预算通过或目标FPS。后台和匿名visitor都有同一个面板，viewer可选表现模式但不保存服务器草稿。性能资料可导出当前无凭据JSON手动记录，不能包含ticket/objectKey/source私有属性。编辑器的逐帧建筑outline与全展项重建可做有据的局部优化，需单独静态复核生命周期；不扩大到线下或模板通信重写。

## B 三维网格 DWG 私有provider

新增`src/native/dwg3dBridge.mjs`,`src/providers/dwg3dProvider.js`,`src/converters/dwg3d.js`及必要同scopepure topo helper（先向Root报文件）。单独规范format `dwg3d`，extensions只dwg；auto/.dwg保持现dwg2d，管理员显式选择三维网格模式。Root修改native bounded module whitelist、config/formats/workspace/browser/api/errors。Node native launcher新模块沿同3GiB/quiescence策略；无商业CAD或无quota时true disabled，P3二维DWG不改。

原始DWG32MiB/header6种/strict readFlags0/100k objects/1024 classes/MEMFS，与P3相同class s_zombie/无xrefs/无proxy。直接raw真实三维顶点/拓扑，禁止走二维DXF、挤厚线条、假盒子。实现3DFACE、POLYLINE_PFACE、未平滑POLYLINE_MESH；MESH只有实际完成level0有界topology后可列，否则固定明确拒绝。ACIS3DSOLID/REGION/BODY/曲面/动态块/MINSERT/未知3D实体明确拒绝，纸空间/支持的纯线注记省略计诊断，模型空间和已实例化block递归正确，不枚举未实例化block几何。depth<=64、实例展开<=100k、顶点<=10m、三角<=10m、nodes<=20k、单nativeGLB100MiB；visited/cycles、counts/indices/finites/planarity/degenerate faces拒绝或明确partial省略。三四角有真实三角化；负polyface索引只是边不可见，不能删整个面。

严格规避固定binding陷阱：inline vertind按受控field_offset/checkedHEAP little-endian4int16复制；numeric array helper局部vector-view禁止用，checkedpointer/count从当前heap同步复制且该view生命期内不再WASM分配。3DFACE/mesh顶点WCS型不再OCS；INSERT用任意轴基/extrusion+ins_pt+rotation+scale−block basepoint递归矩阵，非均匀/负scale正确winding/normal。无能力确认的transform硬拒绝，不假作identity。handle可原值hex+insert链但stable=false（heuristic），sourcepointer/index不作稳定ID。neutral/ACI颜色近似PBR、无纹理/动画/BIM语义，成功始终partial且completeness unknown。

父API `analyzeDwg3d(request,workspace,signal,progress)->analysis` 与`prepareDwg3dConversion(...)->{derivedFiles:{'scene.glb':...},derived:{dwg3d:{sceneUrl:'/derived/scene.glb',providerMeta}}}`；native payload同P3 `{mode,jobId,sourceFile,sourceHash,options,outputDir}`，analyze.result `{analysis}`，convert固定scene.glb/provider-meta.json与`{files:[...],providerMeta}`，目录/size/header/provenance父核，child failure固定DWG3D_*。

预检outer formatdwg3d、sourceHash/entryHash，`dwg3d:{schemaVersion:1,sourceVersion,scope:'mesh3d',supportedEntities,entityCounts,omittedCounts,sourceUnits:{headerCode,unit,metersPerUnit,basis},boundsSource,suggestedOriginM|null,unitConfirmationRequired,completeness:'unknown'}`＋安全diagnostics；不伪造未转换GLB stats。`options.dwg3d={schemaVersion:1,sourceHash,entryHash,scopeConfirmed:true,unitConfirmed:true,originMode:'local',localOriginM:[x,y,z]}`，hash/actualentry复核，unit为auto或原m/cm/mm/in/ft（auto仅knownINSUNITS），missing/0/unknownunits不默认米，明确确认/override来源。native把source unit一次转换m、Z-up→Y-up并rebase明示米制Y-up局部原点；共同hintoutputm/Yup防二次单位/轴。axis锁y-up、centeringfalse，额外scalecommon一次。建议origin基于真实modelspace三维点，在unknownunit时可null，UI依rawbounds和explicitunit得到建议或让用户填；原datum不在公开坐标report，options/ownedpreflight记录它。publicprovider metadata只安全标准单位/类型/计数/heuristic原handle，不任意源名称/hostpaths/property graph。

browser convertDwg3d只读Root fixedderived GLB与safe metadata，保common quality/streaming兼容。capabilities增加dwg3dmesh descriptor enabled scope/entity列表/manual-required，同时完整solid provider另记needs-deployment且不进入enabled formats；不能标全三维DWG/ACIS已支持。UI分析确认与失败引导原工具导出STEP/GLB，保持双hash与file/entry变更撤销。

## 手动验收与完成标准

纯生成输入：静态分区/LOD手测GLB（生成器只建产品输入，不运行import/simplifier/转换）；三维DWG由用户真实3DFACE/polyface/mesh输入或原CAD另存，不制造伪DWG。手测包含首次coarse/nearload/unload/teleport/失败回退/切模型/离开释放/GPU+Blob/手机/metrics、单位与nonuniformbuilding/全局锚点/重导CAS/IFCprivate/public快照，以及3DDWG拓扑/变换/未知unit/solid拒绝/partial。build三部分+独立任务与最终staticreview+修Important+只重启owned改动服务+health/505/11hash保留后报告代码/部署完成；不能声称手测或性能达标。

补充固定：lodError单位为normalized-model米（默认0.005m，范围0.0001..0.02m），metric positions使用原mesh matrixWorld线性变换并以ErrorAbsolute/LockBorder简化；measuredErrorMax是组合position/attribute算法度量，不是实测Hausdorff误差。临时128MiB只为估算数组量准入，不宣称简化WASM有OS内存硬quota。
