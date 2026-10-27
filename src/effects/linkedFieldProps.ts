import {onFieldValueChange} from '@formily/core';
import type {Form as FormilyForm, GeneralField} from '@formily/core';

/**
 * The compute function receives the current dep values keyed by dep name and
 * the target field model (if mounted). It returns a partial object that is
 * split: Formily top-level state keys (visible/title/required/…) are set on the
 * field state directly; the rest (options/disabled/placeholder/…) are merged
 * into `componentProps` and forwarded to the control. Returning a Promise makes
 * the derivation async (e.g. fetching cascade options).
 */
export type LinkedFieldPropsCompute = (
    values: Record<string, any>,
    targetField: GeneralField | undefined,
) => Record<string, any> | Promise<Record<string, any>>;

/**
 * Reactively derive the target's state/props from one or more dependency
 * fields. When any dep value changes (and once on initial registration), the
 * dep values are collected, `compute({ [dep]: value })` is invoked, and the
 * returned object is split and applied to the target field's state:
 *
 *  - Formily top-level field state keys (`visible`, `display`, `editable`,
 *    `required`, `title`, `value`, `dataSource`, …) are set directly on the
 *    state — so `{visible: false}` hides the field, `{title: 'X'}` relabels it.
 *  - Everything else (`options`, `disabled`, `placeholder`, `loading`, …) is
 *    merged into `state.componentProps`, which rsform's Field forwards to the
 *    control via cloneElement — so `{options: [...]}` reaches the Select.
 *
 * Async results are guarded by a per-target monotonic token so a slow earlier
 * request can never overwrite a newer one.
 */
export function linkedFieldProps(
    form: FormilyForm,
    target: string,
    deps: string[],
    compute: LinkedFieldPropsCompute,
): void {
    let token = 0;

    // Formily top-level field state keys that `linkedFieldProps` sets directly
    // on `state`. Anything else goes into `state.componentProps` for the control.
    const STATE_KEYS = new Set([
        'visible', 'display', 'hidden', 'editable', 'readEmpty', 'selfEditable',
        'required', 'title', 'description', 'value', 'defaultValue',
        'dataSource', 'loading', 'validateStatus', 'rules', 'validator',
        'decorator', 'component', 'reactions', 'content',
    ]);

    const run = (): void => {
        const myToken = ++token;
        const values: Record<string, any> = {};
        for (const dep of deps) {
            values[dep] = form.getValuesIn(dep);
        }
        const targetField = form.query(target).take();
        Promise.resolve(compute(values, targetField)).then(result => {
            // Stale guard: a newer run has superseded this one, or the result
            // was empty/no-op.
            if (myToken !== token || !result) {
                return;
            }
            form.setFieldState(target, (state: any) => {
                const compProps: Record<string, any> = {};
                for (const key of Object.keys(result)) {
                    if (STATE_KEYS.has(key)) {
                        state[key] = result[key];
                    } else {
                        compProps[key] = result[key];
                    }
                }
                if (Object.keys(compProps).length > 0) {
                    state.componentProps = {
                        ...(state.componentProps ?? {}),
                        ...compProps,
                    };
                }
            });
        });
    };

    for (const dep of deps) {
        onFieldValueChange(dep, run);
    }
    run();
}
