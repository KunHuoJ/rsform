import type { Form as FormilyForm, GeneralField } from '@formily/core';
import { onFieldMount, onFieldUnmount, onFieldValueChange } from '@formily/core';

/**
 * Cross-field reactive validator. `cb` receives the current trigger values
 * keyed by trigger name and the target field model; a non-empty string/array
 * result is written to the target field's `selfErrors`, while an empty/null/
 * undefined result clears them.
 *
 * `triggers` defaults to `[name]`. When the target field is unmounted its
 * errors are cleared; when it (re)mounts with pending errors they are
 * re-applied.
 *
 * Returns a handle whose `clearEffect()` freezes the validator so subsequent
 * trigger changes become no-ops (Formily v2 hooks live for the form's
 * lifetime, so we use a liveness flag rather than hook disposal).
 */
export type ValidateFieldCb = (
    values: Record<string, any>,
    targetField: GeneralField | undefined,
) => string | string[] | null | undefined | Promise<string | string[] | null | undefined>;

export interface ValidateFieldHandle {
    clearEffect: () => void;
}

export function validateField(
    form: FormilyForm,
    name: string,
    triggers: string[] | ValidateFieldCb,
    cb?: ValidateFieldCb,
): ValidateFieldHandle {
    const triggerList: string[] = Array.isArray(triggers) ? triggers : [name];
    const callback: ValidateFieldCb = Array.isArray(triggers)
        ? (cb as ValidateFieldCb)
        : (triggers as ValidateFieldCb);

    let alive = true;
    let pendingErrors: string[] | null = null;

    const apply = (errors: string[] | null): void => {
        if (!alive) return;
        const field = form.query(name).take();
        if (!field || !(field as any).mounted) {
            // Field not yet mounted: remember the verdict to apply on mount.
            pendingErrors = errors;
            return;
        }
        pendingErrors = null;
        (field as any).setSelfErrors(errors ?? []);
    };

    const run = (): void => {
        if (!alive) return;
        const values: Record<string, any> = {};
        for (const trigger of triggerList) {
            values[trigger] = form.getValuesIn(trigger);
        }
        const targetField = form.query(name).take();
        Promise.resolve(callback(values, targetField)).then((result) => {
            if (!alive) return;
            if (result == null || result === '') {
                apply(null);
            } else if (Array.isArray(result)) {
                apply(result.length ? result : null);
            } else {
                apply([String(result)]);
            }
        });
    };

    for (const trigger of triggerList) {
        onFieldValueChange(trigger, run);
    }
    onFieldMount(name, () => {
        if (!alive) return;
        // Apply any verdict computed before the field mounted.
        if (pendingErrors) {
            const field = form.query(name).take();
            if (field && (field as any).mounted) {
                (field as any).setSelfErrors(pendingErrors);
                pendingErrors = null;
            }
        }
    });
    onFieldUnmount(name, () => {
        if (!alive) return;
        const field = form.query(name).take();
        if (field) {
            (field as any).setSelfErrors([]);
        }
    });

    run();

    return {
        clearEffect: () => {
            alive = false;
        },
    };
}
