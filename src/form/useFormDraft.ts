import * as React from 'react';
import { type Form as FormilyForm, LifeCycleTypes } from '@formily/core';
import { useForm } from '@formily/react';
import { debounce } from '../effects/debounce';

export interface UseFormDraftOptions {
    /** Debounce auto-save by this many ms (default 500). */
    debounceMs?: number;
    /**
     * Storage backend. Defaults to `window.localStorage`; pass a mock for SSR /
     * tests. When `window`/`localStorage` is unavailable the hook becomes a
     * no-op (no save, no restore prompt), so it is SSR-safe out of the box.
     */
    storage?: Storage;
    /** Auto-clear the draft after a successful submit (default `true`). */
    clearOnSubmit?: boolean;
    /** Expire the draft after this many ms; an older snapshot is ignored on read. */
    maxAge?: number;
}

export interface UseFormDraftResult {
    /** A saved draft exists in storage — show the restore prompt. */
    hasDraft: boolean;
    /** The saved draft snapshot, or `undefined` if none / already dismissed. */
    draft: Record<string, any> | undefined;
    /** Load the saved draft into the form (deep-merged over current values). */
    restore: () => void;
    /** Dismiss the restore prompt without loading — keeps the draft in storage. */
    dismiss: () => void;
    /** Delete the saved draft from storage. */
    clear: () => void;
}

const DEFAULT_DEBOUNCE_MS = 500;
const NOOP = (): void => {};

interface DraftEnvelope {
    v?: Record<string, any>;
    t?: number;
}

function readDraft(
    storage: Storage | undefined,
    key: string,
    maxAge: number | undefined,
): Record<string, any> | undefined {
    if (!storage) {
        return undefined;
    }
    let raw: string | null;
    try {
        raw = storage.getItem(key);
    } catch {
        return undefined;
    }
    if (!raw) {
        return undefined;
    }
    let env: DraftEnvelope;
    try {
        env = JSON.parse(raw) as DraftEnvelope;
    } catch {
        return undefined;
    }
    if (typeof env !== 'object' || env === null || env.v === undefined) {
        return undefined;
    }
    if (maxAge !== undefined && typeof env.t === 'number') {
        if (Date.now() - env.t > maxAge) {
            try {
                storage.removeItem(key);
            } catch {
                /* ignore */
            }
            return undefined;
        }
    }
    return env.v;
}

function writeDraft(storage: Storage | undefined, key: string, values: Record<string, any>): void {
    if (!storage) {
        return;
    }
    try {
        storage.setItem(key, JSON.stringify({ v: values, t: Date.now() }));
    } catch {
        /* quota exceeded / storage disabled — ignore; the draft just won't persist */
    }
}

function removeDraft(storage: Storage | undefined, key: string): void {
    if (!storage) {
        return;
    }
    try {
        storage.removeItem(key);
    } catch {
        /* ignore */
    }
}

/**
 * Auto-save / restore a form draft from `localStorage` (or a custom storage).
 *
 * Inside a `<Form>`, call it with a stable `key` unique to this form's
 * purpose (e.g. `'order-edit'`). On mount it checks storage for a saved draft
 * and exposes `hasDraft` so you can render a restore banner; every value
 * change is debounced and persisted automatically, and (by default) the draft
 * is cleared once the form submits successfully — so the draft only lingers
 * for abandoned, unsubmitted work.
 *
 * @example
 * const draft = useFormDraft('order-edit');
 * return (
 *   <>
 *     {draft.hasDraft && (
 *       <DraftBanner onRestore={draft.restore} onDismiss={draft.dismiss} />
 *     )}
 *     <Form.Field name="name"><Form.Input /></Form.Field>
 *   </>
 * );
 */
export function useFormDraft(key: string, options: UseFormDraftOptions = {}): UseFormDraftResult {
    const form = useForm() as FormilyForm;
    const { debounceMs = DEFAULT_DEBOUNCE_MS, clearOnSubmit = true, maxAge } = options;
    const storage: Storage | undefined =
        options.storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);

    const [draft, setDraft] = React.useState<Record<string, any> | undefined>(() =>
        readDraft(storage, key, maxAge),
    );
    const hasDraft = draft !== undefined;

    // The debounced persister is stable across renders for fixed
    // (storage, key, debounceMs), so the subscription effect below is stable too.
    const save = React.useMemo(
        () =>
            debounce((values: Record<string, any>) => writeDraft(storage, key, values), debounceMs),
        [storage, key, debounceMs],
    );

    // Auto-save on every value mutation (user input + effects). Reading
    // `form.values` (not the event payload) keeps this robust against payload
    // shape changes across Formily versions.
    React.useEffect(() => {
        const id = form.subscribe(({ type }) => {
            if (type === LifeCycleTypes.ON_FORM_VALUES_CHANGE) {
                save(form.values);
            }
        });
        return () => form.unsubscribe(id);
    }, [form, save]);

    // Auto-clear the draft once a submit succeeds — the work is committed, so
    // the persisted snapshot no longer represents abandoned data.
    React.useEffect(() => {
        if (!clearOnSubmit) {
            return NOOP;
        }
        const id = form.subscribe(({ type }) => {
            if (type === LifeCycleTypes.ON_FORM_SUBMIT_SUCCESS) {
                removeDraft(storage, key);
            }
        });
        return () => form.unsubscribe(id);
    }, [form, clearOnSubmit, storage, key]);

    const restore = React.useCallback(() => {
        setDraft((current) => {
            if (current === undefined) {
                return undefined;
            }
            form.setValues(current, 'deepMerge');
            return undefined;
        });
    }, [form]);

    const dismiss = React.useCallback(() => setDraft(undefined), []);

    const clear = React.useCallback(() => {
        removeDraft(storage, key);
        setDraft(undefined);
    }, [storage, key]);

    return { hasDraft, draft, restore, dismiss, clear };
}
