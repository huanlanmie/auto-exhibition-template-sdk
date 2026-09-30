# P3 二维 DWG provider：本机与官方资料只读研究

日期：2026-09-30。研究范围由 root 指定：P3-02/P3-03 的本机可用工具、授权/部署边界与受控 adapter 建议。未编辑产品源码，未安装、下载转换程序、运行版本命令、启动 CAD、执行转换或测试，未读取许可证密钥。未触碰原用户修改或 505 案例。

## 结论

**本次检查未发现可直接启用的本机 DWG 转换器。当前应保持 dwg provider disabled，保留“在原软件导出 ASCII DXF 后导入”的明确兼容路径。** 可先实现固定 adapter 契约、配置与真实能力登记，待具备固定合法部署、隔离条件和用户手工格式验收后启用。不能把外部导出 DXF 计为平台已启用直接 DWG。

已读 SDK roadmap P3-02/P3-03 和总体设计关于二维 DWG、代理实体、外部引用及授权要求；三维 DWG 仍属独立 P4 范围。

## 本机事实

只读取路径、目录与非秘密安装登记：

- PATH 中 `acad.exe`、`accoreconsole.exe`、`ODAFileConverter.exe`、`dwgread.exe`、`dwg2dxf.exe` 均未找到。
- 常见 `C:/Program Files/Autodesk`、`C:/Program Files (x86)/Autodesk`、ODA/ODAFileConverter/LibreDWG 根目录未发现候选安装。
- 对以下已有应用目录完成可执行文件名检索：`D:/soft`、`E:/soft`、`D:/Program Files (x86)`、`E:/Program Files (x86)`、`E:/development`、`C:/Program Files`、`C:/Program Files (x86)`。检索名称包含 acad、accoreconsole、ODAFileConverter、TeighaFileConverter、dwg2dxf、dwgread、DWGTrueView、AcDwgFilter；无匹配输出。未对任意个人文档内容进行扫描。
- HKLM 64/32 位及 HKCU 卸载登记未发现名称匹配 AutoCAD、ODA/Open Design、LibreDWG、DWG TrueView、Teigha 的产品。
- 以下键均不存在：HKLM/HKCU Autodesk/AutoCAD、HKLM WOW6432Node Autodesk/AutoCAD、HKCR AutoCAD.Application/CLSID；acad.exe 与 accoreconsole.exe 的常见 App Paths 键也不存在。
- 因没有发现候选 EXE，没有可报告的本机 EXE 版本/哈希/签名或合法使用授权状态。上述结论是“检查范围内未发现”，不是对所有磁盘隐藏/未注册安装的绝对证明。

读取技能：`C:/Users/Administrator/.codex/skills/solidworks-automation/subskills/autocad-automation/SKILL.md`、`references/api-lookup.md` 及父目录 `capabilities.yaml`。技能目录描述曾验证 AutoCAD 2024 .NET 白名单后端，但这属于技能历史能力记录，**不证明当前主机已安装 AutoCAD**。其 DXF 无头工具明确不能读取/写入 DWG。没有运行可能连接/启动 COM 的 preflight 脚本，因为本次只允许静态研究。

## 官方路线比较

### AutoCAD Core Console + 固定 .NET 命令

