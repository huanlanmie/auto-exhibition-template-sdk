# auto-exhibition-template-sdk 内部实现说明

这份文档面向 SDK 维护者，说明内部边界、构建产物和关键模块。模板作者接入 SDK 时只需要阅读根目录 `README.md`。

## 数据边界

SDK 围绕两份数据工作：

1. `configJson`：模板作者维护的源配置，描述字段结构和默认值。
2. `valueMap`：SDK 根据 `configJson` 构建出的运行时值快照，模板页面实际读取的是它。

`valueMap` 是构建后的产物，不是模板作者在开发阶段手工维护的源文件。后台管理如果要动态修改内容，也应该修改运行时 `valueMap`，而不是改写模板作者的 `configJson`。

## 主要入口

1. `src/sdk/index.ts`：SDK 主入口，导出 Vue 插件、`useTemplateValue`、校验和构建 API。
2. `src/config/index.ts`：导出 `defineTemplateConfig`，用于保留模板配置字面量类型。
3. `src/vite/index.ts`：Vite 插件入口，负责校验配置、生成类型声明和 JSON 产物。
4. `src/runtime/schema/validation.ts`：统一 configJson 校验。
5. `src/runtime/value-map/normalize.ts`：把 configJson 字段树转换成运行时 valueMap。
6. `src/runtime/context/createTemplateContext.ts`：运行时加载 JSON 产物、监听后台预览消息、提供取值上下文。
7. `src/runtime/value-map/path.ts`：点路径和数组下标路径解析。

## 构建产物

Vite 插件会生成：

1. `config.json`：规范化后的模板配置。
2. `assets/auto-exhibition-template-sdk/valueMap.json`：运行时值快照。
3. `.auto-exhibition-template-sdk/auto-exhibition-template-sdk.generated.d.ts`：由当前 configJson 推导出的类型声明。

模板页面运行时通过相对路径读取：

1. `./config.json`
2. `./assets/auto-exhibition-template-sdk/valueMap.json`

相对路径不能改成站点绝对路径，否则模板部署在子路径或 file 协议下时会解析错误。

## 字段校验

字段能力清单集中在 `src/runtime/schema/schema-capabilities.json`。

当前字段类型：

1. `string`
2. `number`
3. `boolean`
4. `image`
5. `video`
6. `file`
7. `object`
8. `array`

校验原则：

1. 根字段必须有非空 `key`。
2. `object.value` 中的子字段必须有非空 `key`。
3. `array.value` 中的数组项模板可以省略 `key`，因为数组项按索引读取。
4. 同一层级带 `key` 的字段不能重复。
5. `image` 和 `video` 在 configJson 中只接受字符串路径。
6. `file.accept` 只接受内置类型或带 `.` 前缀的文件后缀。
7. `array.operations` 只支持 `add`、`delete`。

## valueMap 归一规则

`src/runtime/value-map/normalize.ts` 负责把字段声明转换成运行时值。

规则如下：

1. `string`、`number`、`boolean` 返回对应标量。
2. `image` 返回 `{ url }`。
3. `video` 返回 `{ url, poster }`。
4. `file` 返回字符串路径。
5. `object.value` 折叠成普通对象。
6. `array.value` 生成数组。
7. 匿名数组项直接归一为对应运行时值。
8. 带 `key` 的数组项会保留字段节点元信息，并把 `value` 归一成运行时值。

示例：

```json
{
	"key": "models",
	"type": "array",
	"value": [
		{
			"type": "object",
			"value": [
				{ "key": "name", "type": "string", "value": "Meteor Shower" },
				{ "key": "url", "type": "file", "value": "/assets/models/meteor_shower/scene.gltf" }
			]
		}
	]
}
```

会生成：

```json
{
	"models": [
		{
			"name": "Meteor Shower",
			"url": "./assets/models/meteor_shower/scene.gltf"
		}
	]
}
```

## 数组新增语义

SDK 只负责根据 configJson 生成初始 valueMap。后台管理的数组新增逻辑在 `mju-smart-show` 的 `TemplateAnalysis` 里实现。

约定保持一致：

1. 数组第一项只作为结构模板。
2. 后台新增项时不复制第一项内容。
3. 新增项的字段值按类型置空。
4. 空数组没有结构模板，后台不能新增。

## 类型声明生成

`src/vite/index.ts` 会根据 configJson 生成 `TemplateValueMapRegistry` 扩展声明。

需要特别注意：

1. `object` 字段要递归生成普通对象类型。
2. 匿名数组项要直接生成数组元素类型。
3. 带 `key` 的数组项要保留字段节点元信息，并替换 `value` 的类型。
4. 类型生成不能和运行时 valueMap 归一规则分叉。

## 运行时上下文

`createTemplateContext` 会：

1. 自动加载 `config.json` 和 `valueMap.json`。
2. 创建响应式 `config` 和 `valueMap`。
3. 通过 `resolvePath` 规范化读取路径。
4. 通过 `resolveValue` 从 valueMap 中读取值。
5. 监听 `auto-exhibition-template-sdk:update-value-map` 消息，支持后台预览实时更新。

`useTemplateValue` 只读取 valueMap，不直接读取 configJson。

## 发布前检查

修改 SDK 后至少执行：

```bash
pnpm build
```

如果模板项目使用 `file:../template-sdk` 本地依赖，修改 SDK 后还需要在模板项目中刷新依赖：

```bash
pnpm install
```

再构建模板项目确认实际消费的是最新 SDK：

```bash
pnpm build
```
