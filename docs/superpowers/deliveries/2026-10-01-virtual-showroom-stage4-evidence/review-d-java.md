# P4 Root D — independent Java static review

2026-10-01。Reviewer为Task A席位，五Java文件均由Root实现；不自评A。**Spec compliance Approved / Code quality Approved：D-J1、D-J2已独立复读关闭，无未解决Critical/Important/Minor。** 仅此五Java源及必要原有调用边界；不批准尚在收敛的Worker/UI，不把构建/health当模型或性能证明。

权威：SDK stage4 contract（Global/产物闭包与后端登记/B单位与options/旧505边界）和本轮Root精确dispatch。只读current working tree、静态代码/摘要；没有模型JSON/GLB解析执行、engine、tests/build、HTTP、浏览器QA、安装、启动、SQL或Git mutation。报告是唯一新写文件。Root并行运行的构建证据不属于本review执行结果。

## 最后五文件锁定 SHA256

共同目录：`C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/`

| 文件 | 最后只读SHA256 |
| --- | --- |
| VirtualModelStreamingService.java | D680C92BE8416B0832669C95FDD2358F2B5FE518E969B087480ACACDC88F5221 |
| VirtualModelImportService.java | 7C99E5A5E98CD2FA24F8917C35852D5780AE4AD24CD21ED2B94EC380BD879A6C |
| VirtualModelMetadataService.java | BE5DF02EFA9D82621655438E6F35CE094AA377B8DF1782A1FD2CD1F6D36D2C94 |
| VirtualAssetStorageService.java | B4EE748C23C233FCF8E73C3FF5F79F29874CDD6F8B52693FB5CE1549296BC0A9 |
| VirtualShowroomValidationService.java | F3404BAD055835D24EEE79EB9FE42DA071D8529B006E5FE8D3CA07F86FD02380 |

StreamingService初轮hash13A172...7A7B，D-J1中间88643F...06BB5F，最后D680C9...F5221包含以下两项修复。未修改其他四Java文件完成本review；如果Root以后改hash，变更部分须再静态复读。

## Important D-J1 — LOD目标/实际误差与用户选项未闭合，已修

初轮StreamingService:89只独立range measuredErrorMax0..0.02，没有要求其≤lod.maxError，也没有对请求stored options的lodRatio/lodError。可接受声称0.1mm目标却20mm实际度量，或把用户已确认精度替换为另一合法范围值。此问题先报Root后由Root修，reviewer没有改Java。

最后`:89–92`：ratio/error先范围验证，读取storedopts实际值（缺省.35/.005，与Worker契约一致），要求manifest.requestedRatio/maxError与其相等，actual measured≤requestedError+8 Math.ulp(requestedError)，只容许double运算ULP；metadata实际unit m/axis Y_UP与stream保持一致。固定实际digest/resources并不被此校验替代。**Closed**。

精度对接说明：pinnedMeshopt target/return为Float32，原A helper1e-5relative容差比Java严格cap宽。Root另外授权A仅LOD helper补了Float32 target/return提前reserve、去rel容差、最后combinedcap仅8 doubleULP；A源码最终差量必须由B独立复核，本Javareview不自行批准作者A。此是跨层修复接点，不能回退D-J1的用户目标绑定。

## Important D-J2 — 显式opt-in可落普通legacy产物，已修

初轮StreamingService:46在无meta.streaming且无额外chunks/descriptor时直接return；validateReady旧旁路也没有看opts.enabled。实际可达场景是旧Worker忽略新字段却仍报告支持原格式，Java只核format健康允许请求，用户明示开启streaming却被登记为普通4文件success。Task C同时确认Worker反向产物门槛，Root负责对应共同修复；不是两个重复阻断编号。

最后`:24–28` legacy fastpath仅在没有partition资源 **且stored request未enabled** 时旁路；新`:43–47` 在无stream metadata时也检查request.enabled，true或额外stream/chunk任何一项出现都拒绝。meta存在时`:52`仍strict boolean true，然后必须有实际streamdescriptor/nonemptychunks、目录闭包、partialreport。新`:120` modelOptions为null/blank旧记录提供{}默认，不让旧505因无options字段被误拒。**Closed**；既有default-off/no marker路径保留，显式开关不得静默丢失。

## 五文件已核符合项

### 固定registry/publicmanifest与实际bytes

- StreamingService`:13–19`只有固定core/IFCprivate/streammanifest以及c0001..c0064 chunk路径→kind；无任意外部路径入口。Import`:66–85`核version、assetKey、exactprefix/path/重复、artifact kind，byte实际SHA/size，coarse/chunk GLB magic/version/declared length，单chunk32MiB、stream1MiB、coarse100MiB；只有ifc允许固定private16MiB，mandatory core及IFC sidecar保持。
- Import`:75–82`固定storage objectnamespace为verified/jobId/固定模型路径，SHA与MIME来自实际保存bytes。Java登记合计继续受settings.maxExpandedBytes（既有默认256MiB）保护，不提高旧配置。契约默认100MiB仍由Worker全产物aggregate enforcing负责；Root共同最终Workerreview/build需确认，不因Java256MiB既有防线假称允许更大源。
- StreamingService`:95–110`最后位置publicmanifest exact schema/version/resources≤68，对manifest每六字段exact whitelist，必须registered真实kind/SHA/size/MIME相等，集合与registry public减自身完全相等；privateResource与private固定路径不能纳入。manifest没有source paths/objectKey/dataBase64或新任意URI字段。Import提前publicmanifest检查`:186–198`同固定kind与mandatory三项，事务内finalservice补actual集合等值验证。

