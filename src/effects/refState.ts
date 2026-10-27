import type {Form} from '@formily/core';

/**
 * Per-form scratch space for arbitrary state shared between effects (e.g.
 * "is submitting", "last fetch key", cached derived values). Stored on the
 * form instance under a symbol so it never collides with Formily's own fields.
 *
 * rsform deliberately does NOT make this reactive — it's a plain Map. If an
 * effect needs the UI to re-render on change, it should drive a Field instead.
 */
const RSFORM_REFS = typeof Symbol !== 'undefined'
    ? Symbol('rsform.refState')
    : '__rsform_refState__';

function refsOf(form: Form): Map<string, any> {
    const f = form as any;
    if (!f[RSFORM_REFS]) {
        f[RSFORM_REFS] = new Map();
    }
    return f[RSFORM_REFS];
}

export function setRefState<T>(form: Form, key: string, value: T): void {
    refsOf(form).set(key, value);
}

export function getRefState<T = any>(form: Form, key: string): T | undefined {
    return refsOf(form).get(key);
}

export function hasRefState(form: Form, key: string): boolean {
    return refsOf(form).has(key);
}

export function deleteRefState(form: Form, key: string): boolean {
    return refsOf(form).delete(key);
}
