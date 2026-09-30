# P3 Task B 独立静态审阅

日期：2026-09-30。审阅者：独立席位 `/root/stage3_review_native`，非作者。审阅对象为当前 working tree 的六个 Task B 文件，依据完整 P3 contract、plan 与 `task-b-report.md`，并只读固定 `@mlightcad/libredwg-web@0.7.14` 的声明/包装器/转换源码及必要共同调用链。

仅静态阅读与本报告写入；未运行引擎初始化、模型分析/解析/转换、功能测试、浏览器 QA、安装、启动服务、数据操作、stage 或 commit。未修改平台源、505 或原用户修改。实际 quota/格式兼容仍须用户手动验收。

## 已核对的优点

- `CreateProcessW` 使用 suspended，先 `AssignProcessToJobObject` 再 `ResumeThread`，Job 使用 aggregate memory 与 kill-on-close；没有无隔离 fallback。固定 PowerShell、Node 和 bridge 模块没有来自上传选项的 executable/script 路径。
- 原 DWG header 白名单、32 MiB 输入、100k objects/1024 classes 与 16 MiB 输出预算明确；raw `dwg_read_file` 的 `{error,data}` 与独立 `dwg_write_dxf` 返回值分开检查，readFlags 非零拒绝。成功始终产生 partial/unknown 报告，不伪称完整 DWG 或三维支持。
- 派生文件是固定 regular-file 名称，父重新计算实际 bytes 的 SHA；票据使用 256-bit opaque 随机值，绑定 owner/room、原包 SHA、原 DWG entry SHA、provider fingerprint 与派生 SHA，15 分钟 TTL。转换复制冻结 DXF，不重转后复用旧校准。
- 浏览器只用 Root 的 `/derived/derived.dxf`；复用的 `convertDxf` 对 fetch 到的实际 bytes 重新计算 hash。每个已有 sourceAnchor 均降为 `stable:false`/`dwg-derived-handle`；共同 `browser/convert.js:74` 对 DWG 额外 scale 为 1，保留 DXF 的米制/Y_UP hint。
- 原包 SHA 已在 `io/jobWorkspace.js:46-47` 验证，且 selected entry 在 provider 中重新散列；公开 DWG report 的对象显式挑字段，不带票据、owner scope 或宿主路径。

## Critical

无。

## Important

### B-I1：可把 aggregate quota 提高到 4096 MiB，违反 3072 MiB 硬上限

- 路径/行号：`C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/native/boundedNode.js:25`；`src/native/launch-job.ps1:43`、`:49`。共同调用证据：`src/config.js:34`、`src/providers/dwgProvider.js:75`。
- 触发：部署设置 `VIRTUAL_NATIVE_MEMORY_MIB=4096`，或受信 caller 向 `runNativeJob` 传 3073–4096。
- 问题：JS 与 C# 两层都接受 4096，C# 将实际 JobMemoryLimit 设为该值。默认 3072 并不能满足 contract 的 aggregate **硬上限 3072 MiB**，实际可多分配 1 GiB。
- 修复：两层拒绝大于 3072 的值，共同 config 的最大值也同步为 3072；可保留更低配置，固定硬上限不可提高。健康描述保持为实际生效值。

### B-I2：代理类标记读取了不存在的 `is_zombie` 字段

- 路径/行号：`C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/native/libredwgBridge.mjs:35`。
- 固定包证据：`node_modules/@mlightcad/libredwg-web/lib/types/common.d.ts:95-105` 的字段为 **`s_zombie`**；该包 `lib/converter/converter.js:242` 也使用 `cls.s_zombie` 生成 wasAProxyFlag。
- 触发：class 的 dxfname 属于 standardClasses，同时 class 的 `s_zombie` 为 true。当前 `entry.is_zombie` 是 undefined，名称白名单通过后，代理类标记不会被拒绝。
- 问题：标准名称检查不能替代该源 class 的代理标记检查；若 object 被库映射为已知 fixedtype，后续 PROXY/UNKNOWN 字符串检查也不能补回此信息。与“发现 proxy 硬拒绝”的审计边界不符。
- 修复：使用 pinned 的 `s_zombie` 字段，核对返回 class 的形状并对非法/缺失字段 fail closed；不要把字段拼写不匹配当作无 proxy。保留类型/名称的第二层检查。

### B-I3：非零 Z 的块基点可以越过二维源审计

