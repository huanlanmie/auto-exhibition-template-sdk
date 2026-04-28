import { cloneValue, isObjectRecord } from '../value-map/normalize'
import type {
  TemplateArrayOperation,
  TemplateConfig,
  TemplateFieldType,
  TemplateValidationIssue,
} from '../../sdk/types'

// 运行时和构建期共享同一份字段能力清单。
// 这里一旦增删类型，README、类型声明和默认值归一逻辑都必须同步调整。
const SUPPORTED_FIELD_TYPES: TemplateFieldType[] = [
  'string',
  'number',
  'boolean',
  'image',
  'video',
  'array',
]

const SUPPORTED_ARRAY_OPERATIONS: TemplateArrayOperation[] = ['add', 'delete']

function pushIssue(issues: TemplateValidationIssue[], path: string, message: string) {
  issues.push({ path, message })
}

function validateOptionalString(
  value: unknown,
  path: string,
  label: string,
  issues: TemplateValidationIssue[],
) {
  if (value !== undefined && typeof value !== 'string') {
    pushIssue(issues, path, `${label} 必须是字符串`)
  }
}

function validateOptionalRecord(
  value: unknown,
  path: string,
  label: string,
  issues: TemplateValidationIssue[],
) {
  if (value !== undefined && !isObjectRecord(value)) {
    pushIssue(issues, path, `${label} 必须是对象`)
  }
}

function validateArrayOperations(
  value: unknown,
  path: string,
  label: string,
  issues: TemplateValidationIssue[],
) {
  if (value === undefined) {
    return
  }

  if (!Array.isArray(value)) {
    pushIssue(issues, path, `${label} 必须是字符串数组`)
    return
  }

  const operationSet = new Set<string>()

  value.forEach((operation, index) => {
    const operationPath = `${path}[${index}]`

    // 每个操作位都先确认是不是字符串，避免后面的 includes/set 判断建立在错误类型上。
    if (typeof operation !== 'string') {
      pushIssue(issues, operationPath, '操作项必须是字符串')
      return
    }

    // 数组编辑能力目前只开放 add / delete，超出范围直接拦住，避免后续 UI/运行时对不上。
    if (!SUPPORTED_ARRAY_OPERATIONS.includes(operation as TemplateArrayOperation)) {
      pushIssue(issues, operationPath, `仅支持以下操作：${SUPPORTED_ARRAY_OPERATIONS.join(', ')}`)
      return
    }

    // 同一个数组字段里重复声明 add / delete 没有意义，还会让消费侧以为存在额外动作，
    // 所以这里在校验阶段就去重并报错。
    if (operationSet.has(operation)) {
      pushIssue(issues, operationPath, `操作 ${operation} 重复`)
      return
    }

    operationSet.add(operation)
  })
}

function validateMediaFieldValue(
  value: unknown,
  path: string,
  label: string,
  issues: TemplateValidationIssue[],
) {
  if (value === undefined) {
    return
  }

  // 当前规范里 image / video 在 configJson 中只允许写字符串路径。
  // 运行时虽然会再包装成对象，但源配置本身不接受对象写法，避免作者维护两套表达。
  validateOptionalString(value, path, label, issues)
}

function validateScalarFieldValue(
  value: unknown,
  expectedType: 'string' | 'number' | 'boolean',
  path: string,
  label: string,
  issues: TemplateValidationIssue[],
) {
  if (value === undefined) {
    return
  }

  if (expectedType === 'number' && typeof value !== 'number') {
    pushIssue(issues, path, `${label} 必须是数字`)
  }

  if (expectedType === 'boolean' && typeof value !== 'boolean') {
    pushIssue(issues, path, `${label} 必须是布尔值`)
  }

  if (expectedType === 'string' && typeof value !== 'string') {
    pushIssue(issues, path, `${label} 必须是字符串`)
  }
}

function validateValueAgainstField(
  field: Record<string, unknown>,
  value: unknown,
  path: string,
  label: string,
  issues: TemplateValidationIssue[],
) {
  const type = field.type as TemplateFieldType

  switch (type) {
    case 'string':
    case 'number':
    case 'boolean':
      validateScalarFieldValue(value, type as 'string' | 'number' | 'boolean', path, label, issues)
      return
    case 'image':
    case 'video':
      validateMediaFieldValue(value, path, label, issues)
      return
    case 'array':
      validateArrayFieldValue(value, path, label, issues)
      return
    default:
      return
  }
}

