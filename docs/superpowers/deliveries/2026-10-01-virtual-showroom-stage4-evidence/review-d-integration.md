# P4 Root D Worker / UI 集成独立静态复核

日期：2026-10-01。审阅者 stage11_startup_scout（C作者，非Root D作者）。权威stage4 contract与plan Global/Task D；比较平台HEAD基线c7c1420的Root13份指定源差量，并独立读取所需A/B/C合同接点与固定Three/LibreDWG源码。11份既有用户修改不在本审阅范围，没有读取改写其内容。

## Verdict

**Approved — Root D 本报告所列13份Worker共享集成/UI源码最终静态复核通过。无未关闭Critical、Important或Minor。** D-J2 Worker反向opt-in闭包已经修复并复读关闭。13份磁盘SHA独立匹配Root最终product-hashes.json（49product snapshot；后续新增仅docs/license，所审13源SHA未变），详细SHA附后/同scratch review-d-integration-hashes.txt。

不替代A对Root Java5文件的review-d-java.md；不替代B对TaskA LOD/Float32增量、TaskC与最终architecture的独立裁定。B四文件core已另写review-b-core.md（含我补报B-C1精度修复关闭）。我的C代码没有作者自评纳入此次Root D批准，C以B的review-c.md为准。

本席只读源码/差量/摘要/既有报告。没有执行引擎初始化、模型解析/转换/export/simplifier、数值/功能测试、浏览器QA、API/服务/平台数据动作、安装、构建、stage/commit。Root报告finalWorker/UI/Javabuild、owned重启health及505/11hash保留，是Root证据，本席未重跑这些命令。静态Approved和build/ready均不表示用户模型或性能手测通过。

## D-J2 Important 集成闭包 — Worker部分已关闭

原convertRoute仅在result.streamingManifest存在时验证request.options.streaming.enabled=true；若旧/异常Worker忽略opt-in、同时返回无manifest/chunks/meta.streaming的旧形状，会按legacy成功登记。与A发现Java存储options反向门槛是同一D-J2，不重复编号。

Root已修convertRoute:63，request.enabled===true必须与result.streamingManifest存在严格等价，并继续chunks非空与manifest互相等价。opts true产物缺失、opts false意外stream产物、manifest/chunks多缺任意组合都固定STREAMING_OUTPUT_INVALID，不发成功result。独立复读最终源码并匹配frozenSHA。505/旧文档opts缺省仍false，原单GLB路径保持。

A已独立报告Java D-J2闭单：无meta.streaming时若stored opt-in或extra manifest/chunks即拒，validateReady仅未partitioned且未optin才legacy快返；我未在本审阅替他批准Java。Worker和登记两端闭包现对应一致。

## 共同接口与产物证据

1. **格式与真实capabilities。** formats增加canonical dwg3d，但formatForPath不接受伪.dwg3d扩展；实际.dwg在auto仍canonical dwg二维，仅显式request formatdwg3d把DWG候选映射为三维模式。ZIP多entry保完整入口选择，requested不在同模式candidate即拒。health dwg3d仅对应真实3DFACE/POLYLINE_PFACE/POLYLINE_MESH、quota与localfiles；ACIS solid另descriptor enabledfalse/needs-deployment，禁用reason真实，不进入formats。所有新能力manual-required。env关闭/native隔离缺失/file缺失分别reason，无商业下载/通用CAD或动画成功假provider。

2. **A采集顺序与C可消费输出。** browser convert先provider载入、单位/轴/额外scale/居中一次和world bounds统计，再captureStreamingIdentity(root)，然后collectMetadata一次，再applyQuality、prepareStreaming。没有perchunk collect/renumber全局目录；prepare返回完整coarse scene + fixedchunkOutputs +manifest，Root导出prepared scene而非旧high root。生成marker在normalized-root node extras，C已遍历唯一marker（gltf.scene wrapper可以无extra）。nodeIds/anchors.chunkIds/atomic occurrence与来源IFC身份不同；coarse/high同normalized模型空间，building只由客户端施加一次。

