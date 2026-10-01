# Readiness 2：真实模板与完整业务链只读审计

日期 2026-10-01。平台 HEAD `e17dacaf8c7e054d289d3149db5dbb89f55247ce`；SDK HEAD `b049ba0bdd892a559cafc1d1fdc3a5431a83d725`（已读取确认）。范围：真实本地模板源码/已构建静态文件、平台模板选择/快照/预览/发布/访客host/软件路由与SDK，以及线下项目相关兼容语义只读。

没有源码编辑、安装、构建、模型解析、模板执行、自动功能测试、浏览器QA、API调用、数据库查询/写入、服务启动、凭据读取输出或Git提交。505与11个原用户文件未改。以下是静态可定位结论，不宣称手动兼容性已证明。

## 可落地真实模板候选

| 模板 | 真实源码与配置 | 可用静态产物候选 | 实际函数 |
|---|---|---|---|
| Tbutton | `C:/Users/Administrator/Desktop/template/Tbutton/src/App.vue`、`src/template.config.ts` | 同根 `dist/index.html`、`dist/config.json`、`dist/assets/auto-exhibition-template-sdk/valueMap.json`；`C:/Users/Administrator/Desktop/template/Tbutton.zip` | code `three-button-template`，version0.1.0；startShow/switchScene/resetShow 均 inout；按钮实际发binding，另发button:clicked事件 |
| Ebook | `C:/Users/Administrator/Desktop/template/Ebook/src/App.vue`、`src/config.ts` | 同根dist三项；`C:/Users/Administrator/Desktop/template/Ebook/Ebook.zip` 或上层 `template/Ebook.zip` | code `ebook-flipping`，version1.0.0；prevPage/nextPage 均in；真实翻页、欢迎页、页面数据 |
| quiz-buzzer | `C:/Users/Administrator/Desktop/template/quiz-buzzer/src/App.vue`、`src/template.config.ts` | 同根dist三项及 `quiz-buzzer.zip`；`dist/assets/questions/default.txt` 实际存在，378bytes | code `quiz-buzzer`，version0.1.0；加入/轮次/抢答/作答/主控/回调共13项声明 |

三个 dist JS (`index-D_QeclZj.js`、`index-sMSW_rHR.js`、`index-N0FJlz_5.js`) 均静态检出5176旧WebSocket路径，未检出浏览器注入标记 `__AUTO_EXHIBITION_TEMPLATE_RUNTIME__`。**这些现成bundle应使用 legacy-bridge，不应凭package声明SDK0.2.0就选native。** ZIP路径仅确认存在，本席没有解压、发布或证明其内容与当前dist一致；真正纳入平台时应生成/登记明确版本与摘要。当前源码SDK已具native browser transport，可在隔离的模板副本升级后另交付native产物，但现有产物不自动获得该能力。

## 已确认问题及最小修复

### T2-I1 Important：同一quiz屏幕可以入多个房间，但真实模板只有一份房间状态

- 平台 `ruoyi-ui-vue3/src/views/showroom/virtualShowroom/components/InteractionEditor.vue:30` 每个房间的参与屏幕可选完整quizScreens，未限制已在其它房间的屏幕。
- Java `ruoyi-modules/mju-showroom/src/main/java/com/mju/showroom/service/virtual/VirtualInteractionService.java:124–129` 校验每个房间与master成员，却没有跨quizRooms成员唯一性；后续仅检查templateCode及全局最多8屏，重复成员不会违反这些条件。
- `VirtualTemplateRuntimeResourceService.java:29–33` 已表明运行配置只接受唯一membership，否则注入空roomId；`template-host/quizAdapter.js:196–205` onRuntimeReady遍历每个房间对该单一iframe发sync。真实 `template/quiz-buzzer/src/App.vue:125` 只有一个state.roomId，两个回调互相覆盖；随后binding路由房间与args.roomId不一致被adapter拒绝。
- **触发**：管理员添加两间quiz房间，都选同一quiz屏幕并生成操作规则；可通过保存/发布，然后单屏状态归属冲突。不是跨访客共享，而是一个访客内部多房间配置不可执行。
- **最小修复**：服务端validate graph新增每个quiz screen最多属于一quiz room的约束，固定错误 `QUIZ_SCREEN_MULTIPLE_ROOMS`，含screenId/冲突roomId；UI对已加入其它房间的成员禁选并给说明。对已有冲突配置在catalog/预览入口显示诊断，不静默选最后一个房间。无需把真实模板扩成多room状态库，不修改物理规则。

### T2-I2 Important（真实联动就绪）：Ebook远程翻页成功，但首次打开仍停留欢迎页

- 真实 `C:/Users/Administrator/Desktop/template/Ebook/src/App.vue:8,18` 用showWelcome隔开欢迎页与书本；:193–211 goNext/goPrev只改currentPage/isFlipping；:231–232远程prevPage/nextPage直接调用它们；只有本地欢迎页动画回调:255才completeWelcome。
- **触发**：Tbutton startShow/switchScene规则指向Ebook nextPage；host懒加载隐藏Ebook后路由调用成功，页码已变化。用户随后打开Ebook仍见欢迎页，不能看到已完成的联动页，点击欢迎后才显现甚至已跳过前页。当前函数没有“开始阅读”语义。
- **最小修复**：保留原模板只读，在准备交付的独立副本中给远程prevPage/nextPage一个明确包装：首次调用完成欢迎流程，再执行翻页；或新增声明+注册 `openBook` 并让Tbutton启动按钮绑定它，另一个按钮nextPage。前者最少改 `App.vue`；后者同步 `src/config.ts` functions 与构建config/valueMap。不要在通用host猜测Ebook DOM/内部状态。若不修改模板，只能在验收步骤要求先进入阅读，不能称首次启动联动已完整。