技术上可通过 accoreconsole 的固定输入图纸/脚本参数运行数据库命令；Autodesk 官方资料给出 `/i`、`/s` 等入口。Core 插件使用 AcCoreMgd/AcDbMgd，不应依赖桌面 AcMgd。官方 Database.DxfOut(fileName, precision, version) 默认输出 ASCII DXF；precision=-1 才切换为二进制，因此固定包装器可明确指定 ASCII。参考：[Autodesk 官方 Core API 参考](https://github.com/autodesk-platform-services/skills/blob/main/skills/acad-dotnet/references/autocad-api.md)、[DxfOut 方法](https://help.autodesk.com/cloudhelp/2024/ENU/OARX-ManagedRefGuide/files/OARX-ManagedRefGuide-Autodesk_AutoCAD_DatabaseServices_Database_DxfOut_string_int_DwgVersion.html)。

建议的未来调用形状为固定绝对 EXE 加参数数组 `['/i', privateInput, '/s', trustedScript, '/language', 'en-US']`，具体开关和插件目标框架须按实际部署主版本锁定。trustedScript 只能包含发布方固定命令，不从请求插入任意 Lisp/NETLOAD/命令文本；不得为了方便关闭主机全局安全策略。更稳妥的是固定插件直接调用数据库导出并产生结构化诊断，而非依赖交互命令提示顺序。当前主机未发现该运行时。

授权上不能把桌面安装/可执行 CLI 推断为可对任意访客提供服务：Autodesk 当前条款将使用限定于订阅范围，第三方提供软件功能受明确授权限制；Included APIs 的一般范围为授权内部业务使用。平台化服务需匹配具体授权或书面许可；APS 是另一套云服务路线，不能当本地免费能力，也不应在本阶段自动上传用户 CAD。参考：[Autodesk General Terms](https://www.autodesk.com/termsofservice)、[Offering Types / Included APIs](https://www.autodesk.com/company/terms-of-use/en/subscription-types/)。

### ODA File Converter / 有相应授权的 ODA SDK 包装器

官方 File Converter 支持 GUI 和 CLI，接收源目录、目标目录、过滤条件、输出类型/版本、递归与 audit 标志；audit 会执行修复。官方公开页没有给出本次可核定的完整位置参数顺序，且本机未安装，因此不能把网络示例参数当已验证命令。受控部署应使用一个只有 `source.dwg` 的私有输入目录，固定输出 ASCII DXF、禁用递归；audit 若启用必须明确记录其修复影响。参考：[ODA File Converter](https://www.opendesign.com/guestfiles/oda_file_converter)。

免费 Community Application 的 2025-09 协议明确限制服务局/分时使用，并限制作为商业应用的一部分分发；因此不能直接把免费工具塞入展厅 Worker 后宣称授权无问题。ODA SDK 有不同部署级别，官方将 Web/SaaS 列在相应会员范围，应取得适合本产品的授权后封装固定命令。参考：[ODA Community User Agreement](https://www.opendesign.com/agreements/2025/en/ODA%20Community%20User%20Agreement%2009-2025.pdf)、[ODA 部署级别](https://www.opendesign.com/pricing?language=en)。当前无本机工具/授权证据。

### LibreDWG CLI

GNU 官方提供 DWG reader 和 dwg2dxf/dwgread，许可证为 GPLv3+；官方仍说明部分高级 R2010+ 实体可能被跳过，因此不得承诺完整语义。可行的固定 CLI 形状是 `dwgread ['-O','DXF','-o',output, input]` 或经具体版本确认的 `dwg2dxf ['--as','r2013','-o',output,input]`。不要用 `--minimal`：官方说明它省略多种头、表和 handle，会破坏 P2 的单位/图层/来源身份基础。参考：[GNU LibreDWG 项目与许可证](https://www.gnu.org/software/libredwg/)、[官方程序手册](https://www.gnu.org/software/libredwg/manual/html_node/Programs.html)、[上游 dwg2dxf 命令定义](https://github.com/LibreDWG/libredwg/blob/master/programs/dwg2dxf.1)、[DXF 输出边界](https://www.gnu.org/software/libredwg/manual/html_node/DXF.html)。

这是不依赖 AutoCAD seat 的开源候选，但当前没有安装，版本与 Windows 发布物尚未锁定。分发/修改时必须按实际集成方式处理 GPLv3+ 义务；本研究不把进程分离视为自动免除许可义务。若未来选用，先固定官方发行版本/摘要，保留许可材料并完成真实 DWG 实体缺失报告验收。

## 建议的受控 adapter 设计（待 root 固定接口）

1. **运行位置：Node 私有工作区预处理。** 原 HMAC/owner/source package digest/ZIP 路径预算检查先通过，选择单个 DWG entry。不要在浏览器里启动 native CLI。将固定 DWG 转成私有派生 ASCII DXF，再复用现有纯 DXF analyzer 与 browser builder；最终 sourceFormat 仍是 dwg，保留 conversionChain，而不是伪装成原生三维 DWG 解析。
2. **固定部署配置：** providerId、绝对 executable realpath、固定版本/文件摘要或签名、固定 adapter/profile/output DXF version、授权适用状态、隔离配置、人工验收状态。请求不能覆盖 executable、参数模板、script、环境变量、cwd 或搜索路径。用 child_process.spawn/execFile 的参数数组和 `shell:false, windowsHide:true`；绝不拼接 cmd/PowerShell 字符串，不从 PATH 猜可执行程序。
3. **文件边界：** 每任务独立随机目录；复制为服务生成的 `source.dwg`，输出服务生成的 `derived.dxf`。拒绝 symlink/reparse 越界；只接收声明的一个 regular output，读取前后 realpath/长度/hash 验证。不能只因退出码0就认为转换成功：输出必须是 ASCII DXF，具有完整结构，经 P2 raw/parser 预算和实体诊断通过。
4. **期限与资源：** 与 analyze/convert 共用 slot；建议初始并发1，整体转换期限不超过现有180s（可由部署策略更低），断连/取消杀整个进程树并等待退出后清理。限制 stdout/stderr（例如各1MiB）、输入 DWG 与 ZIP 既有预算、派生 DXF≤16MiB及P2后续1m groups/100k raw+expanded/20k paths。native 进程另需 OS 内存/CPU/子进程预算；Node maxBuffer 或 Job Object 的超时本身不是文件/网络隔离。
5. **外部引用与启动内容：** 首版只接受自包含二维 modelspace；不下载/解析 URL、UNC 或包外绝对 xrefs、图片、字体、数据链接、对象启用器。拒绝或明确报告代理/未知/三维实体。仅给 CLI 私有输入目录并不能阻止图内绝对引用读取其他目录；部署还须有可验证的文件/网络隔离，或固定 SDK host services/reference resolver 明确拒绝外部访问。不得复制用户的 .lsp/.scr/.dll/.arx 到可信自动加载路径，不借桌面用户活动会话批处理。
6. **身份谨慎：** 派生 DXF 的 handle 未必等于原 DWG 的稳定实体身份。除非选定 provider 明确保证并验证转换关系，初始 dwg 来源锚点应 stable=false，报告“派生DXF标识仅供建议”，不能直接继承 P2 dxf-handle-chain 的 exact 信任。

## 摘要与校准：必须新增派生输入绑定

P2 `options.dxf.entryHash` 是实际 DXF bytes 摘要。DWG 流程需要同时记录：原 package SHA、原 DWG entry SHA、派生 DXF SHA、provider/version/options fingerprint。不能把原 DWG hash 冒充 DXF hash，也不能因为转换两次有差异就跳过校准校验。

**优先建议：** preflight 生成并验证派生 DXF后，私有冻结它，并返回 owner/room/原输入/派生摘要/provider fingerprint 绑定、短TTL的 preflightId。createJob 复用该精确派生产物。这样避免转换器写入时间戳或顺序变化导致相同 DWG 的两次 DXF bytes 不同。票据不得跨用户/展厅复用；过期/源变更/provider变化须重新分析。原始 DWG 与派生 DXF均保持私有，清理归属明确。

若坚持每次重新转换，必须明确可验证的确定性字节规范化与一致性规则，不能仅比较几何包围盒；初版不推荐增加这条复杂分支。

## disabled 与错误设计

当前建议 capability：`{id:'dwg2d',enabled:false,installed:false,licenseStatus:'unverified',validationStatus:'not-run',formats:[],reasonCode:'DWG_PROVIDER_NOT_INSTALLED',fallback:'export-ascii-dxf'}`。对外不暴露EXE私有路径/许可证信息。整体 Worker 和 P2格式仍 ready。

分别保留禁用原因：NOT_CONFIGURED / NOT_INSTALLED / VERSION_MISMATCH / LICENSE_UNCONFIRMED / ISOLATION_UNAVAILABLE / MANUAL_ACCEPTANCE_REQUIRED。任务固定错误建议 DWG_PROVIDER_UNAVAILABLE、DWG_TIMEOUT、DWG_OUTPUT_LIMIT、DWG_CONVERSION_FAILED、DWG_EXTERNAL_REFERENCE、DWG_UNSUPPORTED_ENTITY、DWG_CALIBRATION_STALE。UI显示“二维DWG尚未启用：请从原软件导出ASCII DXF”，不显示虚假解析进度、不把fallback算直接支持。

启用判定必须分离：代码存在、可执行文件存在、版本匹配、授权适用、隔离具备、转换器实际可用、用户手工验收。当前证据仅支持实现禁用适配框架；不支持启用任何本机DWG provider。

补充：后续只读 npm/WASM 调查发现 `@mlightcad/libredwg-web@0.7.14` 提供真实 Node DWG→ASCII DXF API，可作为无需本机native CAD安装的实现候选。详见同目录 `dwg-wasm-research.md`。本报告的本机EXE未发现事实不变，但“只能等待商业/native工具”的推论不应延续；root已决定采用独立Node进程WASM路线，尚未运行转换。
