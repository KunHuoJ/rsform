import { act, fireEvent, render, screen } from '@testing-library/react';
import type * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ArrayItems, arrayUnion } from '../src/array-items/index';
import { Input } from '../src/controls/index';
import { Field, Form } from '../src/index';

async function flush(): Promise<void> {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

/** Click the add button (the last button in the array-items container). */
function clickAdd(): void {
    const addBtn = screen.getByText('添加');
    fireEvent.click(addBtn);
}

/** Click the remove (×) button for the given row index. */
function clickRemove(index: number): void {
    const removes = screen.getAllByTitle('删除');
    fireEvent.click(removes[index]);
}

/** Click the up (↑) button for the given row index. */
function clickUp(index: number): void {
    fireEvent.click(screen.getAllByTitle('上移')[index]);
}

describe('ArrayItems (Phase 4)', () => {
    it('renders rows from initialValues and adds a row with itemDefaultValue', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ tags: [{ label: 'a' }, { label: 'b' }] }} formRef={formRef}>
                <ArrayItems name="tags" itemDefaultValue={{ label: '' }}>
                    {() => (
                        <Field name="label">
                            <Input data-testid="label" />
                        </Field>
                    )}
                </ArrayItems>
            </Form>,
        );
        await flush();
        expect(formRef.current.values.tags).toHaveLength(2);
        expect(formRef.current.values.tags[0].label).toBe('a');

        clickAdd();
        await flush();
        expect(formRef.current.values.tags).toHaveLength(3);
        expect(formRef.current.values.tags[2]).toEqual({ label: '' });
    });

    it('removes a row and keeps indices contiguous', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form
                initialValues={{ tags: [{ label: 'a' }, { label: 'b' }, { label: 'c' }] }}
                formRef={formRef}
            >
                <ArrayItems name="tags">
                    {() => (
                        <Field name="label">
                            <Input />
                        </Field>
                    )}
                </ArrayItems>
            </Form>,
        );
        await flush();
        // Remove the middle row (label 'b').
        clickRemove(1);
        await flush();
        expect(formRef.current.values.tags).toHaveLength(2);
        expect(formRef.current.values.tags.map((r: any) => r.label)).toEqual(['a', 'c']);
    });

    it('min disables the remove button at or below min', async () => {
        render(
            <Form initialValues={{ tags: [{ label: 'a' }] }}>
                <ArrayItems name="tags" min={1}>
                    {() => (
                        <Field name="label">
                            <Input />
                        </Field>
                    )}
                </ArrayItems>
            </Form>,
        );
        await flush();
        // At min=1 with 1 row, the remove button is disabled.
        expect((screen.getByTitle('删除') as HTMLButtonElement).disabled).toBe(true);
    });

    it('max disables the add button at or above max', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ tags: [{ label: 'a' }] }} formRef={formRef}>
                <ArrayItems name="tags" max={1}>
                    {() => (
                        <Field name="label">
                            <Input />
                        </Field>
                    )}
                </ArrayItems>
            </Form>,
        );
        await flush();
        expect((screen.getByText('添加') as HTMLButtonElement).disabled).toBe(true);
        clickAdd();
        await flush();
        expect(formRef.current.values.tags).toHaveLength(1);
    });

    it('validateBeforeAdd=false blocks the add; string surfaces as a field error', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ tags: [] }} formRef={formRef}>
                <ArrayItems
                    name="tags"
                    itemDefaultValue={{ label: '' }}
                    validateBeforeAdd={() => 'no more'}
                >
                    {() => (
                        <Field name="label">
                            <Input />
                        </Field>
                    )}
                </ArrayItems>
            </Form>,
        );
        await flush();
        clickAdd();
        await flush();
        // Add was blocked by the validateBeforeAdd string.
        expect(formRef.current.values.tags).toHaveLength(0);
        // The string surfaced as an error on the array field.
        const errs = formRef.current.query('tags').take().selfErrors ?? [];
        expect(errs).toContain('no more');
    });

    it('up/down buttons move rows', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form
                initialValues={{ tags: [{ label: 'a' }, { label: 'b' }, { label: 'c' }] }}
                formRef={formRef}
            >
                <ArrayItems name="tags">
                    {() => (
                        <Field name="label">
                            <Input />
                        </Field>
                    )}
                </ArrayItems>
            </Form>,
        );
        await flush();
        // Move the last row up.
        clickUp(2);
        await flush();
        expect(formRef.current.values.tags.map((r: any) => r.label)).toEqual(['a', 'c', 'b']);
    });

    it('arrayUnion rejects a duplicate value across rows', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ tags: [{ label: 'dup' }, { label: '' }] }} formRef={formRef}>
                <ArrayItems name="tags">
                    {() => (
                        <Field name="label" validator={arrayUnion('label', '重复了')}>
                            <Input data-testid="label" />
                        </Field>
                    )}
                </ArrayItems>
            </Form>,
        );
        await flush();
        // Set row 1's label to the already-used 'dup'.
        formRef.current.setValuesIn('tags.1.label', 'dup');
        await formRef.current.validate().catch(() => {});
        await flush();
        const errs = formRef.current.query('tags.1.label').take().selfErrors ?? [];
        expect(errs).toContain('重复了');
    });

    it('Form namespace exposes ArrayItems', async () => {
        const { Form: FormWithArray } = await import('../src/array-items/index');
        expect(FormWithArray.ArrayItems).toBe(ArrayItems);
    });

    it('noop to silence unused-import lints in some runners', () => {
        expect(vi.fn()).toBeDefined();
    });
});
