import { act, fireEvent, render, screen } from '@testing-library/react';
import type * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
    Form as FormWithControls,
    getControl,
    getControls,
    Input,
    InputNumber,
    RadioGroup,
    Select,
    Submit,
    Switch,
} from '../src/controls/index';
import { Field, Form, FormError } from '../src/index';

async function flush(): Promise<void> {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

describe('controls (Phase 3)', () => {
    it('InputNumber injects numeric value and writes back numbers', () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        const { container } = render(
            <Form initialValues={{ age: 1 }} formRef={formRef}>
                <Field name="age">
                    <InputNumber data-testid="age" />
                </Field>
            </Form>,
        );
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input.value).toBe('1');
        fireEvent.change(input, { target: { value: '42' } });
        // antd InputNumber parses the input to a number; rsform writes it through.
        expect(Number(formRef.current.values.age)).toBe(42);
    });

    it('Select with selectFirst auto-selects the first option', () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ color: '' }} formRef={formRef}>
                <Field name="color" selectFirst>
                    <Select
                        data-testid="color"
                        options={[
                            { label: 'Red', value: 'red' },
                            { label: 'Blue', value: 'blue' },
                        ]}
                    />
                </Field>
            </Form>,
        );
        expect(formRef.current.values.color).toBe('red');
    });

    it('RadioGroup defaults to optionType=button and writes the chosen value', () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ size: '' }} formRef={formRef}>
                <Field name="size">
                    <RadioGroup
                        data-testid="size"
                        options={[
                            { label: 'S', value: 's' },
                            { label: 'M', value: 'm' },
                        ]}
                    />
                </Field>
            </Form>,
        );
        // optionType defaults to 'button' → antd renders label inputs as buttons.
        const mLabel = screen.getByText('M');
        fireEvent.click(mLabel);
        expect(formRef.current.values.size).toBe('m');
    });

    it('Switch is an option-control: injects checked (boolean)', () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ enabled: false }} formRef={formRef}>
                <Field name="enabled">
                    <Switch data-testid="enabled" />
                </Field>
            </Form>,
        );
        const sw = screen.getByTestId('enabled');
        // antd Switch renders a <button role="switch" aria-checked>; the Field
        // injects `checked` (boolean) because Switch is tagged option-control.
        expect(sw.getAttribute('aria-checked')).toBe('false');
        fireEvent.click(sw);
        expect(formRef.current.values.enabled).toBe(true);
        expect(sw.getAttribute('aria-checked')).toBe('true');
    });

    it('Form.Submit calls onSubmit and shows loading while submitting', async () => {
        let resolveSubmit!: () => void;
        const submitted = vi.fn();
        const onSubmit = () =>
            new Promise<void>((resolve) => {
                resolveSubmit = resolve;
                submitted();
            });
        render(
            <Form initialValues={{ x: '' }} onSubmit={onSubmit}>
                <Field name="x">
                    <Input data-testid="x" />
                </Field>
                <Submit data-testid="submit">Go</Submit>
            </Form>,
        );
        const btn = screen.getByTestId('submit') as HTMLButtonElement;
        fireEvent.click(btn);
        // Let the click handler's setSubmitting(true) + form.submit flush.
        await flush();
        expect(submitted).toHaveBeenCalledTimes(1);
        // While the onSubmit promise is pending the button is disabled+loading.
        expect(btn.disabled).toBe(true);
        await act(async () => {
            resolveSubmit();
            await flush();
        });
        expect(btn.disabled).toBe(false);
    });

    it('FormError aggregates errors from multiple fields', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ a: '', b: '' }} formRef={formRef}>
                <Field name="a" required validator={() => 'err-a'}>
                    <Input data-testid="a" />
                </Field>
                <Field name="b" required validator={() => 'err-b'}>
                    <Input data-testid="b" />
                </Field>
                <FormError data-testid="formerror" />
            </Form>,
        );
        await formRef.current.validate().catch(() => {});
        await flush();
        const fe = screen.getByTestId('formerror');
        expect(fe.textContent).toContain('err-a');
        expect(fe.textContent).toContain('err-b');
    });

    it('FormError renders nothing when there are no errors', () => {
        render(
            <Form initialValues={{ a: '' }}>
                <Field name="a">
                    <Input />
                </Field>
                <FormError data-testid="formerror" />
            </Form>,
        );
        expect(screen.queryByTestId('formerror')).toBeNull();
    });

    it('FormComMap registry resolves known control keys', () => {
        const controls = getControls();
        expect(controls.input).toBe(Input);
        expect(controls.inputNumber).toBe(InputNumber);
        expect(controls.select).toBe(Select);
        expect(controls.radioGroup).toBe(RadioGroup);
        expect(controls.switch).toBe(Switch);
        expect(getControl('select')).toBe(Select);
        expect(getControl('nonexistent')).toBeUndefined();
    });

    it('Form namespace exposes antd controls + Submit', () => {
        // The controls subpath attaches antd controls + Submit onto Form.
        expect(FormWithControls.Input).toBe(Input);
        expect(FormWithControls.Select).toBe(Select);
        expect(FormWithControls.RadioGroup).toBe(RadioGroup);
        expect(FormWithControls.Switch).toBe(Switch);
        expect(FormWithControls.Submit).toBe(Submit);
        // FormError is antd-free, attached on the bare Form namespace.
        expect(FormWithControls.FormError).toBe(FormError);
    });
});
