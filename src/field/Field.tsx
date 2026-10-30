import * as React from 'react';
import type { GeneralField } from '@formily/core';
import { Field as FormilyField, useField } from '@formily/react';
import { observer } from '@formily/reactive-react';
import { FieldContext } from '../shared/FieldContext';
import { prefixCls } from '../shared/prefixCls';
import { commonMap } from './commonMap';
import { FieldUi } from './FieldUi';
import { isOptionControl } from './isOptionControl';
import { NonEditable } from './NonEditable';
import { useSelectFirst } from './selectFirst';
import { useContentName } from './useContentName';

/**
 * render-prop 子元素收到的 API。按字段值类型 `Value` 泛型化，使
 * `<Form.Field<number>>{({ value }) => ...}` 中的 `value` / `onChange`
 * 获得精确类型（默认 `any`，不指定时与此前行为一致）。
 */
export interface FieldRenderApi<Value = any> {
    value: Value;
    onChange: (value: Value) => void;
    /** 底层 Formily 字段模型。 */
    state: GeneralField;
}

export interface FieldProps<Value = any> {
    /** 字段名;可相对于父级上下文(`.foo`、`..foo`)。 */
    name: string;
    /** 字段标签(首选)。省略时回退为 `title`。 */
    label?: React.ReactNode;
    /** @deprecated `label` 的别名,为向后兼容保留。请优先使用 `label`。 */
    title?: React.ReactNode;
    required?: boolean;
    editable?: boolean;
    /** 在传入控件之前对表单值做转换。 */
    format?: (value: Value) => any;
    /** 在写回表单之前对控件的 onChange 值做转换。 */
    parse?: (value: any) => Value;
    /** 挂载时自动选中第一个选项(用于单选的选项型控件)。 */
    selectFirst?: boolean;
    /** 仅渲染控件,不渲染标签 / 错误外壳。 */
    hideUi?: boolean;
    /** 仅显示必填标记 + 控件,隐藏标题。 */
    requiredOnlyUi?: boolean;
    /** Formily 校验器。 */
    validator?: any;
    /** Formily 字段联动(reactions)。 */
    reactions?: any;
    /** 可选的 Formily basePath 覆盖。 */
    basePath?: string;
    /** 一个控件元素,或一个接收 {value, onChange, state} 的 render-prop。 */
    children?: React.ReactElement | ((api: FieldRenderApi<Value>) => React.ReactNode);
}

interface FieldBodyProps {
    resolvedName: string;
    label?: React.ReactNode;
    required?: boolean;
    editable?: boolean;
    format?: (value: any) => any;
    parse?: (value: any) => any;
    selectFirst?: boolean;
    hideUi?: boolean;
    requiredOnlyUi?: boolean;
    content?: React.ReactElement | ((api: FieldRenderApi) => React.ReactNode);
}

/**
 * 根据 Formily 字段模型渲染字段内容。它位于 Formily 的 <Field> 内部,
 * 因此可以通过 useField() 读取字段 —— 让所有 hooks 都保持在组件顶层
 *(render-prop 回调中不放 hooks)。
 */
