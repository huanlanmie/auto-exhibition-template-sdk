# auto-exhibition-template-sdk

`auto-exhibition-template-sdk` 是展览模板前端 SDK。它负责把模板的 `configJson` 变成运行时 `valueMap`，让 Vue 模板通过 `useTemplateValue` 读取后台配置，同时提供模板函数声明、函数注册、跨设备调用和本地 Bridge 通信能力。

## 安装

```bash
npm install auto-exhibition-template-sdk
```

或：

```bash
pnpm add auto-exhibition-template-sdk
```

## 核心能力

- 使用 `defineTemplateConfig` 定义模板配置。
- 使用 Vite 插件生成 `config.json` 和 `assets/auto-exhibition-template-sdk/valueMap.json`。
- 使用 `useTemplateValue` 在 Vue 页面读取配置值。
- 使用 `configJson.functions` 声明模板暴露的函数能力。
- 构建产物会在 `valueMap.__templateSdk.functions` 写入函数 manifest。
- 使用 `registerTemplateFunction` 注册运行时函数 handler。
- 使用 `invokeTemplateFunction` 通过本地 Bridge 或网关调用其他模板函数。
- 保留 `emitTemplateEvent` / `onTemplateEvent` 事件总线能力。

## 快速示例

```ts
import { defineTemplateConfig } from 'auto-exhibition-template-sdk/config'

export default defineTemplateConfig({
  meta: {
    name: '视频联动模板',
    code: 'video-linkage',
    version: '1.0.0'
  },
  dataSchema: {
    fields: [
      { key: 'title', type: 'string', label: '标题', value: '主屏播放' }
    ]
  },
  functions: {
    playVideo: {
      label: '播放视频',
      description: '按视频 ID 播放内容，并可触发其他设备联动',
      direction: 'inout',
      params: [
        { name: 'id', type: 'string', label: '视频 ID', required: true },
        { name: 'seekTo', type: 'number', label: '起播秒数', defaultValue: 0 }
      ],
      transport: {
        qos: 'at_most_once',
        timeoutMs: 3000
      }
    }
  }
})
```

```ts
import {
  registerTemplateFunction,
  invokeTemplateFunction,
  useTemplateValue
} from 'auto-exhibition-template-sdk'

const title = useTemplateValue('title', '')

registerTemplateFunction('playVideo', async (args) => {
  console.log('play video', args)
  return { ok: true }
})

await invokeTemplateFunction(
  { mode: 'binding', sourceFunction: 'playVideo' },
  'playVideo',
  { id: 'intro', seekTo: 0 }
)
```

## Vite 接入

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import configJson from './configJson'
import { templateSdkPlugin } from 'auto-exhibition-template-sdk/vite'

export default defineConfig({
  plugins: [
    templateSdkPlugin({ configJson }),
    vue()
  ]
})
```

## Vue 插件接入

```ts
import { createApp } from 'vue'
import App from './App.vue'
import TemplateSdk from 'auto-exhibition-template-sdk'

createApp(App).use(TemplateSdk).mount('#app')
```

## 构建产物

标准模板构建后会包含：

```text
dist/
  config.json
  assets/
    auto-exhibition-template-sdk/
      valueMap.json
```

`valueMap.json` 会包含业务字段和 SDK 元信息：

```json
{
  "title": "主屏播放",
  "__templateSdk": {
    "schemaVersion": 1,
    "functions": {
      "playVideo": {
        "name": "playVideo",
        "label": "播放视频",
        "direction": "inout",
        "params": [
          { "name": "id", "type": "string", "required": true }
        ]
      }
    }
  }
}
```

## 重要约束

- `dataSchema.fields[].key` 不能使用保留字段 `__templateSdk`。
- 函数 manifest 只保存元数据，不保存真实 JS 函数体。
- 真实执行逻辑必须在模板运行时通过 `registerTemplateFunction` 注册。
- 跨设备 `binding` 调用由网关按后台规则转发，模板不需要知道目标设备地址。

## 文档

本仓库 `docs/` 下包含静态文档站，重点页面：

- `docs/guide/config-json.html`
- `docs/guide/valueMap.html`
- `docs/guide/advanced.html`
- `docs/api/templateBridge.html`
