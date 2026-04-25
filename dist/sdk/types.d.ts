import type { Ref } from 'vue';
export type TemplateMediaObject = {
    url?: string;
    alt?: string;
    poster?: string;
};
export type TemplateMediaValue = TemplateMediaObject | null;
export type TemplateFieldType = 'string' | 'number' | 'boolean' | 'image' | 'video' | 'array';
export type TemplateFieldSchema = TemplateField[];
export type TemplateArrayValueItem = TemplateField;
export type TemplateArrayOperation = 'add' | 'delete';
type StringKeyOf<T> = Extract<keyof T, string>;
type ArrayItem<T> = T extends readonly (infer Item)[] ? Item : never;
type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends ((value: infer I) => void) ? I : never;
type Simplify<T> = {
    [Key in keyof T]: T[Key];
} & {};
type MergeObjectUnion<U> = Simplify<UnionToIntersection<U>>;
type TemplateRuntimeValueFromLiteral<Value> = Value extends readonly (infer Item)[] ? Array<TemplateRuntimeValueFromLiteral<Item>> : Value extends object ? {
    [Key in keyof Value]: TemplateRuntimeValueFromLiteral<Value[Key]>;
} : Value;
type TemplateFieldBase = {
    key: string;
    type: TemplateFieldType;
    path?: string;
    label?: string;
};
export type TemplateStringField = TemplateFieldBase & {
    type: 'string';
    value?: string;
    defaultValue?: string;
};
export type TemplateNumberField = TemplateFieldBase & {
    type: 'number';
    value?: number;
    defaultValue?: number;
};
export type TemplateBooleanField = TemplateFieldBase & {
    type: 'boolean';
    value?: boolean;
    defaultValue?: boolean;
};
export type TemplateImageField = TemplateFieldBase & {
    type: 'image';
    value?: string;
    defaultValue?: string;
};
export type TemplateVideoField = TemplateFieldBase & {
    type: 'video';
    value?: string;
    defaultValue?: string;
};
export type TemplateArrayField = TemplateFieldBase & {
    type: 'array';
    value?: TemplateArrayValueItem[];
    defaultValue?: TemplateArrayValueItem[];
    operations?: TemplateArrayOperation[];
};
type TemplateFieldRuntimeValue<Field> = Field extends {
    type: 'string';
} ? string : Field extends {
    type: 'number';
} ? number : Field extends {
    type: 'boolean';
} ? boolean : Field extends {
    type: 'image' | 'video';
} ? TemplateMediaObject : Field extends {
    type: 'array';
    value?: infer Value;
} ? Value extends readonly unknown[] ? Array<TemplateRuntimeValueFromLiteral<ArrayItem<Value>>> : unknown[] : unknown;
type TemplateFieldRuntimeRecord<Field> = Field extends {
    key: infer Key extends string;
} ? {
    [Name in Key]: TemplateFieldRuntimeValue<Field>;
} : {};
type TemplateFieldsRuntimeValue<Fields> = Fields extends readonly unknown[] ? MergeObjectUnion<TemplateFieldRuntimeRecord<Fields[number]>> : Record<string, unknown>;
type TemplateDotArrayPath<T> = T extends readonly unknown[] ? `${number}` | (TemplateNestedPath<ArrayItem<T>> extends never ? never : `${number}.${TemplateNestedPath<ArrayItem<T>>}`) : never;
type TemplateBracketArrayPath<T> = T extends readonly unknown[] ? `[${number}]` | (TemplateNestedPath<ArrayItem<T>> extends never ? never : `[${number}].${TemplateNestedPath<ArrayItem<T>>}`) : never;
type TemplateArrayPath<T> = TemplateDotArrayPath<T> | TemplateBracketArrayPath<T>;
type TemplateChildPath<T> = T extends readonly unknown[] ? `.${TemplateDotArrayPath<T>}` | `${TemplateBracketArrayPath<T>}` : T extends object ? `.${TemplateNestedPath<T>}` : never;
type TemplateNestedPath<T> = T extends readonly unknown[] ? TemplateArrayPath<T> : T extends object ? {
    [Key in StringKeyOf<T>]: Key | (TemplateChildPath<T[Key]> extends never ? never : `${Key}${TemplateChildPath<T[Key]>}`);
}[StringKeyOf<T>] : never;
type NormalizeTemplatePath<Path extends string> = Path extends `${infer Head}[${infer Index}]${infer Tail}` ? NormalizeTemplatePath<`${Head extends '' ? '' : `${Head}.`}${Index}${Tail}`> : Path extends `.${infer Rest}` ? NormalizeTemplatePath<Rest> : Path;
type TemplatePathValue<Source, Path extends string> = Path extends `${infer Head}.${infer Tail}` ? Head extends StringKeyOf<Source> ? TemplatePathValue<Source[Head], Tail> : Head extends `${number}` ? Source extends readonly unknown[] ? TemplatePathValue<ArrayItem<Source>, Tail> : unknown : unknown : Path extends StringKeyOf<Source> ? Source[Path] : Path extends `${number}` ? Source extends readonly unknown[] ? ArrayItem<Source> : unknown : unknown;
export type TemplateField = TemplateStringField | TemplateNumberField | TemplateBooleanField | TemplateImageField | TemplateVideoField | TemplateArrayField;
export type TemplateConfig = {
    meta?: Record<string, unknown>;
    dataSchema?: {
        fields?: TemplateField[];
    };
    functions?: Record<string, unknown>;
};
export type TemplateValidationIssue = {
    path: string;
    message: string;
};
export type TemplateBuildArtifacts = {
    configJson: TemplateConfig;
    valueMap: Record<string, unknown>;
};
export type ValidateTemplateConfigKeys<Config> = Config;
export type ValidatedTemplateConfig<Config extends TemplateConfig> = Config;
export type InferTemplateValueMap<Config> = Simplify<TemplateFieldsRuntimeValue<Config extends {
    dataSchema?: {
        fields?: infer Fields;
    };
} ? Fields : never>>;
export interface TemplateValueMapRegistry {
}
export type RegisteredTemplateValueMap = keyof TemplateValueMapRegistry extends never ? Record<string, unknown> : Simplify<TemplateValueMapRegistry>;
export type TemplateValuePath = TemplateNestedPath<RegisteredTemplateValueMap>;
export type TemplateValueAtPath<Path extends string> = TemplatePathValue<RegisteredTemplateValueMap, NormalizeTemplatePath<Path>>;
export type TemplateSdkOptions = {
    configJson: unknown;
};
export type TemplateContext = {
    config: Ref<TemplateConfig | null>;
    valueMap: Ref<Record<string, unknown> | null>;
    resolvePath: (path: string, scopeBasePath?: string) => string;
    resolveValue: (path: string) => unknown;
};
export {};
