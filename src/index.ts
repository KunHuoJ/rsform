import type * as React from 'react';
import * as FormilyReact from '@formily/react';
import { Button as AntdButton } from 'antd';
import { ArrayItems } from './array-items/ArrayItems';
import { DatePicker } from './controls/DatePicker';
import { Input, TextArea } from './controls/Input';
import { InputNumber } from './controls/InputNumber';
import { RadioGroup } from './controls/RadioGroup';
import { Select } from './controls/Select';
import { Switch } from './controls/Switch';
import { Field } from './field';
import { Consumer } from './form/Consumer';
import { Form as FormComponent } from './form/Form';
import { Submit } from './form/Submit';
import { Table } from './table/Table';

export const VERSION = '0.1.0';

/**
 * rsform — 基于 Formily v2 + antd 5 的高性能 React 表单库。
 *
 * 单一入口。`import { Form } from 'rsform'` 即可得到完整的 `Form`
 * 命名空间:`Form.Field` / `Form.Consumer`(核心)+ `Form.Input` /
 * `Form.Select` / … / `Form.Submit` / `Form.Button`(antd 控件)+
 * `Form.Table` + `Form.ArrayItems`。CSS 样式请单独引入 `rsform/styles`。
 *
 * 控件注册表(`FormComMap`,已预置 antd 控件)通过
 * `Table` → `CellBridge` → `FormComMap` 被间接引入,因此
 * Table 的 `control: 'input'` 查找无需任何额外 import 即可解析。
 */

export { Button } from 'antd';
// ArrayItems。
export type { ArrayItemsProps } from './array-items/ArrayItems';
export { ArrayItems } from './array-items/ArrayItems';
export type { ArrayUnionValidator } from './array-items/arrayUnion';
export { arrayUnion } from './array-items/arrayUnion';
export { ArrayFieldContext, useArrayField } from './array-items/useArrayItems';
export { DatePicker } from './controls/DatePicker';
// 控件 + 控件注册表。
export type { ControlComponent, ControlKey, RsfControlRegistry } from './controls/FormComMap';
export { getControl, getControls, registerControl } from './controls/FormComMap';
export { Input, TextArea } from './controls/Input';
export { InputNumber } from './controls/InputNumber';
export type { RadioGroupProps } from './controls/RadioGroup';
export { RadioGroup } from './controls/RadioGroup';
export { Select } from './controls/Select';
export { Switch } from './controls/Switch';
// Effects 辅助函数 + 类型。
export type {
    EachRowCb,
    EachRowCtx,
    EachRowMultiCb,
    EachRowMultiCtx,
    EffectFn,
    EffectHelpers,
    EffectsProp,
    LinkedFieldPropsCompute,
    ValidateFieldCb,
    ValidateFieldHandle,
} from './effects';
export {
    clearOn,
    createEffects,
    debounce,
    getRefState,
    LifeCycleTypes,
    linkedFieldProps,
    mergeEffects,
    onEachRowChange,
    onEachRowMultiChange,
    onFieldInputValueChange,
    onFieldMount,
    onFieldReact,
    onFieldUnmount,
    onFieldValueChange,
    onFormReset,
    onFormSubmit,
    onFormSubmitValidateFailed,
    setRefState,
    validateField,
} from './effects';
// Field 相关组件 + 类型。
export type {
    CommonMapOptions,
    CommonMapResult,
    FieldErrorProps,
    FieldProps,
    FieldRenderApi,
    FieldUiProps,
    IFieldContext,
    NonEditableProps,
} from './field';
export {
    commonMap,
    errorClassName,
    Field,
    FieldContext,
    FieldContextProvider,
    FieldError,
    FieldUi,
    isOptionControl,
    NonEditable,
    OPTION_CONTROL_MARKER,
    useContentName,
    useFieldContext,
    useSelectFirst,
} from './field';
// Form 相关组件。
export { Consumer as FormConsumer } from './form/Consumer';
export type { FormProps } from './form/Form';
export type { FormConsumerProps } from './form/FormNamespace';
export type { SubmitProps } from './form/Submit';
export { Submit } from './form/Submit';
export type { UseFormDraftOptions, UseFormDraftResult } from './form/useFormDraft';
export { useFormDraft } from './form/useFormDraft';
export type { CellBridgeProps } from './table/CellBridge';
export { CellBridge } from './table/CellBridge';
export { Table } from './table/Table';
// Table。
export type {
    BuiltColumns,
    RsfTableColumn,
    RsfTableColumnActions,
    RsfTableProps,
} from './table/types';
export { useTable } from './table/useTable';

/**
 * 统一的 `Form` 命名空间:基础的 `Form`(Field / Consumer / Formily)
 * 加上 antd 控件、`Submit`、`Table` 和 `ArrayItems` —— 全部作为静态属性
 * 挂载,因此只需一次 `rsform` import 即可使用 `Form.Field` / `Form.Input` /
 * `Form.Table` / `Form.ArrayItems` / `Form.Submit`。
 *
 * `Object.assign` 将这些静态属性就地挂载到共享的 `Form` 组件上。
 */
export type RsfForm = typeof FormComponent & {
    Field: typeof Field;
    Consumer: typeof Consumer;
    Formily: typeof FormilyReact;
    Input: typeof Input;
    TextArea: typeof TextArea;
    InputNumber: React.ComponentType<any>;
    Select: React.ComponentType<any>;
    RadioGroup: typeof RadioGroup;
    Switch: typeof Switch;
    DatePicker: typeof DatePicker;
    Submit: typeof Submit;
    /** 转导出 antd 的 `Button`,用于自定义操作按钮。 */
    Button: typeof AntdButton;
    Table: typeof Table;
    ArrayItems: typeof ArrayItems;
};

export const Form: RsfForm = Object.assign(FormComponent, {
    Field,
    Consumer,
    Formily: FormilyReact,
    Input,
    TextArea,
    InputNumber,
    Select,
    RadioGroup,
    Switch,
    DatePicker,
    Submit,
    Button: AntdButton,
    Table,
    ArrayItems,
}) as RsfForm;
