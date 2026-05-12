---
name: generate-template-project
description: "Use when: 一键生成模板项目、创建展览模板项目、初始化 auto-exhibition-template-sdk 模板、把现有页面改造成符合 SDK 接入规范的模板项目。确保生成结果正确接入 templateSdkPlugin、TemplateSdk、configJson、useTemplateValue，并符合 object/array/file/image/video 等字段约定。"
argument-hint: "描述模板主题、页面类型、素材目录、需要后台可编辑的字段和是否需要数组增删"
user-invocable: true
---

# 一键生成模板项目

这个 Skill 用于生成或改造一个符合 `auto-exhibition-template-sdk` 使用规范的模板项目。目标用户是模板作者和项目接入者，生成结果必须能被后台模板解析组件正常识别、编辑、预览和发布。

## 适用场景

- 新建一个基于 Vue 3 + Vite 的模板项目。
- 把已有页面接入 `auto-exhibition-template-sdk`。
- 根据用户描述生成 `configJson`、页面取值逻辑和构建配置。
- 把固定写死的数据改成后台可编辑字段。
- 需要数组增删的内容，例如模型列表、页面列表、时间轴、轮播图、展项清单。

## 必须满足的接入结果

生成或修改后的模板项目必须包含：

1. 在 `vite.config` 中启用 `templateSdkPlugin({ configJson })`。
2. 在 Vue 入口文件中安装 `TemplateSdk`。
3. 维护一份完整 `configJson`，包含 `meta`、`dataSchema.fields`、`functions`。
4. 页面组件通过 `useTemplateValue` 读取后台可编辑内容。
5. 构建命令能生成可上传后台的 `dist` 目录。

`configJson` 可以放在项目任意位置，只要 `vite.config` 能导入并传给 `templateSdkPlugin` 即可。不要把路径写死成唯一规范。

## configJson 生成规则

顶层结构固定为：

```ts
const configJson = defineTemplateConfig({
  meta: {
    name: '模板名称',
    code: 'template-code',
    version: '0.1.0'
  },
  dataSchema: {
    fields: []
  },
  functions: {}
})
```

字段规则：

1. 根字段必须有非空 `key`。
2. `object.value` 内的子字段必须有非空 `key`。
3. `array.value` 内的数组项模板可以省略 `key`，因为数组项按索引读取。
4. `value` 不是必填；有 `value` 时表示默认值。
5. 字段只使用当前支持的类型：`string`、`number`、`boolean`、`image`、`video`、`file`、`object`、`array`。
6. `functions` 保留为对象，通常写 `{}`。

## 字段类型选择

按内容语义选择字段类型：

| 内容 | 字段类型 |
| --- | --- |
| 标题、说明、按钮文案 | `string` |
| 数量、距离、速度、尺寸、页码 | `number` |
| 开关、是否显示、是否启用 | `boolean` |
| 图片、封面、背景图 | `image` |
| 视频、演示片段 | `video` |
| PDF、GLB、GLTF、音频、任意文件 | `file` |
| 一组固定子字段 | `object` |
| 可增删的同构列表 | `array` |

`image` 和 `video` 在 `configJson` 中写字符串路径；页面运行时读取到媒体对象。

`file` 在 `configJson` 中写字符串路径；页面运行时仍读取字符串。

## object 建模规则

当一个配置块由多个固定字段组成时，用 `object`：

```ts
{
  key: 'controls',
  type: 'object',
  label: '控制配置',
  value: [
    { key: 'prevLabel', type: 'string', label: '上一个按钮文案', value: '上一个' },
    { key: 'nextLabel', type: 'string', label: '下一个按钮文案', value: '下一个' },
    { key: 'showGrid', type: 'boolean', label: '显示网格', value: true }
  ]
}
```

页面读取：

```ts
const controls = useTemplateValue('controls', {})
const prevLabel = useTemplateValue('controls.prevLabel', '上一个')
```

## array 建模规则

当内容需要后台动态新增和删除时，用 `array`。

如果数组项包含多个字段，第一项应写成匿名 `object` 模板：

```ts
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
        { key: 'cameraDistance', type: 'number', label: '相机距离', value: 2.8 },
        { key: 'enabled', type: 'boolean', label: '是否启用', value: true }
      ]
    }
  ]
}
```

页面读取：

```ts
const models = useTemplateValue('models', [])
```

运行时应按对象数组消费：

```ts
const enabledModels = computed(() => {
  return Array.isArray(models.value)
    ? models.value.filter((item) => item?.enabled !== false)
    : []
})
```

数组操作规则：

1. 未声明 `operations` 时，默认允许全部操作。
2. `operations: []` 表示不允许新增和删除。
3. 显式声明时只使用 `add`、`delete`。
4. 后台新增数组项时只复用第一项结构，不复制第一项内容；新增值会按类型置空。
5. 如果数组本来就是空数组，后台不能新增，因为缺少结构模板。

## file accept 规则

`file` 字段如果能明确文件类型，应写 `accept`：

```ts
{ key: 'modelFile', type: 'file', label: '模型文件', value: '/assets/models/demo.glb', accept: ['.glb', '.gltf'] }
```

`accept` 可以使用：

1. 内置类型：`image`、`video`、`audio`。
2. 文件后缀：必须带 `.`，例如 `.pdf`、`.glb`、`.gltf`、`.zip`。

## 页面实现规则

页面组件必须通过 `useTemplateValue` 读取后台配置，不要直接导入 `configJson` 当运行时数据源。

推荐写法：

```ts
const title = useTemplateValue('title', '默认标题')
const models = useTemplateValue('models', [])
```

读取路径示例：

1. `title`
2. `controls.showGrid`
3. `models[0].name`
4. `models[0].url`

如果项目开启 `checkJs` 或严格 TypeScript，动态值需要做类型收窄，避免把 `unknown` 当成确定对象使用。

## 生成流程

执行这个 Skill 时按以下流程工作：

1. 明确模板主题、目标页面、素材目录和用户希望后台可编辑的内容。
2. 选择合适的字段类型，优先把可增删内容建成 `array`。
3. 对多字段数组项使用匿名 `object` 模板。
4. 生成或更新 `configJson`。
5. 在 `vite.config` 接入 `templateSdkPlugin({ configJson })`。
6. 在入口文件安装 `TemplateSdk`。
7. 在页面中用 `useTemplateValue` 替换写死数据。
8. 运行构建命令验证项目可打包。
9. 检查页面展示、后台可编辑字段和数组增删行为是否符合预期。

## 禁止事项

- 不要把 `configJson` 的位置写成唯一固定路径。
- 不要用嵌套 `array` 模拟多字段对象；多字段子项使用匿名 `object`。
- 不要把后台可编辑内容继续硬编码在 Vue 组件里。
- 不要生成无法被后台动态增删的固定 `model1Name`、`model2Name`、`model3Name` 这类字段组；应使用 `array`。

## 验证清单

完成后至少确认：

1. `configJson` 结构完整。
2. 根字段和 object 子字段都有 `key`。
3. 多字段数组项使用匿名 `object`。
4. `file` 字段的 `accept` 合理。
5. Vue 页面使用 `useTemplateValue` 读取配置。
6. `vite.config` 已接入 `templateSdkPlugin`。
7. Vue 入口已安装 `TemplateSdk`。
8. 构建命令成功。
9. 需要后台增删的数据在运行时是数组结构。