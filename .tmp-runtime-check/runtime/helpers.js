// valueMap 里会混合对象、数组和基础类型，这里先做一个通用对象判定。
export function isObjectRecord(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
// joinPath 用来拼接作用域路径，例如 timeline[0] 和 title。
export function joinPath(basePath, path) {
    if (!basePath) {
        return path;
    }
    if (!path) {
        return basePath;
    }
    return `${basePath}.${path}`;
}
// SDK 内部统一使用不带前导斜杠的路径格式，避免模板层和运行时出现两套写法。
export function normalizeRootPath(path) {
    return String(path || '').trim().replace(/^\//, '');
}
// 读取配置时统一把未知输入收敛成字段数组，避免在业务逻辑里反复判空。
export function normalizeFields(fields) {
    return Array.isArray(fields) ? fields : [];
}
// 路径分段时顺手把数组下标转成点路径，便于后续统一逐段读取。
export function parsePathSegments(path) {
    return normalizeRootPath(path)
        .replace(/\[(\d+)\]/g, '.$1')
        .split('.')
        .map((segment) => segment.trim())
        .filter(Boolean);
}
// SDK 的所有值读取最终都会落到这里，所以这里必须同时兼容对象路径和数组下标路径。
export function getValueByPath(source, path) {
    const segments = parsePathSegments(path);
    if (!segments.length) {
        return source;
    }
    let currentValue = source;
    for (const segment of segments) {
        if (currentValue === null || currentValue === undefined) {
            return undefined;
        }
        currentValue = currentValue[segment];
    }
    return currentValue;
}
// 默认文本渲染只接受基础值，复杂对象必须由模板侧自己决定如何消费。
export function toText(value) {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return '';
}
// 图片和视频字段都归一成媒体对象，模板侧不需要区分源数据是字符串还是对象。
export function toMediaValue(value) {
    if (typeof value === 'string' && value) {
        return { url: value };
    }
    if (isObjectRecord(value)) {
        return value;
    }
    return null;
}
// 配置默认值在进入运行时前先深拷贝，避免模板侧意外修改原始配置对象。
// 这里刻意不用结构共享，因为 configJson 是模板作者维护的源数据，SDK 需要保证构建出来的 valueMap
// 和原始对象之间没有可变引用，避免页面逻辑把“运行态值”写回“源配置”。
export function cloneValue(value) {
    if (value === undefined) {
        return value;
    }
    return JSON.parse(JSON.stringify(value));
}
// 当字段没有默认值时，SDK 仍然要给模板层一个稳定的空值结构。
// 这样 useTemplateValue 在模板里得到的返回值形态是可预期的，不会因为字段未配置而在模板层反复判类型。
export function getEmptyValueByType(field) {
    switch (field?.type) {
        case 'image':
            return { url: '' };
        case 'video':
            return { url: '', poster: '' };
        case 'array':
            return [];
        default:
            return '';
    }
}
// 数组字段和其他字段一样，只把 value 当成默认值来源。
// 区别只在于 array 的 value 存的是对象数组，SDK 会把每一项深拷贝后直接交给运行时读取。
export function buildArrayDefaultValue(field, value = field?.value) {
    if (field?.type !== 'array') {
        return [];
    }
    if (!Array.isArray(value)) {
        return [];
    }
    return value.map((itemValue) => {
        if (!isObjectRecord(itemValue)) {
            return {};
        }
        return cloneValue(itemValue);
    });
}
// 不同字段类型在默认值进入 valueMap 前需要先做一次类型归一。
// 这里的目标不是“修正错误配置”，而是把已经校验通过的数据转换成稳定的运行时值形态。
// 例如媒体字段在配置里只存字符串路径，但模板运行时仍统一只读取对象。
export function normalizeFieldValueByType(field, value) {
    switch (field?.type) {
        case 'image':
            if (typeof value === 'string') {
                return { url: value };
            }
            return isObjectRecord(value) ? cloneValue(value) : { url: '' };
        case 'video':
            if (typeof value === 'string') {
                return { url: value, poster: '' };
            }
            return isObjectRecord(value) ? cloneValue(value) : { url: '', poster: '' };
        case 'array':
            return buildArrayDefaultValue(field, value);
        default:
            return cloneValue(value);
    }
}
export function resolveExplicitOrDefaultFieldValue(field, value) {
    if (value !== undefined) {
        return normalizeFieldValueByType(field, value);
    }
    return resolveDefaultFieldValue(field);
}
// 这里统一处理 value、defaultValue 和无默认值三种情况，保证最终进入 valueMap 的结构稳定。
// 规则上优先读 value，其次读 defaultValue；如果都没有，则按字段类型补一个空值。
export function resolveDefaultFieldValue(field) {
    if (field?.value !== undefined) {
        return normalizeFieldValueByType(field, field.value);
    }
    if (field?.defaultValue !== undefined) {
        return normalizeFieldValueByType(field, field.defaultValue);
    }
    return getEmptyValueByType(field);
}
// 开发阶段模板作者只维护 configJson，SDK 会在这里把它转换成运行态快照 valueMap。
// 这份 valueMap 的职责很单一：为 useTemplateValue 提供一个路径读取友好的数据结构。
// 它不是模板作者维护的源文件，也不应该反向参与 configJson 的编辑。
export function buildValueMapFromConfig(config) {
    const result = {};
    // 模板当前规范只维护 dataSchema.fields。
    // SDK 会把这份字段列表直接折叠成 valueMap 根对象，模板层读取时不再经过 content 之类的包装节点。
    normalizeFields(config?.dataSchema?.fields).forEach((field) => {
        const fieldKey = String(field?.key || '').trim();
        if (!fieldKey) {
            return;
        }
        result[fieldKey] = resolveDefaultFieldValue(field);
    });
    return result;
}
