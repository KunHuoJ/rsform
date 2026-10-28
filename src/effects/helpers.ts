import type { Form as FormilyForm } from '@formily/core';
import { onFieldValueChange } from '@formily/core';
import { type LinkedFieldPropsCompute, linkedFieldProps } from './linkedFieldProps';
import { type EachRowCb, onEachRowChange } from './onEachRowChange';
import { type EachRowMultiCb, onEachRowMultiChange } from './onEachRowMultiChange';
import { getRefState, setRefState } from './refState';
import { type ValidateFieldCb, type ValidateFieldHandle, validateField } from './validateField';

/**
 * The `$` helpers bundle handed to every `effects` callback. It exposes the
 * raw Formily form plus rsform's sugar helpers (which close over the form so
 * callers don't repeat it). Bare Formily lifecycle hooks can also be called
 * directly inside an `effects` body (they auto-register on the active form),
 * so `$.onFieldValueChange` is provided for ergonomic parity.
 */
export interface EffectHelpers {
    /** The underlying Formily form instance. */
    form: FormilyForm;
    /** Non-reactive per-form scratch storage. A function value is an immer updater. */
    setRefState: (key: string, value: any) => void;
    getRefState: <T = any>(key: string) => T | undefined;
    onFieldValueChange: typeof onFieldValueChange;
    linkedFieldProps: (target: string, deps: string[], compute: LinkedFieldPropsCompute) => void;
    validateField: (
        name: string,
        triggers: string[] | ValidateFieldCb,
        cb?: ValidateFieldCb,
    ) => ValidateFieldHandle;
    onEachRowChange: (pre: string, key: string, cb: EachRowCb) => void;
    onEachRowMultiChange: (pre: string, keys: string[], cb: EachRowMultiCb) => void;
}

/**
 * Build the `$` helpers bundle for a form. Called by `mergeEffects` once per
 * form creation; every user `effects` callback receives this bundle.
 */
export function createEffects(form: FormilyForm): EffectHelpers {
    return {
        form,
        setRefState: (key, value) => setRefState(form, key, value),
        getRefState: <T>(key: string) => getRefState<T>(form, key),
        onFieldValueChange,
        linkedFieldProps: (target, deps, compute) => linkedFieldProps(form, target, deps, compute),
        validateField: (name, triggers, cb) => validateField(form, name, triggers, cb),
        onEachRowChange: (pre, key, cb) => onEachRowChange(form, pre, key, cb),
        onEachRowMultiChange: (pre, keys, cb) => onEachRowMultiChange(form, pre, keys, cb),
    };
}
