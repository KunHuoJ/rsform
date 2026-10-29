import type * as React from 'react';
import { ArrayField as FormilyArrayField, useField } from '@formily/react';
import { observer } from '@formily/reactive-react';
import { useContentName } from '../field/useContentName';
import { FieldContext } from '../shared/FieldContext';
import { prefixCls } from '../shared/prefixCls';
import { ArrayFieldContext } from './useArrayItems';

export interface ArrayItemsProps {
    /** Array field name; may be relative (`.foo`, `..foo`) against the parent context. */
    name: string;
    /** Default value pushed when adding a new row. Defaults to `{}`. */
    itemDefaultValue?: any;
    /** Minimum number of rows; the remove button disables at or below this. */
    min?: number;
    /** Maximum number of rows; the add button disables at or above this. */
    max?: number;
    /**
     * Gate adding a new row. Receives `(values, itemDefaultValue)` and returns
     * `true`/void to allow, `false` to silently block, or a `string` to block and
     * surface as a form error.
     */
    validateBeforeAdd?: (values: any[], itemDefaultValue: any) => boolean | string | void;
    /** Label for the built-in add button. Defaults to '添加'. */
    addText?: React.ReactNode;
    /** Hide the built-in add button entirely (use with `renderAdd`). */
    addDisabled?: boolean;
    /**
     * Fully custom add button. Receives the `add()` trigger; render whatever you
     * want. When provided, the built-in add button is not rendered.
     */
    renderAdd?: (add: () => void) => React.ReactNode;
    /** Label/content for the built-in remove button. Defaults to '×'. */
    removeText?: React.ReactNode;
    /**
     * Gate removal. Receives `(index, values)`; return `false` (or a Promise that
     * resolves to `false`) to cancel the removal — handy for confirm dialogs.
     * Returning anything else (or omitting) proceeds.
     */
    onRemove?: (index: number, values: any[]) => boolean | Promise<boolean>;
    /**
     * Fully custom remove button for each row. Receives `(index, remove)`; render
     * whatever you want. When provided, the built-in remove button is not rendered.
     */
    renderRemove?: (index: number, remove: () => void) => React.ReactNode;
    /**
     * Show up/down move buttons per row. Defaults to `false` — most forms don't
     * need reordering; enable when order matters. Uses Formily `moveUp`/`moveDown`.
     */
    sortable?: boolean;
    /**
     * Row content. A render-prop `(value, index) => ReactNode` is typical —
     * return relative-name Fields (e.g. `<Field name="label">`) which resolve
     * against this row's path scope.
     */
    children?: ((value: any, index: number) => React.ReactNode) | React.ReactNode;
}

export interface ArrayRowProps {
    /** Zero-based row index. */
    index: number;
    /** Total rows in the array (for disabling up/down on the ends). */
    total: number;
    /** Minimum rows; the remove button disables at or below this. */
    min?: number;
    /** Whether to render up/down move buttons. */
    sortable?: boolean;
    /** Remove this row. */
    onRemove: () => void;
    /** Move this row up. */
    onMoveUp: () => void;
    /** Move this row down. */
    onMoveDown: () => void;
    /** Custom remove button; if provided, the built-in × is not rendered. */
    renderRemove?: () => React.ReactNode;
    /** Content for the built-in remove button. */
    removeText?: React.ReactNode;
    /** Row content (rendered inside a FieldContext scoped to this row). */
    children?: React.ReactNode;
}

/**
 * Presentational array row: the row content plus optional up/down move buttons
 * and a remove button. No drag — reordering is via up/down buttons (Formily
 * `moveUp`/`moveDown`), only shown when `sortable` is set. Remove is either the
 * built-in × button or a fully custom `renderRemove`.
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
 * The reactive body of ArrayItems: lives inside the Formily `<ArrayField>` so
 * `useField()` returns the array field model. `observer` makes it re-render on
 * value/length changes.
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
 * rsform ArrayItems: a lightweight add/remove list backed by a Formily
 * `ArrayField`, in the spirit of antd's `Form.List`. `min`/`max`/
 * `validateBeforeAdd` gate mutations; up/down buttons are opt-in via `sortable`
 * (most forms don't need reordering). Add and remove are both customizable:
 * `renderAdd`/`renderRemove` fully replace the built-in buttons, `onRemove`
 * gates removal (e.g. confirm dialogs). Row content is a render-prop receiving
 * `(value, index)` and runs inside a FieldContext scoped to that row's path, so
 * relative-name Fields (`.foo`) resolve to `name.index.foo`.
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
