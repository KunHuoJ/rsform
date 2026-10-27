import * as FormilyReact from '@formily/react';
import {Form as FormComponent} from './Form';
import {Field} from '../field/Field';
import {FormError} from './FormError';

/**
 * rsform.Form is the Form component with sub-components attached as static
 * properties: Form.Field, Form.FormError, Form.Formily (full @formily/react
 * namespace).
 *
 * Note: antd control wrappers (Form.Input, Form.Select, …) and Form.Submit
 * live on the `rsform/antd` subpath entry so the bare `rsform` entry stays
 * antd-free.
 */
export const Form = Object.assign(FormComponent, {
    Field,
    FormError,
    Formily: FormilyReact,
}) as typeof FormComponent & {
    Field: typeof Field;
    FormError: typeof FormError;
    Formily: typeof FormilyReact;
};

export type {FormProps} from './Form';
