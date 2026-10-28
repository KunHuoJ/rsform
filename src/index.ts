/**
 * rsform — High-performance React form library built on Formily v2 + antd 5.
 *
 * Bare entry (antd-free): Form, Field, effect helpers (Phase 2), types.
 * Subpaths:
 *   - rsform/antd        : antd control wrappers + Form.Input / Form.Select / …
 *   - rsform/table       : high-performance editable Table
 *   - rsform/array-items : draggable array list
 *   - rsform/effects     : effect helper sugar
 */

export const VERSION = '0.1.0';

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
// Effects — also available via the `rsform/effects` subpath.
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
export { Consumer as FormConsumer } from './form/Consumer';
export type { FormProps } from './form/Form';
export type { FormErrorProps } from './form/FormError';
export { FormError } from './form/FormError';
export type { FormConsumerProps } from './form/FormNamespace';
export { Form } from './form/FormNamespace';
