import type * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Field, Form, Input } from '../src/index';

describe('Form + Field + Input end-to-end', () => {
    it('flows input value to form.values and submit calls onSubmit', async () => {
        const submitted = vi.fn();
        const formRef: React.MutableRefObject<any> = { current: null };

        render(
            <Form
                initialValues={{ name: '' }}
                onSubmit={(values) => submitted(values)}
                formRef={formRef}
            >
                <Field name="name">
                    <Input data-testid="name-input" />
                </Field>
            </Form>,
        );

        const input = screen.getByTestId('name-input') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'typed' } });
        expect(formRef.current.values.name).toBe('typed');

        await formRef.current.submit();
        expect(submitted).toHaveBeenCalledTimes(1);
        expect(submitted).toHaveBeenCalledWith({ name: 'typed' });
    });

    it('renders NonEditable when editable={false}', () => {
        render(
            <Form initialValues={{ name: 'locked-value' }}>
                <Field name="name" editable={false} title="Name" />
            </Form>,
        );
        expect(screen.getByText('locked-value')).toBeTruthy();
    });

    it('supports render-prop children receiving {value, onChange, state}', () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ count: 0 }} formRef={formRef}>
                <Field name="count">
                    {({ value, onChange }) => (
                        <button data-testid="inc" onClick={() => onChange(value + 1)}>
                            {value}
                        </button>
                    )}
                </Field>
            </Form>,
        );
        const btn = screen.getByTestId('inc');
        expect(btn.textContent).toBe('0');
        fireEvent.click(btn);
        expect(btn.textContent).toBe('1');
        expect(formRef.current.values.count).toBe(1);
    });
});
