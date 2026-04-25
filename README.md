# template-sdk

`template-sdk` 是给模板项目使用的前端 SDK。模板项目把完整 `configJson` 对象交给 `templateSdkPlugin`，由插件统一完成开发期类型声明、dev server JSON 产物和正式构建 JSON 产物。应用挂载时只安装 `TemplateSdk` 运行时，不再重复传入 `configJson`。SDK 运行时会自动读取插件提供的 `config.json` 和 `valueMap.json`，再通过 `useTemplateValue` 提供稳定取值能力。

SDK 项目内部保留了充足的源码注释，重点解释数据边界、路径解析、configJson 校验、configJson 到 valueMap 的转换和全局上下文逻辑，方便后续继续开发和维护。

SDK 对模板项目不再暴露模板组件，模板作者直接在 `script setup` 中调用取值方法，然后用普通 Vue 模板写页面结构。

## 当前能力

1. 模板项目只在 `templateSdkPlugin({ configJson })` 中声明配置入口。
2. SDK 会在插件阶段从头到尾校验 `configJson` 的结构和字段类型。
3. 支持字符串、数字、布尔、图片、视频、数组字段的节点级校验。
4. 支持数组字段的 `value` 值校验，以及 `operations` 操作配置。
5. SDK 运行时始终只读取自己内部构建出的 `valueMap`。
6. 支持从 `configJson` 推导默认值并构建完整 `valueMap`。
7. 支持按点路径读取模板数据。
8. 支持通过单一取值方法完成标签内容、组件内容、prop 和属性绑定。
9. 支持在 dev server 和正式构建阶段从插件传入的 `configJson` 产出 JSON 文件内容。
10. 支持通过 `template-sdk/vite` 在模板项目里完成配置校验、类型声明生成和构建产物输出，不需要第二个 npm 包。

## 方法和构建入口

### useTemplateValue

SDK 对模板层只暴露这一个通用取值方法。

参数：

1. `key`：字段点路径，例如 `title`、`timeline[0].phase`、`timeline[0].milestones[0].state`。
2. `defaultValue`：路径不存在时使用的默认值。

返回值：

1. 返回一个可直接在 Vue 模板中使用的响应式值。

说明：

1. `useTemplateValue` 只负责返回值，不负责任何默认渲染。
2. 模板项目里的标签结构、组件结构和样式全部由模板作者自己实现。
3. 模板上下文由 SDK 在 `app.use(TemplateSdk)` 时自动建立，并从插件产物加载数据。
4. `key` 不接受以 `/` 开头的旧写法。

### validateTemplateConfig

`validateTemplateConfig(configJson)` 会对整份配置做运行时校验。校验范围包括：

1. 根节点是否为对象。
2. `meta`、`functions`、`dataSchema` 是否为对象。
3. `dataSchema.fields` 是否为数组。
4. 每个字段的 `key` 是否为非空字符串且不重复。
5. 每个字段的 `type` 是否为受支持的类型。
6. 不同字段类型的 `value` / `defaultValue` 是否与类型一致。
7. 数组字段的 `value` 是否为数组，并校验每一项是否为对象。

校验失败时会直接抛出错误，并在错误信息里列出每个节点的路径。

### buildTemplateValueMap

`buildTemplateValueMap(configJson)` 会先校验 `configJson`，再返回运行时使用的 `valueMap` 对象。

### buildTemplateArtifacts

`buildTemplateArtifacts(configJson)` 返回：

1. 规范化后的 `configJson`
2. 根据该 `configJson` 生成的 `valueMap`

### buildTemplateJsonFiles

`buildTemplateJsonFiles(configJson)` 返回：

1. `configJson` JSON 字符串
2. `valueMap` JSON 字符串

这个入口就是给构建脚本使用的。模板项目在打包或导出阶段，可以直接拿这两个字符串写入 JSON 文件。

### templateSdkPlugin

`templateSdkPlugin(options)` 是 SDK 提供的 Vite 插件入口，用来根据模板项目当前显式传入的 `configJson` 对象完成配置校验、类型声明生成、dev server JSON 提供，并在 `vite build` 时输出构建产物 JSON。

参数只有一个：`configJson`，必填，表示模板项目当前使用的完整配置对象。

说明：

1. 用户仍然只安装一个包：`template-sdk`。
2. 模板项目只需要在 `vite.config` 里启用插件并显式传入 `configJson` 对象，不需要再额外写生成脚本。
3. 插件在开发阶段生成类型声明，并在 dev server 中提供 `/config.json` 和 `/assets/template-sdk/valueMap.json`。
4. 插件在正式构建阶段会额外生成 `config.json` 和 `valueMap.json`。
5. 自动生成的声明文件应该忽略提交。
6. 类型声明和 JSON 产物路径由 SDK 固定管理，不暴露无意义的路径配置给模板项目。
7. 安装 SDK 后可以直接使用 `template-sdk/config` 和 `template-sdk/vite`，不需要额外为项目补 `jsconfig` 路径映射或本地声明文件。

