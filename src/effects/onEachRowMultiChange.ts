import {onFieldValueChange, onFieldMount} from '@formily/core';
import type {Form as FormilyForm, GeneralField, DataField} from '@formily/core';
import {parseRowIndex} from '../shared/paths';
import {applyRowState} from './onEachRowChange';

/**
 * Per-row multi-key reactive effect. Watches every `pre.*.k` for `k` in
 * `keys`; whenever any of them changes, `cb` fires with the row index, the
 * full set of field models + values for that row, which key triggered, and a
 * row-scoped `setFieldState`. Useful for derived row fields that depend on
 * several inputs (e.g. `total = price * qty - discount`).
 */
export interface EachRowMultiCtx {
    /** Absolute row index within the `pre` array. */
    index: number;
    /** Field models keyed by watched key (model may be undefined if not mounted). */
    fields: Record<string, GeneralField | undefined>;
    /** Values keyed by watched key. */
    values: Record<string, any>;
    /** Which watched key triggered this run. */
    triggerKey: string;
    /** The field model that triggered this run. */
    triggerField: DataField;
    /** Set state on a sibling key within this row: setFieldState(key, partial). */
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
        // Fire once per row on mount so the derived value is computed initially.
        onFieldMount(pattern, (field: GeneralField) => run(field, triggerKey));
    }
}
