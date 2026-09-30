# Stage 11 前端实现交付

权威：docs/superpowers/contracts/virtual-showroom-v1.1.md、docs/superpowers/plans/2026-09-30-virtual-showroom-stage11.md，Task 3。
源码所有权已交回 root；本报告和 frontend-build.log 是本代理最后写入的交付证据。不再修改源码。

## 修改范围

平台根目录 C:/Users/Administrator/Desktop/mju-smart-show/ruoyi-ui-vue3/src 下：

- virtual-showroom/template-host/hostSession.js、TemplateRuntimeHost.vue
- 新增 virtual-showroom/template-host/runtimeRegistry.js、roomRouter.js、roomRuntime.js、quizAdapter.js
- virtual-showroom/viewer/ShowroomViewer.vue
- virtual-showroom/scene-core/schema.js（图默认值）
- api/showroom/virtualShowroom.js（两个图 REST）
- views/showroom/virtualShowroom/editor.vue
- 新增 views/showroom/virtualShowroom/components/InteractionEditor.vue

未改 Vite、.env、package、Worker、后端、SDK、现场模板或 Electron 项目；未安装、启动服务、进行业务请求、转换模型、运行功能测试或浏览器 QA；未暂存、提交。

## 已实现

访客房间持有固定 manifest/graph/catalog 副本。logical clientId 为 v:<visitorSessionId>:<screenId>，每个 iframe 单独产生 runtimeId、window ACK 和认证 MessagePort。不存在全局 activeSession。接收窗口的 origin/source/window/三段身份与端口消息三段身份都逐实例验证；SDK ready 使用 logical clientId。

运行实例按调用目标懒启动，最多 8 个且受 manifest cap 限制。单个保持原比例的放大窗口显示一帧，隐藏帧保留状态和端口；关闭窗口不销毁，离开、重新载入、资源到期、管理端接受新草稿版本时全部 dispose。挂载容器必须 connected 且保持存在，iframe 不在 DOM 之间搬移。host_visibility 通过认证端口请求暂停隐藏媒体；native SDK 和 legacy bootstrap 的处理由各自代理实现，恢复显示不自动播放。

入站调用必须同时出现在固定函数清单与真实 register_functions 注册表中。binding 只采用固定启用规则；unicast 只认当前访客 logical IDs；multicast 精确二选一显式 IDs/固定 group；broadcast 只在当前房间。未知字段、数组/非法 mode 和真实设备地址均拒绝。from 由宿主覆盖；每个投递独立 child messageId，等待项先安装再发送，结果只有对应接收记录能够完成。fan-out 返回首个成功 transport result，全部失败保留错误原因。

函数 TTL 从执行上下文继承；有并行入站时取所有待执行上下文的最小剩余 TTL。追踪缓存最多 1024 项/60秒；请求上限 128、子调用 256，函数执行等待 30秒，注册等待 5秒，握手 15秒。每屏 64条函数/事件每秒的总量限制覆盖改变 payload/新 ID 的循环，事件另有同形突发 8条每秒及独立 child ID/trace/递减 TTL。Storage 保持 visitor/screen/runtime 三段隔离。

抢答房间仅使用声明 quiz-buzzer 成员、声明主控或首位加入者主控。名单、轮次、计分、赢家、截止时间由此访客的宿主管理，不复制模板提供的成员/赢家/分数。题库/选项/分数有界；成员资格、主控控制、题目、选项、唯一赢家、获胜者/单机答题权限、过期加入和抢答截止均检查。回调包括 syncQuizState/memberJoined/quizRoundInvite/buzzResult/answerResult/resetQuestion；quizRoundReady 仅在固定清单与真实注册支持时投递，实际旧模板通过 syncQuizState 接收开局状态。定时器在房间退出清理。

管理端提供规则、虚拟组、抢答房间和内容版本四页；读取 owner catalog 与可映射来源规则/诊断，用 PUT interactions + expectedDraftVersion 保存并接受普通 detail。抢答房间可生成每位成员的有效输出操作规则。实例选择标签增加设备/主题；版本区区分 source/draft/public，现场实装显示未知。删除/禁用屏幕时裁剪其图引用，并随普通撤销/重做恢复。草稿预览与公开参观使用同一个 room runtime。

