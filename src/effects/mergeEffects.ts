import type * as React from 'react';
import type { Form as FormilyForm } from '@formily/core';
import { onFormSubmitSuccess, onFormSubmitValidateFailed } from '@formily/core';
import { toJS } from '@formily/reactive';
import { createEffects, type EffectHelpers } from './helpers';

/**
 * 单个 effect 回调。它接收 `$` helper 集合（其中通过 `$.form` 携带原始
 * form）。裸的 Formily 生命周期 hook 也可以直接在其中调用——它们会自动
 * 注册到当前激活的 form 上。
 */
export type EffectFn = ($: EffectHelpers) => void;

export type EffectsProp = EffectFn | EffectFn[];

export interface MergeEffectsOptions {
    validateFailed?: 'scroll' | ((firstErrorField: any) => void);
    onSubmitRef: {
        current: ((values: any) => void | Promise<void>) | undefined;
    };
    onResetRef: { current: (() => void) | undefined };
    /** 当 `validateFailed === 'scroll'` 时调用，将首个错误字段滚动到可视区域。 */
    scrollToFirstError?: () => void;
    /** 保存进行中的 onSubmit promise，使 Submit 可以 await 它以显示 loading。 */
    submitPromiseRef?: React.MutableRefObject<Promise<any> | undefined>;
}

/**
 * 将用户的 `effects` 回调与 rsform 内置的 submit / 校验失败接线合并为单个
 * `(form) => void`，可直接用于 `createForm({ effects })`。每个回调都会收到
 * `$` helper 集合。
 */
export function mergeEffects(
    effects: EffectsProp | undefined,
    opts: MergeEffectsOptions,
): (form: FormilyForm) => void {
    const fns: EffectFn[] = [];
    if (Array.isArray(effects)) {
        fns.push(...effects);
    } else if (typeof effects === 'function') {
        fns.push(effects);
    }

    // 通过持有的 ref 接入 onSubmit，使（只创建一次的）form 始终调用到最新的
    // 回调，而无需重建。将返回的 promise 捕获进 submitPromiseRef，供 Submit
    // await 它以维持其 loading 状态。重要：要接到 `onFormSubmitSuccess`，而不是
    // `onFormSubmit`——Formily 在 batchSubmit 的成功和失败两条路径上都会触发
    // ON_FORM_SUBMIT，因此即便校验失败，`onFormSubmit` 也会运行消费方的
    // onSubmit（表现为提交「什么都没做」，因为回调对着无效数据触发了）。
    // `onFormSubmitSuccess` 仅在校验通过后触发，因此消费方的 onSubmit 只会
    // 对着有效数据运行。
    fns.push(($) => {
        onFormSubmitSuccess(() => {
            const cb = opts.onSubmitRef.current;
            if (cb) {
                // `form.values` 是深度可观察的 Proxy；转换为普通 JS 对象，
                // 使消费方的 onSubmit 永远不会收到 Proxy（否则会破坏对嵌套
                // 数组/对象的 JSON.stringify）。
                const p = Promise.resolve(cb(toJS($.form.values)));
                if (opts.submitPromiseRef) {
                    opts.submitPromiseRef.current = p;
                }
                return p;
            }
            if (opts.submitPromiseRef) {
                opts.submitPromiseRef.current = undefined;
            }
        });
    });

    // onReset 通过 formRef.current.reset() 暴露；onReset prop 保存在一个 ref 中，
    // 供后续接线使用，并保持公共 API 的稳定。
    void opts.onResetRef;

    if (opts.validateFailed) {
        fns.push(($) => {
            onFormSubmitValidateFailed(() => {
                if (opts.validateFailed === 'scroll') {
                    opts.scrollToFirstError?.();
                } else {
                    const first = $.form.query('*').take((field: any) => field?.errors?.length > 0);
                    (opts.validateFailed as (first: any) => void)(first);
                }
            });
        });
    }

    return (form: FormilyForm) => {
        const $ = createEffects(form);
        fns.forEach((fn) => fn($));
    };
}