### T2-M1 Minor但建议同轮修：quiz“返回首页”的分数清零被权威回调撤销

- 真实 `quiz-buzzer/src/App.vue:428–455` buildHomeState明确将members.score归零、清roundParticipants，returnHome调用resetQuestion；:1115页面仍显示成员分数。
- 平台 `template-host/quizAdapter.js:177–182` 已区分resetQuestion且roundParticipants为空的“返回首页”，清轮次/participants但未清state.members分数；紧接notify将旧分数同步回来。只有下一次joinQuizRound新建轮次:135才清分，期间首页显示旧轮分数，与模板明确重置行为不一致。
- 线下原兼容语义仅作为证据：`automatic_exhibition_setup_platform/gateway/electron/main.js:1251–1265,1804` resetQuestion曾通过updateQuizSnapshot复制state.members分数。线上不应恢复任意模板输入分数信任。
- **最小修复**：只在已通过master权限校验、resetQuestion且已有“清空roundParticipants返回首页”分支中，将权威state.members全部score置0；不复制输入成员/分数，不改变普通重置当前题保分语义。单文件 `quizAdapter.js`。

## 已成立的架构接口（未发现需重写的具体问题）

- **授权与固定内容**：VirtualScreenBindingService.selectable按当前owner的DeviceThemeConfig枚举授权TemplateInstance；materialize核来源ZIP MD5、生成SHA并保存独立artifact资源。picker有device/theme标签。device-theme-instance绑定当前实例，direct-instance允许明确固定旧实例；这里没有直接把任意ZIP冒作已授权实例的入口。
- **更新/重新发布**：相同enabled interactive且contentBinding完全相等可在草稿分步保留stale；新绑定/重新启用须新鲜，发布严格检查所有enabled interactive。版本catalog分别source/draft/public，旧预览图绑定版本不符清除。新内容须重新绑定、验证和发布，已有public revision资源不被自动替换。
- **预览/公开host**：editor在同一草稿版本关闭弹层时保留preview room；变更版本重新创建。公开TemplateRuntimeHost按visitorSessionId key生命周期，close只隐藏，reload/leave/expiry销毁。比例框与隐藏媒体host_visibility已有实现。关闭后维持本访客状态，不代表跨浏览器/跨访客多人协同。
- **身份与路由**：hostSession核origin/source/三元identity，ACK后发稳定 `v:<visitor>:<screen>` clientId；每次frame runtimeId独立。静态config函数manifest与register_functions交集限制incoming；方向inout归一both。binding仅冻结图，硬件/未知selector拒绝；unicast/multicast/broadcast限定此room。fan-out独立childID、TTL/限流、待调用上限，离开清空；storage是三元identity内存域。
- **抢答权限**：当前adapter保持声明成员/master权限、winner唯一、deadline与合法答案、host权威分数；业务拒绝resolve `{ok:false}`并sync，避免旧模板把普通拒绝当离线fallback伪造赢家。异常模板/真实网络手测仍待用户执行，不据静态断言竞态全部实测通过。
- **发布/隔离**：public从frozen revision建资源会话；runtime资源受固定manifest及独立源代理控制。模板配置重映射逻辑clientId/声明唯一room，物理字段清除；CSP不允许连接现场WS/任意外源。publish有owner、validation digest、draft CAS；草稿修改不覆盖公开固定资源。未发现本轮新引入跨owner/跨visitor路由入口。

## Readiness交付还缺的具体材料

这三套本地文件存在，不等于当前隔离平台账号已经有可选TemplateInstance。此次未查询DB/API，不能把上一阶段“实例为空”的旧观察当成当前事实。选择链只接受已发布且owner授权实例，所以Root应先只读确认当前picker；若为空，在独立演示room/独立授权配置中准备真实模板实例及明确版本，不复用505，不改用户物理function_binding_rule。若走既有DeviceThemeConfig发布链，先检查其现场同步副作用，不能以“建虚拟内容”为由向线下设备发布。

建议最小手动交付：独立房间4屏（Tbutton、Ebook、quiz主控、quiz参与），Tbutton startShow→openBook或已修包装的nextPage，switchScene→nextPage，resetShow→prevPage（按钮文案应同步真实意义）；quiz两屏唯一room，生成现有合法out函数到quiz adapter规则。给出可见内容版本A/B、重新绑定后的草稿/发布版本差异及新访客链接；保留旧访客快照语义，不声称多访客共用抢答房间。需要一个真实新SDK副本native与原legacy分别可选时，应各留准确产物hash和profile，不用同一旧产物冒充两模式。

用户手动验证顺序：首次打开/按钮联动→关闭再打开保状态→两屏quiz加入/抢答/答题/自动下一题/结束/返回首页→更换实例并重新发布→新旧访客快照与独立访客隔离。这里只提出与上述真实模板有关的验证，不执行自动功能测试，也不把未执行步骤记录为通过。
