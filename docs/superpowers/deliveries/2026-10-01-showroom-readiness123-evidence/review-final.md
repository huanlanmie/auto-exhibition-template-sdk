# Readiness123 最终交叉集成静态复核

2026-10-01。审阅者：Task C 作者。权威为 `docs/superpowers/contracts/showroom-readiness123.md`（含 HTTPS LAN / localOnly 补充）及各任务冻结 brief/package/report。平台根 `C:/Users/Administrator/Desktop/mju-smart-show`，基线 `e17dacaf8c7e054d289d3149db5dbb89f55247ce`。初次审阅对象为当时未提交的 working tree；末尾记录后续窄差量与 Root 封存状态。本文核对跨任务接口与最终交付接线；不重复批准作者本任务 C，C 的实现批准由 B 的独立 review-c.md 提供。

## 裁定

**最终跨任务静态集成：Approved。无本次复核发现且未关闭的 Critical、Important 或 Minor。**

这项裁定表示源接口和既定边界能够接合，不表示真实 CAD/BIM、模板握手/函数/外观或电脑/手机性能已经手测通过。Root 的最终构建、owned 启动/health、505/原11文件保留、提交与手测交付证据另行归档。本席没有替 Root 执行这些操作。

## 独立审批链

- Task A：B 审阅，review-a.md 为 specification / quality Approved；DXF insertLayers、单位确认/报告和等价完整单组 LOD 符合要求。
- Task B：A 审阅，review-b.md 为 specification / quality Approved；B-M1 Ebook 缺失 favicon 已在隔离副本闭单，最终材料包已刷新；最终 EOF / UTF8 归一化增量也已独立静态批准，无逻辑变化。
- Task C：B 审阅，review-c.md 为 specification / quality Approved；本席仅核对 Root 对 active 接点的消费和面板记录用途，不对 C 自批。
- Root D：A 审阅，review-d.md 为 specification / quality Approved；D-I1 LAN listener readiness 的错误回环地址、D-I2 Windows PowerShell5 owned records 装饰/嵌套问题与 D-I3 LAN 管理员 preview 资源路径均已通过独立复读闭单。
- 最终手测文档：B 的 review-manual.md Approved，并引用 A 的 D-I3 独立闭单；此项是文档静态一致性审核，未声称业务验收。

上述报告本席只读，最终 SHA-256 分别为：

| 报告（相对本目录） | SHA-256 |
|---|---|
| review-a.md | 6E6496D998E6FB4DFE6239A1CBE7CE8C740E1C3DC5BC032619D98A80EAA1E25E |
| review-b.md | B42F3D6319FA56ED6C7AE6A93A1B88848C808B2D279A4CC8E697AFC1CC4F04A4 |
| review-c.md | A760260246B9E1C5135CF9D1FDBAB9E6E3ACCF67CC935BE3EF9F1901AE57C4ED |
| review-d.md | 7C264EF83F1FC69F9E6EFF4058A4C0D68EFE846BAFB0C46DEB7444F18CB4ACBB |
| review-manual.md | F8098DA85CC6E3DD78FCF38AF1DBFA644AACC25172DA05B7A59EB3F32958260B |

## 跨任务接口证据

1. **导入与业务应用仍分步。** ReadinessGuide 指向真实 ImportWizard；A 的明确单位/scale、DXF role/实际 block layer、IFC/DWG 原门槛均进入已有 createImportJob。只有 SUCCEEDED 且有 modelVersionId/assetKey 的任务可以 emit imported；partial 需要用户 acknowledgement。Root editor.applyImport 重新读取 owner 草稿并核本地修改，打开 ReimportReview，不直接替换 building/saveDraft。模型应用仍通过冻结 review/CAS 的既有服务端路径，保留业务 objectId、绑定、graph 和无锚世界位；普通保存和发布不被样例清单绕过。

