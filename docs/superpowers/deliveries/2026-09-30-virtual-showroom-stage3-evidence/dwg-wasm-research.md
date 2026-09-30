# DWG 开源 WASM 候选补充研究

2026-09-30。只读核查 npm 发布元数据、官方上游源码和发布包内容；没有安装到 node_modules、导入/运行模块、初始化 WASM、读取任何 DWG、转换或测试。npm 压缩包仅在内存中展开以读取发布文件清单/文本并计算摘要，未将运行文件写入工作区。

## 结论

**存在真实 DWG→ASCII DXF 的 Node/WASM API，不能将开源路线排除。** `@mlightcad/libredwg-web@0.7.14` 是可进入受控 P3 实现的候选，直接复用上游写 DXF 接口即可，无须自写全部 DWG 解析器。运行兼容性与实际文件完整性仍未验证，当前证据支持实现和部署选型，不支持声称已转换成功。

这修正 `dwg-research.md` 的候选范围：该报告“未发现现成本机 native 工具”的事实仍成立，但新增 npm/WASM 部署可绕开需要本机 AutoCAD/ODA EXE 的前提。

## 精确 pin 和发布物

- 包：`@mlightcad/libredwg-web@0.7.14`；registry latest 0.7.14，发布于 `2026-09-19T08:50:29.867Z`。
- package engines：Node >=20，当前 Node22目标符合声明；无运行依赖；package license 字段 `GPL-3.0`。
- provenance 指向上游 tag v0.7.14、commit `1dd682f46339f37b67c5ff1085d10d04a8c16d7e`。这是读取 npm provenance 的结果，不声称另行完成签名信任链审计。
- tgz 2,433,572 bytes；实际计算 SHA512 与 registry 一致：`sha512-5zuTw+x5o/qj9czjkcf2o3PWuh8v+XEEFM9ZEMEhVRaJySZ6+C7Ua6y6hyGcwJ3WfmXhWAHEdVYsKtx4XAlvfA==`。
- `dist/libredwg-web.js` 278,480 bytes，SHA256 `dc03521806bd65ab0e1b5d56071feaa7edc2b17c461eb1f188fee3320f24dc6a`。
- `wasm/libredwg-web.js` 114,811 bytes，SHA256 `8f362ceb413bb8906a48ca4694a707bff319f20b6720b53280af1f4609e7dafd`。
- `wasm/libredwg-web.wasm` 9,496,803 bytes，SHA256 `431576487027122a28e5ac99d91fe6366f81ecda743a4676878c75c85fe82c53`。

