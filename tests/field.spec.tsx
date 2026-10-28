import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Field, Form, Input } from '../src/index';

describe('Field', () => {
    it('injects value/onChange into the control element', () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ email: 'a@b.com' }} formRef={formRef}>
                <Field name="email">
                    <Input data-testid="email" />
                </Field>
            </Form>,
        );
        const input = screen.getByTestId('email') as HTMLInputElement;
        expect(input.value).toBe('a@b.com');
        fireEvent.change(input, { target: { value: 'c@d.com' } });
        expect(formRef.current.values.email).toBe('c@d.com');
    });

    it('NonEditable renders the value or "-" when empty', () => {
        // Form deliberately does NOT recreate when `initialValues` changes (it
        // would discard field state), so force a remount via `key`.
        const { rerender } = render(
            <Form key="a" initialValues={{ name: '' }}>
                <Field name="name" editable={false} />
            </Form>,
        );
        expect(screen.getByText('-')).toBeTruthy();
        rerender(
            <Form key="b" initialValues={{ name: 'hello' }}>
                <Field name="name" editable={false} />
            </Form>,
        );
        expect(screen.getByText('hello')).toBeTruthy();
    });

    it('runs under React.StrictMode without crashing (R2 spike)', () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <React.StrictMode>
                <Form initialValues={{ x: '' }} formRef={formRef}>
                    <Field name="x">
                        <Input data-testid="x" />
                    </Field>
                </Form>
            </React.StrictMode>,
        );
        const input = screen.getByTestId('x') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'strict' } });
        // StrictMode double-invokes effects; assert the value still lands.
        expect(formRef.current.values.x).toBe('strict');
    });

    it('validator surfaces an error after validate', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ name: '' }} formRef={formRef}>
                <Field
                    name="name"
                    required
                    validator={(value: any) => (value ? '' : 'name is required')}
                >
                    <Input data-testid="name" />
                </Field>
            </Form>,
        );
        await formRef.current.validate().catch(() => {
            // expected: validation fails for the empty name field
        });
        // `required` adds Formily's built-in required message; the custom
        // validator adds 'name is required'. Both surface in field.selfErrors.
        expect(formRef.current.query('name').take().selfErrors).toContain('name is required');
    });

    // Silence unused-import noise in some runners.
    it('noop', () => {
        expect(vi.fn()).toBeDefined();
    });
});
