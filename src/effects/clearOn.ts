import type { Form as FormilyForm } from '@formily/core';
import { onFieldValueChange } from '@formily/core';

function toArray(x: string | string[]): string[] {
    return Array.isArray(x) ? x : [x];
}

/**
 * Clear one or more target fields whenever any dependency field's value
 * changes. Built on `onFieldValueChange`, so it does NOT fire on initial /
 * 回显 — only on a real user-driven change. This is the safe cascade-clear
 * pattern (select province → clear city) where wiping 回显 values on mount
 * would be a bug.
 *
 * Targets are written via `form.setValuesIn` with `clearValue` (default
 * `undefined`); pass `''` / `null` if your controls expect a specific empty
 * sentinel.
 */
export function clearOn(
    form: FormilyForm,
    deps: string | string[],
    targets: string | string[],
    clearValue: any = undefined,
): void {
    const depList = toArray(deps);
    const targetList = toArray(targets);
    for (const dep of depList) {
        onFieldValueChange(dep, () => {
            for (const target of targetList) {
                form.setValuesIn(target, clearValue);
            }
        });
    }
}
