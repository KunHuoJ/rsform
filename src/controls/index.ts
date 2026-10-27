/**
 * rsform/antd — antd 5 control wrappers.
 *
 * Bare `rsform` keeps Form/Field antd-agnostic; this subpath adds the antd
 * controls and attaches them onto the Form namespace (Form.Input, …) for
 * ergonomic access. Also exports the control registry (FormComMap) used by
 * the high-perf Table.
 */
import * as React from 'react';
import {Button as AntdButton} from 'antd';
import {Form as BaseForm} from '../form/FormNamespace';
import {Submit} from '../form/Submit';
import {Input, TextArea} from './Input';
import {InputNumber} from './InputNumber';
import {Select} from './Select';
import {RadioGroup} from './RadioGroup';
import {Switch} from './Switch';
import {prefixCls} from '../shared/prefixCls';

/**
 * The rsform.Form namespace as exposed by the `rsform/antd` subpath: the bare
 * Form (Field/FormError/Formily) plus the antd controls and Submit attached
 * as static properties. `Object.assign` mutates the shared Form object in
 * place (so any code holding the bare Form also sees the controls once this
 * subpath is imported) and widens the type to include them.
 *
 * `InputNumber`/`Select` are typed as `React.ComponentType<any>` here to keep
 * the emitted declaration portable (antd's exact types reference internal
 * `rc-*` packages that aren't resolvable from a consumer's `.d.ts`). Consumers
 * wanting precise antd prop types should import the components directly:
 * `import {InputNumber} from 'rsform/antd'`.
 */
export type ControlsForm = typeof BaseForm & {
    Input: typeof Input;
    TextArea: typeof TextArea;
    InputNumber: React.ComponentType<any>;
    Select: React.ComponentType<any>;
    RadioGroup: typeof RadioGroup;
    Switch: typeof Switch;
    Submit: typeof Submit;
    /** antd `Button` re-export, so consumers can build custom action buttons
     * (e.g. a custom Table remove/add button) from the same antd the lib uses. */
    Button: typeof AntdButton;
};

export const Form: ControlsForm = Object.assign(BaseForm, {
    Input,
    TextArea,
    InputNumber,
    Select,
    RadioGroup,
    Switch,
    Submit,
    Button: AntdButton,
}) as ControlsForm;

export {Input, TextArea};
export {InputNumber} from './InputNumber';
export {Select} from './Select';
export {RadioGroup} from './RadioGroup';
export type {RadioGroupProps} from './RadioGroup';
export {Switch} from './Switch';
export {Submit} from '../form/Submit';
export type {SubmitProps} from '../form/Submit';
/** antd `Button` re-export (also `Form.Button`). Use for custom action buttons. */
export {Button as AntdButton} from 'antd';
export {
    getControl,
    registerControl,
    getControls,
} from './FormComMap';
export type {ControlKey, ControlComponent} from './FormComMap';
export {prefixCls};