function getStructureKind(value: unknown) {
  if (Array.isArray(value)) {
    return 'array'
  }

  if (value === null) {
    return 'null'
  }

  if (isObjectRecord(value)) {
    return 'object'
  }

  return typeof value
}

function formatStructureKind(kind: string) {
  switch (kind) {
    case 'array':
      return '数组'
    case 'object':
      return '对象'
    case 'string':
      return '字符串'
    case 'number':
      return '数字'
    case 'boolean':
      return '布尔值'
    case 'null':
      return 'null'
    default:
      return kind
  }
}

// 这组结构比对函数只服务一个规则：
// 数组字段一旦给出第一份字段结构，后续子项就必须保持同构，避免同一列表里混进完全不同的对象形态。
function compareObjectStructure(
  reference: Record<string, unknown>,
  value: Record<string, unknown>,
  path: string,
  referencePath: string,
  issues: TemplateValidationIssue[],
) {
  const referenceKeys = Object.keys(reference)
  const valueKeys = Object.keys(value)
  const missingKeys = referenceKeys.filter((key) => !valueKeys.includes(key))
  const extraKeys = valueKeys.filter((key) => !referenceKeys.includes(key))

  if (missingKeys.length) {
    pushIssue(issues, path, `结构必须与 ${referencePath} 一致，缺少字段：${missingKeys.join(', ')}`)
  }

  if (extraKeys.length) {
    pushIssue(issues, path, `结构必须与 ${referencePath} 一致，存在多余字段：${extraKeys.join(', ')}`)
  }

  referenceKeys.forEach((key) => {
    // 缺失字段上面已经单独报错，这里不再继续深入，避免重复输出一串子路径错误。
    if (!valueKeys.includes(key)) {
      return
    }

    compareValueStructure(reference[key], value[key], `${path}.${key}`, `${referencePath}.${key}`, issues)
  })
}

function compareArrayStructure(
  reference: unknown[],
  value: unknown[],
  path: string,
  referencePath: string,
  issues: TemplateValidationIssue[],
) {
  if (!reference.length) {
    return
  }

  const referenceItem = reference[0]

  // 只有对象数组才进入“字段结构同构”校验；
  // 如果参考项本身不是对象，就交由更外层的字段定义约束来处理。
  if (!isObjectRecord(referenceItem)) {
    return
  }

  value.forEach((item, index) => {
    if (!isObjectRecord(item)) {
      return
    }

    compareObjectStructure(referenceItem, item, `${path}[${index}]`, `${referencePath}[0]`, issues)
  })
}

function compareValueStructure(
  reference: unknown,
  value: unknown,
  path: string,
  referencePath: string,
  issues: TemplateValidationIssue[],
) {
  const referenceKind = getStructureKind(reference)
  const valueKind = getStructureKind(value)

  if (referenceKind !== valueKind) {
    pushIssue(
      issues,
      path,
      `结构必须与 ${referencePath} 一致，期望 ${formatStructureKind(referenceKind)}，实际 ${formatStructureKind(valueKind)}`,
    )
    return
  }

  if (isObjectRecord(reference) && isObjectRecord(value)) {
    compareObjectStructure(reference, value, path, referencePath, issues)
    return
  }

  if (Array.isArray(reference) && Array.isArray(value)) {
    compareArrayStructure(reference, value, path, referencePath, issues)
  }
}

function validateSiblingFieldKeys(fields: unknown[], path: string, issues: TemplateValidationIssue[]) {
  const keySet = new Set<string>()

  fields.forEach((field, index) => {
    if (!isObjectRecord(field) || typeof field.key !== 'string' || !field.key.trim()) {
      return
    }

    const normalizedKey = field.key.trim()
    const fieldPath = `${path}[${index}]`

    // 同层字段 key 是 valueMap 的直接键名来源，重复后会直接覆盖前面的值，
    // 所以这里必须在进入任何构建步骤前就把冲突拦住。
    if (keySet.has(normalizedKey)) {
      pushIssue(issues, `${fieldPath}.key`, `字段 key ${normalizedKey} 重复`)
      return
    }

    keySet.add(normalizedKey)
  })
}

