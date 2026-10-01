# Task B：真实模板业务链完善与隔离构建

2026-10-01。基线平台e17dacaf / SDKb049ba0，权威 showroom-readiness123.md + task-b-brief.md。作者完成，待独立复核；不自评Approved。

## 所有权与实现

仅修改平台以下4文件，现返还Root：

1. `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualInteractionService.java`：新增纯冻结图 requireUniqueQuizMembership，固定错误 `QUIZ_SCREEN_MULTIPLE_ROOMS: screen / previousRoom / room`。validate/validateDraft（保存、绑定、发布链）与 screenFunctions（新预览/公开资源会话）复用。catalog只返回冲突diagnostic，不让管理员因旧冲突图无法进入修复。缺失graph旧场景为空集，无当前源查询加到匿名读取。范围内已有owner/freshness/CAS/白名单不放宽。
2. `ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/InteractionEditor.vue`：其它房间成员禁选；已选冲突项保持可取消并展示房间名称/冲突提示。移除成员同步移除该房间来自已移除屏的quiz targets、删除因此无target的规则，保留其他目标，清已移除master；保存前独立检查唯一成员。不会默默挑一个冲突房间。
3. `ruoyi-ui-vue3/src/virtual-showroom/template-host/quizAdapter.js`：仅既有master授权后的resetQuestion且roundParticipants为空的返回首页分支，将host权威members分数置0；普通题目reset保分。不信任输入members/score，不改协议。
4. 新 `scripts/virtual-showroom/prepare-readiness-templates.mjs`：固定三来源、安全副本、当前SDK准确alias、Ebook固定副本patch、Vite+vue-tsc、ZIP及SHA/来源证据。无安装、原目录junction、上传、发布或DB逻辑。

Root追加的窄接口已实现：InteractionEditor `localOnly:Boolean=false`；true时仍执行既有前端配置验证，再emit `local-saved` 的规范graph，不调用saveInteractions，不改serverVersion；按钮明确“应用到本地草稿”。Root负责editor将dirty本地修改与graph合并，随后普通whole-draft CAS保存。false保留原server CAS/saved行为。这解决dirty旧冲突修复时不能先保存非法图的问题，未增加后端绕过接口。

## 构建产物（最终）

绝对清单：
`C:/Users/Administrator/Desktop/mju-smart-show/.codex-run/readiness123/templates-2026-10-01T14-55-19-294Z-c2ae72c7/manifest.json`

三ZIP都在该清单同目录：

| id / zipFile | code / version | bytes | SHA-256 |
|---|---|---:|---|
| tbutton / tbutton-native.zip | three-button-template / 0.1.0 | 114442 | 82bab18a98fba88f98d3812ecd585049eb4aeb2abca62b34278e359d515d0e8f |
| ebook / ebook-native.zip | ebook-flipping / 1.0.0 | 127330 | 920b1d0afd74f1fa44d0e174f9ef848221fdb4b7e899f5f068dd08ddc89d7010 |
| quiz-buzzer / quiz-buzzer-native.zip | quiz-buzzer / 0.1.0 | 148675 | b2fc9f57f45e05c340e1d656cd6a41459f57cb4c04dea4d9d9d89e00aea22be2 |

schemaVersion1 / verification manual-required / templates固定id,name,code,version,compatibilityProfile native,zipFile,size,sha256,notes；privateEvidence含本机路径及源码链，仅留私有，不允许Root直接复制整个manifest公开。Root只能白名单取安全字段、验证zipFile在同一run目录内、复制ZIP为下载材料；不把解压HTML托管到管理origin。

代码版本刻意沿用真实模板meta版本，未擅自改原模板版本。每次准备有独立run目录及精确ZIP SHA，后续登记授权实例须产生独立固定实例版本，不覆盖旧出版。新原生候选不自动替换数据库绑定。

## Native模式证据链（非仅搜索token）

- 编译入口是当前SDK `index.js -> dist/sdk/index.js`，配置为 `config/index.js -> dist/config/index.js`，构建插件 `vite/index.js -> dist/vite/index.js`。Vite使用configFile:false/envFile:false，精确包名正则alias，不读取原模板vite.config，不通过原node_modules symlink解析旧SDK。
- Rollup generateBundle记录每个chunk实际modules；三模板均含当前SDK绝对 `dist/sdk/index.js` 和 `dist/chunks/artifacts-CLjkRtUU.js`。脚本要求实际bundle module包含该SDK主模块，否则失败；不是仅声明package版本，也不是仅搜索注入字符串。所有当前dist文件、三个包装入口及native关键源文件SHA在privateEvidence.sdkFiles，结束前复核一致，变化则SDK_CHANGED_DURING_BUILD，不交付manifest。
- 静态源链：SDK src/runtime/runtimeRegistry.ts:7–17优先读取且验证宿主注入，createTemplateRuntime.ts:7–15在browser模式选择BrowserHostTransport；该transport沿用exact origin/source/identity+MessagePort ACK/sdk_ready及host_visibility/软件target边界。三模板main/函数API最终使用该默认runtime。Java native bootstrap在HTML首个可执行脚本前注入配置；不需要旧WebSocket shim。实际握手/注册/业务仍manual-required。
- 原三套dist静态审计仍为legacy-bridge候选；本次新ZIP应选native，不能给新SDK同时配置legacy shim冒充两种验证。

## 隔离与预算

