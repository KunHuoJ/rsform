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
import { FormError } from './form/FormError';
import { Submit } from './form/Submit';
import { Table } from './table/Table';

export const VERSION = '0.1.0';

/**
 * rsform — High-performance React form library built on Formily v2 + antd 5.
 *
 * Single entry. `import { Form } from 'rsform'` gives the whole `Form`
 * namespace: `Form.Field` / `Form.Consumer` (core) + `Form.Input` /
 * `Form.Select` / … / `Form.Submit` / `Form.Button` (antd controls) +
 * `Form.Table` + `Form.ArrayItems`. Use `rsform/styles` separately for the CSS.
 *
 * The control registry (`FormComMap`, pre-populated with the antd controls) is
 * imported transitively via `Table` → `CellBridge` → `FormComMap`, so the
 * Table's `control: 'input'` lookups resolve without any extra import.
 */

export { Button } from 'antd';
// ArrayItems.
export type { ArrayItemsProps } from './array-items/ArrayItems';
export { ArrayItems } from './array-items/ArrayItems';
export type { ArrayUnionValidator } from './array-items/arrayUnion';
export { arrayUnion } from './array-items/arrayUnion';
export { ArrayFieldContext, useArrayField } from './array-items/useArrayItems';
export { DatePicker } from './controls/DatePicker';
// Controls + control registry.
export type { ControlComponent, ControlKey } from './controls/FormComMap';
export { getControl, getControls, registerControl } from './controls/FormComMap';
export { Input, TextArea } from './controls/Input';
export { InputNumber } from './controls/InputNumber';
export type { RadioGroupProps } from './controls/RadioGroup';
export { RadioGroup } from './controls/RadioGroup';
export { Select } from './controls/Select';
export { Switch } from './controls/Switch';
// Effects helpers + types.
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
    createEffects,
    getRefState,
    LifeCycleTypes,
    linkedFieldProps,
    mergeEffects,
    onEachRowChange,
    onEachRowMultiChange,
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
// Field pieces + types.
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
// Form pieces.
export { Consumer as FormConsumer } from './form/Consumer';
export type { FormProps } from './form/Form';
export { FormError } from './form/FormError';
export type { FormConsumerProps } from './form/FormNamespace';
export type { SubmitProps } from './form/Submit';
export { Submit } from './form/Submit';
export type { CellBridgeProps } from './table/CellBridge';
export { CellBridge } from './table/CellBridge';
export { Table } from './table/Table';
// Table.
export type {
    BuiltColumns,
    RsfTableColumn,
    RsfTableColumnActions,
    RsfTableProps,
} from './table/types';
export { useTable } from './table/useTable';

/**
 * The unified `Form` namespace: the bare `Form` (Field / Consumer / FormError /
 * Formily) plus the antd controls, `Submit`, `Table`, and `ArrayItems` — all
 * attached as static properties so `Form.Field` / `Form.Input` / `Form.Table`
 * / `Form.ArrayItems` / `Form.Submit` work from a single `rsform` import.
 *
 * `Object.assign` attaches the static properties onto the shared `Form`
 * component in place.
 */
export type RsfForm = typeof FormComponent & {
    Field: typeof Field;
    Consumer: typeof Consumer;
    FormError: typeof FormError;
    Formily: typeof FormilyReact;
    Input: typeof Input;
    TextArea: typeof TextArea;
    InputNumber: React.ComponentType<any>;
    Select: React.ComponentType<any>;
    RadioGroup: typeof RadioGroup;
    Switch: typeof Switch;
    DatePicker: typeof DatePicker;
    Submit: typeof Submit;
    /** antd `Button` re-export, for custom action buttons. */
    Button: typeof AntdButton;
    Table: typeof Table;
    ArrayItems: typeof ArrayItems;
};

export const Form: RsfForm = Object.assign(FormComponent, {
    Field,
    Consumer,
    FormError,
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
