import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Field, Form, Input, Submit } from '../src/index';

describe('Submit onSubmit override', () => {
    it('Submit.onSubmit replaces (not adds to) Form.onSubmit', async () => {
        const formCb = vi.fn();
        const submitCb = vi.fn();

        render(
            <Form initialValues={{ x: '' }} onSubmit={formCb}>
                <Field name="x">
                    <Input data-testid="x" />
                </Field>
                <Submit onSubmit={submitCb}>go</Submit>
            </Form>,
        );

        fireEvent.change(screen.getByTestId('x'), { target: { value: '1' } });
        fireEvent.click(screen.getByText('go'));

        // The submit flow is async (validation + lifecycle + onSubmit promise).
        await waitFor(() => expect(submitCb).toHaveBeenCalledTimes(1));
        expect(submitCb).toHaveBeenCalledWith({ x: '1' });
        // Form-level onSubmit must be overridden, not invoked in addition.
        expect(formCb).toHaveBeenCalledTimes(0);
    });

    it('Form.onSubmit still fires when Submit has no onSubmit prop', async () => {
        const formCb = vi.fn();

        render(
            <Form initialValues={{ x: '' }} onSubmit={formCb}>
                <Field name="x">
                    <Input data-testid="x" />
                </Field>
                <Submit>go</Submit>
            </Form>,
        );

        fireEvent.change(screen.getByTestId('x'), { target: { value: '1' } });
        fireEvent.click(screen.getByText('go'));

        await waitFor(() => expect(formCb).toHaveBeenCalledTimes(1));
        expect(formCb).toHaveBeenCalledWith({ x: '1' });
    });
});
