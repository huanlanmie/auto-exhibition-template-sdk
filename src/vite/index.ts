import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin } from 'vite'
import { buildTemplateJsonFiles } from '../runtime/schema/artifacts'
import type { TemplateConfig } from '../sdk/types'

const DEFAULT_DTS_PATH = '.template-sdk/template-sdk.generated.d.ts'
const DEFAULT_ARTIFACTS_DIR = 'assets/template'
const INDENT = '  '

type TemplateSdkPluginOptions = {
  configJson: TemplateConfig
  dtsPath?: string
  artifactsDir?: string
}

type ValidationIssue = {
  path: string
  message: string
}

// 这层插件只做两件事：
// 1. 在 vite dev / vite build 启动前校验 configJson；
// 2. 根据当前 configJson 生成一份类型声明文件给 TS 服务消费。
// 它不参与页面运行时，也不注入任何业务逻辑。
function pushIssue(issues: ValidationIssue[], path: string, message: string) {
  issues.push({ path, message })
}

function normalizeFields(fields: unknown): Array<Record<string, unknown>> {
  return Array.isArray(fields)
    ? fields.filter((field): field is Record<string, unknown> => Boolean(field && typeof field === 'object'))
    : []
}

function uniqueTypes(types: Array<string | undefined | null>) {
  return [...new Set(types.filter(Boolean))] as string[]
}

function indentMultilineType(typeSource: string, indent: string) {
  return String(typeSource).replace(/\n/g, `\n${indent}`)
}

function renderUnionType(types: Array<string | undefined | null>) {
  const normalizedTypes = uniqueTypes(types)

  if (!normalizedTypes.length) {
    return 'unknown'
  }

  if (normalizedTypes.length === 1) {
    return normalizedTypes[0]
  }

  return normalizedTypes.join(' | ')
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function validateSiblingFieldKeys(fields: unknown[], path: string, issues: ValidationIssue[]) {
  const keySet = new Set<string>()

  fields.forEach((field, index) => {
    if (!isObjectRecord(field) || typeof field.key !== 'string' || !field.key.trim()) {
      return
    }

    const normalizedKey = field.key.trim()
    const fieldPath = `${path}[${index}]`

    // 构建期必须尽早拦住同层 key 冲突，
    // 否则一旦继续生成声明文件，编辑器拿到的类型结果本身就已经不可信了。
    if (keySet.has(normalizedKey)) {
      pushIssue(issues, `${fieldPath}.key`, `字段 key ${normalizedKey} 重复`)
      return
    }

    keySet.add(normalizedKey)
  })
}

function validateFieldArrayForBuild(fields: unknown, path: string, issues: ValidationIssue[]) {
  if (!Array.isArray(fields)) {
    pushIssue(issues, path, '必须是字段数组')
    return
  }

  validateSiblingFieldKeys(fields, path, issues)

  fields.forEach((field, index) => {
    if (!isObjectRecord(field) || field.type !== 'array') {
      return
    }

    // 数组字段里如果继续声明了 value/defaultValue 子字段数组，
    // 构建期同样要沿用“同层 key 不可重复”的规则向下递归。
    if (field.value !== undefined) {
      validateFieldArrayForBuild(field.value, `${path}[${index}].value`, issues)
    }

    if (field.defaultValue !== undefined) {
      validateFieldArrayForBuild(field.defaultValue, `${path}[${index}].defaultValue`, issues)
    }
  })
}

function validateConfigJsonForBuild(configJson: unknown) {
  const issues: ValidationIssue[] = []

  if (!isObjectRecord(configJson)) {
    pushIssue(issues, 'configJson', '必须是对象')
  } else {
    const dataSchema = configJson.dataSchema

    if (dataSchema !== undefined && !isObjectRecord(dataSchema)) {
      pushIssue(issues, 'configJson.dataSchema', 'dataSchema 必须是对象')
    }

    const fields = isObjectRecord(dataSchema) ? dataSchema.fields : undefined
    if (fields !== undefined) {
      validateFieldArrayForBuild(fields, 'configJson.dataSchema.fields', issues)
    }
  }

  if (issues.length) {
    // 构建期错误文案沿用完整路径风格，
    // 目的是让模板作者在终端里也能直接定位到具体节点，而不是只看到笼统失败提示。
    const message = issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n')
    throw new Error(`template-sdk configJson 校验失败:\n${message}`)
  }
}

function renderObjectType(entries: Array<{ key: string; valueType: string }>, depth = 0) {
  const indent = INDENT.repeat(depth)
  const childIndent = INDENT.repeat(depth + 1)

  if (!entries.length) {
    return 'Record<string, unknown>'
  }

  const lines = entries.map(({ key, valueType }) => (
    `${childIndent}${JSON.stringify(String(key))}: ${indentMultilineType(valueType, childIndent)}`
  ))

  return `{
${lines.join('\n')}
${indent}}`
}

function renderArrayType(field: Record<string, unknown>, depth: number) {
  if (!Array.isArray(field.value) || !field.value.length) {
    return 'unknown[]'
  }

  // 数组项的声明来自 value 里的字段对象数组，
  // 所以这里继续递归每一项，再把结果合成数组元素联合类型。
  return `Array<${renderUnionType(field.value.map((item) => renderValueType(item, depth + 1)))}>`
}

function renderValueType(value: unknown, depth = 0): string {
  if (Array.isArray(value)) {
    if (!value.length) {
      return 'unknown[]'
    }

    return `Array<${renderUnionType(value.map((item) => renderValueType(item, depth + 1)))}>`
  }

  if (isObjectRecord(value)) {
    return renderObjectType(
      Object.entries(value).map(([key, nestedValue]) => ({
        key,
        valueType: renderValueType(nestedValue, depth + 1),
      })),
      depth,
    )
  }

  switch (typeof value) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      return 'unknown'
  }
}

