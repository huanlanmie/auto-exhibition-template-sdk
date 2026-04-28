# template-sdk

`template-sdk` 是给模板项目使用的前端 SDK。接入后，只需要准备 `configJson`、在页面里通过 `useTemplateValue` 取值，并在上传到管理后台前构建出 `dist`。

SDK 不提供页面组件，模板项目自己的页面结构、样式和业务组件仍然由模板作者实现。

## 快速接入

这一部分只讲模板项目怎么接入 SDK，不展开实现细节。

### 1. 安装依赖

`pnpm`：

```bash
pnpm add git+https://gitee.com/CoolRainLy/template-sdk.git#main
```

`npm`：

```bash
npm install git+https://gitee.com/CoolRainLy/template-sdk.git#main
```

### 2. 编写 `configJson`

`configJson` 是模板项目维护的完整配置对象。

`configJson` 可以来自 `.ts`、`.js`、`.json` 文件，也可以直接内联到 `vite.config`。只要最终传给 `templateSdkPlugin({ configJson })` 的是完整配置对象，就可以使用。

常见写法：

| 写法 | 适用场景 | 说明 |
| --- | --- | --- |
| `defineTemplateConfig` + `.ts` 文件 | TypeScript 项目 | 推荐写法，编辑器提示最好 |
| `.js` / `.json` 文件 | JavaScript 项目或纯数据配置 | 可以直接使用 |
| 直接内联到 `vite.config` | 临时示例或最小 demo | 可以使用，但不适合长期维护 |

下面只给一个常用示例：

顶层字段：

| 字段 | 说明 | 类型 | 取值 / 约束 |
| --- | --- | --- | --- |
| `meta` | 模板元信息 | `object` | 普通对象，常见字段有 `name`、`code`、`version` |
| `dataSchema` | 字段定义容器 | `object` | 当前使用 `{ fields: TemplateField[] }` |
| `functions` | 预留配置对象 | `object` | 当前保留对象结构，通常写 `{}` |

`dataSchema.fields` 中每一项都是字段对象，字段对象属性如下：

| 属性 | 说明 | 类型 | 取值 / 约束 |
| --- | --- | --- | --- |
| `key` | 字段唯一标识 | `string` | 必填，非空，同一层级内不能重复 |
| `type` | 字段类型 | `string` | 必填，只能是 `string`、`number`、`boolean`、`image`、`video`、`array` |
| `label` | 字段展示名 | `string` | 可选，普通字符串 |
| `value` | 默认值 | `unknown` | 可选；有 `value` 时表示默认值，取值类型取决于 `type` |
| `operations` | 数组字段操作能力 | `string[]` | 仅 `array` 字段可用；未填写时默认允许 `add`、`delete`；空数组表示不允许操作；显式可选值只有 `add`、`delete` |

不同 `type` 对应的 `value` 取值规则：

| `type` | `value` 类型 | 说明 |
| --- | --- | --- |
| `string` | `string` | 普通文本 |
| `number` | `number` | 数字 |
| `boolean` | `boolean` | 布尔值 |
| `image` | `string` | 图片路径 |
| `video` | `string` | 视频路径 |
| `array` | `TemplateField[]` | 直接写字段对象数组 |

```ts
import { defineTemplateConfig } from 'template-sdk/config'

const configJson = defineTemplateConfig({
	meta: {
		name: '示例模板',
		code: 'demo-template',
		version: '0.1.0'
	},
	dataSchema: {
		fields: [
			{ key: 'title', type: 'string', label: '标题', value: '星图态势科技舱' },
			{ key: 'poster', type: 'image', label: '主视觉海报', value: '/assets/template/poster-core.svg' },
			{
				key: 'timeline',
				type: 'array',
				label: '时间轴',
				operations: [],
				value: [
					{ key: 'phase01', type: 'string', label: '阶段一', value: '接入边缘传感节点。' },
					{ key: 'phase02', type: 'string', label: '阶段二', value: '将采集数据转换为状态向量。' }
				]
			}
		]
	},
	functions: {}
})

export default configJson
```

### 3. 在 `vite.config` 里启用插件

在现有 `vite.config` 里引入 `configJson` 和 `templateSdkPlugin`，再把 `templateSdkPlugin({ configJson })` 加到 `plugins`：

```js
import configJson from './src/template/configJson'
import { templateSdkPlugin } from 'template-sdk/vite'

plugins: [templateSdkPlugin({ configJson }), vue()]
```

### 4. 在 `main.js` 安装运行时

在现有 `main.js` 里给应用增加 `TemplateSdk`：

```js
import { createApp } from 'vue'
import App from './App.vue'
import TemplateSdk from 'template-sdk'

createApp(App)
	.use(TemplateSdk)
	.mount('#app')
```

### 5. 配置 `jsconfig.json`

