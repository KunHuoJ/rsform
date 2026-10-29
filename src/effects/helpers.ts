import type { Form as FormilyForm } from '@formily/core';
import { onFieldReact, onFieldValueChange } from '@formily/core';
import { clearOn } from './clearOn';
import { debounce } from './debounce';
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
 * so `$.onFieldValueChange` / `$.onFieldReact` are provided for ergonomic
 * parity.
 */
export interface EffectHelpers {
    /** The underlying Formily form instance. */
    form: FormilyForm;
    /** Non-reactive per-form scratch storage. A function value is an immer updater. */
    setRefState: (key: string, value: any) => void;
    getRefState: <T = any>(key: string) => T | undefined;
    /**
     * Field-value-change listener (Formily v2 native). Fires only when the
     * field's value changes — does NOT fire on init.
     */
    onFieldValueChange: typeof onFieldValueChange;
    /**
     * Reactive field reaction (Formily v2 native). Runs the callback once on
     * field init AND again whenever any observable on the field changes
     * (value/visible/display/...). This is the one to use for "init + change
     * both run" linkage — e.g. toggling another field's `visible` from a value,
     * where the initial value must also apply on mount (no need to pair
     * `onFieldValueChange` with a separate `ON_FIELD_MOUNT` handler).
     */
    onFieldReact: typeof onFieldReact;
    linkedFieldProps: (target: string, deps: string[], compute: LinkedFieldPropsCompute) => void;
    validateField: (
        name: string,
        triggers: string[] | ValidateFieldCb,
        cb?: ValidateFieldCb,
    ) => ValidateFieldHandle;
    onEachRowChange: (pre: string, key: string, cb: EachRowCb) => void;
    onEachRowMultiChange: (pre: string, keys: string[], cb: EachRowMultiCb) => void;
    /**
     * Trailing-edge debounce. Stable across renders, safe to pass as a prop.
     * Use to tame `onSearch` / `onChange` before a remote request.
     */
    debounce: typeof debounce;
    /**
     * Clear target field(s) when any dep field's value changes. Does NOT fire
     * on init / 回显 (safe cascade-clear). Targets are written with
     * `clearValue` (default `undefined`).
     */
    clearOn: (
        deps: string | string[],
        targets: string | string[],
        clearValue?: any,
    ) => void;
    /** Set a field's `visible` state. Sugar for `form.setFieldState(name, s => { s.visible = v })`. */
    setVisible: (name: string, visible: boolean) => void;
    /** Set a field's `required` state. Sugar for `form.setFieldState(name, s => { s.required = v })`. */
    setRequired: (name: string, required: boolean) => void;
    /** Set a field's `editable` state. Sugar for `form.setFieldState(name, s => { s.editable = v })`. */
    setEditable: (name: string, editable: boolean) => void;
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
        onFieldReact,
        linkedFieldProps: (target, deps, compute) => linkedFieldProps(form, target, deps, compute),
        validateField: (name, triggers, cb) => validateField(form, name, triggers, cb),
        onEachRowChange: (pre, key, cb) => onEachRowChange(form, pre, key, cb),
        onEachRowMultiChange: (pre, keys, cb) => onEachRowMultiChange(form, pre, keys, cb),
        debounce,
        clearOn: (deps, targets, clearValue) => clearOn(form, deps, targets, clearValue),
        setVisible: (name, visible) => form.setFieldState(name, (s: any) => { s.visible = visible; }),
        setRequired: (name, required) => form.setFieldState(name, (s: any) => { s.required = required; }),
        setEditable: (name, editable) => form.setFieldState(name, (s: any) => { s.editable = editable; }),
    };
}
