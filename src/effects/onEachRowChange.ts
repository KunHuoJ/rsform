import type { DataField, Form as FormilyForm, GeneralField } from '@formily/core';
import { onFieldMount, onFieldValueChange } from '@formily/core';
import { parseRowIndex } from '../shared/paths';

/**
 * 按行、单 key 的响应式 effect。监听 `pre.*.key`；每当某一行的 `key` 值变化时，
 * `cb` 会被触发，并带上行索引、发生变化的字段模型，以及一个作用域限定在该行的
 * `setFieldState(scopedKey, partialState)`。
 *
 * `pre` 是数组字段名（例如 `rows`），`key` 是每行的子 key（例如 `total`）。
 * Formily 的 `*` 通配符匹配单个路径段，因此模式 `rows.*.total` 可匹配
 * `rows.0.total`、`rows.1.total`、…
 *
 * 行作用域的 `setFieldState(key, partial)` 会把 `partial.value`（若存在）
 * 通过 `form.setValuesIn` 写入，使派生值即使在目标字段当前未渲染时也能持久化；
 * 其余任何 state key（visible、display、…）则通过 `form.setFieldState` 应用。
 */
export interface EachRowCtx {
    /** 在 `pre` 数组中的绝对行索引。 */
    index: number;
    /** 发生变化的 Formily 字段模型。 */
    field: DataField;
    /** 对本行内的兄弟 key 设置 state：setFieldState(key, partial)。 */
    setFieldState: (key: string, state: Record<string, any>) => void;
}

export type EachRowCb = (ctx: EachRowCtx) => void;

export function onEachRowChange(form: FormilyForm, pre: string, key: string, cb: EachRowCb): void {
    const pattern = `${pre}.*.${key}`;
    // `onFieldValueChange` 产出 `DataField`；`onFieldMount` 产出 `GeneralField`。
    // 一个接受 `GeneralField` 的处理器对两者都可赋值（GeneralField 是其父类型），
    // 且在运行时两者都只对匹配 `rows.*.key` 的数据字段触发，因此向下转型为
    // `DataField` 是可靠的。
    const handler = (field: GeneralField) => {
        const idx = parseRowIndex(pre, field.path?.toString?.() ?? '');
        if (idx < 0) return;
        cb({
            index: idx,
            field: field as DataField,
            setFieldState: (scopedKey, state) => {
                applyRowState(form, pre, idx, scopedKey, state);
            },
        });
    };
    onFieldValueChange(pattern, handler);
    // 在每一行的 `key` 字段挂载时触发一次，使 cb 在初始时就运行，
    // 而不仅仅在首次变更时运行。
    onFieldMount(pattern, handler);
}

/** 两个数组 helper 共用的行 state 应用器。 */
export function applyRowState(
    form: FormilyForm,
    pre: string,
    index: number,
    scopedKey: string,
    state: Record<string, any>,
): void {
    const path = `${pre}.${index}.${scopedKey}`;
    if (Object.prototype.hasOwnProperty.call(state, 'value')) {
        form.setValuesIn(path, state.value);
    }
    const rest: Record<string, any> = { ...state };
    delete rest.value;
    if (Object.keys(rest).length > 0) {
        form.setFieldState(path, (s: any) => {
            Object.assign(s, rest);
        });
    }
}
