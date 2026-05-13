# auto-exhibition-template-sdk

`auto-exhibition-template-sdk` 是给展览模板项目使用的前端 SDK。模板项目接入后，只需要维护一份 `configJson`，在 Vue 页面里通过 `useTemplateValue` 读取内容，并在上传后台前执行构建。

这份文档只说明模板作者如何接入和使用 SDK，不包含内部实现细节。

## 安装

```bash
pnpm add auto-exhibition-template-sdk
```

或：

```bash
npm install auto-exhibition-template-sdk
```

## 编写 configJson

`configJson` 是模板项目维护的完整配置对象，可以放在项目中的任意位置；只要 `vite.config` 能导入并传给 `templateSdkPlugin` 即可。下面示例用 `configJson.ts` 演示。

```ts
import { defineTemplateConfig } from 'auto-exhibition-template-sdk/config'

const configJson = defineTemplateConfig({
	meta: {
		name: '3D 模型预览',
		code: 'model-preview-demo',
		version: '0.1.0'
	},
	dataSchema: {
		fields: [
			{ key: 'title', type: 'string', label: '主标题', value: '3D 模型预览示例' },
			{ key: 'enabled', type: 'boolean', label: '启用状态', value: true },
			{ key: 'cover', type: 'image', label: '封面图片', value: '/assets/template/poster.svg' },
			{
				key: 'models',
				type: 'array',
				label: '模型列表',
				operations: ['add', 'delete'],
				value: [
					{
						type: 'object',
						label: '模型项',
						value: [
							{ key: 'name', type: 'string', label: '模型名称', value: 'Meteor Shower' },
							{ key: 'url', type: 'file', label: '模型文件', value: '/assets/models/meteor_shower/scene.gltf', accept: ['.gltf', '.glb'] },
							{ key: 'cameraDistance', type: 'number', label: '相机距离', value: 2.8 }
						]
					}
				]
			}
		]
	},
	functions: {}
})

export default configJson
```

## configJson 结构

顶层对象固定使用以下结构：

```json
{
	"meta": {},
	"dataSchema": {
		"fields": []
	},
	"functions": {}
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `meta` | 模板元信息，常见字段有 `name`、`code`、`version` |
| `dataSchema.fields` | 模板字段数组，后台会根据它生成内容配置表单 |
| `functions` | 预留对象，通常写 `{}` |

## 字段对象

每个字段对象至少需要：

| 属性 | 说明 |
| --- | --- |
| `key` | 字段唯一标识。根字段和 `object.value` 子字段必须填写；数组项模板可以省略 |
| `type` | 字段类型 |
| `label` | 后台表单展示名称，可选 |
| `value` | 默认值，可选；有 `value` 时表示默认值 |

当前支持的字段类型：

| type | value 写法 | 运行时读取值 |
| --- | --- | --- |
| `string` | 字符串 | 字符串 |
| `number` | 数字 | 数字 |
| `boolean` | 布尔值 | 布尔值 |
| `image` | 图片路径字符串 | `{ url }` 媒体对象 |
| `video` | 视频路径字符串 | `{ url, poster }` 媒体对象 |
| `file` | 文件路径字符串 | 字符串 |
| `object` | 字段对象数组 | 普通对象 |
| `array` | 数组项模板数组 | 数组 |

## object 字段

`object.value` 是一组带 `key` 的子字段。运行时会折叠成普通对象。

```json
{
	"key": "profile",
	"type": "object",
	"label": "基础信息",
	"value": [
		{ "key": "name", "type": "string", "label": "名称", "value": "示例展项" },
		{ "key": "level", "type": "number", "label": "等级", "value": 1 }
	]
}
```

页面中可以这样读取：

```ts
const profile = useTemplateValue('profile', {})
const name = useTemplateValue('profile.name', '')
```

## array 字段

`array.value` 的第一项是后台新增子项时使用的结构模板。数组项按索引读取，数组项模板可以省略 `key`。

当一个数组项包含多个字段时，推荐把第一项写成匿名 `object`：

```json
{
	"key": "models",
	"type": "array",
	"label": "模型列表",
	"operations": ["add", "delete"],
	"value": [
		{
			"type": "object",
			"label": "模型项",
			"value": [
				{ "key": "name", "type": "string", "label": "模型名称", "value": "Meteor Shower" },
				{ "key": "url", "type": "file", "label": "模型文件", "value": "/assets/models/meteor_shower/scene.gltf", "accept": [".gltf", ".glb"] }
			]
		}
	]
}
```

运行时读取到的是对象数组：

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

数组操作规则：

1. `operations` 不填写时，默认允许 `add` 和 `delete`。
2. `operations: []` 表示不允许新增和删除。
3. 显式填写时只支持 `add`、`delete`。
4. 后台新增数组项时只复用第一项的结构，不复制第一项内容；新增值会按类型置空。
5. 如果 `array.value` 是空数组，后台无法判断新增项结构，因此不能新增。

## file 字段 accept

`file.accept` 用来限制后台素材选择范围。

```json
{
	"key": "modelFile",
	"type": "file",
	"label": "模型文件",
	"value": "/assets/models/demo.glb",
	"accept": [".glb", ".gltf"]
}
```

`accept` 可以填写：

1. 内置类型：`image`、`video`、`audio`。
2. 具体后缀：必须带 `.`，例如 `.pdf`、`.glb`、`.zip`。

## 启用 Vite 插件

在 `vite.config` 中传入 `configJson`：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import configJson from './configJson'
import { templateSdkPlugin } from 'auto-exhibition-template-sdk/vite'

export default defineConfig({
	plugins: [templateSdkPlugin({ configJson }), vue()]
})
```

## 安装 Vue 插件

在入口文件中安装 SDK：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import TemplateSdk from 'auto-exhibition-template-sdk'

createApp(App)
	.use(TemplateSdk)
	.mount('#app')
```

## 配置类型声明

如果项目使用 `tsconfig.json` 或 `jsconfig.json`，建议把 SDK 生成的类型声明加入 `include`：

```json
{
	"include": [
		".auto-exhibition-template-sdk/**/*.d.ts",
		"src/**/*.ts",
		"src/**/*.vue"
	]
}
```

## 在页面里读取内容

使用 `useTemplateValue` 按点路径读取字段：

```vue
<script setup>
import { useTemplateValue } from 'auto-exhibition-template-sdk'

const title = useTemplateValue('title', '')
const models = useTemplateValue('models', [])
</script>

<template>
	<h1>{{ title }}</h1>
	<ul>
		<li v-for="model in models" :key="model.url">{{ model.name }}</li>
	</ul>
</template>
```

路径示例：

1. `title`
2. `profile.name`
3. `models[0]`
4. `models[0].url`

## 构建并上传

模板项目开发完成后执行构建：

```bash
pnpm build
```

构建完成后，将生成的 `dist` 目录打包上传到后台模板管理。上传的是构建产物，不是源码目录。