### 流式manifest / catalog双向闭包

- StreamingService`:47–63`要求完整高catalog/nonempty、safe meta.streaming五字段与fixedmanifest key、schema/version/layout m/Y_UP、finite有序bounds、bounds等于完整meta、coarse/meta实际descriptor SHA/size、metadata.digest对应真正已读meta；固定policy30/45/64MiB、18/28/24MiB、concurrent2。
- `:64–85` ≤64chunks/每块32MiB，路径ID唯一固定一一对应，无多缺注册chunk；atomic全局唯一≤20k，chunk nodeIds每块≤20k/总refs≤1M且都为实际完整highcatalog，覆盖全部anchors。每anchor.chunkIds≤64且与chunk.nodeIds反向集合完全相等，支持祖先跨多块而不重新生成目录。triangles总≤10m、decoded估算有界且没有把它称GPU实测。
- `:87–96` requestedratio/error/actualcount/error范围+opts绑定，coarse triangles≥1且≤high、high数等于chunkssum；近似LOD要求partial。固定stream/public JSON read`:118`按1MiB上限、actualsize/SHA核后读取，不让摘要关联形成meta↔manifest循环。

### owner metadata / private IFC

- MetadataService`:23–34`按当前room拥有READY版本读取固定meta，并核descriptor SHA/size及source/modelversion；`:37–38`安全topwhitelist增加streaming，anchors`:51–52`增加chunkIds，report`:64–65`增加streaming/dwg3d，sourceIdentity原格式/稳定规则不放宽。所有globalnormalizedMatrix4/bounds仍原高catalog，原legacy/anchorsIncomplete逻辑不被coarse替换。
- `:17`,`:115–130`既有private-key清理及地址路径清理继续生效，新字段没有ownerScope/ticket/objectKey/private source coordinates。IFC属性仍固定私有sidecar，Import`:86`,`92`保P3properties.validateImport在同一登记事务；publicmanifest固定kind与字段排除private。
- 必要原有调用边界定向读取：VirtualResourceSessionService.activeResources先privateResource continue，再仅selectedmodelprefix/已引用合法keys选择；publicResources只六safe descriptor字段；publicController P3双private拦截未在本次改动放宽。因资源会话本来可授权已登记selected prefix，chunks无需匿名任意URL/新DB表。Root最终C/共同review仍负责访问链实现。

### immutable发布 / 重导CAS / boundedhash

- Import`:88–96`同事务ownerroom锁+RUNNING当前状态，insert READY后立即read/IFCprivate+streaming验证，全部成功才room draftCAS和job RUNNING CAS；任一校验/取消失败回滚登记与draft。不自动选择新模型或发布，原building/对象bindings不动。storedassets失败残余不等于登记成功。
- ValidationService`:23–27`完整ownedmetadata/readystream验证新入口；`:43`每roomresource改用storage.verifyDigest。Storage`:107–113`65536bytebuffer流式计数/SHA、有expected size和configured cap、超expected立即false、资源InputStream try-close，避免每次发布把100MiB GLB整块读入Java堆。JSON1MiB仍有限整读，meta原32MiB验证路径保留。
- 必要定向原有Publish/Review边界：Publish保validation digest(scene+resources)/ownerexpectedversion/lock再核、固定revision scene/resources完整copy；ResourceSession保frozenrevision manifest且selectedprefix。ModelReview保source/target metadata SHA与draftdigest冻结/owner审阅、apply expectedversionCAS及全局normalizedMatrix4世界变换公式，不依赖当前coarse/chunk加载状态。import job新verified/jobId命名空间保障此次输出不覆旧version；storage原store REPLACE_EXISTING不是物理不可变存储声明，P4没有增添覆盖旧publication的业务入口。

### 新DWG3D options边界

- Import`:120–128`显式独立dwg3d format，auto不会变成三维默认；provider不可用拒。`:38–41`actual来源包SHA核已确认calibration；`:133–136`,`156–169` onlyauto/m/cm/mm/in/ft、finiteextraScale、严格dwg3d schema1双hash/true confirmations/localorigin3finitebounded/Y-up/centeringfalse，禁止把ifc/dwg/dxf选项塞另一format。
- streaming options`:157–161`只有四键、strict enabled bool、有限范围/defaults由Worker共同parse；unknown/null非数字拒。分析阶段opts早return保持原preflight职责，构建阶段完整强校验。不拿预检假GLB stats当转换成功。

## 最后范围与待验收

Java源Approved只证明静态五文件及修复接口符合contract；没有执行任何runtime/模型/HTTP或测试。不证明实际Meshopt/DWG/IFC几何、性能、public fetch或用户手测已通过。Root须以最后Java hashfreshpackage、其它D Worker/UI与C各自独立Approved、A精度增量由非作者Approved、505/11原文件保留证据完成整合。上述未完成其它部分不能借此报告一并宣布通过。
