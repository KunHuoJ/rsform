import type {Form} from '@formily/core';
import {onFieldValueChange} from './lifecycle';

export type RowChangeCallback = (row: any, index: number, array: any[]) => void;
export type ArrayChangeCallback = (array: any[]) => void;

function readArray(form: Form, arraySelector: string): any[] {
    const field = form.query(arraySelector).take();
    const value = field ? (field as any).value : undefined;
    return Array.isArray(value) ? value : [];
}

/**
 * Fires `callback(row, index, array)` for each row whose value changed in an
 * array field, plus once for every row on registration. Use this for row-level
 * side effects (clearing a dependent cell, re-validating a row, …). The array
 * selector may target any ArrayField, e.g. `'users'` or `'form.users'`.
 *
 * Implemented as a shallow diff over the array value, re-run on every array
 * value change (Formily bubbles leaf edits up to the array field's value).
 */
export function onEachRowChange(
    form: Form,
    arraySelector: string,
    callback: RowChangeCallback,
): void {
    let prev: any[] = readArray(form, arraySelector).slice();
    const fire = () => {
        const arr = readArray(form, arraySelector);
        arr.forEach((row, index) => {
            if (prev[index] !== row) {
                callback(row, index, arr);
            }
        });
        prev = arr.slice();
    };
    // Initial pass: every existing row is "new" relative to the empty prev.
    prev = [];
    fire();
    onFieldValueChange(arraySelector, fire);
}

/**
 * Fires `callback(array)` with the whole array value whenever the array field
 * changes, plus once on registration. Use this for derived whole-array state
 * (totals, duplicates check, …) where per-row granularity isn't needed.
 */
export function onEachRowMultiChange(
    form: Form,
    arraySelector: string,
    callback: ArrayChangeCallback,
): void {
    const fire = () => {
        callback(readArray(form, arraySelector));
    };
    fire();
    onFieldValueChange(arraySelector, fire);
}
