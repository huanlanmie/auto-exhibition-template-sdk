# P4 最终架构、生成器及交付文档静态复核

审阅基线：平台 `c7c142040ed54bf1d30abbd4732ab7b1b231c7f7` 到当前 working tree（含新增文件），2026-10-01。权威要求为 SDK `docs/superpowers/contracts/virtual-showroom-stage4.md` 和 `docs/superpowers/plans/2026-10-01-virtual-showroom-stage4.md`。未将 working tree 冒称已提交版本。

## 裁定

**本报告负责的最终架构、生成器、package/build 边界、文档/notices 与跨层接口静态复核 Approved；无未关闭 Critical/Important。** A 精度最后增量亦独立 Approved，详见 review-a.md 末段。D Worker/UI 已由 C 席独立 Approved（review-d-integration.md）；审核链现已收齐，本报告仍不能替代最终构建/保留证据。源代码与文档只读，唯一写入为审阅报告。

这不是模型/引擎/运行时验收。没有运行简化器、初始化 WASM、解析或转换输入、生成样例、功能/数值测试、HTTP、浏览器 QA、安装、启动或构建。Root/作者已有构建日志只用于区分交付状态，不作为静态功能证明。505 房间与 11 个原用户修改的保留由 Root 的独立前后证据负责，本席不读取这些旧文件差异内容、不修改数据。

## 独立审核链及作者隔离

- **Task A**：本席独立 `review-a.md` 已 Approved；Float32 position 量化余量与 target/return 储备都先扣减，再检查最终 combined cap。最终 streamingLod.js SHA-256 为 `301A2B20EEB5B84EFE1FBA67725273E7EA894E8C1E7F0700BE1ED9CDB1502EC6`。原 A-I1 已关闭；未以构建代替证明。
- **Task B**：本席是作者，不自批准。引用 A 席 `review-b.md` 与 C 席 `review-b-core.md` 的独立检查。B-I1 ownership 集合闭包与 B-C1 大坐标投影精度都经 A 独立 Closed/Approved；最后 topology SHA-256 为 `DA38AF0E47962B49D92DB5411EF5223BF377006C90616BD6C2A71CC53E308F84`。本报告只检查 B 和共同入口的接口衔接，不重复出具自身实现 verdict。
- **Task C**：本席独立 `review-c.md` 已 Approved，C-I1 共享 FileLoader 取消传播修复已关闭。最终模型加载为每 handle 独立 fetch/AbortController 与 GLTFLoader.parseAsync，晚到结果按 epoch/handle 释放；具体 15 文件锁定依据见该报告及作者 source-hashes。
- **Task D Java**：A 席 `review-d-java.md` 已 Approved；D-J1/D-J2 固定字段/闭包及 explicit opt-in 要求的修复已有独立复读。D Worker/UI：C 席 review-d-integration.md 及 review-d-integration-hashes.txt 已交付并独立 Approved，13份指定源码 hash 与其锁定快照匹配；D-J2 Worker 双向 opt-in 闭包已关闭。本席读取报告确认结论，不代替 C 席的独立审查。

## 已核关键衔接

1. **高精目录先于视觉降级。** Worker `src/browser/convert.js:129–143` 先捕获 canonical 原子身份、collectMetadata 全局目录，再做质量处理和 prepareStreaming；coarse/high 沿用同一 normalized 根坐标。Java MetadataService 透传 chunkIds/streaming 而不把 coarse 重建为业务目录。重导、绑定、世界矩阵及 CAS 继续读取固定版本的完整高精目录，与当前画布加载哪些 chunk 无关。

2. **单位与原生边界。** 显式 dwg3d 与 P3 dwg 分开；自动 `.dwg` 仍二维。B 输出的 metre/Y-up trusted hint 与共同 pipeline 单次 scale/axis 分支衔接，local origin 由 native 阶段一次完成；common 不重新居中。原生 bridge/helper 不在 visitor 或 browser app 模块白名单中；有限 provider 三实体范围、neutral PBR、partial/unknown 与 handles heuristic 没有因流式启用升级为完整 CAD 或稳定身份承诺。

3. **产物实际字节与摘要链。** `src/api/convertRoute.js` 用实际 buffer 生成 SHA/size，校验固定 chunk 名、单块 32MiB/最多64块、GLB头与 manifest descriptor，再填 coarse/meta 实际摘要；manifest 先于 public manifest 形成，未制造循环摘要。每次 add() 将实际 bytes 纳入 aggregate 输出预算，不能仅用几何估算漏掉纹理副本。IFC sidecar 在公开 manifest 集合完成后单独登记 private；资源路径与 kind 不接受来自源文件的任意 URI。

4. **登记与发布复核不是只信 Worker 摘要。** ImportService 同事务锁 owner room/RUNNING job，按真实保存 bytes 核 fixed kind/path/SHA/size，登记后立即 properties/streaming.validateImport，再 CAS room/job。StreamingService 绑定 stored enabled 请求、ratio/error、完整 metadata.digest、chunk/atomic/anchor 双向闭包及部分结果确认要求；requested enabled 而无 stream 不能走 legacy 旁路。发布 `validateReady` 再核，Storage.verifyDigest 采用有界流式 SHA。原无 streaming marker/options 的旧版本保留 legacy 路径。

