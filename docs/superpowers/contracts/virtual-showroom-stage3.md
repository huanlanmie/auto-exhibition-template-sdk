# 虚拟展厅 P3 IFC / 二维 DWG 契约

用户“继续下一个阶段”授权执行原roadmap P3-01/02/03；沿用已批准总体架构及P2业务链路，不再询问执行许可。用户仍只做手动功能验收；不新增/运行unit/integration/E2E、模型解析/转换样本验证或浏览器业务QA。构建、静态独立复核、文件/服务就绪允许。保留505及用户原修改，不写生产SQL/Nacos/线下Electron。

## 依赖、隔离与共同能力

固定Three0.186.1、web-ifc0.0.78、@mlightcad/libredwg-web0.7.14，其他P2依赖不升级。IFC与DWG引擎仅在独立Node子进程初始化；不得把IFC/GPL DWG库放Vue或访客vendor。DWG桥接脚本单独保留GPL许可/对应源信息；不把技术分隔写成整项目许可法律结论。没有安装商业AutoCAD/ODA，不下载或启用未经确认商业工具。

新增`native/boundedNode.js`纯Node共享器（不import config）：`nativeIsolationStatus()→{ready,mode,reason?}`、`runNativeJob(moduleName,payload,{directory,signal,timeoutMs,maxMemoryMiB,maxResultBytes})→{result,outputDir}`。moduleName只允许`ifcBridge.mjs/libredwgBridge.mjs`；directory为Root安全workspace.directory，内部新建job目录，固定request.json/result.json及输出文件，不采用请求中的可执行/脚本/命令。Windows固定PowerShell隐藏启动`native/launch-job.ps1`，CreateProcess带CREATE_SUSPENDED与PROC_THREAD_ATTRIBUTE_JOB_LIST原子挂入Job→IsProcessInJob核对→Resume，Job Object aggregate内存上限3072MiB+kill-on-close。独立named-Job observer在建桥前持有Job，正常/异常/launcher fallback终止均等待ActiveProcesses=0并给quiescence proof；无法确认时NATIVE_CLEANUP_UNCONFIRMED禁用后续native admission并保留私有workspace。失败不能无隔离回退。其他OS未配置真实quota时optional providers disabled，保留P2。静态构建就绪不代表实际quota/格式手测通过。Node max-old-space-size512只作为JS堆辅助，不宣称它限制WASM。

child payload共同`{mode:'analyze'|'convert',jobId,sourceFile,sourceHash,options}`，sourceFile为安全workspace真实entry绝对路径，输出只在child outputDir固定名。boundedNode写request.json时由父加入`outputDir`为该job目录；bridge按process.argv[2]读取request，按outputDir固定result.json输出success或`{failure:{code,message}}`（code固定、message不得原异常），exit0为有结果（业务失败也可exit0），异常进程退出由父固定失败。IFCbridge结果`{analysis}`或`{providerMeta,files:['scene.glb','ifc-properties.json','provider-meta.json']}`；scene.glb为canonical中间模型。DWGbridge结果`{sourceVersion,readFlags,writeStatus,diagnostics,files:['derived.dxf']}`。父验证所有定点普通文件/长度/摘要，不接受任意输出路径。固定错误code跨边界，私有日志不作为public message。

共同converter context新增Root受信`derived`。IFC为`derived.ifc={sceneUrl:'/derived/scene.glb',providerMeta:<已验证安全JSON>}`；DWG为`derived.dwg={dxfUrl:'/derived/derived.dxf',providerMeta:<安全JSON>}`。native公共scene+summary由Root验证，browser converter不得从options同名字段或sourceZIP自选derived。Browser Root whitelist只host fixedderived file map，no private sidecar route。IFCconverter可以复用convertGltf加载内嵌无外链GLB并还原可信provider report/hints/ifcSummary。DWGconverter以derivedURL+实际derivedbytes复用convertDxf后覆sourceFormat/置信降级/公共dwgreport。

