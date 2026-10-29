import type * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

    it('preventDuplicate: after a successful submit the button stays disabled', async () => {
        const onSubmit = vi.fn(() => Promise.resolve());
        render(
            <Form initialValues={{ x: '' }} onSubmit={onSubmit}>
                <Field name="x">
                    <Input data-testid="x" />
                </Field>
                <Submit preventDuplicate data-testid="go">
                    go
                </Submit>
            </Form>,
        );
        const btn = screen.getByTestId('go') as HTMLButtonElement;
        fireEvent.change(screen.getByTestId('x'), { target: { value: '1' } });
        fireEvent.click(btn);
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        // After the onSubmit promise resolves, the button stays disabled
        // (one-shot lock) — a second click does nothing.
        await waitFor(() => expect(btn.disabled).toBe(true));
        fireEvent.click(btn);
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    });

    it('preventDuplicate: synchronous re-entry guard collapses a double click', async () => {
        const onSubmit = vi.fn(() => Promise.resolve());
        render(
            <Form initialValues={{ x: '' }} onSubmit={onSubmit}>
                <Field name="x">
                    <Input data-testid="x" />
                </Field>
                <Submit preventDuplicate data-testid="go">
                    go
                </Submit>
            </Form>,
        );
        const btn = screen.getByTestId('go') as HTMLButtonElement;
        fireEvent.change(screen.getByTestId('x'), { target: { value: '1' } });
        // Two synchronous clicks before any re-render.
        fireEvent.click(btn);
        fireEvent.click(btn);
        await waitFor(() => expect(onSubmit).toHaveBeenCalled());
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('preventDuplicate: reset clears the one-shot lock', async () => {
        const onSubmit = vi.fn(() => Promise.resolve());
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form formRef={formRef} initialValues={{ x: '' }} onSubmit={onSubmit}>
                <Field name="x">
                    <Input data-testid="x" />
                </Field>
                <Submit preventDuplicate data-testid="go">
                    go
                </Submit>
            </Form>,
        );
        const btn = screen.getByTestId('go') as HTMLButtonElement;
        fireEvent.change(screen.getByTestId('x'), { target: { value: '1' } });
        fireEvent.click(btn);
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(btn.disabled).toBe(true));
        // Reset → form.pristine returns → lock clears → submit allowed again.
        act(() => {
            formRef.current.reset();
        });
        await waitFor(() => expect(btn.disabled).toBe(false));
        fireEvent.change(screen.getByTestId('x'), { target: { value: '2' } });
        fireEvent.click(btn);
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    });
});