来源固定 `C:/Users/Administrator/Desktop/template/{Tbutton,Ebook,quiz-buzzer}`，原件只读。新copy位于上述run/templates/{tbutton,ebook,quiz-buzzer}；选src/public/index.html/env.d.ts，排除node_modules/dist/build/tests/git/ZIP/旧配置与生成目录。递归拒绝symlink/特殊文件，检查相对路径和私密文件名，源/ZIP最多4096文件、64MiB，ZIP store仅固定可交付扩展，排除map/source/env/脚本配置，保留必需index/config/valueMap。文本输出拒绝私钥标头；不从原根目录复制未知配置。源码内容本身为用户真实模板，本脚本不承诺发现任意语义秘密，公开材料应保持这三固定候选的范围。

程序化build仅用SDK已有依赖：Vite8.0.8、@vitejs/plugin-vue6.0.6、Vue3.5.32、TypeScript6.0.2、vue-tsc3.2.6，未安装或升级。alias同一Vue真实路径避免重复runtime，cacheDir/outDir/生成types与独立tsconfig只在copy。TS配置源仅在副本经现TypeScript转译再引用当前SDK config；模板应用本身没有执行。每个ZIP只有构建dist静态文件，分别5/5/6条，expanded113802/126690/147903bytes。

Ebook精确patch仅两处注册回调：`prevPage/nextPage` 先 `welcomeFlow.completeWelcome()` 再调用原goPrev/goNext。脚本要求每个原字符串唯一命中，不匹配即失败。没有改本地欢迎动画/点击goNext/goPrev或原模板文件，没有通用宿主DOM猜测。

原件摘要证据：最终run的 `original-hashes-before.json` 与 `original-hashes-after.json` 字节一致；Tbutton21、Ebook45、quiz23个文件（含原src/public/dist/ZIP/docs/生成声明，跳过node_modules/.git/临时缓存目录），privateEvidence.originalFilesUnchanged=true。没有向原node_modules写入的代码路径；依赖目录未做全量hash，不能把该来源文件摘要误称整机文件系统证明。

## 已执行检查与未执行事项

- 准备脚本 node --check exit0；quizAdapter.js node --check exit0。
- 三模板生产Vite build+每个vue-tsc --noEmit全部exit0；最后总命令exit0。完整日志 `SDK/.superpowers/sdd/2026-10-01-readiness123/task-b-template-build.log`；每个copy/typecheck.log为空（exit0）。第一轮私有tsconfig漏Vite CSS类型声明导致typecheck失败，已在脚本显式include现有vite/client.d.ts；随后重建全通过，失败run未交付manifest且原件hash一致。
- 3个既有源码文件 git diff --check exit0（仅LF/CRLF提示）。源码锁定hash见 `task-b-source-hashes.json`。
- Root负责整合后的Java编译/UI生产build，本席未并行运行，不能称其在本报告时已完成。独立review也由Root派非作者执行。
- 未运行应用模板/函数、测试、浏览器QA、模型解析/转换、引擎、API、对象存储上传、DB/设备发布、服务启动或Git提交。505与原11文件无动作。真正首次联动、抢答完整轮次/清分、native握手、重新绑定/重发版本、跨访客隔离留给用户手动验证。

## 最终源码SHA

- VirtualInteractionService.java：8E9705AAF43DC648A1806299DA5D55FE5E5101718034D4B8DD58C9B602769B30
- InteractionEditor.vue：D86D218AE5D7E712FDFFDA147B53453EC45B81D0EB3D8327645E453C77E7E0EC
- quizAdapter.js：32EF382C906D2DF0B5C3FD58554A0E7631FA1F28113C765AA23EE2C9574CAA28
- prepare-readiness-templates.mjs：A890E16622B1FC520FE0B3E91B2BC888E5AF7E4C16C159431E95CB94A4046205

## B-M1 独立复核反馈窄修（最终产物替代前文路径）

独立A审查发现Ebook原index.html含不存在的绝对 `/vite.svg` favicon。经Root授权，仅准备脚本patchEbook在私有copy/index.html中检查 `<link rel="icon" type="image/svg+xml" href="/vite.svg" />` 恰好一次并移除；不匹配固定EBOOK_FAVICON_PATCH_CONTEXT_MISMATCH失败。原件不变，其它业务源不变。privateEvidence.patch同步标明favicon与先前welcome包装。

脚本最终SHA：`A5907617A2C0F0C9D6B603215E9C58D2494CF469D242F2444E7494D6E5CA2338`，已更新 task-b-source-hashes.json；其它三源码hash不变。

最终交付manifest：`C:/Users/Administrator/Desktop/mju-smart-show/.codex-run/readiness123/templates-2026-10-01T15-08-20-335Z-238217d3/manifest.json`。此run替代前文旧run，三ZIP路径仍相对清单目录。

- tbutton-native.zip：114442 bytes，SHA `82bab18a98fba88f98d3812ecd585049eb4aeb2abca62b34278e359d515d0e8f`（未变）
- ebook-native.zip：127273 bytes，SHA `98972cd6a4331897d952660bffdaa6ad2be9532fbb94296fcda8ccdf7b028cb1`（仅HTML无效favicon移除）
- quiz-buzzer-native.zip：148675 bytes，SHA `b2fc9f57f45e05c340e1d656cd6a41459f57cb4c04dea4d9d9d89e00aea22be2`（未变）

node --check与三模板Vite/vue-tsc全量重建exit0；日志 task-b-template-build-final.log。静读最终Ebook dist/index.html已无该link，业务JS/CSS文件名未变；再次source原件89文件before/after完全相等，SDK结束前hash一致门槛通过。没有模板运行/功能测试/浏览器/上传/DB。源码所有权已返Root，B-M1关闭由A独立差量复核确认，不由作者自批。