function validateArrayFieldValue(
  value: unknown,
  path: string,
  label: string,
  issues: TemplateValidationIssue[],
) {
  if (value === undefined) {
    return
  }

  if (!Array.isArray(value)) {
    pushIssue(issues, path, `${label} 必须是数组`)
    return
  }

  validateSiblingFieldKeys(value, path, issues)

  const referenceItem = value.find((itemValue) => isObjectRecord(itemValue))

  value.forEach((itemValue, itemIndex) => {
    validateField(itemValue, `${path}[${itemIndex}]`, issues)

    // 第一份对象结构会被当成这一层数组的参考模板；
    // 后续对象既要自己合法，也要和参考结构保持一致。
    if (referenceItem && referenceItem !== itemValue && isObjectRecord(itemValue)) {
      compareObjectStructure(referenceItem, itemValue, `${path}[${itemIndex}]`, `${path}[0]`, issues)
    }
  })
}

function validateArrayField(field: Record<string, unknown>, path: string, issues: TemplateValidationIssue[]) {
  validateArrayOperations(field.operations, `${path}.operations`, '字段 operations', issues)
  validateArrayFieldValue(field.value, `${path}.value`, '字段 value', issues)
}

function validateField(field: unknown, path: string, issues: TemplateValidationIssue[]) {
  if (!isObjectRecord(field)) {
    pushIssue(issues, path, '字段节点必须是对象')
    return
  }

  const key = field.key
  const type = field.type

  if (typeof key !== 'string' || !key.trim()) {
    pushIssue(issues, `${path}.key`, '字段 key 必须是非空字符串')
  }

  if (typeof type !== 'string' || !SUPPORTED_FIELD_TYPES.includes(type as TemplateFieldType)) {
    pushIssue(
      issues,
      `${path}.type`,
      `字段 type 必须是受支持的类型：${SUPPORTED_FIELD_TYPES.join(', ')}`,
    )
    return
  }

  validateOptionalString(field.label, `${path}.label`, '字段 label', issues)
  validateOptionalString(field.path, `${path}.path`, '字段 path', issues)

  // 这里按字段类型拆分，是为了把“字段声明”和“字段值形态”绑定在同一层校验里。
  // 模板项目只维护一份 configJson，所以 SDK 必须在入口处一次性把结构问题暴露完整。
  switch (type as TemplateFieldType) {
    case 'string':
    case 'number':
    case 'boolean':
      validateValueAgainstField(field, field.value, `${path}.value`, '字段 value', issues)
      break
    case 'image':
    case 'video':
      validateValueAgainstField(field, field.value, `${path}.value`, '字段 value', issues)
      break
    case 'array':
      validateArrayField(field, path, issues)
      break
    default:
      break
  }
}

function validateFields(fields: unknown, path: string, issues: TemplateValidationIssue[]) {
  if (!Array.isArray(fields)) {
    pushIssue(issues, path, '必须是字段数组')
    return
  }

  validateSiblingFieldKeys(fields, path, issues)

  fields.forEach((field, index) => {
    validateField(field, `${path}[${index}]`, issues)
  })
}

// validateTemplateConfig 是 SDK 全部公开构建入口的统一前置步骤。
// 不论是运行时安装插件，还是构建期导出产物，都先走这条路径，保证规则只有一份。
export function validateTemplateConfig(configJson: unknown): TemplateConfig {
  const issues: TemplateValidationIssue[] = []

  if (!isObjectRecord(configJson)) {
    pushIssue(issues, 'configJson', '必须是对象')
  } else {
    validateOptionalRecord(configJson.meta, 'configJson.meta', 'meta', issues)
    validateOptionalRecord(configJson.functions, 'configJson.functions', 'functions', issues)

    if (configJson.dataSchema !== undefined && !isObjectRecord(configJson.dataSchema)) {
      pushIssue(issues, 'configJson.dataSchema', 'dataSchema 必须是对象')
    }

    // 只有 dataSchema 自身是对象时，fields 才有继续向下校验的意义；
    // 否则会产生一串派生错误，掩盖真正的问题起点。
    const fields = isObjectRecord(configJson.dataSchema) ? configJson.dataSchema.fields : undefined
    if (fields !== undefined) {
      validateFields(fields, 'configJson.dataSchema.fields', issues)
    }
  }

  if (issues.length) {
    const message = issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n')
    throw new Error(`template-sdk configJson 校验失败:\n${message}`)
  }

  // 返回深拷贝后的规范化配置，避免外部继续持有原始对象引用并在 SDK 运行过程中修改它。
  return cloneValue(configJson as TemplateConfig)
}