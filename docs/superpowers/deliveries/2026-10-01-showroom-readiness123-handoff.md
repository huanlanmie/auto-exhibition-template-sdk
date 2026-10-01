# 图纸、模板与性能完善交付

2026-10-01。完成用户选定1/2/3的代码完善、验证材料和本机运行准备，实际业务和终端效果由用户手动验证。继续使用原平台、SDK与访客隔离协议，无新表或依赖升级。

- 图纸导入：DXF设备块按实际插入图层确认，地板厚度与角色字段正确传递；OBJ/STL明确确认单位及缩放，换参数会撤销确认。转换报告提供中文摘要和原JSON，单材质完整分组可进入既有受控LOD。
- 真实模板：准备Tbutton、Ebook、quiz-buzzer独立副本，用当前SDK编译为ZIP。新Ebook远程翻页先退出欢迎页；抢答每屏限一个房间，主持返回首页清分。软件联动支持本地未保存草稿修复，不强制保存冲突图。新包需要用户在模板管理登记授权实例并绑定，不自动替换旧实例或已发布505。
- 性能：画布被遮挡、页面后台或contextlost时暂停自己的渲染和未完成高精请求；恢复重新累计帧窗口。档位调整实际DPR/分区预算，100%/75%/50%调整像素；展项按视觉变化更新节点，访客禁用展项不请求。实际电脑/手机FPS需要用户记录。

后台列表新增“验证材料与操作”，提供4个生成模型输入、3份重建模板ZIP与三个手测流程。真实IFC/DWG及已知尺寸尚未提供，生成输入不代表真实505建筑或实际兼容性验收。

## 打开验证

[管理后台](http://localhost:5173/showroom/virtualShowroom/index) → 刷新并登录 → “验证材料与操作”。建议另建验证展厅。原[505参观链接](http://localhost:5173/v/c7e9aef4aca6489483ce83509701bb99)保留原发布版。

完整步骤、模板登记、性能比较与可选HTTPS手机入口见平台[手动验证说明](C:/Users/Administrator/Desktop/mju-smart-show/docs/virtual-showroom/readiness123-manual.md)。当前保持localhost。切换局域网需显式services/LanPreviewAddress、同网络和人工信任开发证书；脚本不设置系统信任或防火墙。不要省略-Action，缺省all会含snapshot。

## 已完成检查

SDK构建、三模板Vite/vue-tsc构建、平台Vue生产构建、Worker语法/固定依赖/Windows launcher CompileOnly、Java release17且跳过tests的打包均成功。UI2202modules/15.01s、Java7.894s；现有Maven插件验证警告保留在日志。

独立任务/集成静态复核通过。Windows PowerShell5进程记录序列化已修为平面标量数组，失效记录拒绝操作；仅匹配exe/startTicks的自有服务可停止或重配。LAN探测使用实际绑定地址，模板草稿固定preview资源路径得到明确支持；运行源仍限制会话资产GET/HEAD及后端授权，私有转换服务保留回环。

四Java健康UP、前端HTTP200、Workerready/activeJobs0。已做本机HTTPS前端就绪GET并恢复localhost；真实手机证书信任与连通未验证。启动仅dependencies/services，不prepare/snapshot/all，不写生产配置、线下设备或发布数据。

505只读前后完全一致：ONLINE/draft6/publishedRevision2，model f9b1dc78-90c9-4565-8b92-d425818244a1；draft/resources digest b1f0ef97f988fa6bb9fc6adaa8a5fb110422934ad979bdf6accfdf01a946b682。11原用户文件、89原模板文件及31SDK构建输入hash一致；原用户修改留在工作树，未纳入提交。

没有执行自动功能测试、浏览器业务QA、模型解析转换、引擎/简化器初始化、实际模板握手/函数或FPS采样。这些仍按手测说明由用户验收。

## 证据与版本

契约和计划分别位于../contracts/showroom-readiness123.md、../plans/2026-10-01-showroom-readiness123.md。最终36个产品文件hash、任务报告、独立审核、构建/启动日志及保留证据位于相邻2026-10-01-showroom-readiness123-evidence，仅归档明确清单，不含私有配置、证书/口令或SQL快照。SDK没有产品源码改动，只记录本轮交付文档。

平台精确36文件本地提交19ccecf0ea07fdca11ed17286881355fd2f36f0e；原11用户修改留在工作树，未push。SDK交付文档另行本地提交。
