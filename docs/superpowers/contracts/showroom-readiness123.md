# 展厅 1/2/3 验证准备与完善契约

2026-10-01，用户选择剩余事项1（真实CAD/BIM导入）、2（真实模板业务链）、3（电脑/手机性能），要求完成后运行项目，由用户验证。基线平台e17dacaf8c7e054d289d3149db5dbb89f55247ce、SDKb049ba0bdd892a559cafc1d1fdc3a5431a83d725。此轮是现有批准方案的针对性完善，不加入正式互联网部署或新原生/动画provider。

用户保留手动功能验证；不写/运行自动功能测试、浏览器业务QA、模型样本解析转换或引擎/简化器初始化。允许构建、独立静态复核、纯输入创作/复制、模板构建打包、进程健康与数据保留读取。真实模型尺寸/外观、模板实际交互及终端FPS仍需用户验证，不能以样例/构建冒称已经验收。缺少真实IFC/DWG与已知尺寸时明确记录，不将其它来源的小模型当505建筑。

## 全局保留

原项目checkouts与新codex/showroom-readiness123分支，保留505 ONLINE/draft6/public2/原模型与digest、平台11原用户修改及SDK原有untracked。线下网关/客户端与Desktop/template真实模板只读；不写生产SQL/Nacos/对象存储/现场设备，不重新snapshot、自动发布或改505。所有项目现有依赖版本保持，不npm安装/升级。只重启确认exe+startTicks匹配的owned服务，已有私有数据与凭据保留，凭据不进入报告。Desktop/template无git且可能含用户修改，模板修复在独立忽略目录副本进行，不能通过node_modules junction写回原件。

## A 导入向导与有据的LOD缺口

- DXF预检blocks新增固定安全`insertLayers:[{name,count}]`，从既有解析后的`document.instances`按同name/effective layer聚合，bounded排序，不能凭定义存在就假称设备实例存在。DxfCalibration显示真实插入图层，块映射仅在至少一个实际对应图层选equipment时可生成；没有有效几何映射则中文提示且禁止提交。保持原builder语义、不猜图层角色。
- floor行使用`thicknessM`（0.01..5米）而非被builder忽略的heightM。wall保height/thickness，column/equipment保height；生成payload移除各role不消费的旧隐藏字段。
- OBJ/STL新增用户明确单位/额外scale确认；file/entry/format/unit/scale变化撤销确认，缺确认禁止submit，不猜文件名单位、不新增Worker/Java不识别的options键。原DXF/IFC/DWG确认门槛保留。
- ImportWizard以中文结构呈现来源、单位归一化、边界/真实统计、partial与资源/降级信息，仍可展开原报告；表达provider边界和实际最大文件预算，不宣称解码/视觉通过。
- `streamingLod.js`仅开放单一material、一个group（materialIndex0/start0/count完整有效index或position）的等价full-range组，既有完整drawRange条件保留；只在复制geometry上clearGroups，源high group/material/anchor不改。多组、多材质/partial/非法组继续保守skip；既有Float32储备与误差严格上限不放宽。

## B 真实模板链完善与隔离构建材料

- Java VirtualInteractionService.validate对每个quiz screen只允许一个room，固定QUIZ_SCREEN_MULTIPLE_ROOMS错误；UI禁选已在其它room的屏幕并解释。新存储/发布/预览校验复用此约束，不静默为旧冲突图选一个room，不修改物理联动表。
- quizAdapter仅在已有master授权、resetQuestion且清空roundParticipants的返回首页分支将权威members分数清0；普通重置题目保分，不信任输入members/score。
- 真实候选Tbutton/Ebook/quiz-buzzer来源Desktop/template。当前旧bundle仅legacy-bridge；隔离副本用本次已构建SDK产物构建native候选，原件不改。Ebook仅远程prevPage/nextPage包装先明确完成welcome再翻页；本地欢迎动画/手动翻页保留，不由host猜DOM。
- 新准备脚本复制源码/资源（排除node_modules/dist/tests/.git/zip和危险symlink）到`.codex-run/readiness123`下新run目录；使用已有依赖，SDK alias必须精确与可追溯；不写原node_modules、不安装、不发布。输出三ZIP与size/SHA/source/code/version/profile/manual-required清单到独立忽略目录；zip固定路径、无源私钥/凭据，目录预算遵守模板既有安全展开限制。
- 构建只证明编译/静态包结构，source SDK与bundle原生bootstrap衔接由静态独审，实际注册/握手/控制由用户验证。重建候选不能自动替换数据库实例或已发布版本；用户导入/授权/绑定后手测。

