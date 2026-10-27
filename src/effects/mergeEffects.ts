import {
    onFormSubmit,
    onFormSubmitValidateFailed,
} from '@formily/core';
import type {Form as FormilyForm} from '@formily/core';
import {createEffects, type EffectHelpers} from './helpers';

/**
 * A single effect callback. It receives the `$` helpers bundle (which carries
 * the raw form via `$.form`). Bare Formily lifecycle hooks may also be called
 * directly inside it — they auto-register on the active form.
 */
export type EffectFn = ($: EffectHelpers) => void;

export type EffectsProp = EffectFn | EffectFn[];

export interface MergeEffectsOptions {
    validateFailed?: 'scroll' | ((firstErrorField: any) => void);
    onSubmitRef: {
        current: ((values: any) => void | Promise<void>) | undefined;
    };
    onResetRef: {current: (() => void) | undefined};
    /** Invoked when `validateFailed === 'scroll'` to scroll the first error into view. */
    scrollToFirstError?: () => void;
}

/**
 * Compose the user's `effects` callbacks with rsform's built-in submit /
 * validate-failed wiring into a single `(form) => void` suitable for
 * `createForm({ effects })`. Each callback receives the `$` helpers bundle.
 */
export function mergeEffects(
    effects: EffectsProp | undefined,
    opts: MergeEffectsOptions,
): (form: FormilyForm) => void {
    const fns: EffectFn[] = [];
    if (Array.isArray(effects)) {
        fns.push(...effects);
    } else if (typeof effects === 'function') {
        fns.push(effects);
    }

    // Wire onSubmit through the held ref so the form (created once) always
    // invokes the freshest callback without recreating.
    fns.push($ => {
        onFormSubmit(() => {
            if (opts.onSubmitRef.current) {
                return opts.onSubmitRef.current($.form.values);
            }
        });
    });

    // onReset is exposed via formRef.current.reset(); the onReset prop is held
    // in a ref for future wiring and to keep the public API stable.
    void opts.onResetRef;

    if (opts.validateFailed) {
        fns.push($ => {
            onFormSubmitValidateFailed(() => {
                if (opts.validateFailed === 'scroll') {
                    opts.scrollToFirstError?.();
                } else {
                    const first = $.form
                        .query('*')
                        .take((field: any) => field?.errors?.length > 0);
                    (opts.validateFailed as (first: any) => void)(first);
                }
            });
        });
    }

    return (form: FormilyForm) => {
        const $ = createEffects(form);
        fns.forEach(fn => fn($));
    };
}