证据：[npm registry 固定版本](https://registry.npmjs.org/@mlightcad%2flibredwg-web/0.7.14)、[npm provenance](https://registry.npmjs.org/-/npm/v1/attestations/@mlightcad%2flibredwg-web@0.7.14)、[固定版本 package.json](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/package.json)。

## 可用入口与返回值

从包根导入，避免使用未开放的 package subpath：

```js
import { createModule, LibreDwg, Dwg_Error } from '@mlightcad/libredwg-web'
// 发布物默认初始化或固定本地WASM目录；下面仅说明API，未执行。
const raw = await createModule({ locateFile: fixedLocalWasmResolver, print: boundedLog, printErr: boundedLog })
raw.FS.writeFile('/input.dwg', inputBytes)
const read = raw.dwg_read_file('/input.dwg') // { error: number, data: number }
// 保存read.error；read.data是opaque WASM pointer，不能向客户端公开。
raw.dwg_free(read.data)
const writeStatus = raw.dwg_write_dxf('/input.dwg', '/output.dxf') // number
const output = raw.FS.readFile('/output.dxf') // Uint8Array
```

高层方便接口为 `await LibreDwg.create(absoluteWasmDirectory)` 后 `lib.dwg_write_dxf(exactArrayBuffer)`，返回 Uint8Array 或 null。它会管理 tmp.dwg/tmp.dxf，但非零状态只记录日志并变为 null；不适合作为平台唯一诊断入口。`LibreDwg.dwg_read_data` 也会丢弃非严重 read.error，只警告后返回 pointer。原始读取错误应直接从 raw 返回对象取；没有独立 `dwg_read_error` API。证据：[TypeScript wrapper](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/src/libredwg.ts)、[raw binding](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/embind/binding_func.cpp)。

上游仓库有 Node API 示例/测试源，覆盖显式 WASM目录与默认定位；本次只读了代码，**未运行该测试**。发布 wrapper 已存在 DXF 方法，build:prepare 不再含 `--disable-dxf`，C++绑定调用的是 ASCII `dwg_write_dxf`。README 仍保留“默认关闭DXF”的旧描述，不能据此否定当前接口，也不能以文档替代真实手测。输出最终仍须被本平台验证为有界 ASCII DXF。参考：[Node入口源码](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/test/node-api.test.mjs)、[ASCII writer](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/src/out_dxf.c)。

## 读取与写入错误必须分开

`dwg_read_file` 返回 bitmask：WRONGCRC=1，NOTYETSUPPORTED=2，UNHANDLEDCLASS=4，INVALIDTYPE=8，INVALIDHANDLE=16，INVALIDEED=32，VALUEOUTOFBOUNDS=64，CLASSESNOTFOUND=128，SECTIONNOTFOUND=256，PAGENOTFOUND=512，INTERNALERROR=1024，INVALIDDWG=2048，IOERROR=4096，OUTOFMEM=8192；CRITICAL阈值是128。高层封装对OOM有 abandon 路径，但原始 C++ read wrapper 在返回前还会遍历 references，异常或trap仍须由独立进程失败路径接管。[错误定义](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/include/dwg.h)、[JS枚举](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/src/types/enums.ts)。

**writeStatus不是可靠的同一bitmask。** 文件到文件绑定重新读入DWG，严重读取错误直接返回，非严重读取flags随后被写入结果覆盖。ASCII writer只据各阶段是否达到严重阈值决定失败，最终返回0或1，未完整汇总较轻错误。不能把writeStatus=1解释成CRC，也不能把0解释成“无未知或丢失实体”。建议首版前置 raw read，保留原始bitmask；任何非零读取结果严格拒绝，或进入合同明确的partial策略。写入结果独立记录；即使两次状态0也始终报告源完整性未证实，继续做派生DXF实体审查与人工确认。[绑定错误流程](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/embind/binding_func.cpp#L47)、[writer返回逻辑](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/src/out_dxf.c#L3950)。

`convertEx(pointer)` 的 stats 只有 unknownEntityCount，其范围属于 JS数据库转换器，不等于 ASCII writer 的全部失败实体数量。原始 getter 可读 object/class/type/handle；对象数量、类数量与遍历均须平台自己设上限。BigInt handle 应转十六进制字符串，不经 Number 避免64位精度损失。初始DWG来源仍不应把派生DXF handle 自动声明为跨转换稳定exact身份。

## Node、内存与文件隔离事实

- 上游固定构建参数：ALLOW_MEMORY_GROWTH=1、INITIAL_MEMORY=1GB、MAXIMUM_MEMORY=4GB。发布glue的getHeapMax返回4,294,901,760字节（略小于4GiB）；内存从WASM导出取得，不存在可以简单用LibreDwg.create的一个小内存参数覆盖该编译上限的保证。
- 默认初始化根为MEMFS；检查发布glue未发现NODEFS/NODERAWFS，FS.filesystems只登记MEMFS。Node fs.readFileSync用来加载固定本地WASM资源。不可再挂宿主目录、创建lazy-file映射或向用户暴露任意locateFile路径。
- createModule的print/printErr可绑定有界处理器。FS可stat输出后再readFile，避免输出超过16MiB后再复制到父进程；但C writer已在MEMFS写入，因此这不是写入时内存上限。
- 应每任务独立Node子进程、并发1、父进程期限kill+wait，随后清理。worker_threads/V8 maxOldGenerationSizeMb/Node max-old-space-size不等于WASM线性内存硬限制；进程RSS监测可及时终止，但不是严密硬上限承诺。若需真正硬内存限制，应由OS容器/Job Object等部署层实施或重编译受限WASM。
- 不同任务不可共享高层固定tmp文件名实例。子进程重建也避免长驻WASM堆、损坏pointer与free失败污染后续任务。

证据：[固定glue](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/wasm/libredwg-web.js)、[构建参数](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/package.json)。以上为源码/发布物静态事实，不是已观测进程峰值。

## 版本、外部参照及完整性边界

上游枚举识别至AC1032/R2018，并含beta/占位标签；不能据枚举声称每个版本/实体都能无损转换。建议P3初始限定经合同列举的主流文件header，其他拒绝；报告读到的源版本和provider版本。未知、代理、自定义类、三维内容或外部引用须拒绝/明确partial，不能从空DXF推断原DWG无实体。MEMFS不提供宿主路径映射，可防止普通文件调用读到宿主外部参照；仍需仅传入固定输入bytes、锁定loader路径并禁止任何网络/宿主FS扩展。派生DXF复用P2严格结构与实体诊断。[版本表](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/bindings/javascript/src/database/version.ts)。

原package SHA、DWG entry SHA、派生DXF SHA与provider fingerprint必须分开。优先采用原研究建议的15分钟ownerScope冻结缓存，分析和转换复用完全相同的派生DXF，不假定再次转换字节确定。

## 许可证事实与隔离安排

npm字段为GPL-3.0；仓库COPYING是GPLv3，底层LibreDWG文件头另写version 3 or later。它是MLightCAD维护的LibreDWG派生绑定，不是Autodesk或ODA授权运行时。GPL文本涉及使用、修改、convey与相应源码义务，不能把“独立进程”或“不发到浏览器”直接当作所有场景免除义务的法律结论。[固定COPYING](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/COPYING)、[底层许可头](https://github.com/mlightcad/libredwg-web/blob/1dd682f46339f37b67c5ff1085d10d04a8c16d7e/src/out_dxf.c)。

工程建议与root选择一致：GPL adapter及notices/对应源码材料单独归档，固定版本、构建脚本与来源可追溯；只在私有Node子进程载入，不添加浏览器/vendor路由，不进入Java或Vue bundle。向客户交付该Worker/包或修改版本时，需按实际交付方式确认并履行对应许可证要求。这里只陈述源许可证和技术分隔，未作法律结论。

## 实施决策输入

可优先采用此npm/WASM方案实现DWG2D受控入口；不需要购买/启动桌面CAD来验证API形状。待root冻结缓存与错误契约后再落代码。当前仅完成pin/接口/源码研究；后续安装、构建就绪和用户手工DWG验收须分阶段记录，仍不得伪称本研究执行过转换。
