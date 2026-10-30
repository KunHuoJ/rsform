/**
 * antd 5 控件封装 + 高性能 Table 使用的控件注册表（FormComMap）。单一的
 * `rsform` 入口（`src/index.ts`）会重新导出这些内容，并把它们挂载到 `Form`
 * 命名空间上（Form.Input、…、Form.Submit、Form.Button）。本模块是这些控件的
 * 实现层面；消费方直接从 `rsform` 导入。
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
 * 增补了 antd 控件 + Submit 的 rsform.Form 命名空间（Form 命名空间的「控件」
 * 层）。`Object.assign` 就地修改共享的 Form 对象，并将其类型拓宽以包含这些控件。
 *
 * 这里将 `InputNumber`/`Select` 的类型标注为 `React.ComponentType<any>`，以保持
 * 生成的声明文件可移植（antd 的精确类型会引用内部的 `rc-*` 包，而这些包从消费方
 * 的 `.d.ts` 中无法解析）。想要精确 antd prop 类型的消费方应直接导入组件：
 * `import { InputNumber } from 'rsform'`。
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
    /** antd `Button` 的重新导出，使消费方可以用库所使用的同一套 antd 来构建
     * 自定义操作按钮（例如自定义的 Table 删除/新增按钮）。 */
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

/** antd `Button` 的重新导出（也是 `Form.Button`）。用于自定义操作按钮。 */
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
