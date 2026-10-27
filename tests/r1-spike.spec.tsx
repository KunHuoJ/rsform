import * as React from 'react';
import {describe, it, expect} from 'vitest';
import {render} from '@testing-library/react';
import {Form, Field} from '../src/index';
import {Input} from '../src/controls/index';

/**
 * R1 spike: verify form.createField({name, validator}) registers a field for
 * validation WITHOUT rendering a <Field> in the tree. This is the feasibility
 * gate for the high-perf Table's CellBridge (Phase 5), which needs cell
 * validation to work without per-cell Formily Field subscriptions.
 */
describe('R1 spike — form.createField without rendering <Field>', () => {
    it('runs a validator on a programmatically created field', async () => {
        const formRef: React.MutableRefObject<any> = {current: null};

        function Harness() {
            const form = formRef;
            React.useEffect(() => {
                if (!form.current) return;
                form.current.createField({
                    name: 'hidden-x',
                    basePath: '',
                    validator: (value: any) => (value ? '' : 'hidden-x is required'),
                });
            }, []);
            return null;
        }

        render(
            <Form initialValues={{}} formRef={formRef}>
                <Field name="visible">
                    <Input data-testid="visible" />
                </Field>
                <Harness />
            </Form>,
        );

        // Wait a tick for the effect to register the field.
        await Promise.resolve();
        const field = formRef.current.query('hidden-x').take();
        expect(field).toBeTruthy();
        // Formily's form.validate() rejects with the errors array when invalid.
        try {
            await formRef.current.validate();
        } catch (_e) {
            // expected: validation fails for the empty hidden-x field
        }
        const errs = formRef.current.query('hidden-x').take().selfErrors;
        expect(errs).toContain('hidden-x is required');
    });
});
