import type { TemplateConfig } from '../sdk/types'

// defineTemplateConfig 只承担“保留字面量类型”的职责。
// 真正的结构合法性和重复 key 校验统一放在构建期 / 运行期入口执行，
// 这样这里保持足够轻，模板作者也不会在配置定义阶段收到一堆噪音类型错误。
export function defineTemplateConfig<const T extends TemplateConfig>(config: T): T {
  return config
}