如果项目里已经有 `jsconfig.json`，把下面这段补进 `include`：

```json
{
	"include": [
		".template-sdk/**/*.d.ts",
	]
}
```

重点是把 `.template-sdk/**/*.d.ts` 纳入语言服务。

### 6. 在页面组件里取值

`useTemplateValue` 用来在页面组件里读取模板字段值。

参数：

1. 第一个参数是字段路径，例如 `title`、`timeline[0].phase`。
2. 第二个参数是可选兜底值；当路径没有取到值时，返回这个兜底值。

返回结果：

1. 返回一个可直接在 Vue 模板里使用的响应式值。
2. 你可以直接在模板里显示这个值，或者继续拿它去做绑定和判断。

示例：

```vue
<script setup>
import { useTemplateValue } from 'template-sdk'

const title = useTemplateValue('title', '')
</script>

<template>
	<h1>{{ title }}</h1>
</template>
```

### 7. 构建产物

上传到管理后台的模板管理时，需要先手动构建模板项目，再将生成的 `dist` 目录打包后上传。

构建完成后，上传的内容是 `dist` 目录对应的打包结果，不是源码目录。

## configJson 结构约定

这一部分先说明 `configJson` 的整体结构，再说明每一种对象结构，最后给出一个覆盖所有字段类型的最小示例。

### 1. 顶层结构

`configJson` 必须是完整配置对象：

```json
{
	"meta": {},
	"dataSchema": {
		"fields": []
	},
	"functions": {}
}
```

顶层对象说明：

1. `meta` 是模板元信息对象。
2. `dataSchema.fields` 是模板作者维护的字段数组。
3. `functions` 当前保留为对象结构。

### 2. 对象类型结构

#### `meta` 对象

`meta` 是普通对象，没有强制字段白名单，常见字段如下：

```json
{
	"name": "示例模板",
	"code": "demo-template",
	"version": "0.1.0"
}
```

#### `dataSchema` 对象

`dataSchema` 当前只要求维护 `fields`：

```json
{
	"fields": []
}
```

#### 通用字段对象

所有字段对象至少包含以下结构：

```json
{
	"key": "title",
	"type": "string",
	"label": "标题",
	"value": "默认标题"
}
```

通用规则：

1. `key` 必须是非空字符串。
2. 同一层级内 `key` 不能重复。
3. `label` 可选。
4. `value` 不是必填；有 `value` 时表示默认值。

#### `string` 字段对象

```json
{
	"key": "title",
	"type": "string",
	"label": "标题",
	"value": "默认标题"
}
```

#### `number` 字段对象

```json
{
	"key": "count",
	"type": "number",
	"label": "数量",
	"value": 3
}
```

#### `boolean` 字段对象

```json
{
	"key": "enabled",
	"type": "boolean",
	"label": "是否启用",
	"value": true
}
```

#### `image` 字段对象

```json
{
	"key": "poster",
	"type": "image",
	"label": "海报",
	"value": "/assets/template/poster-core.svg"
}
```

`image` 在 `configJson` 里只接受字符串路径。

#### `video` 字段对象

```json
{
	"key": "trailer",
	"type": "video",
	"label": "视频",
	"value": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
}
```

`video` 在 `configJson` 里只接受字符串路径。

#### `array` 字段对象

```json
{
	"key": "timeline",
	"type": "array",
	"label": "时间轴",
	"operations": ["add", "delete"],
	"value": [
		{
			"key": "phase01",
			"type": "string",
			"label": "阶段一",
			"value": "接入边缘传感节点。"
		}
	]
}
```

数组字段规则：

1. `value` 如果存在，必须是字段对象数组。
2. 数组子项继续使用和普通字段一致的字段对象结构。
3. `operations` 可选；未填写时默认允许 `add` 和 `delete`。
4. `operations: []` 表示不允许任何操作。
5. 如果显式填写操作项，当前只支持 `add` 和 `delete`。

#### `functions` 对象

```json
{}
```

`functions` 当前只保留对象结构，不参与模板项目运行时取值。

### 3. 支持的字段类型

当前只支持以下类型：

1. `string`
2. `number`
3. `boolean`
4. `image`
5. `video`
6. `array`

### 4. 覆盖所有类型的最小示例

```ts
import { defineTemplateConfig } from 'template-sdk/config'

const configJson = defineTemplateConfig({
	meta: {
		name: '示例模板',
		code: 'demo-template',
		version: '0.1.0'
	},
	dataSchema: {
		fields: [
			{ key: 'title', type: 'string', label: '标题', value: '默认标题' },
			{ key: 'count', type: 'number', label: '数量', value: 3 },
			{ key: 'enabled', type: 'boolean', label: '启用状态', value: true },
			{ key: 'poster', type: 'image', label: '海报', value: '/assets/template/poster-core.svg' },
			{ key: 'trailer', type: 'video', label: '视频', value: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
			{
				key: 'timeline',
				type: 'array',
				label: '时间轴',
				operations: ['add', 'delete'],
				value: [
					{ key: 'phase01', type: 'string', label: '阶段一', value: '接入边缘传感节点。' },
					{ key: 'phase02', type: 'string', label: '阶段二', value: '将采集数据转换为状态向量。' }
				]
			}
		]
	},
	functions: {}
})

export default configJson
```

