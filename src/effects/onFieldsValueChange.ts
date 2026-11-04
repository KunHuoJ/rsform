import type { Form as FormilyForm, GeneralField } from '@formily/core';
import { onFieldValueChange } from '@formily/core';

export interface FieldsValueChangeCtx {
    /** 以各 key 为键的当前值（未挂载的字段从 form.values 读取）。 */
    values: Record<string, any>;
    /** 本次由哪个 key 触发。 */
    triggerKey: string;
    /** 触发本次运行的字段模型。 */
    triggerField: GeneralField;
}

export type FieldsValueChangeCb = (ctx: FieldsValueChangeCtx) => void;

/**
 * 多字段值变化监听。监听 `keys` 中每个字段的值变化，任一变化即触发 `cb`，
 * 回调收到所有 key 的当前值、本次触发的 key 与字段模型。是 `onFieldValueChange`
 * 的多字段版本（单字段用 `onFieldValueChange`，多字段用本 helper）。
 *
 * 初始化不会触发（与 `onFieldValueChange` 一致）——只在字段值真正变化时运行。
 * 需要「初始化也要执行」时改用 `onFieldReact`。需要驯服高频触发（如发请求前
 * 防抖）时，在 `cb` 内部配合 `$.debounce` 使用。
 *
 * @example
 * $.onFieldsValueChange(['province', 'city'], ({values}) => {
 *   // province 或 city 任一变化都重跑
 *   $.form.setFieldState('label', s => { s.value = `${values.province}/${values.city}`; });
 * });
 */
export function onFieldsValueChange(
    form: FormilyForm,
    keys: string[],
    cb: FieldsValueChangeCb,
): void {
    const readValues = (): Record<string, any> => {
        const values: Record<string, any> = {};
        for (const k of keys) {
            values[k] = form.getValuesIn(k);
        }
        return values;
    };
    for (const triggerKey of keys) {
        onFieldValueChange(triggerKey, (field: GeneralField) => {
            cb({ values: readValues(), triggerKey, triggerField: field });
        });
    }
}