3. **字节/摘要/闭包与预算。** NodeconvertRoute核coarse GLB2.0 header/length；chunks最多64、exactchunks/c0001..c0064.glb且不可0000、unique，逐个实际bytes≤32MiB/有效header、size/SHA和descriptor.id/key一致。stage.add累计全部产物（coarse/meta/report/chunks/stream/publicmanifest/private）受config.maxOutputBytes，未提高default100MiB。浏览器coarse仍quality硬100MiB，A独立源控制LOD/canonical/aggregate预预算。metadata已含最终chunkIDs而不含streamSHA，Node按最终meta/coarse bytes填stream指向SHA，避免散列循环；stream≤1MiB，再生成publicmanifest列之前全部公共descriptor。Java固定多产物登记/更完整catalog/政策合法性另由A审阅。

4. **公私边界。** publicmanifest在private artifact追加前生成，IFC source Psets/原datum只能fixedifc-properties.json/kindmodel-private，非IFC或其他文件名/kind/MIME拒。stream helper只复制collect后的安全extras，global IFC summary只safe fields，Root现normalization不会把private源P/Q/D/CRS放回meta/report。deriveFiles来自privateprovider固定映射，仅scene.glb或既有DWG derived.dxf；runner仅Map内exactderived路径，不暴露provider-meta/IFCproperty sidecar。browserappModules只新browser converter/三个streamhelpers，不包含dwg3dBridge/topology/nativeproviders/WASM LibreDWG或web-ifc引擎。/vendor仅原Three/OCCT/DXF与fixedapp白名单；source/directory traversal与outside network沿P3阻断。

5. **B provider连接。** analyzeRoute与convertRoute仅workspace.formatdwg3d调用B analyze/prepare，前后actualcaps检查，双hash由真实选择entry与包SHA；prepare给derivedFiles.scene.glb及safeproviderMeta，经runner传入fixedderived对象。convertDwg3d复用convertGltf直接fetch fixedrootbytes/parse，rootderived不经错误texture URLModifier替换；externalreferencesresolverfalse，拒动画，sourcehandlesstablefalse。trustedhint已经m/Y-up，common额外scale一次，centeringfalse，因此不二次units/轴变换。原DWG2D token/derivedDXF与IFC路径保持。

6. **native quota与失败处理。** boundedNode只增加固定dwg3dBridge白名单及DWG3D_失败prefix；仍source realpath在workspace内、limits≤3GiB/time/result、WinJob受控launcher、observer-beforechild与quiescence proof，无unsandboxedfallback。cleanup不确认保留privateworkspace并停native准入，convert/analyze沿此条件不删除workspace或把cancel掩盖清理错误。新增固定nativeFailure消息覆盖B码，含DWG3D_OWNERSHIP_INVALID；browser stream validation失败也是fixedmap，不把native日志/宿主路径透给响应。Malformed/不一致result转固定error，不发成功登记；已有unknownfilesystem/network/browser错误仍genericmessage。

7. **协议与候选。** HMAC/body256KiB/jobId/sourcehash/noncereplay沿原权限；options.streaming走A exactkeys/finitebounds parser，wrongtypes或参数越界固定STREAMING_OPTIONS_INVALID。analysis返回typeanalysis，dwg3d源与rawbounds仅owned预检，没有改publicvisitor访问源的接口。auto ZIP无唯一entry时只给可部署candidate与requiresEntrySelection，不能默取第一个；入口/格式变化在UI同步invalidateanalysis。

## UI确认与兼容证据