## C 电脑/手机性能与测量准备

- 场景生命周期新增`runtime.setActive(boolean)`，与页面visibility共同控制RAF和streaming排队；inactive暂停，不把暂停时间计入FPS/P95，恢复重置计时窗口并重排分区。已有loaded对象/身份保留，不取消其它画布lease；暂停时仅取消本画布未完成高精请求，迟到结果释放。
- `SceneCanvas`新增`active`默认true，watch至runtime；Root编辑器在导入/复核/模板弹层/遮挡时置false，复核两个可见画布正常工作。viewer模板操作时是否暂停按明确界面遮挡接点，不猜浏览器状态。
- `runtime.setPerformanceProfile('auto'|'desktop'|'mobile')`，auto依已有pointer检测；effective desktop DPR上限2、mobile上限1.5。`setRenderScale(1|0.75|0.5)`以profile基准调像素，不缩放场景/锚点。切profile同时更新分区30/45米64MiB或18/28米24MiB策略，queue2与总量限制保持，按新budget卸载/排队。
- metrics报告requested/effective profile、renderScale、active/hidden和实际pixelRatio；面板可手调/导出，恢复后样本窗口重新累积。无假FPS/显存/自动“验收通过”。移动端实际设备记录留给用户。
- Viewer不创建disabled展项或请求其预览；editor可见disabled对象仍可编辑。以objectId维护展项节点，只在type/name/preview等视觉签名变化时重建；单纯transform/其它业务字段保留贴图/节点并更新可见性/变换。旧异步preview属于节点的cancelLoad生命周期，不重用到已替换对象。

## Root 交付入口与运行

列表增加“验证材料”入口，展示三步操作、可下载的纯生成输入和真实模板构建候选清单及各自来源/限制，不把清单显示成已测试结果。模型准备脚本只复制已有generated samples（DXF/IFC/STL/大场景GLB）与实际hash到前端public固定只读材料目录；不暴露任意磁盘路径/读取API、不解析模型。模板ZIP仅作为下载材料，不在管理origin提供可执行解压HTML；不修改现有授权模板列表。

提供可选局域网HTTPS手测启动方式：默认回环保持；LAN参数只接受本机已绑定RFC1918 IPv4。前端TLS9443→回环5173，runtime TLS9444只GET/HEAD固定public前缀→回环9319，不暴露private convert/API，strip runtime cookie/auth/service header，拒redirect；精确前端origin与独立Worker runtime origin一起配置，Java/DB仍回环，不开任意CORS/公网或写防火墙。证书仅内存生成并导出私有PFX/公共CER，不安装系统trust，用户设备信任与连通性手测。HTTPS用于既有SubtleCrypto/randomUUID所需secure context，不能省略摘要或Math.random降级身份。LAN两个port使用同一IP，而cookie不按port隔离，因此LAN后台token/expiry只在9443的origin-tab sessionStorage，忽略共享cookie且不记录/读取remember密码；默认localhost cookie流程保留。无真实手机连接证据时仅称准备好手测入口。

窄接口补充：InteractionEditor.localOnly默认false，未保存主草稿打开联动不强制先保存冲突图；localOnly提交emit local-saved graph，由Root execute应用本地并保留其它修改，之后用户whole-draft CAS保存。clean方式保原server graph CAS。移除冲突quiz成员时仅清对应无效quiz targets与已移除master，保留其他targets。

最后SDK/模板/UI/Worker/Java覆盖构建、任务交叉与最终静态审、owned启动/health、505/原文件hash回读、精确本地提交与手测说明。实际设备/图纸验证由用户执行；未提供的真实BIM证据保持待验收，不因任务收尾虚构完成。