canonical formats增加`ifc/dwg`（二维DWG展示标签，不能称dwg3d）。health保持`ready/formats/providers/qualityPresets`；optional不拖垮P2。各provider追加`enabled,status:'enabled'|'needs-deployment'|'unsupported',disabledReason:{code,message}|null,version,formats,boundary,verification:'manual-required'`及IFC schemas、DWG sourceVersions/scope；不公开路径、命令、许可key。nativeIsolation描述只给mode/ready/manual-required。未部署也保留描述并显示操作建议。

## IFC分析和选项

复用HMAC `/v1/analyze` 与Java owner/import preflight。IFC-SPF源32MiB、STEP实体150000、references1000000、参数嵌套/placement深度128；ASCII/UTF8受控扫描在OpenModel之前；FILE_SCHEMA唯一且严格。只接受IFC2X3/IFC4/IFC4X3_ADD2及固定web-ifc的canonical IFC4X3→ADD2别名；RC/ADD1/IFC4X1/IFC4X2等拒绝。设置ALLOW_INCOMPATIBLE_SCHEMA_ALIASES=false、COORDINATE_TO_ORIGIN=false。MEMORY_LIMIT256MiB只为token tape预算，几何/WASM内存由OS Job quota另限制。

analysis外形`{schemaVersion:1,format:'ifc',sourceHash,entryHash,entryFile,candidates,requiresEntrySelection:false,ifc:{schema,sourceSchema,schemaSupported,sourceUnits:{name,metersPerUnit,basis},projectGlobalId,storeys:[{expressId,globalId,label,elevationSource?,elevationM?}],types:[{ifcType,elementCount}],georeferencing:{present,applied:false,requiresLocalOrigin},suggestedOriginM:[x,y,z]|null,counts,truncated},diagnostics}`。该管理分析可供owner确认单位/局部原点，但不得包含联系人/OwnerHistory/raw parser graph。完整geometry仍在conversion生成，不伪造预检三角数。

`options.ifc={schemaVersion:1,sourceHash,entryHash,schemaConfirmed:true,storeyIds?:[正整expressID],types?:['IFCWALL',...],includeUncontained:true,originMode:'source'|'local',localOriginM?:[x,y,z],propertyPolicy:'basic'|'psets',allowAdd2:false}`。IFC必须预检并核actual包/entry摘要。缺storeyIds为所有contained；[]不选contained，但includeUncontained=true仍选uncontained。types缺省为全部可显示product类型（默认排除IFCSPACE/IFCOPENINGELEMENT/IFCOPENINGSTANDARDCASE，仅保语义）；[]不选任何type，显式包含可尝试空间/开口mesh。两条件取交集，未知id/type拒绝。ADD2另需allowAdd2=true并显示条件支持/需手测；不等于支持全部基础设施实体。

默认local，localOriginM为**引擎单位/轴规范化后的米制Y_UP工程坐标**。preflight可由有效placement平移给建议，不能以未执行几何的bounds作保证；用户可改共同基准。source模式只允许无georef、坐标适中来源；georeferencing.present/requiresLocalOrigin或过大坐标必须local，避免publicGLB直接泄漏精确datum。IFC通用axis固定Y_UP，unit自动文件定义，centering必须false保持明示datum，scale由共同root仅额外乘一次；保留源UnitsInContext、原placement/storey标高、CRS/MapConversion/WCS/TrueNorth的私有记录。不执行地图投影或MapConversion/TrueNorth重复旋转。geometry公共report不泄露精确原地理datum，源恢复矩阵只在private sidecar。

## IFC转换、锚点与属性

Task A Nodebridge采用web-ifc Node入口，StreamMeshes(...true)的flat F已包含NormalizeIFC N=[x,z,-y]和源单位u，不再乘u/placement。校验唯一可解LENGTHUNIT及native兼容SI/无偏移conversion因子，不用库默认为1假称单位为米。placement原P由受typed LocalPlacement/Axis2Placement/point/direction及cycle预算检查后GetWorldTransformMatrix获得；元素帧`Q=N*S(u)*P*S(1/u)`，mesh局部`Q^-1*F`；provider根`D=T(-localOriginM)`或identity，最终DF。geometry6float(position/normal)stride、size/indices先核预算再复制，callback结束前复制并delete geometry/vector wrappers。单个缺网格或fallback列诊断，绝不称完整；不支持Grid/Linear placement不得假作精确帧。无动画/外部纹理，颜色/alpha近似PBR。

