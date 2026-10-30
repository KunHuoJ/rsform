/**
 * 将 Formily v2 的生命周期 hook 重新导出为 rsform 的「原生」effect helper。
 * 它们是全局注册 helper：在 `effects` 回调内调用它们（当 form 的 effect
 * 作用域处于激活状态时）会接入该 form 的生命周期。rsform 的语法糖 helper
 * （`linkedFieldProps`、`validateField`、…）都构建在它们之上。
 *
 * 注意：Formily v2 的 effect hook 返回 `void`（没有单个 hook 的 disposer）；
 * 它们在 form 的整个生命周期内保持注册。rsform 的 `validateField` 通过一个
 * 内部存活标志提供了 `clearEffect` handle，用于热重载/拆卸。
 */
export {
    LifeCycleTypes,
    onFieldChange,
    onFieldInit,
    onFieldInitialValueChange,
    onFieldInputValueChange,
    onFieldMount,
    onFieldReact,
    onFieldUnmount,
    onFieldValueChange,
    onFormGraphChange,
    onFormInit,
    onFormMount,
    onFormReact,
    onFormReset,
    onFormSubmit,
    onFormSubmitFailed,
    onFormSubmitSuccess,
    onFormSubmitValidateFailed,
    onFormSubmitValidateSuccess,
    onFormUnmount,
    onFormValuesChange,
} from '@formily/core';
