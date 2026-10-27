import * as React from 'react';
import {describe, it, expect} from 'vitest';
import {render, screen, fireEvent, act} from '@testing-library/react';
import {Form, Field} from '../src/index';
import {Input} from '../src/controls/index';

/**
 * Form.Consumer — render-prop subscriber over reactive form state.
 *
 * Two modes:
 *  - no `name`: subscribes to the whole form.values (any field change re-renders)
 *  - with `name`: subscribes to that leaf only (only that leaf change re-renders)
 *
 * Clean-room reimpl of the "inline read form values" convenience — built on
 * Formily v2's observer + form.values, not a port of any icloud-ui API.
 */
describe('Form.Consumer', () => {
    it('renders the whole form.values when no name is given', () => {
        const formRef: React.MutableRefObject<any> = {current: null};
        render(
            <Form initialValues={{name: 'a', age: 1}} formRef={formRef}>
                <Form.Consumer>{values => <span data-testid="out">{`${values.name}-${values.age}`}</span>}</Form.Consumer>
            </Form>,
        );
        expect(screen.getByTestId('out').textContent).toBe('a-1');

        act(() => {
            formRef.current.setValuesIn('age', 2);
        });
        expect(screen.getByTestId('out').textContent).toBe('a-2');
    });

    it('subscribes to a single named field and updates only on that leaf', () => {
        const formRef: React.MutableRefObject<any> = {current: null};

        render(
            <Form initialValues={{name: '', other: ''}} formRef={formRef}>
                <Form.Consumer name="name">{v => <span data-testid="out">{String(v)}</span>}</Form.Consumer>
            </Form>,
        );
        const before = screen.getByTestId('out').textContent;

        // Changing an UNRELATED field must NOT re-render the named Consumer's output.
        act(() => {
            formRef.current.setValuesIn('other', 'x');
        });
        expect(screen.getByTestId('out').textContent).toBe(before);

        // Changing the subscribed leaf updates the output.
        act(() => {
            formRef.current.setValuesIn('name', 'typed');
        });
        expect(screen.getByTestId('out').textContent).toBe('typed');
    });

    it('resolves names against the nearest FieldContext (child of a Field)', () => {
        const formRef: React.MutableRefObject<any> = {current: null};
        render(
            <Form initialValues={{rows: [{qty: 5, price: 2}]}} formRef={formRef}>
                <Field name="rows.0">
                    {/* No leading dot: appended to preName → resolves to rows.0.qty */}
                    <Form.Consumer name="qty">{qty => <span data-testid="out">{String(qty)}</span>}</Form.Consumer>
                </Field>
            </Form>,
        );
        expect(screen.getByTestId('out').textContent).toBe('5');

        act(() => {
            formRef.current.setValuesIn('rows.0.qty', 9);
        });
        expect(screen.getByTestId('out').textContent).toBe('9');
    });

    it('reflects real input edits flowing through Field', () => {
        render(
            <Form initialValues={{name: ''}}>
                <Field name="name">
                    <Input data-testid="name-input" />
                </Field>
                <Form.Consumer name="name">{v => <span data-testid="mirror">{String(v)}</span>}</Form.Consumer>
            </Form>,
        );
        const input = screen.getByTestId('name-input') as HTMLInputElement;
        fireEvent.change(input, {target: {value: 'hello'}});
        expect(screen.getByTestId('mirror').textContent).toBe('hello');
    });
});
