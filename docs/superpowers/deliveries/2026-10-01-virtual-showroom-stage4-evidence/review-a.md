# P4 Task A 独立静态复核

日期：2026-10-01。审阅对象：最终锁定 working tree；审阅者 `/root/stage11_backend_graph` 非 Task A 作者。依据 stage4 contract/Task A plan、最终 task-a-report，以及固定 Three0.186.1 源码。仅阅读源码、计算文件 SHA 和写本报告；没有运行构建、simplifier/WASM、模型输入、exporter、解析转换、测试、浏览器 QA、服务或 Git mutation。Task B 自身代码不在本报告批准范围。

## 最终 verdict

**Approved — Task A 静态实施复核通过。当前无未关闭 Critical、Important 或 Minor。** 预审发现的 1 个 Important 和 2 个非阻断属性兼容建议已在最终锁定树修复。此结论不代表实际减面视觉误差、运行内存、帧率或输入转换手测通过。

## 已关闭 findings

### A-I1 Important：米制度量转换为 Float32 的误差未计入预算 — 已修复

- 原触发位置：`C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/pipeline/streamingLod.js` 的 metricPositions 填充和 simplifyWithAttributes 调用。
- 触发：源几何经过较大/非均匀缩放或具有较大米制跨度，变换后坐标存入 Float32 时，舍入量可能超过选定的 0.1–20mm lodError。简化器只知道已经舍入的输入度量，而最终输出复制原属性；仅比较其返回 error 无法覆盖这一额外差异。
- 最终源码约 `:105–121` 逐顶点测量 double→Float32 向量 round-trip 差异并保留 double 运算余量，以双端余量扣除可用简化预算；预算耗尽保留高几何、记录 metric-precision-budget。约 `:142–157` 用扣除后的 target 调用固定简化器，并验证 returned error + reserve 仍在请求预算内。
- `streaming.js:201–223` 分开保留 actual Meshopt `measuredErrorMax`、`precisionBoundMax` 和 `metricAllowanceMax`，没有把估计余量冒充库实测返回值。报告明确它是带属性权重的简化度量，不是实际测得 Hausdorff 距离。静态关闭该问题，不宣称运行验证。

### 属性兼容建议 — 已落实

- `streamingLod.js:33` 明确跳过 Float16BufferAttribute，避免固定 Three 中继承 getComponent 读取编码 Uint16、而 getX/Y/Z/W 才解码半浮点的差异。该项预审未认定当前 importer 有可达半浮点输入，但属于合理兼容边界。
- compactGeometry 重建属性时复制 gpuType，保留原 constructor、raw typed array、itemSize、normalized、name、usage；避免未来非默认 GPU 类型在精简后变化。

## 主要审查证据

1. **默认关闭与固定选项。** streamingOptions 只接受声明的四键/明确 bool enabled；cell/ratio/error 范围与契约一致。prepareStreaming disabled 直接返回原 root、空 chunks、null manifest，不改 meta/report，不调用简化器。Meshopt 为 lazy import；静态 helper 导入本身不会初始化该 WASM。Root共同调用点在 collectMetadata 前 capture、一次全高 metadata/quality 后 prepare；本次只是核接口，不替代 Task D 总体复核。

2. **canonical 与全局身份。** `streaming.js:19–27` 用 WeakSet 保存原对象的 canonical 属性，包括不可信/重复 GUID 的 IFC 元素；不据此提升 stable。`inventory` 要求完整高目录、节点 ID 双向一致，拒绝动画、skin、morph、instancing、非三角原语。选择最顶层 canonical 或 Mesh subtree 后停止向下选择，避免父子重复单位。任意 source 同形 canonical flag最多保守合并原子，不会绕过 common sourceIdentity 白名单或提升身份。

3. **一套坐标。** cloneAtomic (`:122–127`) 将原单位 matrixWorld 放到新顶层 matrix、禁自动重组矩阵，子 local transform 保留，再挂 identity chunk root。coarse 保留原完整 normalized 层级。没有每块居中、重乘单位/轴、重写 global nodeId/normalizedMatrix4 或绑定。GLTFExporter 固定源码的 matrix 分支保留该矩阵；客户端仍应只施加一次 building 变换。

4. **原子与祖先闭包。** 每单位分配 a00001 类独立 ID；coarse 与唯一 high chunk 用原对象到 clone 的树配对赋 ID，不用名称匹配。descriptor.nodeIds 包括单位子树与所有有目录 ID 的祖先 (`:149–154`)。随后 anchor.chunkIds 按反向集合构建并要求每条非空 (`:186–195`)。跨区祖先多 chunk、canonical 元素一 chunk 的规则符合契约。descriptor祖先 ID 是全局目录关联，不要求高 GLB 里复制所有祖先对象。

