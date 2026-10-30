import type { Form as FormilyForm } from '@formily/core';
import { onFieldReact, onFieldValueChange } from '@formily/core';
import { clearOn } from './clearOn';
import { debounce } from './debounce';
import { type LinkedFieldPropsCompute, linkedFieldProps } from './linkedFieldProps';
import { type EachRowCb, onEachRowChange } from './onEachRowChange';
import { type EachRowMultiCb, onEachRowMultiChange } from './onEachRowMultiChange';
import { getRefState, setRefState } from './refState';
import { type ValidateFieldCb, type ValidateFieldHandle, validateField } from './validateField';

/**
 * 传入每个 `effects` 回调的 `$` helper 集合。它暴露原始的 Formily form，
 * 以及 rsform 的语法糖 helper（这些 helper 已闭包捕获 form，调用方无需
 * 重复传入）。裸的 Formily 生命周期 hook 也可以直接在 `effects` 函数体内
 * 调用（它们会自动注册到当前激活的 form 上），因此这里一并提供
 * `$.onFieldValueChange` / `$.onFieldReact` 以保持用法上的一致。
 */
export interface EffectHelpers {
    /** 底层的 Formily form 实例。 */
    form: FormilyForm;
    /** 非响应式的、按 form 隔离的临时存储。传入函数值时视为 immer 的 updater。 */
    setRefState: (key: string, value: any) => void;
    getRefState: <T = any>(key: string) => T | undefined;
    /**
     * 字段值变更监听器（Formily v2 原生）。仅在字段值发生变化时触发，
     * 初始化时不会触发。
     */
    onFieldValueChange: typeof onFieldValueChange;
    /**
     * 响应式字段 reaction（Formily v2 原生）。回调会在字段初始化时执行一次，
     * 之后每当字段上任意可观察属性（value/visible/display/…）变化时再次执行。
     * 需要「初始化与变更都要执行」的联动时就用它——例如根据某个值切换另一个
     * 字段的 `visible`，且初始值在挂载时也必须生效（无需再把
     * `onFieldValueChange` 和单独的 `ON_FIELD_MOUNT` 处理器配对使用）。
     */
    onFieldReact: typeof onFieldReact;
    linkedFieldProps: (target: string, deps: string[], compute: LinkedFieldPropsCompute) => void;
    validateField: (
        name: string,
        triggers: string[] | ValidateFieldCb,
        cb?: ValidateFieldCb,
    ) => ValidateFieldHandle;
    onEachRowChange: (pre: string, key: string, cb: EachRowCb) => void;
    onEachRowMultiChange: (pre: string, keys: string[], cb: EachRowMultiCb) => void;
    /**
     * 后沿（trailing-edge）防抖。跨重渲染保持稳定，可安全作为 prop 传入。
     * 用于在发起远程请求前，驯服 `onSearch` / `onChange` 的高频触发。
     */
    debounce: typeof debounce;
    /**
     * 当任一依赖字段的值变化时，清空目标字段。初始化 / 回显时不会触发
     * （安全的级联清空）。目标字段以 `clearValue`（默认为 `undefined`）写入。
     */
    clearOn: (deps: string | string[], targets: string | string[], clearValue?: any) => void;
    /** 设置字段的 `visible` 状态。`form.setFieldState(name, s => { s.visible = v })` 的语法糖。 */
    setVisible: (name: string, visible: boolean) => void;
    /** 设置字段的 `required` 状态。`form.setFieldState(name, s => { s.required = v })` 的语法糖。 */
    setRequired: (name: string, required: boolean) => void;
    /** 设置字段的 `editable` 状态。`form.setFieldState(name, s => { s.editable = v })` 的语法糖。 */
    setEditable: (name: string, editable: boolean) => void;
}

/**
 * 为一个 form 构建 `$` helper 集合。由 `mergeEffects` 在每次创建 form 时
 * 调用一次；每个用户 `effects` 回调都会收到该集合。
 */
export function createEffects(form: FormilyForm): EffectHelpers {
    return {
        form,
        setRefState: (key, value) => setRefState(form, key, value),
        getRefState: <T>(key: string) => getRefState<T>(form, key),
        onFieldValueChange,
        onFieldReact,
        linkedFieldProps: (target, deps, compute) => linkedFieldProps(form, target, deps, compute),
        validateField: (name, triggers, cb) => validateField(form, name, triggers, cb),
        onEachRowChange: (pre, key, cb) => onEachRowChange(form, pre, key, cb),
        onEachRowMultiChange: (pre, keys, cb) => onEachRowMultiChange(form, pre, keys, cb),
        debounce,
        clearOn: (deps, targets, clearValue) => clearOn(form, deps, targets, clearValue),
        setVisible: (name, visible) =>
            form.setFieldState(name, (s: any) => {
                s.visible = visible;
            }),
        setRequired: (name, required) =>
            form.setFieldState(name, (s: any) => {
                s.required = required;
            }),
        setEditable: (name, editable) =>
            form.setFieldState(name, (s: any) => {
                s.editable = editable;
            }),
    };
}
