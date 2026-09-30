# P4 Task C 独立静态复核

日期：2026-10-01。审阅者 `/root/stage11_backend_graph` 非 Task C 作者。对象为最终锁定 working tree 的 15 个 UI 文件，以 stage4 contract/Task C plan 为准。已独立核对 `task-c-source-hashes.txt` 的全部15项 SHA 与磁盘文件一致，并读最终报告及构建日志。只读源码、固定 Three 实现、文件摘要与已有日志；未运行构建、模型解析、转换、简化器、功能测试、浏览器 QA、服务或 Git mutation。作者自身 Task B 不在本报告批准范围。

## Verdict

**Approved — Task C 最终静态复核通过。无未关闭 Critical、Important 或 Minor。** 预审的 C-I1 Important 已修复并在最终源码重新核对。构建日志包含2196 modules transformed、built in12.19s，作者报告 exit0；本席没有重跑构建，也不把构建当作生命周期/性能手测证明。

## C-I1 Important — 同 Blob URL 跨画布取消：已关闭

- 原位置：`C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src/virtual-showroom/scene-core/modelLoader.js` 的 `GLTFLoader.loadAsync(url)` 与 `LoadingManager.abort()`。
- 具体触发：编辑器主画布与模型替换前后预览共用资源 resolver，或多个画布持有同一 chunk lease，因而拿到同一 Blob URL。固定 Three 的 `FileLoader.js:~103–121` 在模块全局 `loading[url]` 合并 pending 请求，且只由第一个请求的 manager signal 控制 fetch。取消其中一份旧预览可能使另一份仍活跃的消费者收到 AbortError，尽管其 lease 引用还在。
- 最终修复：modelLoader `:11–38` 每 handle 有独立 AbortController，自行 fetch Blob URL→ArrayBuffer，再调用 GLTFLoader.parseAsync；cancel 只终止自己的 root fetch，不再 abort 共享依赖 manager。解析不可即时取消时，迟到 root 先登记资源再 dispose，不能挂入新 scene。
- `:40–46` 保留 decoder 到全部 pending 解析 finally 清理后再 dispose，避免提前 terminate Draco worker 留下无法 settle 的晚到任务。已读最终实现，静态关闭 C-I1；没有实际执行网络/解析取消用例。

## 生命周期 / 权限 / 坐标证据

1. **Lease refcount 与 ABA。** `chunkAssetCache.js` 每 record 独立 controller、refs、closed/settled、Blob URL；lease 闭包绑定自己的 record，release/cancel 幂等。close 只有在 cache.get(key)===record 时删除；hash/byte读取后的迟到阶段也检查相同身份。最后一个 lease 才 abort/revoke；旧 record 不能删除或关闭同 key 新 record。失败记录从缓存退出，调用者持有的旧 lease 不污染新 generation。

2. **描述符与真实 chunk bytes。** acquire 先验证 kind=model-chunk、固定 models/version/chunks/cNNNN.glb、size<=32MiB 和 SHA 格式，再验证实际 Blob size/SHA。共享Blob仍是每canvas独立 GPU graph，C-I1 修复后根字节读取也独立取消。publicSession 只从发布 resources 描述符集合选择，credentials omit；admin resolver 走 owner API。chunk 不能经普通永久 resolve 缓存取得，coarse/template/preview不被 chunk release误释放。

3. **资源登记与公私边界。** editor/独立 imports 在挂 canvas 前 setResources；getDraft 的 public resource descriptors 包含已登记模型资源，私有存储信息不由组件生成。streamingManifest核单一 generatedmarker、当前modelVersion、固定manifest/coarse路径、1MiB清单、真实清单SHA/size、全部coarse/meta/chunk登记kind/size/SHA；无任意source URI、外部模型或私有IFC路径。后端登记/公开会话的最终授权闭包仍由 Root D负责独立审阅。

4. **Atomic closure。** coarse实际atomic ID每项唯一且总数<=20k，与manifest所有chunk原子集合一一对应；chunk ID唯一/范围1..64、固定路径、bounds/计数/策略/LOD字段严格核。high解析后再核本chunk完整atomic集合，拒绝嵌套stream marker、多项/缺项/重复原子。nodeIds只作为全局目录关联，不在客户端重新采metadata或按mesh/name重分配业务身份。

