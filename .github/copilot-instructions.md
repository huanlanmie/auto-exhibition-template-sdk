在这个项目中修改 SDK 代码时，必须同步更新根目录的 README.md。

README.md 必须始终写成当前状态下的完整说明文档，按第一次编写的方式表达，不要写“相较于上一次新增了什么”“这次修改了什么”之类的变更说明。

README.md 需要优先覆盖以下内容：

1. SDK 的用途和当前能力。
2. `configJson` 的结构约定。
3. `valueMap` 的角色和使用边界。
4. 组件列表和接入方式。

补充约定：

1. `configJson` 必须按 `mju-smart-show` 中 `TemplateAnalysis` 的真实语义书写，始终作为完整配置对象描述。
2. 字段 `value` 不是必填；字段有 `value` 时表示默认值。
3. 模板作者维护的数组字段示例优先使用 `itemSchema`，不要默认要求手写 `itemTemplateSchema`。
4. `valueMap` 是构建后的产物，不是模板作者在开发阶段手工维护的源文件。
5. SDK 项目的核心代码需要保留充分注释，尤其是运行时、数据源切换、路径解析、configJson/valueMap 转换、Provider 和公共组件逻辑，注释要解释设计意图和边界，方便后续开发维护。
6. 每次修改完 SDK 后，都必须重新更新 `template-project` 对 `template-sdk` 的本地依赖，确保模板项目实际使用的是最新的 SDK 内容。