2. **联动修改可修复旧冲突而不丢本地草稿。** Root openInteractions 不强制先保存旧冲突图，dirty 传 localOnly；B 的 local-saved 只交 graph，Root applyLocalInteractions 经 execute 克隆当前整份 document、写 graph 并保留其它修改和撤销历史。之后 saveDraft 使用当前 serverVersion 的整份 CAS。clean 路径仍调用 saveInteractions(showroomId, expectedDraftVersion, graph)，response detail 由 acceptDetail 归一化。无 API 降级或无版本覆盖。移除冲突 quiz 成员只清该 room 的无效 quiz targets 和被移除 master，保留其它 targets；服务端唯一成员约束继续覆盖保存、发布、preview/session，软件房间不触发物理联动写入。

3. **主画布遮挡与复核接线一致。** Root editor.canvasActive 包含导入、绑定、发布检查、内容更新、模板预览、软件联动、模型复核和 busy 状态，传给 SceneCanvas.active，同时输入 gating 使用同一计算值。ReimportReview 的两个可见 SceneCanvas 保默认 active=true；不因主画布暂停关闭其资源。ShowroomViewer 以 activeScreen/hotspot/expired 传 ViewerScene.active，模板关闭后恢复参观，visitor room/frame 身份仍由原房间生命周期维持。C 的暂停/取消范围以 B 独立审核为准，Root 没有改成关闭共享 resolver。

4. **性能记录为实值且口径明确。** 共享面板消费 runtime 的 setPerformanceProfile(auto/desktop/mobile) 和 setRenderScale(1/.75/.5)，没有写入 scene/building/anchor。档位改变渲染像素与同 preset chunk policy，queue2 和原预算保留。Root Guide 要求同设备、同视点/路线/网络比较；桌面 mobile 档位不等于真手机验收。面板的最近展项更新 CPU 耗时来自代码 timing，FPS/P95 来自有效 RAF 窗口；它没有声称 GPU timing/显存，也没有固定目标达标。暂停/warming/closed 状态与导出 JSON 的实际 samplingStatus 一致；模板另有开销的口径已明示。

5. **材料交付只有固定只读下载。** 列表入口受 query 权限显示，但 public 目录只包含四份生成输入、三份 ZIP 和 catalog，不包含解压模板 HTML/脚本入口或 private manifest。ReadinessGuide fetch 固定 catalog，credentials omit，验证 schema/manual-required、4/3 列表限额、固定相对下载 URL、size/SHA 形状，用 Vue 文本插值展示。Root copy 脚本只接受私有目录下固定 manifest，三候选 id/code/native/version/zip 名和实际 SHA 一致；公开字段白名单没有 disk path/privateEvidence/ticket。既有模板登记/授权、绑定、preview/publication均仍为用户独立操作；材料下载不自动注册/发布或替换 505。

6. **HTTPS 与既有强身份/摘要接口接合。** LAN frontend9443/runtime9444 都使用 TLS，精确绑定已分配 RFC1918 地址。runtimeOrigin 为 https selectedIP:9444，allowedHostOrigins 增加精确 https selectedIP:9443；hostSession 使用 manifest.runtimeOrigin、window.location.origin 和精确 source/window/port 身份，Java bootstrap/CSP frame-ancestors 沿既有 exact host 检查。secure context 的前提由 HTTPS 与用户信任证书提供，没有删 SHA 校验或用弱随机替换 UUID。无手机证书信任、连接或握手证据时不能称该链已实测。

7. **运行时代理保隔离。** LAN runtime 只承接 GET/HEAD 固定 public 路径：字面 preview 或 8..128 位公开 code，后接 sessions/43 位 bearer key/assets/，不暴露 manifest/renew、health/private analyze/convert、admin API 或 WebSocket，输入 Cookie/Authorization/runtime secret/proxy auth 被移除，redirect 拒绝。下游 Worker main.js 仅从浏览器白名单复制公开读取 header，并自行注入服务 secret；输出也只白名单 content/cache/CSP 等，cookie/auth challenge不回模板。服务路径最终仍以 session manifest/key 验证。frontend 的唯一 websocket upgrade 是 Vite HMR，cookie/auth不随 upgrade。Java/Worker/MySQL/Redis 的私有监听和配置保持回环，无任意 CORS/公网上 bind 或防火墙改写。

