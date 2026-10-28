/**
 * rsform/antd — antd 5 control wrappers.
 *
 * Bare `rsform` keeps Form/Field antd-agnostic; this subpath adds the antd
 * controls and attaches them onto the Form namespace (Form.Input, …) for
 * ergonomic access. Also exports the control registry (FormComMap) used by
 * the high-perf Table.
 */

import { Button as AntdButton } from 'antd';
import type * as React from 'react';
import { Form as BaseForm } from '../form/FormNamespace';
import { Submit } from '../form/Submit';
import { prefixCls } from '../shared/prefixCls';
import { Input, TextArea } from './Input';
import { InputNumber } from './InputNumber';
import { RadioGroup } from './RadioGroup';
import { Select } from './Select';
import { Switch } from './Switch';

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

/** antd `Button` re-export (also `Form.Button`). Use for custom action buttons. */
export { Button as AntdButton } from 'antd';
export type { SubmitProps } from '../form/Submit';
export { Submit } from '../form/Submit';
export type { ControlComponent, ControlKey } from './FormComMap';
export {
    getControl,
    getControls,
    registerControl,
} from './FormComMap';
export { InputNumber } from './InputNumber';
export type { RadioGroupProps } from './RadioGroup';
export { RadioGroup } from './RadioGroup';
export { Select } from './Select';
export { Switch } from './Switch';
export { Input, prefixCls, TextArea };
