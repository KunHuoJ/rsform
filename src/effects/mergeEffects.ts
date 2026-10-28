import type * as React from 'react';
import type { Form as FormilyForm } from '@formily/core';
import { onFormSubmitSuccess, onFormSubmitValidateFailed } from '@formily/core';
import { toJS } from '@formily/reactive';
import { createEffects, type EffectHelpers } from './helpers';

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
    onResetRef: { current: (() => void) | undefined };
    /** Invoked when `validateFailed === 'scroll'` to scroll the first error into view. */
    scrollToFirstError?: () => void;
    /** Holds the in-flight onSubmit promise so Submit can await it for loading. */
    submitPromiseRef?: React.MutableRefObject<Promise<any> | undefined>;
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
    // invokes the freshest callback without recreating. Capture the returned
    // promise into submitPromiseRef so Submit can await it for its loading
    // state. IMPORTANT: wire to `onFormSubmitSuccess`, NOT `onFormSubmit` —
    // Formily fires ON_FORM_SUBMIT on BOTH the success and failure paths of
    // batchSubmit, so `onFormSubmit` would run the consumer's onSubmit even
    // when validation failed (submit appeared to "do nothing" because the
    // callback fired on invalid data). `onFormSubmitSuccess` fires only after
    // validation passes, so the consumer's onSubmit runs only on valid data.
    fns.push(($) => {
        onFormSubmitSuccess(() => {
            const cb = opts.onSubmitRef.current;
            if (cb) {
                // `form.values` is a deeply-observable Proxy; convert to a plain
                // JS object so the consumer's onSubmit never receives a Proxy
                // (which would break JSON.stringify of nested arrays/objects).
                const p = Promise.resolve(cb(toJS($.form.values)));
                if (opts.submitPromiseRef) {
                    opts.submitPromiseRef.current = p;
                }
                return p;
            }
            if (opts.submitPromiseRef) {
                opts.submitPromiseRef.current = undefined;
            }
        });
    });

    // onReset is exposed via formRef.current.reset(); the onReset prop is held
    // in a ref for future wiring and to keep the public API stable.
    void opts.onResetRef;

    if (opts.validateFailed) {
        fns.push(($) => {
            onFormSubmitValidateFailed(() => {
                if (opts.validateFailed === 'scroll') {
                    opts.scrollToFirstError?.();
                } else {
                    const first = $.form.query('*').take((field: any) => field?.errors?.length > 0);
                    (opts.validateFailed as (first: any) => void)(first);
                }
            });
        });
    }

    return (form: FormilyForm) => {
        const $ = createEffects(form);
        fns.forEach((fn) => fn($));
    };
}
