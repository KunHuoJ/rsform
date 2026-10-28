import * as FormilyReact from '@formily/react';
import { Field } from '../field/Field';
import { Consumer } from './Consumer';
import { Form as FormComponent } from './Form';

/**
 * rsform.Form is the Form component with sub-components attached as static
 * properties: Form.Field, Form.Consumer, Form.Formily (full @formily/react
 * namespace).
 *
 * The antd controls (Form.Input, Form.Select, …), Form.Submit, Form.Button,
 * Form.Table and Form.ArrayItems are attached in `src/index.ts` (the single
 * `rsform` entry), so `import { Form } from 'rsform'` yields the whole
 * namespace. This `FormNamespace` module holds only the core (antd-free)
 * pieces, so it can be reused by the single entry without circular concerns.
 */
export const Form = Object.assign(FormComponent, {
    Field,
    Consumer,
    Formily: FormilyReact,
}) as typeof FormComponent & {
    Field: typeof Field;
    Consumer: typeof Consumer;
    Formily: typeof FormilyReact;
};

export type { FormConsumerProps } from './Consumer';
export type { FormProps } from './Form';
