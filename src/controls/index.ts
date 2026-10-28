/**
 * antd 5 control wrappers + the control registry (FormComMap) used by the
 * high-perf Table. The single `rsform` entry (`src/index.ts`) re-exports these
 * and attaches them onto the `Form` namespace (Form.Input, …, Form.Submit,
 * Form.Button). This module is the implementation surface for the controls;
 * consumers import from `rsform` directly.
 */

import type * as React from 'react';
import { Button as AntdButton } from 'antd';
import { Form as BaseForm } from '../form/FormNamespace';
import { Submit } from '../form/Submit';
import { prefixCls } from '../shared/prefixCls';
import { DatePicker } from './DatePicker';
import { Input, TextArea } from './Input';
import { InputNumber } from './InputNumber';
import { RadioGroup } from './RadioGroup';
import { Select } from './Select';
import { Switch } from './Switch';

/**
 * The rsform.Form namespace augmented with the antd controls + Submit (the
 * "controls" layer of the Form namespace). `Object.assign` mutates the shared
 * Form object in place and widens the type to include the controls.
 *
 * `InputNumber`/`Select` are typed as `React.ComponentType<any>` here to keep
 * the emitted declaration portable (antd's exact types reference internal
 * `rc-*` packages that aren't resolvable from a consumer's `.d.ts`). Consumers
 * wanting precise antd prop types should import the components directly:
 * `import { InputNumber } from 'rsform'`.
 */
export type ControlsForm = typeof BaseForm & {
    Input: typeof Input;
    TextArea: typeof TextArea;
    InputNumber: React.ComponentType<any>;
    Select: React.ComponentType<any>;
    RadioGroup: typeof RadioGroup;
    Switch: typeof Switch;
    DatePicker: typeof DatePicker;
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
    DatePicker,
    Submit,
    Button: AntdButton,
}) as ControlsForm;

/** antd `Button` re-export (also `Form.Button`). Use for custom action buttons. */
export { Button as AntdButton } from 'antd';
export type { SubmitProps } from '../form/Submit';
export { Submit } from '../form/Submit';
export { DatePicker } from './DatePicker';
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
