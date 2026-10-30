import type * as React from 'react';
import { ArrayField as FormilyArrayField, useField } from '@formily/react';
import { observer } from '@formily/reactive-react';
import { useContentName } from '../field/useContentName';
import { FieldContext } from '../shared/FieldContext';
import { prefixCls } from '../shared/prefixCls';
import { ArrayFieldContext } from './useArrayItems';

export interface ArrayItemsProps {
    /** 数组字段名;可相对于父级上下文使用相对路径(`.foo`、`..foo`)。 */
    name: string;
    /** 新增一行时推入的默认值。默认为 `{}`。 */
    itemDefaultValue?: any;
    /** 最小行数;达到或低于该值时删除按钮禁用。 */
    min?: number;
    /** 最大行数;达到或超过该值时新增按钮禁用。 */
    max?: number;
    /**
     * 新增行前的拦截校验。接收 `(values, itemDefaultValue)`,返回
     * `true`/void 表示允许,`false` 表示静默拦截,或返回 `string` 拦截并
     * 作为表单错误提示展示。
     */
    validateBeforeAdd?: (values: any[], itemDefaultValue: any) => boolean | string | void;
    /** 内置新增按钮的文案。默认为 '添加'。 */
    addText?: React.ReactNode;
    /** 完全隐藏内置新增按钮(配合 `renderAdd` 使用)。 */
    addDisabled?: boolean;
    /**
     * 完全自定义新增按钮。接收 `add()` 触发函数,由你自由渲染。
     * 提供该属性时,不再渲染内置新增按钮。
     */
    renderAdd?: (add: () => void) => React.ReactNode;
    /** 内置删除按钮的文案/内容。默认为 '×'。 */
    removeText?: React.ReactNode;
    /**
     * 删除前的拦截。接收 `(index, values)`;返回 `false`(或 resolve 为
     * `false` 的 Promise)可取消删除 —— 便于接入确认弹窗。
     * 返回其他值(或不提供)则继续删除。
     */
    onRemove?: (index: number, values: any[]) => boolean | Promise<boolean>;
    /**
     * 每行完全自定义的删除按钮。接收 `(index, remove)`,由你自由渲染。
     * 提供该属性时,不再渲染内置删除按钮。
     */
    renderRemove?: (index: number, remove: () => void) => React.ReactNode;
    /**
     * 每行是否显示上移/下移按钮。默认为 `false` —— 多数表单不需要
     * 重新排序;当顺序重要时再开启。底层使用 Formily 的 `moveUp`/`moveDown`。
     */
    sortable?: boolean;
    /**
     * 行内容。通常为 render-prop `(value, index) => ReactNode` ——
     * 返回使用相对名的 Field(例如 `<Field name="label">`),它们会
     * 相对于当前行的路径作用域解析。
     */
    children?: ((value: any, index: number) => React.ReactNode) | React.ReactNode;
}

export interface ArrayRowProps {
    /** 从 0 开始的行索引。 */
    index: number;
    /** 数组的总行数(用于在首尾禁用上移/下移)。 */
    total: number;
    /** 最小行数;达到或低于该值时删除按钮禁用。 */
    min?: number;
    /** 是否渲染上移/下移按钮。 */
    sortable?: boolean;
    /** 删除当前行。 */
    onRemove: () => void;
    /** 将当前行上移。 */
    onMoveUp: () => void;
    /** 将当前行下移。 */
    onMoveDown: () => void;
    /** 自定义删除按钮;提供时不再渲染内置的 ×。 */
    renderRemove?: () => React.ReactNode;
    /** 内置删除按钮的内容。 */
    removeText?: React.ReactNode;
    /** 行内容(渲染在以当前行为作用域的 FieldContext 内)。 */
    children?: React.ReactNode;
}

/**
 * 展示型数组行:行内容加上可选的上移/下移按钮和一个删除按钮。
 * 不支持拖拽 —— 通过上移/下移按钮(Formily 的 `moveUp`/`moveDown`)
 * 重新排序,仅在设置了 `sortable` 时显示。删除按钮为内置的 ×
 * 按钮,或完全自定义的 `renderRemove`。
 */
