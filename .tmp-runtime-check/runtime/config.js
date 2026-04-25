import { buildValueMapFromConfig, cloneValue, isObjectRecord } from './helpers.js';
const SUPPORTED_FIELD_TYPES = [
    'string',
    'text',
    'number',
    'boolean',
    'image',
    'video',
    'array',
];
const SUPPORTED_ARRAY_OPERATIONS = ['add', 'delete'];
// 运行时校验的目标不是代替模板作者“猜”配置，而是尽早阻止不合法的 configJson 进入上下文。
// 一旦 SDK 安装成功，后续读取链路就默认认为配置已经通过校验，不再重复做节点级防御。
function pushIssue(issues, path, message) {
    issues.push({ path, message });
}
function validateOptionalString(value, path, label, issues) {
    if (value !== undefined && typeof value !== 'string') {
        pushIssue(issues, path, `${label} 必须是字符串`);
    }
}
function validateOptionalRecord(value, path, label, issues) {
    if (value !== undefined && !isObjectRecord(value)) {
        pushIssue(issues, path, `${label} 必须是对象`);
    }
}
function validateArrayOperations(value, path, label, issues) {
    if (value === undefined) {
        return;
    }
    if (!Array.isArray(value)) {
        pushIssue(issues, path, `${label} 必须是字符串数组`);
        return;
    }
    const operationSet = new Set();
    value.forEach((operation, index) => {
        const operationPath = `${path}[${index}]`;
        if (typeof operation !== 'string') {
            pushIssue(issues, operationPath, '操作项必须是字符串');
            return;
        }
        if (!SUPPORTED_ARRAY_OPERATIONS.includes(operation)) {
            pushIssue(issues, operationPath, `仅支持以下操作：${SUPPORTED_ARRAY_OPERATIONS.join(', ')}`);
            return;
        }
        if (operationSet.has(operation)) {
            pushIssue(issues, operationPath, `操作 ${operation} 重复`);
            return;
        }
        operationSet.add(operation);
    });
}
function validateMediaFieldValue(value, path, label, issues) {
    // 配置规范里媒体字段现在只接受字符串路径。
    // 运行时仍会把这个字符串归一成对象，方便模板层继续稳定读取 url / poster / alt。
    if (value === undefined) {
        return;
    }
    validateOptionalString(value, path, label, issues);
}
function validateScalarFieldValue(value, expectedType, path, label, issues) {
    if (value === undefined) {
        return;
    }
    if (expectedType === 'number' && typeof value !== 'number') {
        pushIssue(issues, path, `${label} 必须是数字`);
    }
    if (expectedType === 'boolean' && typeof value !== 'boolean') {
        pushIssue(issues, path, `${label} 必须是布尔值`);
    }
    if ((expectedType === 'string' || expectedType === 'text') && typeof value !== 'string') {
        pushIssue(issues, path, `${label} 必须是字符串`);
    }
}
function validateValueAgainstField(field, value, path, label, issues) {
    const type = field.type;
    switch (type) {
        case 'string':
        case 'text':
        case 'number':
        case 'boolean':
            validateScalarFieldValue(value, type, path, label, issues);
            return;
        case 'image':
        case 'video':
            validateMediaFieldValue(value, path, label, issues);
            return;
        case 'array':
            validateArrayFieldValue(value, path, label, issues);
            return;
        default:
            return;
    }
}
function getStructureKind(value) {
    if (Array.isArray(value)) {
        return 'array';
    }
    if (value === null) {
        return 'null';
    }
    if (isObjectRecord(value)) {
        return 'object';
    }
    return typeof value;
}
function formatStructureKind(kind) {
    switch (kind) {
        case 'array':
            return '数组';
        case 'object':
            return '对象';
        case 'string':
            return '字符串';
        case 'number':
            return '数字';
        case 'boolean':
            return '布尔值';
        case 'null':
            return 'null';
        default:
            return kind;
    }
}
function compareObjectStructure(reference, value, path, referencePath, issues) {
    const referenceKeys = Object.keys(reference);
    const valueKeys = Object.keys(value);
    const missingKeys = referenceKeys.filter((key) => !valueKeys.includes(key));
    const extraKeys = valueKeys.filter((key) => !referenceKeys.includes(key));
    if (missingKeys.length) {
        pushIssue(issues, path, `结构必须与 ${referencePath} 一致，缺少字段：${missingKeys.join(', ')}`);
    }
    if (extraKeys.length) {
        pushIssue(issues, path, `结构必须与 ${referencePath} 一致，存在多余字段：${extraKeys.join(', ')}`);
    }
    referenceKeys.forEach((key) => {
        if (!valueKeys.includes(key)) {
            return;
        }
        compareValueStructure(reference[key], value[key], `${path}.${key}`, `${referencePath}.${key}`, issues);
    });
}
function compareArrayStructure(reference, value, path, referencePath, issues) {
    if (!reference.length) {
        return;
    }
    const referenceItem = reference[0];
    if (!isObjectRecord(referenceItem)) {
        return;
    }
    value.forEach((item, index) => {
        if (!isObjectRecord(item)) {
            return;
        }
        compareObjectStructure(referenceItem, item, `${path}[${index}]`, `${referencePath}[0]`, issues);
    });
}
function compareValueStructure(reference, value, path, referencePath, issues) {
    const referenceKind = getStructureKind(reference);
    const valueKind = getStructureKind(value);
    if (referenceKind !== valueKind) {
        pushIssue(issues, path, `结构必须与 ${referencePath} 一致，期望 ${formatStructureKind(referenceKind)}，实际 ${formatStructureKind(valueKind)}`);
        return;
    }
    if (isObjectRecord(reference) && isObjectRecord(value)) {
        compareObjectStructure(reference, value, path, referencePath, issues);
        return;
    }
    if (Array.isArray(reference) && Array.isArray(value)) {
        compareArrayStructure(reference, value, path, referencePath, issues);
    }
}
function validateSiblingFieldKeys(fields, path, issues) {
    const keySet = new Set();
    fields.forEach((field, index) => {
        if (!isObjectRecord(field) || typeof field.key !== 'string' || !field.key.trim()) {
            return;
        }
        const normalizedKey = field.key.trim();
        const fieldPath = `${path}[${index}]`;
        if (keySet.has(normalizedKey)) {
            pushIssue(issues, `${fieldPath}.key`, `字段 key ${normalizedKey} 重复`);
            return;
        }
        keySet.add(normalizedKey);
    });
}
function validateArrayFieldValue(value, path, label, issues) {
    if (value === undefined) {
        return;
    }
    if (!Array.isArray(value)) {
        pushIssue(issues, path, `${label} 必须是数组`);
        return;
    }
    validateSiblingFieldKeys(value, path, issues);
    value.forEach((itemValue, itemIndex) => {
        validateField(itemValue, `${path}[${itemIndex}]`, issues);
    });
}
function validateArrayField(field, path, issues) {
    // 数组字段和其他字段对齐后，只保留 value 作为数据来源。
    // operations 继续只表达编辑态可执行的数组操作，目前只支持 add / delete。
    validateArrayOperations(field.operations, `${path}.operations`, '字段 operations', issues);
    validateArrayFieldValue(field.value, `${path}.value`, '字段 value', issues);
    validateArrayFieldValue(field.defaultValue, `${path}.defaultValue`, '字段 defaultValue', issues);
}
function validateField(field, path, issues) {
    if (!isObjectRecord(field)) {
        pushIssue(issues, path, '字段节点必须是对象');
        return;
    }
    const key = field.key;
    const type = field.type;
    if (typeof key !== 'string' || !key.trim()) {
        pushIssue(issues, `${path}.key`, '字段 key 必须是非空字符串');
    }
    if (typeof type !== 'string' || !SUPPORTED_FIELD_TYPES.includes(type)) {
        pushIssue(issues, `${path}.type`, `字段 type 必须是受支持的类型：${SUPPORTED_FIELD_TYPES.join(', ')}`);
        return;
    }
    validateOptionalString(field.label, `${path}.label`, '字段 label', issues);
    validateOptionalString(field.path, `${path}.path`, '字段 path', issues);
    // 这里按字段类型分支校验，是为了把“节点类型”和“默认值形态”绑定起来。
    // 模板项目只传一份 configJson，所以 SDK 必须在安装期把所有结构问题一次性暴露出来。
    switch (type) {
        case 'string':
        case 'text':
        case 'number':
        case 'boolean':
            validateValueAgainstField(field, field.value, `${path}.value`, '字段 value', issues);
            validateScalarFieldValue(field.defaultValue, type, `${path}.defaultValue`, '字段 defaultValue', issues);
            break;
        case 'image':
        case 'video':
            validateValueAgainstField(field, field.value, `${path}.value`, '字段 value', issues);
            validateMediaFieldValue(field.defaultValue, `${path}.defaultValue`, '字段 defaultValue', issues);
            break;
        case 'array':
            validateArrayField(field, path, issues);
            break;
        default:
            break;
    }
}
function validateFields(fields, path, issues) {
    if (!Array.isArray(fields)) {
        pushIssue(issues, path, '必须是字段数组');
        return;
    }
    validateSiblingFieldKeys(fields, path, issues);
    fields.forEach((field, index) => {
        const fieldPath = `${path}[${index}]`;
        validateField(field, fieldPath, issues);
    });
}
export function validateTemplateConfig(configJson) {
    const issues = [];
    // validateTemplateConfig 是所有公开构建入口的统一前置步骤。
    // 不论是插件安装，还是构建 JSON 文件，都必须先过这一层，避免规则分叉。
    if (!isObjectRecord(configJson)) {
        pushIssue(issues, 'configJson', '必须是对象');
    }
    else {
        validateOptionalRecord(configJson.meta, 'configJson.meta', 'meta', issues);
        validateOptionalRecord(configJson.functions, 'configJson.functions', 'functions', issues);
        if (configJson.dataSchema !== undefined && !isObjectRecord(configJson.dataSchema)) {
            pushIssue(issues, 'configJson.dataSchema', 'dataSchema 必须是对象');
        }
        const fields = isObjectRecord(configJson.dataSchema) ? configJson.dataSchema.fields : undefined;
        if (fields !== undefined) {
            validateFields(fields, 'configJson.dataSchema.fields', issues);
        }
    }
    if (issues.length) {
        // 报错信息保留完整路径，目的是让模板作者能快速定位到具体节点，而不是只看到一个笼统的“配置无效”。
        const message = issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
        throw new Error(`template-sdk configJson 校验失败:\n${message}`);
    }
    return cloneValue(configJson);
}
export function buildTemplateValueMap(configJson) {
    // 这个方法暴露给外部构建脚本或测试用例时，仍然保证先校验再构建，
    // 避免调用方绕过规则直接得到一份看似可用但结构不可靠的 valueMap。
    return buildValueMapFromConfig(validateTemplateConfig(configJson));
}
export function buildTemplateArtifacts(configJson) {
    // 构建流程里同时返回规范化后的 configJson 和 valueMap，
    // 目的是让落盘产物都来自 SDK 认可过的同一份数据，而不是调用方自己拼接。
    const normalizedConfig = validateTemplateConfig(configJson);
    return {
        configJson: normalizedConfig,
        valueMap: buildValueMapFromConfig(normalizedConfig),
    };
}
export function buildTemplateJsonFiles(configJson, space = 2) {
    // SDK 不直接负责写文件，只负责给出可直接写盘的 JSON 文本。
    // 这样前端项目、Node 构建脚本或其他工具链都可以复用，而不把文件系统能力硬编码进 SDK。
    const artifacts = buildTemplateArtifacts(configJson);
    return {
        configJson: JSON.stringify(artifacts.configJson, null, space),
        valueMap: JSON.stringify(artifacts.valueMap, null, space),
    };
}
export function isTemplateField(value) {
    return isObjectRecord(value) && typeof value.key === 'string' && typeof value.type === 'string';
}
