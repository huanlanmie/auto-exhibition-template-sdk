import type { Ref } from 'vue'

// 媒体类字段在 valueMap 中统一按对象读取，模板侧可以直接绑定 src、poster、alt 等属性。
export type TemplateMediaObject = {
  url?: string
  alt?: string
  poster?: string
}

export type TemplateMediaValue = TemplateMediaObject | null

// 字段类型直接对齐当前 SDK 接受的 configJson 语义。
// 这里只保留运行时和构建链路已经真正支持的类型，避免 README、校验器和类型系统各说各话。
export type TemplateFieldType = 'string' | 'number' | 'boolean' | 'image' | 'video' | 'array'

export type TemplateFieldSchema = TemplateField[]

export type TemplateArrayValueItem = TemplateField
export type TemplateArrayOperation = 'add' | 'delete'

// 下面这组工具类型只服务两件事：
// 1. 从 configJson 的字面量结构推导出运行时 valueMap 形态；
// 2. 根据 valueMap 反推出 useTemplateValue 可接受的点路径和值类型。
// 它们不再承担编辑器诊断职责，只负责把真实配置转换成静态类型信息。
type StringKeyOf<T> = Extract<keyof T, string>

type ArrayItem<T> = T extends readonly (infer Item)[] ? Item : never

type UnionToIntersection<U> =
  (U extends unknown ? (value: U) => void : never) extends ((value: infer I) => void)
    ? I
    : never

type Simplify<T> = {
  [Key in keyof T]: T[Key]
} & {}

type MergeObjectUnion<U> = Simplify<UnionToIntersection<U>>

type TemplateRuntimeValueFromLiteral<Value> =
  Value extends readonly (infer Item)[]
    ? Array<TemplateRuntimeValueFromLiteral<Item>>
    : Value extends object
      ? { [Key in keyof Value]: TemplateRuntimeValueFromLiteral<Value[Key]> }
      : Value

// 所有字段共享同一套基础元信息。
// path 目前保留给后续与模板分析配置对齐的场景，label 只用于配置表达，不参与运行时取值。
type TemplateFieldBase = {
  key: string
  type: TemplateFieldType
  path?: string
  label?: string
}

export type TemplateStringField = TemplateFieldBase & {
  type: 'string'
  value?: string
  defaultValue?: string
}

export type TemplateNumberField = TemplateFieldBase & {
  type: 'number'
  value?: number
  defaultValue?: number
}

export type TemplateBooleanField = TemplateFieldBase & {
  type: 'boolean'
  value?: boolean
  defaultValue?: boolean
}

export type TemplateImageField = TemplateFieldBase & {
  type: 'image'
  value?: string
  defaultValue?: string
}

export type TemplateVideoField = TemplateFieldBase & {
  type: 'video'
  value?: string
  defaultValue?: string
}

export type TemplateArrayField = TemplateFieldBase & {
  type: 'array'
  value?: TemplateArrayValueItem[]
  defaultValue?: TemplateArrayValueItem[]
  operations?: TemplateArrayOperation[]
}

// 这组类型把“字段声明”映射成“运行时最终读到的值”。
// 这里反映的是 SDK 归一化后的结果，而不是 configJson 原始字面量：
// 例如 image/video 字段在配置里存字符串路径，但运行时统一返回媒体对象。
type TemplateFieldRuntimeValue<Field> =
  Field extends { type: 'string' }
    ? string
    : Field extends { type: 'number' }
      ? number
      : Field extends { type: 'boolean' }
        ? boolean
        : Field extends { type: 'image' | 'video' }
          ? TemplateMediaObject
          : Field extends { type: 'array', value?: infer Value }
            ? Value extends readonly unknown[]
              ? Array<TemplateRuntimeValueFromLiteral<ArrayItem<Value>>>
              : unknown[]
            : unknown

type TemplateFieldRuntimeRecord<Field> =
  Field extends { key: infer Key extends string }
    ? { [Name in Key]: TemplateFieldRuntimeValue<Field> }
    : {}

// 字段数组会被折叠成一个对象类型，键名来自每个字段的 key。
// 这样模板项目只要给出完整 configJson，就能自动推导出 valueMap 根结构。
type TemplateFieldsRuntimeValue<Fields> =
  Fields extends readonly unknown[]
    ? MergeObjectUnion<TemplateFieldRuntimeRecord<Fields[number]>>
    : Record<string, unknown>

// 这一组路径类型专门服务 useTemplateValue。
// 它既支持 title 这样的普通点路径，也支持 timeline[0].phase 这样的数组路径。
type TemplateDotArrayPath<T> =
  T extends readonly unknown[]
    ? | `${number}`
      | (TemplateNestedPath<ArrayItem<T>> extends never ? never : `${number}.${TemplateNestedPath<ArrayItem<T>>}`)
    : never