5. **高低切换顺序。** `streamingModel.js` 只有完整high解析、原子集合有效、alive及record身份仍当前时才add high并隐藏对应coarse。unload先恢复coarse，再dispose高图并release旧lease。取消的pending仍保留并发/编码字节预留，直到解析settle，避免反复取消产生无限替代任务。错误保留coarse并显示说明；明确切换模式才清失败集合重试。

6. **正确世界距离与预算。** chunk local bounds先经building.matrixWorld变换，camera world position到world AABB计算距离，包含非均匀scale。high挂在building下identity Group，chunk已有normalized坐标，building变换仅一次。auto使用load/unload阈值与hysteresis；视锥/距离排序，pending<=2、resident+pending按desktop/mobile encoded bytes限额；high模式也不绕预算，coarse模式取消/恢复。相机恢复、模型document变更与gizmo变换重排。

7. **版本 epoch 与晚到。** runtime切换建筑key、清空和dispose递增modelEpoch，取消旧coarse handle/manifest controller/stream manager；所有异步coarse/manifest返回均核alive/epoch。stream内部record.closed/identity防旧任务回包。旧model迟到立即dispose，不能加入新building。Viewer会话过期同时关闭runtime与session；ready时已过期也不启动后续加载。旧无marker GLB沿单文件路径，505无需迁移。

8. **GPU / ImageBitmap / Blob 释放。** dispose.js按已登记GLB root持有的geometry/material/texture/skeleton/image集合引用计数；同root幂等、同资源去重，跨root共享ImageBitmap只在最后引用close。释放父scene/group先移除登记子root，避免父遍历再次销毁其资源。整个session关闭abort并revoke所有Blob；分区卸载只归还自己的chunk lease，不按key销毁别人的screen/template资源。

9. **真实统计。** sceneMetrics使用RAF实际时间差，未使用行走导航的clamped dt；renderer.info来自实际render，计数/JS heap/编码字节分开标示，无GPU bytes或目标FPS伪造。1秒通知、bounded样本窗口，getStats读取当前数据；dispose发送明确关闭快照。panel默认收起，模式不保存服务器草稿，导出的plain JSON只有指标/浏览器及手动备注，没有ticket/objectKey/source/private属性。下载阶段耗时包含resolver/hash/Blob字节读取，报告已说明，不冒充CPU profiler。

10. **原业务与outline。** building outline缓存规范化全高bounds，再按building matrix更新，避免每帧遍历整建筑或随驻留chunk跳动。展项、navigation、碰撞、全局anchors、重导review/CAS、模板host通信未被分区管理器改写。独立imports只加resources接点，不恢复旧的直接saveDraft替代review入口。

## 最终锁定证据

全部15项独立比对一致，完整清单在同目录 `task-c-source-hashes.txt`。关键文件：

| 相对 ruoyi-ui-vue3 | SHA-256 |
|---|---|
| src/virtual-showroom/scene-core/modelLoader.js | EF8D2A9BB7B4B76F9159C8ED1AE42A412D9943F30BAEFF4747F58789B1493EEA |
| src/virtual-showroom/scene-core/chunkAssetCache.js | 1AF319E28270E253052021BB31FF857957A31DBB2E5CFF6DBFEEC9E5A3E84A06 |
| src/virtual-showroom/scene-core/streamingModel.js | 52E1CD9DA90D271C791890AB243CA857F53BA0EB185E3354A67F57B835B1FDAF |
| src/virtual-showroom/scene-core/sceneRuntime.js | 288FAD4173A7AFF194522726583D67ACAA117D37B4C2B682A55F2D64B674ED77 |
| src/virtual-showroom/scene-core/dispose.js | C274DA5C46BDF2CF6BE413AAA1A579E63F6E70F31AADBA172D55445A4291FB61 |

## 验收限制

本报告不判定真实终端FPS、GPU峰值、网格减面观感、网络取消时序或Blob实际释放曲线已通过。用户仍需按手册手动检查多canvas同URL取消、近远/teleport/失败回退、换模型/离开、手机预算与内存。Task A导出、Task B原生解析以及Root D资产闭包/后端/UI导入分别由对应独立审阅覆盖，不能由本报告代替。