8. **同 IP 不同端口的 cookie 边界已显式处理。** auth.js 对 https RFC1918:9443 仅读写本 origin-tab 的 sessionStorage token/expiry，login.vue 不读写记住密码 cookie；默认 localhost 仍保既有流程。userStore/request 都走 getToken/setToken，visitor publicHttp 继续 credentials omit。runtime 与管理页面端口分离不是 cookie 保密依据；前述 proxy header 与 LAN sessionStorage 两层同时存在，材料目录不提供可执行模板应用。证书仅在内存生成后导出私有 PFX/公开 CER，无系统 trust 安装；私人状态/私钥不会进入报告或材料 catalog。

## 最终交付材料摘要核对

仅读取并计算现有文件 SHA；未解码/解析/转换模型。七份实际 bytes 与 catalog 描述逐项相同。

| 材料 | 实际 bytes | SHA-256 |
|---|---:|---|
| lab-plan-mm.dxf | 1144 | 0aab0d97f67fe25837aebba87bc8ab279b34305820bcc45f727899d6ce7033b3 |
| lab-ifc4-mm.ifc | 6178 | 5a3f338edb62a88de20f52559814ac0db5623b6302783c6ba26a907305aeee1f |
| box-mm-binary.stl | 684 | 6bc9cb9b405cb375c36704b2428b31489eddeb22e3a06f7f17a6005922704ccd |
| static-hall-80x60m.glb | 116604 | d25d73b657682bded4a6cb16e3d6725a2400900a6eca7fdc5a9ef8acc88e9c02 |
| tbutton.zip | 114442 | 82bab18a98fba88f98d3812ecd585049eb4aeb2abca62b34278e359d515d0e8f |
| ebook.zip | 127273 | 98972cd6a4331897d952660bffdaa6ad2be9532fbb94296fcda8ccdf7b028cb1 |
| quiz-buzzer.zip | 148675 | b2fc9f57f45e05c340e1d656cd6a41459f57cb4c04dea4d9d9d89e00aea22be2 |

## 最终集成源锁定

平台相对路径。Root D 八份源匹配原 package；start-local.ps1 与 lan-preview.mjs 匹配 D-I2 / D-I3 独立闭单后的最终摘要。C 七份源独立 hash 与 B review-c.md 一致，仅作为锁定核对而非本席自批。InteractionEditor 也匹配 A 的 B 外审。