## valueMap 的角色和边界

这是 SDK 最重要的数据边界。

1. 模板项目开发阶段只维护 `configJson`。
2. `valueMap` 不是模板作者手工维护的源文件。
3. SDK 在开发和构建阶段根据 `configJson` 生成 `valueMap`。
4. 运行时读取的是 `valueMap`，不是 `configJson`。
5. 平台侧如果要做运行时内容变更，改的是构建产物 `valueMap`，不是模板作者的源配置。

## 对外入口

SDK 当前对模板项目公开的入口只有这些：

1. `template-sdk`：默认导出 `TemplateSdk`，并导出 `useTemplateValue`、`validateTemplateConfig`、`buildTemplateValueMap`、`buildTemplateArtifacts`、`buildTemplateJsonFiles`。
2. `template-sdk/config`：导出 `defineTemplateConfig`。
3. `template-sdk/vite`：导出 `templateSdkPlugin`。

SDK 不提供模板 UI 组件。模板项目自己的 `HeroPanel`、`TimelinePanel`、`AlertsPanel` 这类组件，都是业务组件自己消费 `useTemplateValue`。

## 实现方式

上面讲的是模板项目怎么接入；这一部分再讲 SDK 内部是怎么工作的。

### 运行链路

SDK 的运行链路是固定的：

1. 模板项目把 `configJson` 传给 `templateSdkPlugin`。
2. 插件生成 `.template-sdk/**/*.d.ts`，并产出 `config.json` 和 `valueMap.json`。
3. 模板项目运行时只安装 `TemplateSdk`。
4. `TemplateSdk` 自动读取 `/config.json` 和 `/assets/template-sdk/valueMap.json`。
5. 页面组件通过 `useTemplateValue` 按点路径读取运行时值。

### useTemplateValue 规则

`useTemplateValue` 只有一套路径语义：

1. 只接受点路径，例如 `title`、`timeline[0].phase`。
2. 不接受以 `/` 开头的旧写法。
3. 普通字段直接返回标量值。
4. `image`/`video` 运行时统一读取为媒体对象。
5. `array` 运行时读取为字段对象数组。

### 为什么运行时只读 valueMap

`configJson` 是源配置，`valueMap` 是运行时快照。这样做的目的只有一个：把“结构定义”和“运行时内容”彻底分开。

这能保证：

1. 模板作者维护的配置结构不会被运行时回写。
2. 平台侧只需要替换 `valueMap.json` 就能改变页面展示内容。
3. 构建时和运行时使用同一份字段校验与默认值归一逻辑。

### 目录分层

当前源码目录按职责拆分如下：

1. `src/sdk`：对外公开入口、类型定义和 `useTemplateValue`。
2. `src/runtime/context`：运行时上下文创建、注入 key 和上下文读取逻辑。
3. `src/runtime/schema`：`configJson` 校验、构建产物生成和 JSON 导出入口。
4. `src/runtime/value-map`：点路径解析、默认值归一和 `configJson` 到 `valueMap` 的转换逻辑。
5. `src/config`：`defineTemplateConfig` 的运行时代码和类型声明。
6. `src/vite`：Vite 插件入口，负责构建前校验和自动生成模板类型声明。
7. `src/dev`：SDK 本地调试入口，不参与对外导出。

### Git 分发要求

当前模板项目是通过 Git 仓库直接安装 SDK，而不是从 npm registry 安装。

因此有一个硬要求：

1. SDK 每次修改后，`dist` 必须和源码一起保持最新。
2. 包根目录的 `index.js`、`config/index.js`、`vite/index.js` 只是兼容入口，它们最终都会转到 `dist/**`。
3. 如果 Git 仓库里没有最新的 `dist`，模板项目虽然能装下包，但运行或构建时会直接找不到导出文件。

## 构建与发布

SDK 当前采用“源码目录 + dist 分发目录”的结构：

1. 开发时维护 `src`。
2. 发布前执行 `pnpm build`。
3. 构建后产物输出到 `dist`。
4. 模板项目安装时消费的是包根兼容入口，再转到 `dist`。

如果 SDK 通过 Gitee `main` 直接分发给模板项目，记得在更新 SDK 代码后同步更新模板项目依赖，确保模板项目实际使用的是最新提交对应的 `dist` 产物。