## 与实际模板对齐的必要裁定

1. 真实 quiz-buzzer 的 sendBinding 在任何 transport rejection 时会进入本地预览降级，自行生成赢家/作答。因此已认证成员的正常业务拒绝返回 function_result {ok:false,code,message,state} 并同步权威状态；身份/协议伪造仍返回 function_error。避免正常输家被显示为本地赢家或重复计分。
2. 实际模板仅在自己的 clock 观察 answering→timeout 时安排自动下一题。宿主已实施截止后，仅向主控保留一次“answering + 已过期 timestamp”的过渡，其他成员接收权威 timeout。主控真实 timeout ACK 必须匹配 room/round/master/index；ACK 不执行函数路由、不复制模板 state。保留模板自己的 autoNext/resultHold 配置。
3. 实际 syncQuizState 元数据是 in，但 memberJoined handler 会外发该函数。只在已认证的宿主 quiz memberJoined 回调仍在执行时，将该主控的同步包消费为 ACK；绝不扩大 out 白名单、不执行联动或接受输入分数/赢家。
4. 实际模板未注册 quizRoundReady；不投递未注册函数，以已注册 syncQuizState 完成权威开局同步。

## 精确接口

- createHostSession({iframe,manifest,screen,virtualClientId,onMessage,onState,onError}) → {identity,send,dispose,updateValueMap}
- createVirtualRoomRuntime({manifest,resolveAsset,mountTarget,onError,maxRuntimes?}) → {openScreen(screenId),closeScreen(),dispose(),getScreenStatus(screenId),onState(handler)}
- mountTarget(screen,record) → 已 connected 的 HTMLElement；onState 返回取消订阅函数。
- getScreenStatus → {status,error,virtualClientId?}；onState snapshot → {activeScreenId,activeCount,maxRuntimes,screens:[{screenId,status,error,virtualClientId}]}
- manifest.screenFunctions[id] → {templateCode,functions:[{name,direction,label?,params?}]}，inout/both 都识别。
- manifest.runtimeCapabilities → {virtualRouting:true,maxRuntimes:8}
- control port payload → {type:'host_visibility',visible:boolean}
- API getInteractionCatalog(id)；saveInteractions(id,expectedDraftVersion,interactionGraph)。
- InteractionEditor props {showroomId,expectedDraftVersion,sceneDocument}；saved(detail)/error(cause)/close。
- TemplateRuntimeHost 的 screen 可为 null，组件仍挂载；expose {dispose,getRoomRuntime}。

## 构建与复核

最终构建日志：C:/Users/Administrator/Desktop/auto-exhibition-template-sdk/.superpowers/sdd/2026-09-30-virtual-showroom-stage11/frontend-build.log。
执行 E:/development/nvm/nodejs/npm.cmd run build:prod；仅构建，不做功能自动验收。
后台代理已对实际 Tbutton/Ebook/quiz-buzzer、函数交集、fan-out、CAS、预览生命周期和上述边界独立静态复核；最终 verdict 由 frontend-review.md 记录。

## 用户手测建议

- 两个屏幕分别绑定 Tbutton 和 Ebook，添加按钮输出→翻页输入规则；发布后打开按钮屏幕操作，再打开书页确认状态保留。
- 关闭再打开同屏，确认状态仍在；离开/重新进入展厅后确认状态重置。
- 创建包含两个 quiz-buzzer 屏幕的房间，生成操作规则；同一访客切换屏幕加入本轮、争抢、提交答案，检查只有一位赢家和一次计分。
- 无人抢答时等待超时，检查主控自动下一题；改变模板 autoNext/resultHold 配置后重新绑定/发布手测。
- 两个独立标签页进入同一公开展厅，确认逻辑 ID、页面状态、抢答结果互不共享。
- 更新来源后查看 source/draft/public 对照；重新绑定并保存后再发布，不自动替换现有访客版本。

最终构建结果：退出码 0；2181 modules transformed；built in 14.57s。构建证据在 frontend-build.log；无功能测试或浏览器验收结论。
