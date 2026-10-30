import * as React from 'react';

/**
 * 暴露给位于 `<Form>` 内部的 rsform 组件(目前仅 `Submit`)的 rsform 内部
 * 表单接线。它与不依赖 antd 的 `FieldContext` 分开,因为它承载的是只有
 * rsform 自身组件才需要的 submit/reset promise 簿记。
 *
 *  - `submitPromiseRef`:保存本次进行中的提交里,表单 `onSubmit` 回调返回的
 *    promise。`form.submit()`(无参)会通过 `onFormSubmit` 生命周期触发表单的
 *    `onSubmit`,但并不会 await 它,因此 `Submit` 读取此 ref 以在真实 onSubmit
 *    执行期间保持其 loading 状态。
 */
export interface RsfFormInternals {
    submitPromiseRef: React.MutableRefObject<Promise<any> | undefined>;
    /**
     * 表单的 `onSubmit` 回调(保存在 ref 中,使只创建一次的表单始终调用最新的)。
     * `Submit` 会在一次点击期间临时将此 ref 换成它自己的 `onSubmit` prop,使该
     * prop 覆盖(而非叠加)表单级别的回调,随后再恢复。
     */
    onSubmitRef: React.MutableRefObject<((values: any) => void | Promise<void>) | undefined>;
}

export const RsfFormInternalsContext = React.createContext<RsfFormInternals | null>(null);

/** 读取最近的 rsform 表单内部状态,在 `<Form>` 外部则为 null。 */
export function useFormInternals(): RsfFormInternals | null {
    return React.useContext(RsfFormInternalsContext);
}
