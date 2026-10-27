import {onFieldValueChange} from '@formily/core';
import type {Form as FormilyForm, GeneralField} from '@formily/core';

/**
 * The compute function receives the current dep values keyed by dep name and
 * the target field model (if mounted). It returns a partial props object that
 * is applied to the target field's state via `form.setFieldState`. Returning a
 * Promise makes the derivation async (e.g. fetching cascade options).
 */
export type LinkedFieldPropsCompute = (
    values: Record<string, any>,
    targetField: GeneralField | undefined,
) => Record<string, any> | Promise<Record<string, any>>;

/**
 * Reactively derive the target field's props from one or more dependency
 * fields. When any dep value changes (and once on initial registration), the
 * dep values are collected, `compute({ [dep]: value })` is invoked, and the
 * returned object is merged into the target field's state through
 * `form.setFieldState`. Common keys such as `visible`, `display`, `editable`,
 * `dataSource`, `title`, `required` are honoured by Formily's state setter.
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
                Object.assign(state, result);
            });
        });
    };

    for (const dep of deps) {
        onFieldValueChange(dep, run);
    }
    run();
}