导出中间GLB使用Three GLTFExporter+局限于Blob的Node FileReader shim（无纹理/DOM，不eval）。总10m顶点、20k节点、100k关系、200k总属性、每构件最多128属性、文本2048、private sidecar16MiB；到限截断诊断/partial，不承诺峰值内存等于这些bytes。Root共同质量/归一化再生成最终四个public产物。

每个retained canonical元素parent group只有一份源锚点，`sourceAnchor={format:'ifc',id:'<projectGlobalId>:<productGlobalId>',basis:'ifc-global-id',stable:true,canonical:true}`；两GUID都22字符首位0..3、其余A-Za-z0-9_$，唯一有效project及整源Root GUID唯一。重复/缺失/无精确placement为stable=false，expressID/mesh片段/listindex不升级stable。几何child片段不重复标稳定身份。Rootmetadata精确扩IFC白名单，仍20k/截断降级，catalog与private properties按sourceIdentity.id关联，绑定业务对象仍n00001 nodeId。

Node provider-meta只能含安全`{schemaVersion:1,sourceHash,entryHash,sourceVersion,units,sourceIdentityConfidence,report,ifcSummary:{schema,storeys:[{expressId,globalId,label:'Storey #ID'}],types,counts,georeferencing:{present,applied:false},elements:[{identity,expressId,globalId,ifcType,storeyIds}]}}`及无精确datum的loader transform；不得raw IFC Name/OwnerHistory/CRS/Psets进入GLB node.name/extras/public report。GLB节点使用类型+expressID生成显示名。

新增第五artifact固定`models/<version>/ifc-properties.json`，kind=`model-private`，manifest.json不列该私有产物。sidecar`{schemaVersion:1,modelVersionId,sourceHash,entryHash,ifc:{schema,sourceUnits,georeferencing,sourceCoordinateTransform},elements:[{identity,expressId,ifcType,globalId,storeyIds,displayName?,description?,groups:[{name,properties:[{name,value,valueType,unit?,inherited?}]}]}],diagnostics,truncated}`。basic保基本typed元数据，psets只允许Pset_*Common及Qto_*BaseQuantities中的scalar/boolean/number/有界list/enum，显式排除OwnerHistory、Person/Address/Organization/contact/document/URI/credentials/raw relations；不算缺失面积/成本。Source Name/Description仅owner-only且文本显示。

backend import校验固定artifact名/kind/size/digest/version/source，不能把private统一model-meta；登记时验证sidecar且事务仍先validate再draftCAS。public session及公开serve必须hard-exclude kind=model-private或固定ifc-properties.json，即使scene猜assetKey也不能授权；公共manifest资源只含四种public文件。旧505及8格式无需数据迁移。owner modelmetadata追加public ifcSummary及public report.ifc/dwg，不包含private内容。

新增query+owner `GET /virtual/admin/showrooms/{id}/models/{version}/nodes/{nodeId}/properties`，验证目录合法node、其身份及所属固定sidecar/digest/schema，返回仅该元素typed字段/组和owner georef摘要/诊断；非IFC无属性返回可操作说明，不接受ObjectKey。UI新增IfcImportOptions与ModelPropertyInspector：楼层/type/原点/schema确认；建筑选择/已绑定anchor按虚拟目录查看属性，不改BIM mesh点击/visitor runtime。P2重导审查沿用唯一GUID+冻结/CAS公式，源过滤后缺元素必须明确map/detach，不删除业务对象。

## DWG原生桥与冻结校准

