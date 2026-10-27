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

export {Form} from './form/FormNamespace';
export type {FormProps} from './form/Form';

export {
    Field,
    FieldUi,
    FieldError,
    errorClassName,
    NonEditable,
    commonMap,
    isOptionControl,
    OPTION_CONTROL_MARKER,
    useSelectFirst,
    useContentName,
    FieldContext,
    useFieldContext,
    FieldContextProvider,
} from './field';
export type {
    FieldProps,
    FieldRenderApi,
    FieldUiProps,
    FieldErrorProps,
    NonEditableProps,
    CommonMapOptions,
    CommonMapResult,
    IFieldContext,
} from './field';