function renderFieldType(field: Record<string, unknown>, depth = 0) {
  switch (field.type) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'image':
    case 'video':
      return '{ url?: string; alt?: string; poster?: string }'
    case 'array':
      return renderArrayType(field, depth)
    default:
      return 'unknown'
  }
}

function buildValueMapEntries(config: TemplateConfig) {
  const entries: Array<{ key: string; valueType: string }> = []

  normalizeFields(config?.dataSchema?.fields).forEach((field) => {
    if (!field.key) {
      return
    }

    // 这里的条目列表最终会声明合并进 TemplateValueMapRegistry，
    // 所以键名必须直接对齐 configJson 里的字段 key。
    entries.push({
      key: String(field.key),
      valueType: renderFieldType(field, 1),
    })
  })

  return entries
}

function buildDeclarationSource(config: TemplateConfig, relativeConfigPath: string) {
  const valueMapType = renderObjectType(buildValueMapEntries(config), 0)

  return `/* eslint-disable */
// Generated by template-sdk/vite from ${relativeConfigPath}.
// Do not edit this file manually.

type TemplateProjectValueMap = ${valueMapType}

declare module 'template-sdk' {
  interface TemplateValueMapRegistry extends TemplateProjectValueMap {}
}

export {}
`
}

async function writeTemplateDeclarationFile(projectRoot: string, options: TemplateSdkPluginOptions) {
  const dtsFilePath = path.resolve(projectRoot, options.dtsPath || DEFAULT_DTS_PATH)

  // 先校验再生成声明文件，保证“开发期类型上下文”和“运行期认可的配置边界”不会分叉。
  validateConfigJsonForBuild(options.configJson)
  const declarationSource = buildDeclarationSource(options.configJson, 'explicit configJson object')

  await mkdir(path.dirname(dtsFilePath), { recursive: true })

  let currentSource = ''
  try {
    currentSource = await readFile(dtsFilePath, 'utf8')
  } catch {
    currentSource = ''
  }

  // 内容没有变化时不重复写盘，避免 dev 过程中无意义触发文件监听和类型服务刷新。
  if (currentSource !== declarationSource) {
    await writeFile(dtsFilePath, declarationSource, 'utf8')
  }

  return {
    dtsFilePath,
  }
}

function normalizeOutputPath(value: string) {
  return String(value || '')
    .trim()
    .replace(/^[./\\]+/, '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
}

function buildTemplateArtifactFileNames(options: TemplateSdkPluginOptions) {
  const artifactDir = normalizeOutputPath(options.artifactsDir || DEFAULT_ARTIFACTS_DIR)
  const prefix = artifactDir ? `${artifactDir}/` : ''

  return {
    configJson: `${prefix}configJson.json`,
    valueMap: `${prefix}valueMap.json`,
  }
}

function emitTemplateJsonFiles(
  emitFile: (emittedFile: { type: 'asset'; fileName: string; source: string }) => void,
  options: TemplateSdkPluginOptions,
) {
  // JSON 产物必须复用 SDK 的正式构建方法，不能在 Vite 插件里再手写一套转换规则。
  // 这样运行时 valueMap、构建输出 valueMap 和外部脚本拿到的 valueMap 都来自同一份校验与归一逻辑。
  const files = buildTemplateJsonFiles(options.configJson)
  const fileNames = buildTemplateArtifactFileNames(options)

  emitFile({
    type: 'asset',
    fileName: fileNames.configJson,
    source: files.configJson,
  })

  emitFile({
    type: 'asset',
    fileName: fileNames.valueMap,
    source: files.valueMap,
  })
}

export function templateSdkPlugin(options: TemplateSdkPluginOptions): Plugin {
  if (!options || options.configJson === undefined) {
    throw new Error('template-sdk/vite 需要显式传入 configJson 对象，例如 templateSdkPlugin({ configJson })')
  }

  let projectRoot = ''
  let hasGenerated = false

  const generateTypes = async (reportError: (message: string) => void) => {
    try {
      await writeTemplateDeclarationFile(projectRoot, {
        configJson: options.configJson,
        dtsPath: options.dtsPath || DEFAULT_DTS_PATH,
      })
    } catch (error) {
      const message = error instanceof Error ? error.stack || error.message : String(error)
      reportError(`template-sdk/vite 生成类型声明失败:\n${message}`)
    }
  }

  return {
    name: 'template-sdk:vite',
    enforce: 'pre',
    async configResolved(config) {
      // 在配置解析阶段先落盘声明文件，
      // 这样 vite dev 和 vite build 都会尽早拿到同一份类型上下文。
      projectRoot = config.root
      await generateTypes((message) => {
        throw new Error(message)
      })
      hasGenerated = true
    },
    async buildStart() {
      if (!hasGenerated) {
        await generateTypes((message) => this.error(message))
      }
    },
    generateBundle() {
      try {
        // 只在正式构建产物阶段输出 configJson/valueMap 文件。
        // dev 阶段仍只生成类型声明，避免开发时频繁写入 public 或 dist 目录。
        emitTemplateJsonFiles((emittedFile) => this.emitFile(emittedFile), options)
      } catch (error) {
        const message = error instanceof Error ? error.stack || error.message : String(error)
        this.error(`template-sdk/vite 生成模板 JSON 产物失败:\n${message}`)
      }
    },
  }
}

export type { TemplateSdkPluginOptions }