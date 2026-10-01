# 最终用户手测文档静态复核

2026-10-01。范围：平台 docs/virtual-showroom/readiness123-manual.md、docs/virtual-showroom/stage11-startup.md；只读对应启动/代理接口、既有startup-readiness.json及startup-lan/local.log、A/B/C/D审核记录。未操作服务、浏览器、DB、测试、模型或产品源码。

## 文档裁定

**两份最终文档 Approved，无未关闭文案 Critical/Important/Minor。** 已发现的历史描述矛盾由Root修改后独立复读：stage11将格式限制明确为“第一阶段当时”，当前能力指向readiness说明；默认回环与可选开发HTTPS分别说明，正式互联网部署仍未承诺。readiness明确每次必须显式-Action，脚本缺省all含snapshot，不可裸运行或把all当现有环境普通启动。

静读发现的实际LAN管理员预览路径缺口另记为产品D-I3，见下；产品修复关闭以A的独立D复核为准，本报告不代签。此限制不影响当前默认localhost已经回读的就绪事实，但未闭单前不得称LAN管理员预览路径静态完整。

## 已核一致项

- 默认管理入口 http://localhost:5173/showroom/virtualShowroom/index；当前交付startup-readiness.json记录startupMode localhost、frontendHTTP200、Java19200/19201/9402/19088 UP、Worker ready，activeJobs0。已有日志记录先起LAN9443/9444再回本机默认。文档只称本机HTTPS frontend200/TLS端口准备，不称手机连通/信任或真实FPS通过。以上为Root已保存证据，本席未重新请求/启动。
- 所有示例使用显式dependencies/services/status，LAN为services -LanPreviewAddress已分配RFC1918地址，恢复为不带LAN的services。符合脚本固定参数、loopback underlying、owned exe/startTicks及导入任务门槛。没有建议snapshot或all升级既有505数据。
- HTTPS9443前端、9444仅public资源；证书CER公开、PFX/口令私有，设备手动信任，脚本不安装trust root/防火墙。IP变化须使用当前本机地址，192.168.1.9明确为本次示例。认证sessionStorage限制于HTTPS9443当前origin/tab，默认localhost cookie行为保持；不把其它端口或Worker私有转换端点说成公网入口。
- 三新ZIP只作为下载材料，未自动登记授权/对象存储发布/替换505；管理员须另建验证数据、授权实例并绑定native。旧bundle legacy与本次新SDK native区别、source meta version沿用而实际SHA不同均写清。Ebook远程welcome修复、quiz唯一membership/权威清分、dirty本地图修复与之后整体CAS保存符合A/B/C已审源，不把相同模板版本号当相同bytes。
- 四模型材料标记生成输入、没有真实IFC/DWG/已知尺寸则待提供，非505真实建筑。DXF示例实际WALL/FLOOR/EQUIPMENT及STL1000×800×100mm依据生成脚本静读吻合；未解析模型。LOD/partial、单位确认和角色字段提示与A源一致。
- 性能页DPR2/1.5、像素scale1/.75/.5、high编码64/24MiB/queue2以及后台/遮挡窗口重置对应C。主画布overlay和复核可见canvas由RootD接点处理；文档没有用桌面mobile档替代真手机，没有GPU容量或FPS达标伪称。
- 最后已检查范围明确build/static/ownedhealth与用户业务验收分别列出；没有自动测试、模板函数/模型转换、手机性能的成功记录。

## 发现并交由Root处理的D-I3

原 scripts/virtual-showroom/lan-preview.mjs:26 只接受8..128位publicCode；Java VirtualResourceSessionService.preview:22固定code='preview'（7位），resourceBase:35生成 `/showroom/virtual/public/preview/sessions/<key>/assets/`。因此LAN9444拒绝管理员模板预览HTML/资源，文档描述的LAN预览业务链存在具体缺口。已及时通知Root，不通过改文案掩盖。

Root已报告窄修为字面preview或原8..128位code、固定43位session key和/assets/前缀，GET/HEAD及后端会话校验保留；该修复交A独立review-d.md追加审阅。本席文档批准不替代A的产品差量结论，不执行HTTP或模板预览验证。最终汇总需引用D-I3 Closed记录。

## 锁定文档SHA-256

- C:/Users/Administrator/Desktop/mju-smart-show/docs/virtual-showroom/readiness123-manual.md：FA7AB86C9095CB29A6DD5AC90CDE101310A6BDEF0B9D1DF2610D9BE53D662347
- C:/Users/Administrator/Desktop/mju-smart-show/docs/virtual-showroom/stage11-startup.md：96F83C085534DC165846CDCF51F71D1F3C721064062B74AFEA98CAB32248AEC9

这是readiness用户说明的静态一致性审阅，不是手机/真实模型/模板完整业务/性能验收。505和原用户文件无修改。


## D-I3审核链闭单

已读取A席review-d.md最后D-I3独立复核：Spec/Quality Approved，无未关闭C/I/Minor。其记录lan-preview.mjs最终SHA `B71784AAB13D6867960030769005ED430052C1E0F12C6E01D8011A9A4FB7E5A2`，核对固定preview/公开code+43key/assets、Java owner/code/期限/资源清单以及Worker私有资源排除链。本报告对该产品修复引用A的独立结论；前述D-I3待闭单条件已解除，两文档最终Approved不变。没有因此新增HTTP/手机/功能验收成功声明。
