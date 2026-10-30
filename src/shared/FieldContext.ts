import * as React from 'react';

/**
 * FieldContext 将解析后的字段路径与 Formily 字段模型沿组件树向下
 * 传递,使后代(相对名子项、表格单元格、数组行)能够解析自身的
 * name 并通过正确的 mutator 写入。
 */
export interface IFieldContext {
    /** 相对名的已解析路径前缀(在表单根节点为空字符串)。 */
    preName: string;
    /** 当前字段解析后的完整 name。 */
    name: string;
    /** Formily 字段模型,在表单根节点为 null。 */
    state: any;
    /** 若当前字段为 ArrayField,则为其数组 mutators。 */
    mutators?: any;
}

const ROOT_CONTEXT: IFieldContext = {
    preName: '',
    name: '',
    state: null,
};

export const FieldContext = React.createContext<IFieldContext>(ROOT_CONTEXT);

/**
 * 读取最近的 FieldContext。在 Form 之外会返回根上下文(preName 为
 * 空、state 为 null)而非抛错,这样可能在测试隔离环境中运行的工具
 * hook 不会崩溃。
 */
export function useFieldContext<T = IFieldContext>(): T {
    return React.useContext(FieldContext) as unknown as T;
}

export const FieldContextProvider = FieldContext.Provider;
