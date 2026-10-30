import type { DataField, Form as FormilyForm, GeneralField } from '@formily/core';
import { onFieldMount, onFieldValueChange } from '@formily/core';
import { parseRowIndex } from '../shared/paths';
import { applyRowState } from './onEachRowChange';

/**
 * 按行、多 key 的响应式 effect。监听 `keys` 中每个 `k` 对应的 `pre.*.k`；
 * 每当其中任一个变化时，`cb` 会被触发，并带上行索引、该行全部的字段模型 + 值、
 * 是哪个 key 触发的，以及一个行作用域的 `setFieldState`。适用于依赖多个输入的
 * 派生行字段（例如 `total = price * qty - discount`）。
 */
export interface EachRowMultiCtx {
    /** 在 `pre` 数组中的绝对行索引。 */
    index: number;
    /** 以被监听的 key 为键的字段模型（若未挂载，模型可能为 undefined）。 */
    fields: Record<string, GeneralField | undefined>;
    /** 以被监听的 key 为键的值。 */
    values: Record<string, any>;
    /** 本次运行由哪个被监听的 key 触发。 */
    triggerKey: string;
    /** 触发本次运行的字段模型。 */
    triggerField: DataField;
    /** 对本行内的兄弟 key 设置 state：setFieldState(key, partial)。 */
    setFieldState: (key: string, state: Record<string, any>) => void;
}

export type EachRowMultiCb = (ctx: EachRowMultiCtx) => void;

export function onEachRowMultiChange(
    form: FormilyForm,
    pre: string,
    keys: string[],
    cb: EachRowMultiCb,
): void {
    const run = (field: GeneralField, triggerKey: string) => {
        const idx = parseRowIndex(pre, field.path?.toString?.() ?? '');
        if (idx < 0) return;
        const fields: Record<string, GeneralField | undefined> = {};
        const values: Record<string, any> = {};
        for (const k of keys) {
            const f = form.query(`${pre}.${idx}.${k}`).take();
            fields[k] = f;
            values[k] = f ? (f as any).value : form.getValuesIn(`${pre}.${idx}.${k}`);
        }
        cb({
            index: idx,
            fields,
            values,
            triggerKey,
            triggerField: field as DataField,
            setFieldState: (scopedKey, state) => {
                applyRowState(form, pre, idx, scopedKey, state);
            },
        });
    };
    for (const triggerKey of keys) {
        const pattern = `${pre}.*.${triggerKey}`;
        onFieldValueChange(pattern, (field: GeneralField) => run(field, triggerKey));
        // 在每一行挂载时触发一次，使派生值在初始时就被计算出来。
        onFieldMount(pattern, (field: GeneralField) => run(field, triggerKey));
    }
}