type TemplateBracketArrayPath<T> =
  T extends readonly unknown[]
    ? | `[${number}]`
      | (TemplateNestedPath<ArrayItem<T>> extends never ? never : `[${number}].${TemplateNestedPath<ArrayItem<T>>}`)
    : never

type TemplateArrayPath<T> = TemplateDotArrayPath<T> | TemplateBracketArrayPath<T>

type TemplateChildPath<T> =
  T extends readonly unknown[]
    ? `.${TemplateDotArrayPath<T>}` | `${TemplateBracketArrayPath<T>}`
    : T extends object
      ? `.${TemplateNestedPath<T>}`
      : never

type TemplateNestedPath<T> =
  T extends readonly unknown[]
    ? TemplateArrayPath<T>
    : T extends object
      ? {
          [Key in StringKeyOf<T>]:
            | Key
            | (TemplateChildPath<T[Key]> extends never ? never : `${Key}${TemplateChildPath<T[Key]>}`)
        }[StringKeyOf<T>]
      : never

type NormalizeTemplatePath<Path extends string> =
  Path extends `${infer Head}[${infer Index}]${infer Tail}`
    ? NormalizeTemplatePath<`${Head extends '' ? '' : `${Head}.`}${Index}${Tail}`>
    : Path extends `.${infer Rest}`
      ? NormalizeTemplatePath<Rest>
      : Path

// 当 useTemplateValue 传入路径字符串后，最终靠这个类型把路径映射成返回值类型。
// 它会同时解析对象 key 和数组下标，让模板里的返回值提示尽量贴近真实 valueMap 结构。
type TemplatePathValue<Source, Path extends string> =
  Path extends `${infer Head}.${infer Tail}`
    ? Head extends StringKeyOf<Source>
      ? TemplatePathValue<Source[Head], Tail>
      : Head extends `${number}`
        ? Source extends readonly unknown[]
          ? TemplatePathValue<ArrayItem<Source>, Tail>
          : unknown
        : unknown
    : Path extends StringKeyOf<Source>
      ? Source[Path]
      : Path extends `${number}`
        ? Source extends readonly unknown[]
          ? ArrayItem<Source>
          : unknown
        : unknown

// TemplateField 贴近 mju TemplateAnalysis 的字段定义，保持和 configJson 的真实语义一致。
export type TemplateField =
  | TemplateStringField
  | TemplateNumberField
  | TemplateBooleanField
  | TemplateImageField
  | TemplateVideoField
  | TemplateArrayField

// SDK 在开发态只关心完整 configJson，所以这里保留和模板配置一致的整体结构。
export type TemplateConfig = {
  meta?: Record<string, unknown>
  dataSchema?: {
    fields?: TemplateField[]
  }
  functions?: Record<string, unknown>
}

export type TemplateValidationIssue = {
  path: string
  message: string
}

export type TemplateBuildArtifacts = {
  configJson: TemplateConfig
  valueMap: Record<string, unknown>
}

// 第一版阶段不再尝试用类型系统拼装重复 key 等复杂诊断。
// 这两个类型现在只作为透传占位，保留公开 API 的连续性。
export type ValidateTemplateConfigKeys<Config> =
  Config

export type ValidatedTemplateConfig<Config extends TemplateConfig> =
  Config

// 消费侧可以直接用 typeof configJson 生成运行时 valueMap 对应的静态类型，
// 不需要再维护第二份手写接口。
export type InferTemplateValueMap<Config> = Simplify<
  TemplateFieldsRuntimeValue<
    Config extends { dataSchema?: { fields?: infer Fields } } ? Fields : never
  >
>

// 这个注册表专门给模板项目做类型桥接：
// 项目里只需要把现有 configJson 的 typeof 绑定进来，
// useTemplateValue 就能基于真实配置推导 key 和返回值类型。
export interface TemplateValueMapRegistry {}

export type RegisteredTemplateValueMap =
  keyof TemplateValueMapRegistry extends never
    ? Record<string, unknown>
    : Simplify<TemplateValueMapRegistry>

export type TemplateValuePath = TemplateNestedPath<RegisteredTemplateValueMap>

export type TemplateValueAtPath<Path extends string> = TemplatePathValue<RegisteredTemplateValueMap, NormalizeTemplatePath<Path>>

// 插件安装参数只接受 configJson；valueMap 是 SDK 内部构建出的产物，不再由模板项目注入。
export type TemplateSdkOptions = {
  configJson: unknown
}

// 所有 SDK 取值方法都通过这一份上下文读取 valueMap。
export type TemplateContext = {
  config: Ref<TemplateConfig | null>
  valueMap: Ref<Record<string, unknown> | null>
  resolvePath: (path: string, scopeBasePath?: string) => string
  resolveValue: (path: string) => unknown
}