| 文件 | SHA-256 |
|---|---|
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/index.vue | 90293DB140FAEB01C282AFE24EE5FDF7A7A4B341F1366BBF1269F3BC87172996 |
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/editor.vue | 925B66BF1D986C0C919E55F1F252521008F9C47EF3FEE6329D8605B06192E26D |
| ruoyi-ui-vue3/src/virtual-showroom/viewer/ShowroomViewer.vue | 9BF73E6CF849DC3AC601472BA3D3F1091A8F2DFB31F2248C6DFD00591CDB0E82 |
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/ReadinessGuide.vue | 214BD1BF0B5057857093ACEC44CFA81FDEE437DC680A8885F61D4923AE76AC02 |
| scripts/virtual-showroom/prepare-readiness-models.mjs | 9D6C73BE3870C727743DB69546B61157550C06D3E4151F6C9D4D3E1D67A9B8A5 |
| scripts/virtual-showroom/prepare-readiness-templates.mjs | C5DE3149EB88EE9B576C407B197F2BBBC4F65615FD9945431A19ECBBCA7E952F |
| scripts/virtual-showroom/start-local.ps1 | A14E9DF0B16E0814EF564691BC1B17E54352C27C6E65985E7955F6CA25DBAEF8 |
| scripts/virtual-showroom/prepare-lan-preview.ps1 | 15583DA40555AD8A107BDFCF3DDA9B781DFED1FF6AE0E455611EBB9652AB1CE3 |
| scripts/virtual-showroom/lan-preview.mjs | B71784AAB13D6867960030769005ED430052C1E0F12C6E01D8011A9A4FB7E5A2 |
| ruoyi-ui-vue3/src/utils/auth.js | 6DA598B9E36CE25A159BF9306AA6831DF2357689096D4D169C5E119425D5C098 |
| ruoyi-ui-vue3/src/views/login.vue | 694EAE7245F71EC0978440D14879C5B3BF1E8F80E36908779B044CFFE65DC7D1 |
| ruoyi-ui-vue3/public/readiness-materials/catalog.json | 9791FEE9044FFC676B35476EC3530F17C98B1C578675EF8C351C2CEF1628748F |
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/InteractionEditor.vue | D86D218AE5D7E712FDFFDA147B53453EC45B81D0EB3D8327645E453C77E7E0EC |
| ruoyi-ui-vue3/src/virtual-showroom/scene-core/sceneRuntime.js | 120F03BC1F7881CE2BC7AB6B3E3D011DDFD2516ED4224F4E0071D2A32F762CA5 |
| ruoyi-ui-vue3/src/virtual-showroom/scene-core/sceneMetrics.js | 1857C8ED656D14A1141DCAAEB274B71C05D49879125F192AD69C81A8D689DD58 |
| ruoyi-ui-vue3/src/virtual-showroom/scene-core/streamingModel.js | 4638EE6B491C6C49FA93A0995B48F12984F2763EBE164FA1DB6B34ED10EE74B7 |
| ruoyi-ui-vue3/src/virtual-showroom/scene-core/screenObjects.js | A936248D90905735A7274988007C1A7A8D116CDD4042EBA0DDF62FD7D063B5CA |
| ruoyi-ui-vue3/src/virtual-showroom/components/ScenePerformancePanel.vue | E5A8926061FA77F17DB6FB13170E7A581A43C148D80B6D045CB5496CCB459E2E |
| ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/SceneCanvas.vue | A2EC826E929144F52971A653F5231B48B2C84AE3CF59242946E3BB1B8A1B80A9 |
| ruoyi-ui-vue3/src/virtual-showroom/viewer/ViewerScene.vue | 0EFAC5BE53759B50B40D7347578E412D9CDB7B407863A768D62A7222AF222A53 |

## 最终启动增量补记：D-I2 闭单

2026-10-01 窄范围补核，仅重新读取 start-local.ps1 的 Processes/Start-Owned、Services 默认切换、stop 接点和 A 更新后的 review-d.md，不重做此前已有集成审查。最终 specification / quality / cross-integration Approved 保持；无新增未关闭问题。

Processes 在 JSON 解码后逐条 foreach，先拒缺 name/pid/executable/startTicks/port 的记录，再以 string/int/long 等标量重新构造 flat PSCustomObject 并显式输出；value/Count 装饰包装不能被猜测恢复为 owned record。Start-Owned 完整收集记录后才决定是否重配，在 List<object> 中按 name 保留其它记录并追加当前标量记录，使用 `ConvertTo-Json -InputObject ([object[]]$updated.ToArray())` 一次序列化完整数组，避免 pipeline 数组相加造成装饰/嵌套和 depth5 丢 ownership。

Same-Process 仍在停止前精确匹配 executable/startTicks；无关已占端口仍拒绝。D-I1 的 LAN selected-address probes/waits、bindAddress 保存与 legacy loopback fallback 均保留。Services 默认切换与 stop 都先收集待处理记录再进入 process-action loop；本增量没有扩大脚本的数据或进程权限。本席独立计算的最终 startup SHA 与 A 闭单摘要完全一致，上表已替换为最终值，未保留旧摘要作最终锁定值。

Root 报告实际 default 启动成功、flat10 owned records 已验证、四 Java UP/frontend200/Worker ready；这些是 Root 的运行证据，本席没有复跑脚本、网络 probe、服务、认证或业务动作。A 的 D-I2 独立复核为 Closed 且 Approved，最新外审报告 SHA 已更新在上表。本段是 D-I2 的窄补记；后续 lan-preview.mjs 最终变化见 D-I3。

## 最终运行时路径补记：D-I3 闭单

