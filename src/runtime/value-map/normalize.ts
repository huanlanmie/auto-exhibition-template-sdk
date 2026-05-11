import type {
  TemplateConfig,
  TemplateField,
} from '../../sdk/types'

// valueMap 构建阶段会同时接触字段对象、媒体对象和普通嵌套对象，
// 这里先统一收敛成“非数组对象”的判断，避免每个转换分支都重复写一遍。
export function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

// 读取配置时统一把未知输入收敛成字段数组，避免业务转换里到处判空或手动断言。
export function normalizeFields(fields: unknown) {
  return Array.isArray(fields) ? (fields as TemplateField[]) : []
}

// configJson 是模板作者维护的源对象，valueMap 是 SDK 构建出的运行态快照。
// 这里每次都做深拷贝，是为了彻底切断两者之间的可变引用，防止模板运行时反写源配置。
export function cloneValue<T>(value: T): T {
  if (value === undefined) {
    return value
  }

  return JSON.parse(JSON.stringify(value)) as T
}

// 模板作者写在 configJson 里的资源路径只表示“模板项目内文件”，不表示部署站点根路径。
// 因此这里只把单斜杠开头的值收敛成 ./ 相对路径，避免 file:// 或容器环境把它解释成磁盘根目录。
function normalizeTemplateAssetPath(value: string) {
  if (!value.startsWith('/') || value.startsWith('//')) {
    return value
  }

  return `.${value}`
}

// 当字段没有显式默认值时，SDK 仍然要补一份稳定的空结构。
// 这样模板层读取时至少能得到可预期的占位形态，而不是在 undefined 上反复做防御判断。
function getEmptyValueByType(field: TemplateField) {
  switch (field?.type) {
    case 'image':
      return { url: '' }
    case 'video':
      return { url: '', poster: '' }
    case 'file':
      return ''
    case 'array':
      return []
    default:
      return ''
  }
}

// 数组字段的 value 本质上是字段对象数组。
// SDK 不在这里再做结构推断，只负责把每一项安全复制成运行时自己的值，
// 具体是否合法已经由校验阶段在进入这里之前拦住。
function buildArrayFieldValue(field: TemplateField, value: unknown = field?.value): unknown[] {
  if (field?.type !== 'array') {
    return []
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value.map((itemValue) => {
    // 非对象子项按空对象兜底，保持数组每项始终是对象容器，避免模板层读子字段时报结构错误。
    if (!isObjectRecord(itemValue)) {
      return {}
    }

    return cloneValue(itemValue)
  })
}

// configJson 里的 value 只是“配置表达”，真正进运行时前要先按字段类型归一。
// 例如 image/video 在配置里存的是字符串路径，但模板层始终读取媒体对象；
// file 字段则保持字符串本身，不额外包装运行时对象。
function normalizeFieldValueByType(field: TemplateField, value: unknown) {
  switch (field?.type) {
    case 'image':
      if (typeof value === 'string') {
        return { url: normalizeTemplateAssetPath(value) }
      }

      return isObjectRecord(value) ? cloneValue(value) : { url: '' }
    case 'video':
      if (typeof value === 'string') {
        return { url: normalizeTemplateAssetPath(value), poster: '' }
      }

      return isObjectRecord(value) ? cloneValue(value) : { url: '', poster: '' }
    case 'file':
      return typeof value === 'string' ? normalizeTemplateAssetPath(value) : ''
    case 'array':
      return buildArrayFieldValue(field, value)
    default:
      return cloneValue(value)
  }
}

// 字段有 value 时使用 value；没有时再按字段类型补空结构，保证 valueMap 始终完整可读。
function resolveDefaultFieldValue(field: TemplateField): unknown {
  if (field?.value !== undefined) {
    return normalizeFieldValueByType(field, field.value)
  }

  return getEmptyValueByType(field)
}

// 模板作者只维护 configJson；SDK 在这里把 fields 折叠成运行态 valueMap。
// 根对象的键名直接来自字段 key，这样模板层读取路径时不需要再经过额外包装层。
export function buildValueMapFromConfig(config: TemplateConfig | null) {
  const result: Record<string, unknown> = {}

  normalizeFields(config?.dataSchema?.fields).forEach((field) => {
    const fieldKey = String(field?.key || '').trim()

    // 空 key 已经会在校验阶段报错；这里仍然跳过一次，避免错误输入污染运行时结果。
    if (!fieldKey) {
      return
    }

    // 每个字段在进入 valueMap 前都先走默认值解析，
    // 这样模板层看到的是一份已经归一化完成的快照，而不是原始 configJson 字面量。
    result[fieldKey] = resolveDefaultFieldValue(field)
  })

  return result
}