5. **分块/输出预算。** 按单位世界 bounds 中心 XZ 网格聚类，按几何估算先分同 cell；实际导出超过32MiB则只按完整原子二分，单原子过大明确失败，始终最多64块。实际 GLB buffer 计算 SHA/size，高 chunk 累计按实际 bytes 限制；source texture 可能重复，不能靠估算忽略。coarse/meta/report/private 最终合计仍由 Root共同输出层负责，报告明确 helper 的 highBytes 检查不能替代该合计。manifest预留固定digest/size字段并执行1MiB预算，没有构造互相散列环。

6. **受控 LOD。** 固定简化器使用 simplifyWithAttributes、LockBorder、ErrorAbsolute，不用 Sloppy/Prune/WithUpdate。position度量含 normalized world linear transform；normal 用对应 normal matrix；UV/normal/color/tangent 进入属性度量。多材质/groups、partial drawRange、非支持布局或工作量超预算保留原几何并明确统计。非 indexed 仅在 clone 上 mergeVertices，随后逐属性确认 weld 完全相同，否则保原，避免未计入的 weld 误差。

7. **输出原属性与有效几何。** 简化输出只改变索引并 compact 实际引用顶点，保留源属性数据类型/normalized 和材质，验证 indices/finite/bounds/至少一非退化三角。目标 ratio 不保证达成；error/border 限制时 unchanged 数量如实增加。不切掉整个原子、不改 high 原始 geometry、不生成包围盒替代失败网格。

8. **资源与隐私。** cleanClone 再次只放清洗后的 sourceAnchor 字段，streamAtomicId/showroomStreaming 由 helper 固定生成；private IFC SourceName/Psets/原datum不在 clone extras 中。高导出 clone 共享原高资源，finally 只清树、不误 dispose 高 geometry/material；coarse 新简化 geometry 在失败路径释放，成功交 Root最终export/browser生命周期。native IFC/DWG 引擎没有进入该 helper 的导入链或访客 vendor。128MiB lodWorkBytes 是保守工作数组估算门槛，不是 browser/WASM/GPU 峰值硬限，报告没有混称。

9. **统计与状态。** high/coarse triangles、reduced/unchanged meshes、actual high GLB bytes、错误度量和 skipped 原因都来自实际处理路径；streaming显式启用必有 approximate warning 和 partial。固定 policy 与契约相同。性能/FPS/GPU 实测不由 exporter伪造。

## 最终锁定 SHA-256（独立读取确认）

| 相对 Worker 文件 | SHA-256 |
|---|---|
| src/pipeline/streamingOptions.js | 9E7B94FCD390E4020B7DE3D98FADA739E124B3C2ACA423C9D4A461EE80A48799 |
| src/pipeline/streamingLod.js | DDE8D8FAC658DF310F534D4DCEC840FCCF8C15B0A0497B425CE04E1C45771A10 |
| src/pipeline/streaming.js | E62EDDB127D93D8A9F1403AF36FE86B4ECF4B233A1A9A9D7877B87CF6D02F279 |

## 留给其他席位/手动验收

Root Task D 仍需独立核 coarse/meta/chunk实际 SHA、合计bytes、Java登记闭包、公开/private固定资源权限和 UI显式选择。Task C须独立核 lease/epoch/加载卸载/单位世界距离/真实指标。用户手测负责真实输入的减面效果、跨块接缝/材质、加载回退、手机资源释放和性能；本报告没有执行这些操作。

## 最后差量复核：Float32 target/return 精度储备（2026-10-01）

结论：**Approved，A-I1 保持关闭；无新增 Important/Critical。** 独立重新读取 streamingLod.js:119–153 并核对 SHA-256 为 `301A2B20EEB5B84EFE1FBA67725273E7EA894E8C1E7F0700BE1ED9CDB1502EC6`；此值替代上表该文件旧 hash，其余两文件结论不变。

position Float32 量化与 double 算术余量之后，代码按 remaining target 再预留 `max(16 × 2^-23 × availableErrorM, 16 × 2^-149)` 的 Float32 target/return 舍入余量，合入 metricAllowanceM，在调用 simplifyWithAttributes 前从目标扣除。无有限正余量则保留原几何。实际返回误差与储备之和执行 `lodError + 8 double ULP` 的最终上限检查，旧 `1e-5` 相对放宽已移除。在契约 lodError 正数范围内，该 double ULP 公式与 Java 严格校验口径一致；manifest measuredErrorMax 仍为实际简化器返回值，report 精度界限和储备分别保留，不伪装实测几何误差。

这是源码差量复核与文件哈希确认；未调用简化器、引擎、模型解析、数值/功能测试或构建。整体手动验收边界不变。