function FieldBodyImpl(props: FieldBodyProps): React.ReactElement | null {
    const field: any = useField();
    if (!field) {
        return null;
    }
    const {
        label,
        required,
        editable,
        format,
        parse,
        selectFirst,
        hideUi,
        requiredOnlyUi,
        content: children,
    } = props;

    useSelectFirst({ field, selectFirst, children });

    // 用于将 <label htmlFor> 与控件关联的稳定 id。仅当子元素是我们能注入
    // `id` 的具体元素时才使用(render-prop 情况不适用)。
    const autoId = React.useId();
    const isNonEditable = editable === false || field.editable === false;

    let content: React.ReactNode;
    let controlId: string | undefined;
    if (isNonEditable) {
        content = <NonEditable value={field.value} format={format} />;
    } else if (typeof children === 'function') {
        content = children({
            value: field.value,
            onChange: (value: any) => field.onInput(parse ? parse(value) : value),
            state: field,
        });
    } else if (React.isValidElement(children)) {
        const childEl = children as React.ReactElement<any>;
        const optionCtrl = isOptionControl(childEl);
        const inject = commonMap(field, { format, parse, isOptionControl: optionCtrl });
        controlId = childEl.props.id ?? autoId;
        const injectProps: Record<string, any> = {
            id: controlId,
            onChange: inject.onChange,
            onBlur: inject.onBlur,
            onFocus: inject.onFocus,
        };
        if (optionCtrl) {
            injectProps.checked = inject.checked;
        } else {
            injectProps.value = inject.value;
        }
        if (!childEl.props.placeholder && typeof label === 'string') {
            injectProps.placeholder = `请输入${label}`;
        }
        // 转发由 `linkedFieldProps` 派生的控件 props。该 effects 辅助函数会把
        // 它的 `compute` 结果合并进 `field.componentProps`;将其展开到控件上,
        // 这样例如级联得到的 `options` 就能传到 Select。
        const componentProps = (field as any)?.componentProps;
        if (componentProps && typeof componentProps === 'object') {
            Object.assign(injectProps, componentProps);
        }
        content = React.cloneElement(childEl, injectProps);
    } else {
        content = children ?? null;
    }

    let node: React.ReactNode;
    if (hideUi) {
        node = content;
    } else if (requiredOnlyUi) {
        node = (
            <div className={`${prefixCls}-field ${prefixCls}-field-required-only`}>
                {required && <span className={`${prefixCls}-field-required`}>*</span>}
                {content}
            </div>
        );
    } else {
        node = (
            <FieldUi
                label={label}
                htmlFor={controlId}
                required={required}
                error={(field as any)?.selfErrors?.[0]}
            >
                {content}
            </FieldUi>
        );
    }

    return (
        <FieldContext.Provider
            value={{
                preName: props.resolvedName,
                name: props.resolvedName,
                state: field,
                mutators: field?.mutators,
            }}
        >
            {node}
        </FieldContext.Provider>
    );
}

/**
 * 需要 `observer` 是因为 Formily 的 <Field> 使用了 `component={[]}`(不渲染
 * 任何组件),所以它自身的 ReactiveInternal 在渲染期间从不读取 `field.value` /
 * `field.errors`,因此也不会重新订阅这些变化。用 observer 包裹 FieldBody 使其
 * 对 value/error/pattern 变化保持响应式,从而让 render-prop 子元素、注入的控件
 * 以及错误信息都能同步更新。
 */
const FieldBody = observer(FieldBodyImpl);

/**
 * rsform 的 Field 包裹 Formily 的 <Field>,自动向子控件注入 value/onChange,
 * 对选项型控件切换为 `checked`,支持 format/parse 转换、editable=false ->
 * NonEditable、selectFirst、相对名称解析,并为后代发布一个 FieldContext。
 */
export function Field<Value = any>(props: FieldProps<Value>): React.ReactElement {
    const {
        name,
        label,
        title,
        required,
        editable,
        format,
        parse,
        selectFirst,
        hideUi,
        requiredOnlyUi,
        validator,
        reactions,
        basePath,
        children,
    } = props;

    const resolvedName = useContentName(name);
    // `label` 为规范属性;`title` 作为向后兼容的别名保留。
    const resolvedLabel = label ?? title;

    return (
        <FormilyField
            name={resolvedName}
            basePath={basePath ?? ''}
            title={resolvedLabel}
            required={required}
            editable={editable}
            validator={validator}
            reactions={reactions}
            component={[]}
        >
            <FieldBody
                resolvedName={resolvedName}
                label={resolvedLabel}
                required={required}
                editable={editable}
                format={format}
                parse={parse}
                selectFirst={selectFirst}
                hideUi={hideUi}
                requiredOnlyUi={requiredOnlyUi}
                content={children}
            />
        </FormilyField>
    );
}