2026-10-01 再做最后窄范围源核对。B 文档审查发现旧 LAN 代理按 8..128 字符公开 code 放行，但 Java owner preview 固定使用七字符 `preview`，管理员正确预览资源因此被拒。这是具体集成缺口，不能用已有静态批准或默认 localhost 健康代替关闭；Root 修复后由 A 独立闭单。

本席读取 lan-preview.mjs:26–27 的最终规则，允许字面 `preview` 或原 8..128 字符 code，必须后接 `/sessions/[A-Za-z0-9_-]{43}/assets/`，仍仅 GET/HEAD。Java preview() 先 requireOwned 再创建记录；token() 是 32 bytes base64url without padding 的 43 字符 key。资源读取通过 sessions.get(code,key) 核记录 code 和 expiresAt，随后只解析冻结 manifest 中的 resource，并继续拒 private IFC 路径/种类；接受 `preview` 不绕过 owner 建会话或读取鉴权。hostSession 从 manifest.resourceBaseUrl 和 runtimeOrigin 组成 iframe URL，原 preview/public 两条 URL 都符合新规则。manifest/renew 仍走 publicHttp 的前端 API 路径，并非新增 runtime 代理开放项。

既有 Host 精确匹配、HTTP 方法/路径限制、header 剥离、Worker 自带服务 secret、Java模板 secret/CSP 和独立 origin 边界保留；没有为 preview 加 cookie/token 旁路或放行私有转换。HEAD 仍可能被既有只服务 GET 的 Worker 返回 404，此已在 A 外审明示；不影响现有浏览器 GET 资源路径，也未因此扩大入口。

最终 lan-preview.mjs SHA 和 A review-d.md SHA 已独立计算并替换上表；start-local.ps1 最终 A14E9...AEF8 不变。A 的 D-I3 Closed / specification+quality Approved，以及 B review-manual.md 的文档 Approved / 引用产品闭单均已读取。最终 cross-integration Approved 保持，无未关闭问题。未执行 regex、代理、HTTP、手机连接、模板业务或任何模型/功能测试，也未修改产品源或提交。

## 封存补记：B 准备脚本 EOF / UTF8 归一化

Root 最终 staging whitespace check 发现模板准备脚本结尾空白，使用 ReadAllText 后 TrimEnd()+单个 CRLF、UTF8Encoding(false) 写回。这是 EOF / 编码归一化，不能误写为只删除单个原始 LF 字节。A 的 review-b.md 最后“Final EOF cleanup — Approved”已独立对当前全脚本文本做 line-ending normalization / EOF TrimEnd 后，核其等于冻结 package 加此前批准的 favicon-copy patch 与 private patch-label 替换；没有逻辑或其它源行变化，其他三份 B 源保持已批准摘要。

本席仅读取这段 A 证据，并独立计算最终 review-b.md 与 prepare-readiness-templates.mjs 摘要，上表已更新为最终值。已交付 ZIP / 模板原件不受该清理影响；没有重新模板编译、产品审核、模型/业务测试或 QA。最终 cross-integration Approved 保持。Root 报告平台 36 文件已提交 19ccecf0；这是 Root 的封存状态，本席未执行提交。

## 未执行与用户手测边界

本席只读源码/既有审核文档/现有公开材料 bytes，计算文件摘要并写 SDK scratch 报告。没有自动 tests、功能/引擎执行、模型解析转换、浏览器/手机 QA、认证、网络/API/DB请求、服务操作、安装、Git提交或用户数据动作；没有读取私有凭据。505/原11保留由 Root 既定只读证据覆盖，本报告没有单独宣称已查数据库。

用户手测仍应检查：真实来源/尺寸与坐标、partial/CAD边界、IFC私有属性、建筑应用后导航和锚点；实际模板登记/授权/握手/翻页/抢答与访客隔离；同设备有效采样窗口的桌面/手机 profile/scale 与分区比较；HTTPS证书信任及真实手机连接。现有生成样例和编译包均标 manual-required，不作为真实505建筑或自动功能验收结果。
