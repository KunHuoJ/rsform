import * as React from 'react';
import { LifeCycleTypes } from '@formily/core';
import { useForm } from '@formily/react';
import { observer } from '@formily/reactive-react';
import { Button } from 'antd';
import { useFormInternals } from './RsfFormInternals';

export interface SubmitProps
    extends Omit<React.ComponentProps<typeof Button>, 'onClick' | 'htmlType' | 'loading'> {
    /** 仅为此 submit 覆盖表单的 onSubmit(默认沿用 Form 的 onSubmit prop)。 */
    onSubmit?: (values: any) => void | Promise<void>;
    /**
     * 阻止重复提交。两种作用:
     *  1. 同步的重入守卫(ref),使同一 tick 内、重渲染之前的两次点击
     *     不会都进入 `form.submit()`。
     *  2. 提交成功后按钮保持禁用(一次性锁),直到表单被重置 —— 这样
     *     同一个表单实例无法被提交两次。当 `form.pristine` 恢复
     *     (即 `form.reset()` 之后)时自动解除。
     */
    preventDuplicate?: boolean;
    /** 按钮的子节点。 */
    children?: React.ReactNode;
}

/**
 * 一个绑定到最近 rsform 的提交按钮:点击它会调用 `form.submit()`,并在表单
 * 提交中、校验中、或表单的 `onSubmit` 回调处于 pending 时显示 antd 的 loading 状态。
 *
 * `form.submit()` 会通过 `onFormSubmitSuccess` 生命周期触发表单的 `onSubmit`
 *(来自 `<Form onSubmit>`),但并不会 await 它;rsform 通过表单内部状态捕获
 * 该 promise,使此按钮在真实 onSubmit 执行期间保持 loading。若提供了显式的
 * `onSubmit` prop,它会仅为本次点击临时覆盖表单级别的回调(通过交换共享的
 * onSubmit ref),因此两者绝不会同时触发。
 */
export const Submit = observer(function Submit({
    onSubmit,
    preventDuplicate = false,
    children,
    disabled,
    ...rest
}: SubmitProps): React.ReactElement {
    const form = useForm();
    const internals = useFormInternals();
    const [submitting, setSubmitting] = React.useState(false);
    // 一次性锁:成功提交后(preventDuplicate),按钮保持禁用直到表单被重置。
    // 通过订阅表单的 `onFormReset` 心跳事件来解除(Formily 表单未暴露
    // `pristine` 布尔值,所以该生命周期事件才是可靠信号)。
    const [locked, setLocked] = React.useState(false);
    // 同步的重入守卫,使同一 tick 内(在 `submitting` 状态重渲染并禁用按钮
    // 之前)的两次点击不会都进入 `form.submit()`。
    const inFlight = React.useRef(false);

    React.useEffect(() => {
        if (!preventDuplicate) {
            return;
        }
        const id = form.subscribe(({ type }) => {
            if (type === LifeCycleTypes.ON_FORM_RESET) {
                setLocked(false);
            }
        });
        return () => form.unsubscribe(id);
    }, [form, preventDuplicate]);

    const handleClick = async () => {
        if (inFlight.current) {
            return;
        }
        const ref = internals?.onSubmitRef;
        const prev = ref?.current;
        if (onSubmit && ref) {
            ref.current = onSubmit;
        }
        inFlight.current = true;
        try {
            setSubmitting(true);
            await form.submit();
            const p = internals?.submitPromiseRef.current;
            if (p) {
                await p;
            }
            if (preventDuplicate) {
                setLocked(true);
            }
        } finally {
            if (ref) {
                ref.current = prev;
            }
            inFlight.current = false;
            setSubmitting(false);
        }
    };

    return (
        <Button
            type="primary"
            htmlType="button"
            {...rest}
            disabled={disabled || locked || submitting || form.submitting || form.validating}
            loading={submitting || form.submitting || form.validating}
            onClick={handleClick}
        >
            {children ?? '提交'}
        </Button>
    );
});