Task B固定LibreDWG package Node raw createModule本地WASM，MEMFS只放/input.dwg/out.dxf，不mount宿主FS/lazy refs、不网络加载。DWG输入32MiB、derived ASCII DXF16MiB、objects100k/classes1024。初始header允许AC1015/AC1018/AC1021/AC1024/AC1027/AC1032（2000..2018格式，版本可识别不保证实体无损）。捕获raw read `{error,data}`，任何nonzero readFlags拒绝或固定明确错误（本阶段严格拒绝），free后write；writeStatus非zero独立失败，不能将1当CRC或0当完整。尽量有界审计types/classes/xrefs/proxy/3D，发现三维/自定义/外部引用硬拒绝；writer隐藏丢失不可证明，所有DWG成功report必须partial+完整性unknown。派生DXF再走P2严格analyze/build，Unknown/nonplanar建模角色仍硬拒绝。

Node `providers/dwgProvider.js`导出`dwgDeploymentStatus(nativeStatus)`、`analyzeDwg(request,workspace,signal,progress)→analysis`、`prepareDwgConversion(request,workspace,signal,progress)→{derivedDxfPath,providerMeta}`。provider configfingerprint固定版本+cap/scope参数SHA，不由options任意更改。

HMAC payload新增`ownerScope:{ownerId:'正整数字串',showroomId:'正整数字串'}`由Java现登录归属构造，不能从UI options接受。DWG分析创建15分钟私有opaque ticket（random256bits），最多20条/合计derived320MiB，过期受控清理；缓存固定scope+原packageSHA+原entrySHA+providerFingerprint+derivedSHA，只保derived DXF/安全provenance，不保外部URL/任意path。父缓存真实路径/regular file/hash核对，source包新上传还是相同bytes必须与票据固定全部匹配；过期/缺失明确DWG_CALIBRATION_STALE要求重分析，绝不重新转换后沿用旧mark。

analysis外format='dwg'，以现DXF预检fields平铺`layers/blocks/paths/sourceUnits/bounds/diagnostics`且`calibrationKind:'dxf',entryHash:<derivedDXF SHA>,sourceEntryHash:<原DWG entry SHA>,dwg:{schemaVersion:1,analysisToken,providerId:'libredwg-wasm',providerVersion:'0.7.14',providerFingerprint,sourceVersion,sourceEntryHash,derivedDxfHash,expiresAt,scope:'2d',completeness:'unknown'}`；sourceHash仍原packageSHA、entryFile仍原DWG包入口。禁止把内部derived路径作为UI entry。

`options.dwg={schemaVersion:1,analysisToken,sourceEntryHash,derivedDxfHash,providerFingerprint}`及`options.dxf`原有schema/sourceHash/entryHash/校准；format=dwg独有允许组合。DWG实际source字节hash与缓存entrySHA核对，DXFcalibration.entryHash必须等于缓存actualDerivedSHA。Root把原生derived作为独立不可被source ZIP伪造的/derived精确白名单资产给browser。

browser `converters/dwg2d.js`复用convertDxf构建，但强制所有派生sourceAnchor stable=false、basis='dwg-derived-handle'，sourceFormat保持dwg，公共root不得叠scale（与DXF一致）。报告`dwg/conversionChain`保安全provider/原entrySHA/derivedSHA/readFlags/writeStatus/完整性unknown，不公布票据/scope/configpath。派生handle不假定原DWG身份。P2sourceDXF原分析路径/engine单位策略不变。

## Root共同整合与手测

Root拥有formats/protocol/config/workspace/native派发/analyze+convert/runner/browser common/metadata/pipeline/build/package及文档/样本/服务；A仅IFC文件，B仅native runner/DWG/cache文件，C仅后台UI。所有shared改动先协调，root最终精确stage/commit。保留P2四artifact契约向后兼容，private fifth仅IFC可登记。

手测输入由自建IFC2X3/IFC4/ADD2文本提供（不执行转换），实际DWG用用户原图或原CAD另存P2 DXF样本；不创建伪DWG。手测覆盖schema/单位/placement/GUID/属性私有/过滤/地理datum/内存期限、DWG原/派生摘要/票据过期/三维拒绝/部分报告，以及原8格式/重导绑定保持。当前所有capability都标manual-required，部署与验收区分。源码实现+构建/static reviews+就绪后才报告阶段代码完成。