默认构建输出：

1. `dist/config.json`
2. `dist/assets/template-sdk/valueMap.json`

这两个文件都由 SDK 根据当前 `configJson` 生成；模板作者不需要、也不应该手工维护 `valueMap.json`。

## configJson 约定

SDK 当前按照 `mju-smart-show` 里的 `TemplateAnalysis` 规范读取配置。

最小结构示例：

```json
{
	"meta": {
		"name": "示例模板"
	},
	"dataSchema": {
		"fields": [
			{
				"key": "title",
				"type": "string",
				"label": "标题",
				"value": "默认标题"
			},
			{
				"key": "tracks",
				"type": "array",
				"label": "片单",
				"operations": ["add", "delete"],
				"value": [
					{
						"key": "trackTitle",
						"type": "string",
						"label": "片名",
						"value": "默认片名"
					}
				]
			}
		]
	},
	"functions": {}
}
```

字段规则：

1. `value` 不是必填。
2. 字段有 `value` 时，表示该字段的默认值。
3. `key` 必须是非空字符串，同一层级内不能重复；这条规则同时适用于根级 `fields` 和所有数组字段里的子项。
4. `type` 必须是 `string`、`number`、`boolean`、`image`、`video`、`array` 之一。
5. 数组字段的实际数据写在数组字段自己的 `value` 中，`value` 必须是字段对象数组。
6. 数组里的每一个子项都继续使用和普通字段一致的对象结构，也就是 `key`、`type`、`label`、`value` 这套字段定义。
7. 数组字段可选 `operations` 数组来表达允许的数组操作；当前只支持 `add` 和 `delete`。

字段类型约定：

1. `string` 字段的 `value` 和 `defaultValue` 必须是字符串。
2. `number` 字段的 `value` 和 `defaultValue` 必须是数字。
3. `boolean` 字段的 `value` 和 `defaultValue` 必须是布尔值。
4. `image` / `video` 字段的 `value` 和 `defaultValue` 必须是字符串路径。
5. `array` 字段的 `value` 和 `defaultValue` 如果存在，必须是数组。
6. `array` 字段的每个数组项都必须是合法字段对象，也就是说数组子项会继续按自己的 `type` 校验 `value`。
7. 数组项里的嵌套数组也继续使用字段对象数组。
8. `array` 字段的 `operations` 如果存在，必须是字符串数组，并且当前只支持 `add`、`delete`。

## valueMap 说明

1. 模板项目开发阶段只维护 `configJson`。
2. 构建前只考虑 `configJson`。
3. SDK 运行时会先把 `configJson` 转换成 `valueMap`。
4. 构建后只考虑 `valueMap.json`。
5. `valueMap.json` 不应该由模板开发者手工维护。
6. `valueMap.json` 是构建后的产物，用来承载最终可渲染的数据快照。

## 使用方式

模板项目只在 Vite 插件里传入 `configJson`：

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import configJson from './src/template/configJson'
import { templateSdkPlugin } from 'template-sdk/vite'

export default defineConfig({
	plugins: [templateSdkPlugin({ configJson }), vue()]
})
```

应用挂载时只安装 SDK 运行时：

```js
import TemplateSdk from 'template-sdk'

createApp(App).use(TemplateSdk).mount('#app')
```

如果希望在模板项目里直接获得字段类型提示，可以直接使用 SDK 提供的轻量 helper：

```ts
import { defineTemplateConfig } from 'template-sdk/config'