5. **公开/private 与快照。** ResourceSessionService:21–26 从已发布 revision scene/resources 创建会话；:41–61 对已选择模型 prefix 选取登记资源且先排除 privateResource；publicResources 只输出安全描述字段。新增 stream/chunk 通过同一固定权限机制，未新开任意 URL/路径读取。IFC 原名称/属性仍 private sidecar；公示 report/metadata allowlist 增加安全汇总而不加入 objectKey、ticket 或 ownerScope。清单的 coarse/meta/chunk 引用与登记真值相等后才可发布。

6. **客户端资源生命周期和指标边界。** 引用已独立 Approved 的 C：digest/size/kind 固定 descriptor、逐消费 lease/最后释放、旧记录 ABA 防护、epoch 晚到处置；原粗模加载保留，只有已核原子集合的 high 挂入才隐藏对应 coarse。world distance 包含 building 变换，队列与编码字节预算不被称 GPU 内存硬限；面板来自实际帧窗口/renderer/runtime stats，不是生成器预填 FPS。旧505无 streaming 标记继续单GLB路径。

## 手动输入生成器与构建边界

`virtual-showroom-worker/scripts/generate-stage4-samples.js` 全文静读：仅 fs/crypto 与 Three 基础 TorusGeometry/BoxGeometry；手写 GLB 固定 accessor/bufferView/material/node/scene，4-byte 对齐 JSON/BIN 与 GLB2 chunk 长度。没有 importer、simplifier、native engine、解析断言或对转换产物进行 QA。96 个普通 torus Mesh 加底板，重用源几何而非 InstancedMesh；尺寸 80×60m、442380 个 authored triangles 的信息来自固定输入构造。输出 source SHA/bytes 是输入元数据，不把它称减面率、转换成功或性能证据。未伪造 DWG 样例。`samples:stage4` 与 build 分离，本席没有执行生成器。

`virtual-showroom-worker/scripts/build.js` 仅递归 node --check `.js/.mjs/.cjs`，require.resolve/读取 package 版本和指定文件存在性；Windows launcher `-CompileOnly` 是 C# 类型编译而非 Job/模型进程启动。package 保持七个固定依赖版本，新增样例命令不在 build 链中。build-info 文字准确说明检查范围；固定 Meshopt 文件可用不等同算法实际验收成功。

## 文档、来源和留给用户的验收

完整静读 `docs/virtual-showroom/stage4-manual.md`、Worker README 的 P4/P3 相邻说明、`licenses/stage4-sources.md` 及关联已有 notices。文档明确默认关闭、近/远迟滞、64/24MiB 编码资源预算、静态三角限制、整体100MiB默认产物、局部原点/单位、DWG3D三实体/拒绝范围、partial/unknown 与原 handle 不稳定；明确公共快照权限、双画布取消、晚到/GPU/Blob释放和手机体验需要手动验收，没有把源输入样例或构建写成已通过性能测试。

notices 保留固定 LibreDWG GPL 来源/构建材料与新增 adapter 源清单，Meshopt/Three notice 引用，明确私有架构不构成法律豁免。额外原生格式与动画 P4-03 按实际后续需求接入，没有声明未实现的商业引擎/实体曲面支持。505 已发布案例、原用户文件、现存服务归属与 SQL 边界均被写入交付限制；最终保留/readback 证据仍须 Root 提供。

本报告没有可行动的未关闭 Important，故无虚构问题列表。最终用户交付可报告“静态审核与构建检查完成、手动验收待执行”，不能报告实际 CAD/LOD/性能验收已通过。

## 最后文档/许可差量复核

Root 冻结后仅文档差量已独立复读：Worker README:57 的显式 format 枚举加入 dwg3d，与 :97 的“auto .dwg 仍二维”说明一致；未扩张 provider 支持范围。licenses/stage4-sources.md 现指明已安装模块为 meshoptimizer 1.1 并链接新增 meshoptimizer-1.1-MIT.txt；本席核对本地完整 MIT 正文存在，copyright 2016–2026 Arseny Kapoulkine 与固定 installed meshopt_simplifier.module.js 前5行的 MIT/copyright/版本标头一致。来源链接固定 upstream v1.1 LICENSE.md，未替换库文件或引入运行操作，GPL 与手动验收说明保留。**该文档增量 Approved，无新增 Important。** 本地内容与版本标头核对不是法律合规总体认证。


## 最终审核链收齐

已读取 C 席 review-d-integration.md 的最终裁定、D-J2 关闭说明和13份源码SHA记录：Approved，无未关闭Critical/Important/Minor。该席是C作者，不自评C；本席是B作者，不自评B；A负责B与D Java，本席负责A、C、架构/文档，C负责D Worker/UI与B核心补充。因此全链没有用作者自批准替代独立复核。D报告原48文件快照之后，Root仅新增/完善README与MIT文档；本报告上段已独立覆盖此最后文档差量。最终静态审阅结论维持Approved；真实模型、功能与性能仍待用户手动验收。