function ArrayRow({
    index,
    total,
    min,
    sortable,
    onRemove,
    onMoveUp,
    onMoveDown,
    renderRemove,
    removeText,
    children,
}: ArrayRowProps): React.ReactElement {
    const atTop = index <= 0;
    const atBottom = index >= total - 1;
    const removeDisabled = min != null && total <= min;

    return (
        <div className={`${prefixCls}-array-item`}>
            <div className={`${prefixCls}-array-item-content`}>{children}</div>
            <div className={`${prefixCls}-array-item-actions`}>
                {sortable && (
                    <>
                        <button
                            type="button"
                            className={`${prefixCls}-array-item-up`}
                            onClick={onMoveUp}
                            disabled={atTop}
                            title="上移"
                            aria-label="上移"
                        >
                            ↑
                        </button>
                        <button
                            type="button"
                            className={`${prefixCls}-array-item-down`}
                            onClick={onMoveDown}
                            disabled={atBottom}
                            title="下移"
                            aria-label="下移"
                        >
                            ↓
                        </button>
                    </>
                )}
                {renderRemove ? (
                    renderRemove()
                ) : (
                    <button
                        type="button"
                        className={`${prefixCls}-array-item-remove`}
                        onClick={onRemove}
                        disabled={removeDisabled}
                        title="删除"
                        aria-label="删除"
                    >
                        {removeText ?? '×'}
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * ArrayItems 的响应式主体:位于 Formily `<ArrayField>` 内部,因此
 * `useField()` 返回的是数组字段模型。`observer` 使其在值/长度变化时
 * 重渲染。
 */
const ArrayItemsBody = observer(function ArrayItemsBody({
    name,
    itemDefaultValue,
    min,
    max,
    validateBeforeAdd,
    addText,
    addDisabled,
    renderAdd,
    removeText,
    onRemove,
    renderRemove,
    sortable,
    children,
}: Omit<ArrayItemsProps, 'name'> & { name: string }): React.ReactElement {
    const field: any = useField();
    const values: any[] = Array.isArray(field?.value) ? field.value : [];

    const atMax = max != null && values.length >= max;
    const handleAdd = async () => {
        if (atMax) return;
        if (validateBeforeAdd) {
            const result = validateBeforeAdd(values, itemDefaultValue);
            if (result === false) return;
            if (typeof result === 'string') {
                field?.setFeedback({ type: 'error', messages: [result] });
                return;
            }
        }
        await field?.push(itemDefaultValue ?? {});
    };
    const handleRemove = async (index: number) => {
        if (min != null && values.length <= min) return;
        if (onRemove) {
            const ok = await onRemove(index, values);
            if (ok === false) return;
        }
        field?.remove(index);
    };

    const renderRow = (value: any, index: number): React.ReactNode => {
        const rowPath = `${name}.${index}`;
        const content =
            typeof children === 'function'
                ? (children as (v: any, i: number) => React.ReactNode)(value, index)
                : children;
        return (
            <FieldContext.Provider
                key={`${name}#${index}`}
                value={{ preName: rowPath, name: rowPath, state: null }}
            >
                <ArrayRow
                    index={index}
                    total={values.length}
                    min={min}
                    sortable={sortable}
                    onRemove={() => handleRemove(index)}
                    onMoveUp={() => field?.moveUp(index)}
                    onMoveDown={() => field?.moveDown(index)}
                    renderRemove={
                        renderRemove
                            ? () => renderRemove(index, () => handleRemove(index))
                            : undefined
                    }
                    removeText={removeText}
                >
                    {content}
                </ArrayRow>
            </FieldContext.Provider>
        );
    };

    return (
        <ArrayFieldContext.Provider value={field}>
            <div className={`${prefixCls}-array-items`}>
                {values.map((v, i) => renderRow(v, i))}
                {renderAdd
                    ? renderAdd(() => handleAdd())
                    : !addDisabled && (
                          <button
                              type="button"
                              className={`${prefixCls}-array-items-add`}
                              onClick={handleAdd}
                              disabled={atMax}
                          >
                              {addText ?? '添加'}
                          </button>
                      )}
            </div>
        </ArrayFieldContext.Provider>
    );
});

/**
 * rsform ArrayItems:一个基于 Formily `ArrayField` 的轻量增删列表,
 * 理念类似 antd 的 `Form.List`。`min`/`max`/`validateBeforeAdd`
 * 用于拦截修改操作;上移/下移按钮通过 `sortable` 按需开启(多数
 * 表单不需要重新排序)。新增与删除均可自定义:`renderAdd`/
 * `renderRemove` 完全替换内置按钮,`onRemove` 拦截删除(例如确认
 * 弹窗)。行内容是一个接收 `(value, index)` 的 render-prop,运行在
 * 以当前行路径为作用域的 FieldContext 内,因此相对名的 Field(`.foo`)
 * 会解析为 `name.index.foo`。
 */
export function ArrayItems(props: ArrayItemsProps): React.ReactElement {
    const { name, ...rest } = props;
    const resolvedName = useContentName(name);
    return (
        <FormilyArrayField name={resolvedName} basePath="">
            <ArrayItemsBody name={resolvedName} {...rest} />
        </FormilyArrayField>
    );
}