const configJson = defineTemplateConfig({
	meta: {
		name: '示例模板'
	},
	dataSchema: {
		fields: []
	},
	functions: {}
}

export default configJson
```

`defineTemplateConfig` 本身只负责保留配置对象的字面量类型，不再依赖复杂的类型体操去拼接重复 `key` 的错误文案。

如果希望在开发和构建阶段尽早暴露配置问题，可以在模板项目里启用 `template-sdk/vite`。这个入口会在生成类型声明和 JSON 产物之前先校验当前 `configJson`，因此像重复 `key` 这样的结构问题会直接让 `vite dev` / `vite build` 失败，而不会等到页面运行后才暴露。

如果希望让编辑器根据当前 `configJson` 自动推导 `useTemplateValue` 的路径和值类型，可以使用同一个 Vite 插件入口：

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import configJson from './src/template/configJson'
import { templateSdkPlugin } from 'template-sdk/vite'

export default defineConfig({
	plugins: [templateSdkPlugin({ configJson }), vue()]
})
```

项目里需要让语言服务纳入自动生成的声明目录。默认 Vite JavaScript 项目可以通过 `jsconfig.json` 加入：

```json
{
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"moduleResolution": "Bundler",
		"types": ["vite/client"]
	},
	"include": [
		".template-sdk/**/*.d.ts",
		"src/**/*.js",
		"src/**/*.vue",
		"vite.config.js"
	]
}
```

`.template-sdk` 目录是插件自动生成的产物，不需要手写，也不应该提交到仓库。插件不会自动猜测配置文件；模板项目必须显式把当前使用的 `configJson` 对象传给 `templateSdkPlugin`。`main.js` 不再传入 `configJson`，只负责安装 `TemplateSdk` 运行时。

`templateSdkPlugin` 在生成声明文件和构建 JSON 产物之前会先校验当前 `configJson`：

1. 根级 `dataSchema.fields` 同层 `key` 重复会直接阻断 `vite dev` / `vite build`。
2. 数组字段 `value` / `defaultValue` 里的子项同层 `key` 重复，也会直接阻断构建。
3. 报错信息会保留完整路径，例如 `configJson.dataSchema.fields[8].value[4].key`，方便直接定位到问题节点。

构建 JSON 文件示例：

```js
import configJson from './src/template/configJson'
import { buildTemplateJsonFiles } from 'template-sdk'

const files = buildTemplateJsonFiles(configJson)

// files.configJson 和 files.valueMap 都是可直接写入磁盘的 JSON 字符串
```

页面中直接调用方法：

```vue
<script setup>
import { useTemplateValue } from 'template-sdk'

const title = useTemplateValue('title', '')
</script>

<template>
	<h1>{{ title }}</h1>
</template>
```

数组示例：

```vue
<script setup>
import { useTemplateValue } from 'template-sdk'

const timeline = useTemplateValue('timeline', [])
</script>

<template>
	<article v-for="(item, index) in timeline" :key="index">
		<h3>{{ item.title }}</h3>
	</article>
</template>
```

## 目录说明

当前源码已经按职责拆分，根目录下不再把入口、类型、构建插件和运行时工具混放在一起。

1. `src/sdk`：SDK 对外公开入口、类型定义和 `useTemplateValue`。
2. `src/runtime/context`：全局上下文创建、注入 key 和上下文读取逻辑。
3. `src/runtime/schema`：`configJson` 校验、构建产物生成和 JSON 导出入口。
4. `src/runtime/value-map`：点路径解析、默认值归一和 `configJson` 到 `valueMap` 的转换逻辑。
5. `src/config`：`defineTemplateConfig` 轻量 helper 的运行时代码和类型声明。
6. `src/vite`：可选的 Vite 插件入口，负责构建前校验和自动生成模板类型声明。
7. `src/dev`：SDK 本地最小调试入口脚本，不参与对外导出。
8. `src/env.d.ts`：Vite 环境下的 Vue 文件类型声明。

## 构建与发布方式

SDK 当前已经按“源码目录 + dist 分发目录”的方式组织：

1. 开发时维护 `src` 下的源码。
2. 发布前执行 `pnpm build`，由库构建产出 `dist`。
3. `package.json` 的 `main`、`types` 和 `exports` 都指向包根兼容入口，再由兼容入口转到 `dist`，外部项目不再直接吃 `src` 源码入口。
4. 如果通过 Git 仓库分发给模板项目，`dist` 应该和源码一起提交，保证安装时能直接拿到可用产物。
5. 包根目录和 `config`、`vite` 子路径都提供了兼容入口文件，模板项目安装后不需要再额外补本地声明或路径映射。

## 当前模板项目接入方式

当前推荐通过 Git 仓库版本接入：

1. SDK 仓库维护源码和构建后的 `dist`。
2. 模板项目在 `package.json` 中通过 Git 地址或 tag 引用 SDK。
3. 模板项目在 `vite.config` 中通过 `templateSdkPlugin({ configJson })` 统一把完整配置对象传给 SDK。
4. 模板项目在应用挂载时只调用 `app.use(TemplateSdk)` 安装运行时，不再重复传入 `configJson`。
5. 模板项目启用 `template-sdk/vite` 后，会同时获得配置校验、编辑器类型增强、dev server JSON 提供和构建产物输出能力，不需要安装第二个包。
6. 如果后续切换到 npm 或私有制品仓库，只需要替换依赖来源，不需要改模板项目里的导入方式。