- ImportWizard trueformat选项分二维DWG/三维网格DWG，actualformatdisabled与providerreason展示；不把notdeployedsolid列成功格式。DWG上传默认二维，管理员需explicit选mesh3d。
- 三维预检必须成功后Dwg3dImportOptions才提供valid校准；从analysis双hash输出exactschema1选项，scope/unit双checkbox，originMode local，meter/Y-up三值。unknownINSUNITS必须明示选m/cm/mm/in/ft，auto读取有效header单位；组件同时显示文件单位与当前确认factor，改unit/analysis重置确认，origin改变重置scope确认。
- suggestedOrigin由原始bounds按当前factor→[X,Z,-Y]得到米制Y-up中心/最低高度，非地图投影；centeringdisabledfalse、axisdisabledYup。common额外scale保留用户输入，hint防止nativeunit/axis重复施加。
- file/entry/format变更撤销全部analysis及3D校准；ZIP选entry后重新分析，partialjob必须checkboxack才进入既有review/apply，successimport只登记，不直接改building/publicrevision。owner/CAS/backend重复校验另由Javareview。
- streaming默认false、featuredisabled不能勾；optin明确静态近似coarse与globalanchors保留、32MiB/64/合计cap和目标ratio不能保证。UIfields cell5..200、ratio0.1..0.9、metricerror0.0001..0.02，与parser对应；没有添加动画或未知native格式空成功入口。
- C消费manifest/register descriptors/lease/worlddistance/真实HUD接口已按单独review-c Approved；Root没有重写C文件来取消其epoch/refcount或业务隔离边界。

## 不可替代的人工验收

真实源仍需：原网格支持/ACIS明确拒绝/未知unit与局部origin、nonuniform/镜像/嵌套INSERT、远工程坐标小quad、owner链缺失、同URL多canvas取消、首次coarse/近远chunks/省流/teleport/非均匀buildingScale/失败回退/换版离开/Blob+GPU/手机、全局anchors/reimportCAS、IFCprivate/public快照与真实frame/网络记录。没有执行上述功能或性能样本，不声称30FPS/15MiB目标达成或全三维DWG支持。

## 最终锁定SHA（独立匹配product-hashes.json）
- virtual-showroom-worker/src/config.js: 98DE504DE9C324BE797001E74FB6D6A7CEAAD05C80D5D019D636125E89033A00
- virtual-showroom-worker/src/formats.js: 74F3CFD1C6A39931F285ED7FB47F7F2144BE5F3FCE5CBCFA630428A63E3FE3C9
- virtual-showroom-worker/src/io/jobWorkspace.js: 9A4D0051C546EE6C1899354F05CD88341280F2D1E681995977743EDAF1FAD466
- virtual-showroom-worker/src/native/boundedNode.js: 620DA7D719025E3592A46D7ED6727BED5E676F58AE66A52D8618973E8CAD4A70
- virtual-showroom-worker/src/providers/nativeFailure.js: DD49909C3F1285A8279F9BDFD16D6BFB1CBA48F2D21D55A0CB4596CAE213031B
- virtual-showroom-worker/src/protocol.js: A29E15FE4195DA372DB2975DEE9D86A2F5D6CC49BA3D277A8A90CD6320F63A1E
- virtual-showroom-worker/src/api/analyzeRoute.js: 57C4CF1CCD60EB7A66E6BF2B299FE6F54CCD0A361D5EE41E44184B6583428D82
- virtual-showroom-worker/src/api/convertRoute.js: 32452EFB301B55C391CCA3878B227C8403B67A257364BCC26D7E0BA5533A175F
- virtual-showroom-worker/src/browser/convert.js: 128BB8B687076A71A02FF42A892B36BEBFF3C399FBC9CCF3ECB10825AF9E2E9D
- virtual-showroom-worker/src/browser/runner.js: C6D152E338E9D0F8E876B4A885F8D5975F65B4B008F354FFEA28A06066EB8A49
- virtual-showroom-worker/src/browser/errors.js: F0279A8BCF8FECF969EAF70B9DA1CD312A111DD7EF1B5F47C78E407F04F50C3D
- ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ImportWizard.vue: FA9E3A15D1D20D3FFA1CF10D447F6CC9F4B9CECDD91FC77B57C255657379165E
- ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/Dwg3dImportOptions.vue: 7E0F56D98DA1685B207B9ED4185664D852703C79B451935D7BF5ED42248F81AB
