import { createApp, h } from 'vue'

// 这个入口只服务 SDK 自己本地单独启动时的最小调试壳。
// 对外 npm 包能力全部走 sdk/index.ts，这里不参与实际对外导出。
createApp({
	name: 'TemplateSdkDevShell',
	render() {
		return h('div', null, 'template-sdk dev entry')
	}
}).mount('#app')