- 路径/行号：`C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/native/libredwgBridge.mjs:57-62`。
- 固定包证据：`node_modules/@mlightcad/libredwg-web/lib/converter/converter.js:271` 从 BLOCK_HEADER 读取 `base_pt`。共同 DXF 证据：`src/cad/dxfAnalysis.js:52` 保存块基点，`:151` 将负块基点加入实例变换，`:165` 仅检查路径内部 Z 的差值。
- 触发：BLOCK_HEADER.base_pt.z 非零，块内 LINE 等实体 Z=0，INSERT.ins_pt.z=0，xref flags 皆为零。native 只检查块 xrefs，块内实体和 INSERT 的点检查都通过。
- 问题：派生 DXF 中块基点会使实例落在非零 Z。P2 对同一平面上的非零标高允许建模，所以“派生 DXF 再检查”不会保证拒绝此源 3D 变换；最终 DWG 可成功进入严格二维 scope，尽管同等实体的非零 Z 在 native 中本应硬拒绝。
- 修复：BLOCK_HEADER 分支有界读取并校验 `base_pt`，对非零/非有限 Z 拒绝；若当前 raw API 无法读取，按审计失败拒绝。继续沿用严格 native 2D 策略，不靠 DXF 建模层的宽松标高规则补审。

### B-I4：缓存删除失败后，存留 orphan 不再计入 20 条/320 MiB 限额

- 路径/行号：`C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/providers/dwgCache.js:18-22`、`:33-36`。
- 触发：过期文件在 Windows 被占用，或 unlink/rmdir 返回权限/IO 错误。`remove()` 先删除内存 record，再吞掉删除错误，目录成为 expired orphan。
- 问题：`sweep()` 对该 orphan 再次删除失败后仍 `continue`，因此真实存在的文件/目录既不计 count 也不计 bytes。后续 admission 接受新票据，磁盘上实际可超过 20 条和 320 MiB；定时清理持续忽略同一存留项。
- 修复：仅在确认固定文件与目录实际删除后跳过统计；删除失败的存留文件必须按实际大小计数并保留受控重试。也可让删除失败使 admission fail closed，但不能在容量统计中把存留 bytes 当作不存在。

### B-I5：launcher fallback 被杀后，只等待了 PowerShell，未确认 Job 内进程已经退出

- 路径/行号：`C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/native/boundedNode.js:47`、`:57`、`:63`、`:78-79`；异常清理分支 `src/native/launch-job.ps1:79-86`。
- 触发：取消/超时后 launcher 在编译、native 等待或清理中超过 10 秒，触发 `child.kill()`；或 C# 异常/失败路径走 finally 清理。
- 问题：正常取消路径确实调用 `TerminateJobObject`、等待主进程并轮询 ActiveProcesses=0。但 fallback 的 `close` 只是 PowerShell 退出；Job handle 被关闭会触发 kill-on-close，却没有任何留下来的监督者等待 Job 所有成员终止。C# finally 也只等主进程，不等余下成员。父随后立即 reject，Root 可以清理工作目录、释放并发槽并开始下一个任务；契约要求 abort/期限关闭后 **等待完整进程树退出**，当前异常分支缺该保证。此结论是静态缺少等待路径，不宣称已观察到运行时残留。
- 修复：让可靠监督层在所有清理分支等待 Job ActiveProcesses=0，并让父只有收到 quiescence 确认才结束；fallback 必须仍有可等待的 OS process/job handles 或等价监督者。无法确认隔离清理时应禁用后续 native admission，不能把 launcher close 当作全树退出确认。

## Minor

无独立风格项。未增加超出用户授权的测试/审批要求。

## 未裁定事项

- 实际 Windows quota 是否触发、abort 时 OS 的退出时序、实际 DWG writer 覆盖率与兼容性：需用户手动验收，静态报告只判断代码路径是否符合契约。
- 全项目 GPL 法律结论及商业 AutoCAD/ODA 能力：超出 Task B 静态代码审阅；保留私有 bridge 的许可/对应源信息即可，本报告不作全项目法律结论。
- 其他 Root/A/C 新功能的整体行为：本席位只阅读共同调用链以核对 Task B 边界，不代替对应独立审阅。

## Verdict

**With fixes / 当前不宜判定 Task B 可合入。** 固定桥、冻结校准与浏览器降级链路结构合理，但上述五项 Important 必须修复后再作静态复核。仍沿用用户仅手动功能验收约束；修复后的静态结论不等于实际 quota/格式验收通过。

## 审阅快照 SHA-256

| 文件（相对 worker） | SHA-256 |
| --- | --- |
| src/native/boundedNode.js | 1e61852a07132212aaba9307d5f1631408b5396142bbfd5471421d6d18a17560 |
| src/native/launch-job.ps1 | 873e147be2a61bd3da0d2552ca79ed1aa5fa4e662ed592d01fefb0853480c927 |
| src/native/libredwgBridge.mjs | 47b65b922e1777456c809c1898bf03e3faf01c8caa298edcdd118df3d56f38d4 |
| src/providers/dwgProvider.js | f0b710dce5944e5169cbcd47f275596e0829a08fc04f8f8e715d087cec0a96ba |
| src/providers/dwgCache.js | af5d8c95000b03850038d38e36fe5494aa562faea70d51201f3574df75c1d10c |
| src/converters/dwg2d.js | a411c870e96480705b11d1dc14c819340cc462ca0d2d804ebaa9186de02a7a78 |
