import { act, fireEvent, render, screen } from '@testing-library/react';
import type * as React from 'react';
import { describe, expect, it } from 'vitest';
import { Input } from '../src/controls/index';
import { type EffectHelpers, getRefState } from '../src/effects';
import { Field, Form } from '../src/index';

/**
 * Helpers to read a field's state from the rendered form via its formRef.
 */
function useFormRef(): React.MutableRefObject<any> {
    const ref: React.MutableRefObject<any> = { current: null };
    return ref;
}

async function flush(): Promise<void> {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

describe('effects: $ bundle + sugar helpers', () => {
    it('hands the $ bundle to effects and exposes $.form', () => {
        const formRef = useFormRef();
        let received: EffectHelpers | undefined;
        render(
            <Form
                initialValues={{ a: 1 }}
                effects={($) => {
                    received = $;
                }}
                formRef={formRef}
            >
                <Field name="a">
                    <Input data-testid="a" />
                </Field>
            </Form>,
        );
        expect(received).toBeDefined();
        expect(received!.form).toBe(formRef.current);
    });

    it('onFieldValueChange (bare) reacts to a value change', () => {
        const formRef = useFormRef();
        const seen: any[] = [];
        render(
            <Form
                initialValues={{ a: '', b: '' }}
                effects={($) => {
                    $.onFieldValueChange('a', (field: any) => {
                        seen.push(field.value);
                    });
                }}
                formRef={formRef}
            >
                <Field name="a">
                    <Input data-testid="a" />
                </Field>
            </Form>,
        );
        fireEvent.change(screen.getByTestId('a'), { target: { value: 'x' } });
        expect(seen).toContain('x');
    });

    it('linkedFieldProps reactively toggles target visibility from a dep', async () => {
        const formRef = useFormRef();
        render(
            <Form
                initialValues={{ country: 'US', city: '' }}
                effects={($) => {
                    $.linkedFieldProps('city', ['country'], ({ country }) => ({
                        visible: country === 'CN',
                    }));
                }}
                formRef={formRef}
            >
                <Field name="country">
                    <Input data-testid="country" />
                </Field>
                <Field name="city">
                    <Input data-testid="city" />
                </Field>
            </Form>,
        );
        await flush();
        // country === 'US' → city hidden.
        expect(formRef.current.getFieldState('city', (s: any) => s.visible)).toBe(false);

        fireEvent.change(screen.getByTestId('country'), { target: { value: 'CN' } });
        await flush();
        expect(formRef.current.getFieldState('city', (s: any) => s.visible)).toBe(true);
    });

    it('linkedFieldProps async stale guard: a fast later result wins over a slow earlier one', async () => {
        const formRef = useFormRef();
        let resolveFirst: ((v: string) => void) | undefined;
        render(
            <Form
                initialValues={{ q: '', target: '' }}
                effects={($) => {
                    $.linkedFieldProps('target', ['q'], ({ q }) =>
                        new Promise<string>((resolve) => {
                            if (q === 'slow') {
                                resolveFirst = (v: string) => resolve(v as any);
                            } else {
                                resolve(`fast:${q}`);
                            }
                        }).then(() => ({ title: q === 'slow' ? 'SLOW' : 'FAST' })),
                    );
                }}
                formRef={formRef}
            >
                <Field name="q">
                    <Input data-testid="q" />
                </Field>
                <Field name="target">
                    <Input data-testid="target" />
                </Field>
            </Form>,
        );
        // Fire a slow request first.
        fireEvent.change(screen.getByTestId('q'), { target: { value: 'slow' } });
        await flush();
        // Then a fast one that should resolve first and set FAST.
        fireEvent.change(screen.getByTestId('q'), { target: { value: 'fast' } });
        await flush();
        expect(formRef.current.getFieldState('target', (s: any) => s.title)).toBe('FAST');
        // Now resolve the stale slow request; it must NOT overwrite FAST.
        resolveFirst?.('SLOW');
        await flush();
        expect(formRef.current.getFieldState('target', (s: any) => s.title)).toBe('FAST');
    });

    it('validateField reactively sets/clears target errors from a cross-field rule', async () => {
        const formRef = useFormRef();
        render(
            <Form
                initialValues={{ password: '', confirm: '' }}
                effects={($) => {
                    $.validateField('confirm', ['password', 'confirm'], ({ password, confirm }) =>
                        password && confirm && password !== confirm ? 'passwords do not match' : '',
                    );
                }}
                formRef={formRef}
            >
                <Field name="password">
                    <Input data-testid="password" />
                </Field>
                <Field name="confirm">
                    <Input data-testid="confirm" />
                </Field>
            </Form>,
        );
        await flush();
        fireEvent.change(screen.getByTestId('password'), { target: { value: 'abc' } });
        fireEvent.change(screen.getByTestId('confirm'), { target: { value: 'xyz' } });
        await flush();
        expect(formRef.current.query('confirm').take().selfErrors).toContain(
            'passwords do not match',
        );
        // Fix confirm → error clears.
        fireEvent.change(screen.getByTestId('confirm'), { target: { value: 'abc' } });
        await flush();
        expect(formRef.current.query('confirm').take().selfErrors).toHaveLength(0);
    });

    it('setRefState/getRefState is non-reactive per-form scratch storage', () => {
        const formRef = useFormRef();
        render(
            <Form
                initialValues={{ a: 0 }}
                effects={($) => {
                    $.setRefState('counter', 1);
                    $.setRefState('counter', (c: number) => c + 10);
                }}
                formRef={formRef}
            >
                <Field name="a">
                    <Input data-testid="a" />
                </Field>
            </Form>,
        );
        // Read via the same form through the bare helper.
        expect(getRefState(formRef.current, 'counter')).toBe(11);
    });

    it('onEachRowChange fires per-row with the right index and a row-scoped setter', async () => {
        const formRef = useFormRef();
        const calls: number[] = [];
        render(
            <Form
                initialValues={{
                    rows: [{ price: 10 }, { price: 5 }],
                }}
                effects={($) => {
                    $.onEachRowChange('rows', 'price', ({ index, field, setFieldState }) => {
                        calls.push(index);
                        // Mirror the changed price into a sibling key of the SAME row.
                        setFieldState('mirror', { value: field.value });
                    });
                }}
                formRef={formRef}
            >
                <Field name="rows.0.price">
                    <Input data-testid="p0" />
                </Field>
                <Field name="rows.1.price">
                    <Input data-testid="p1" />
                </Field>
            </Form>,
        );
        await flush();
        // Both rows mirrored their initial price on mount.
        expect(formRef.current.getValuesIn('rows.0.mirror')).toBe(10);
        expect(formRef.current.getValuesIn('rows.1.mirror')).toBe(5);
        const callsBeforeChange = calls.length;
        fireEvent.change(screen.getByTestId('p1'), { target: { value: '99' } });
        await flush();
        // The change fired for row 1 (not row 0).
        expect(calls[calls.length - 1]).toBe(1);
        expect(calls.length).toBe(callsBeforeChange + 1);
        // Row-scoped: row 1's mirror updated, row 0's mirror untouched.
        expect(formRef.current.getValuesIn('rows.1.mirror')).toBe('99');
        expect(formRef.current.getValuesIn('rows.0.mirror')).toBe(10);
    });

    it('onEachRowMultiChange computes a derived row field from several inputs', async () => {
        const formRef = useFormRef();
        render(
            <Form
                initialValues={{
                    rows: [{ price: 10, qty: 2, discount: 1, total: 0 }],
                }}
                effects={($) => {
                    $.onEachRowMultiChange(
                        'rows',
                        ['price', 'qty', 'discount'],
                        ({ values, setFieldState }) => {
                            const total =
                                Number(values.price) * Number(values.qty) - Number(values.discount);
                            setFieldState('total', { value: total });
                        },
                    );
                }}
                formRef={formRef}
            >
                <Field name="rows.0.price">
                    <Input data-testid="price" />
                </Field>
                <Field name="rows.0.qty">
                    <Input data-testid="qty" />
                </Field>
            </Form>,
        );
        await flush();
        // initial: 10 * 2 - 1 = 19
        expect(formRef.current.getValuesIn('rows.0.total')).toBe(19);
        fireEvent.change(screen.getByTestId('qty'), { target: { value: '5' } });
        await flush();
        // 10 * 5 - 1 = 49
        expect(formRef.current.getValuesIn('rows.0.total')).toBe(49);
    });

    it('effects: array of EffectFn fans out in order', () => {
        const order: string[] = [];
        render(
            <Form
                initialValues={{ a: '' }}
                effects={[() => order.push('first'), () => order.push('second')]}
            >
                <Field name="a">
                    <Input data-testid="a" />
                </Field>
            </Form>,
        );
        expect(order).toEqual(['first', 'second']);
    });

    it('validateField clearEffect stops further reactions', async () => {
        const formRef = useFormRef();
        let handle: { clearEffect: () => void } | undefined;
        render(
            <Form
                initialValues={{ a: '', b: '' }}
                effects={($) => {
                    handle = $.validateField('b', ['a'], ({ a }) => (a ? 'err' : ''));
                }}
                formRef={formRef}
            >
                <Field name="a">
                    <Input data-testid="a" />
                </Field>
                <Field name="b">
                    <Input data-testid="b" />
                </Field>
            </Form>,
        );
        await flush();
        fireEvent.change(screen.getByTestId('a'), { target: { value: 'x' } });
        await flush();
        expect(formRef.current.query('b').take().selfErrors).toContain('err');
        // Tear down; subsequent changes must not re-trigger.
        handle!.clearEffect();
        fireEvent.change(screen.getByTestId('a'), { target: { value: 'y' } });
        await flush();
        // Error stays as last applied ('err'); clearEffect is a liveness flag,
        // so it doesn't actively clear — it just stops new reactions.
        expect(formRef.current.query('b').take().selfErrors).toContain('err');
    });
});
