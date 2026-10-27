import {onFieldValueChange, onFieldMount} from '@formily/core';
import type {Form as FormilyForm, GeneralField, DataField} from '@formily/core';
import {parseRowIndex} from '../shared/paths';

/**
 * Per-row single-key reactive effect. Watches `pre.*.key`; whenever a row's
 * `key` value changes, `cb` fires with the row index, the changed field model,
 * and a `setFieldState(scopedKey, partialState)` scoped to that row.
 *
 * `pre` is the array field name (e.g. `rows`), `key` is a per-row child key
 * (e.g. `total`). Formily's `*` wildcard matches a single segment, so the
 * pattern `rows.*.total` matches `rows.0.total`, `rows.1.total`, …
 *
 * The row-scoped `setFieldState(key, partial)` writes `partial.value` (if
 * present) through `form.setValuesIn` so derived values persist even when the
 * target field is not currently rendered; any remaining state keys (visible,
 * display, …) are applied via `form.setFieldState`.
 */
export interface EachRowCtx {
    /** Absolute row index within the `pre` array. */
    index: number;
    /** The Formily field model that changed. */
    field: DataField;
    /** Set state on a sibling key within this row: setFieldState(key, partial). */
    setFieldState: (key: string, state: Record<string, any>) => void;
}

export type EachRowCb = (ctx: EachRowCtx) => void;

export function onEachRowChange(
    form: FormilyForm,
    pre: string,
    key: string,
    cb: EachRowCb,
): void {
    const pattern = `${pre}.*.${key}`;
    // `onFieldValueChange` yields a `DataField`; `onFieldMount` yields a
    // `GeneralField`. A `GeneralField`-accepting handler is assignable to both
    // (GeneralField is the supertype), and at runtime both fire only for
    // matching `rows.*.key` data fields, so the cast to `DataField` is sound.
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
    // Fire once per row when its `key` field mounts so the cb runs initially,
    // not only on the first change.
    onFieldMount(pattern, handler);
}

/** Shared row-state applier used by both array helpers. */
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
    const rest: Record<string, any> = {...state};
    delete rest.value;
    if (Object.keys(rest).length > 0) {
        form.setFieldState(path, (s: any) => {
            Object.assign(s, rest);
        });
    }
}

