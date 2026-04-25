// SDK 内部统一使用点路径读取 valueMap。
// 这组工具只负责“路径如何被拆解和读取”，不关心字段校验或默认值构建。

// 所有根路径都会先去掉旧版残留的前导斜杠，避免同一个值出现 /title 和 title 两套写法。
export function normalizeRootPath(path: string) {
  return String(path || '').trim().replace(/^\//, '')
}

// 当模板里存在作用域基路径时，需要把局部 key 拼成完整点路径。
// 例如 timeline[0] 作用域下读取 phase，最终会变成 timeline[0].phase。
export function joinPath(basePath: string, path: string) {
  if (!basePath) {
    return path
  }

  if (!path) {
    return basePath
  }

  return `${basePath}.${path}`
}

// 数组路径在读取前先被展开成普通段数组。
// 例如 timeline[0].phase 会先被归一成 timeline.0.phase，
// 后续逐段读取时就不用区分“对象 key”还是“数组下标语法”。
export function parsePathSegments(path: string) {
  return normalizeRootPath(path)
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
}

// 所有 useTemplateValue 的最终读取都会落到这里。
// 这里按段前进而不是一次性 eval 路径，是为了让读取规则简单、稳定、可控。
export function getValueByPath(source: unknown, path: string) {
  const segments = parsePathSegments(path)

  // 传空路径时直接返回整个源对象，方便上层在需要时读取当前作用域根值。
  if (!segments.length) {
    return source
  }

  let currentValue: unknown = source

  for (const segment of segments) {
    // 只要中途已经走到 null / undefined，后续路径都不可能继续命中，直接返回 undefined。
    if (currentValue === null || currentValue === undefined) {
      return undefined
    }

    currentValue = (currentValue as Record<string, unknown>)[segment]
  }

  return currentValue
}