import type * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Field, Form, Input, useFormDraft } from '../src/index';

/** A minimal Storage implementation backed by a plain map. */
function makeStorage(): Storage & { dump: () => Record<string, string> } {
    const map = new Map<string, string>();
    const storage: Storage = {
        get length() {
            return map.size;
        },
        clear: () => map.clear(),
        getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
        key: (i: number) => Array.from(map.keys())[i] ?? null,
        removeItem: (k: string) => {
            map.delete(k);
        },
        setItem: (k: string, v: string) => {
            map.set(k, v);
        },
    };
    return Object.assign(storage, { dump: () => Object.fromEntries(map) });
}

interface DraftProps {
    storage: Storage;
    storageKey: string;
    debounceMs?: number;
    clearOnSubmit?: boolean;
    maxAge?: number;
}

/** Lives INSIDE <Form>, so useFormDraft's useForm() resolves the form. */
function DraftContent({
    storage,
    storageKey,
    debounceMs = 0,
    clearOnSubmit,
    maxAge,
}: DraftProps): React.ReactElement {
    const draft = useFormDraft(storageKey, {
        storage,
        debounceMs,
        clearOnSubmit,
        maxAge,
    });
    return (
        <>
            {draft.hasDraft && (
                <div data-testid="banner">
                    <button data-testid="restore" onClick={draft.restore}>
                        恢复
                    </button>
                    <button data-testid="dismiss" onClick={draft.dismiss}>
                        忽略
                    </button>
                </div>
            )}
            <Field name="name">
                <Input data-testid="name" />
            </Field>
            <Field name="city">
                <Input data-testid="city" />
            </Field>
        </>
    );
}

function DraftForm({
    storage,
    storageKey,
    onSubmit,
    formRef,
    ...draftProps
}: DraftProps & {
    onSubmit?: (values: any) => void | Promise<void>;
    formRef?: React.MutableRefObject<any>;
}): React.ReactElement {
    return (
        <Form onSubmit={onSubmit} formRef={formRef}>
            <DraftContent
                storage={storage}
                storageKey={storageKey}
                debounceMs={draftProps.debounceMs}
                clearOnSubmit={draftProps.clearOnSubmit}
                maxAge={draftProps.maxAge}
            />
            <button data-testid="submit" onClick={() => formRef?.current?.submit()}>
                go
            </button>
        </Form>
    );
}

async function flush(): Promise<void> {
    await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
    });
}

describe('useFormDraft', () => {
    it('detects an existing draft on mount and restore() loads it into the form', async () => {
        const storage = makeStorage();
        storage.setItem(
            'order',
            JSON.stringify({ v: { name: 'alice', city: 'sz' }, t: Date.now() }),
        );
        const formRef: React.MutableRefObject<any> = { current: null };
        render(<DraftForm storage={storage} storageKey="order" formRef={formRef} />);
        // Banner shows because a draft exists; form is still empty.
        expect(screen.getByTestId('banner')).toBeTruthy();
        expect(formRef.current.getValuesIn('name')).toBeUndefined();

        fireEvent.click(screen.getByTestId('restore'));
        await flush();
        expect(formRef.current.getValuesIn('name')).toBe('alice');
        expect(formRef.current.getValuesIn('city')).toBe('sz');
        // After restore the prompt dismisses itself.
        expect(screen.queryByTestId('banner')).toBeNull();
    });

    it('auto-saves edits (debounced) and restores them on a fresh mount', async () => {
        const storage = makeStorage();
        const formRef: React.MutableRefObject<any> = { current: null };
        const { unmount } = render(
            <DraftForm storage={storage} storageKey="order" formRef={formRef} />,
        );
        fireEvent.change(screen.getByTestId('name'), {
            target: { value: 'bob' },
        });
        fireEvent.change(screen.getByTestId('city'), {
            target: { value: 'bj' },
        });
        await flush();
        // The edit was persisted to storage as a draft envelope.
        const raw = storage.dump().order;
        expect(raw).toBeTruthy();
        const env = JSON.parse(raw as string);
        expect(env.v.name).toBe('bob');
        expect(env.v.city).toBe('bj');

        unmount();
        // A fresh mount should detect the saved draft and offer to restore.
        const formRef2: React.MutableRefObject<any> = { current: null };
        render(<DraftForm storage={storage} storageKey="order" formRef={formRef2} />);
        expect(screen.getByTestId('banner')).toBeTruthy();
        fireEvent.click(screen.getByTestId('restore'));
        await flush();
        expect(formRef2.current.getValuesIn('name')).toBe('bob');
        expect(formRef2.current.getValuesIn('city')).toBe('bj');
    });

    it('dismiss() hides the prompt but keeps the draft in storage', async () => {
        const storage = makeStorage();
        storage.setItem('order', JSON.stringify({ v: { name: 'carol' }, t: Date.now() }));
        const formRef: React.MutableRefObject<any> = { current: null };
        render(<DraftForm storage={storage} storageKey="order" formRef={formRef} />);
        expect(screen.getByTestId('banner')).toBeTruthy();
        fireEvent.click(screen.getByTestId('dismiss'));
        await flush();
        expect(screen.queryByTestId('banner')).toBeNull();
        // Draft is still in storage (dismiss only hides the prompt).
        expect(storage.dump().order).toBeTruthy();
    });

    it('clears the draft after a successful submit (clearOnSubmit default true)', async () => {
        const storage = makeStorage();
        storage.setItem('order', JSON.stringify({ v: { name: 'dave' }, t: Date.now() }));
        const onSubmit = vi.fn(() => Promise.resolve());
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <DraftForm
                storage={storage}
                storageKey="order"
                onSubmit={onSubmit}
                formRef={formRef}
            />,
        );
        // Restore so the form has values, then submit.
        fireEvent.click(screen.getByTestId('restore'));
        await flush();
        fireEvent.click(screen.getByTestId('submit'));
        await flush();
        expect(onSubmit).toHaveBeenCalledTimes(1);
        // Successful submit wipes the persisted draft.
        expect(storage.dump().order).toBeUndefined();
    });

    it('clearOnSubmit:false keeps the draft after submit', async () => {
        const storage = makeStorage();
        storage.setItem('order', JSON.stringify({ v: { name: 'eve' }, t: Date.now() }));
        const onSubmit = vi.fn(() => Promise.resolve());
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <DraftForm
                storage={storage}
                storageKey="order"
                onSubmit={onSubmit}
                clearOnSubmit={false}
                formRef={formRef}
            />,
        );
        fireEvent.click(screen.getByTestId('restore'));
        await flush();
        fireEvent.click(screen.getByTestId('submit'));
        await flush();
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(storage.dump().order).toBeTruthy();
    });

    it('maxAge expires a stale draft (treated as no draft)', async () => {
        const storage = makeStorage();
        storage.setItem('order', JSON.stringify({ v: { name: 'frank' }, t: Date.now() - 10_000 }));
        const formRef: React.MutableRefObject<any> = { current: null };
        render(<DraftForm storage={storage} storageKey="order" maxAge={1000} formRef={formRef} />);
        // Stale draft: no prompt, and the entry is purged from storage.
        expect(screen.queryByTestId('banner')).toBeNull();
        expect(storage.dump().order).toBeUndefined();
    });
});
