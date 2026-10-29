import * as React from 'react';
import { useForm } from '@formily/react';
import { LifeCycleTypes } from '@formily/core';
import { observer } from '@formily/reactive-react';
import { Button } from 'antd';
import { useFormInternals } from './RsfFormInternals';

export interface SubmitProps
    extends Omit<React.ComponentProps<typeof Button>, 'onClick' | 'htmlType' | 'loading'> {
    /** Override the form's onSubmit for this submit only (defaults to the Form onSubmit prop). */
    onSubmit?: (values: any) => void | Promise<void>;
    /**
     * Block duplicate submission. Two effects:
     *  1. A synchronous re-entry guard (ref) so two clicks in the same tick
     *     before re-render can't both enter `form.submit()`.
     *  2. After a successful submit the button stays disabled (one-shot lock)
     *     until the form is reset — so the same form instance can't be
     *     submitted twice. Cleared automatically when `form.pristine` returns
     *     (i.e. after `form.reset()`).
     */
    preventDuplicate?: boolean;
    /** Children of the button. */
    children?: React.ReactNode;
}

/**
 * A submit button bound to the nearest rsform: clicking it calls
 * `form.submit()`, and it shows its antd loading state while the form is
 * submitting, validating, or while the form's `onSubmit` callback is pending.
 *
 * `form.submit()` fires the form's `onSubmit` (from `<Form onSubmit>`) through
 * the `onFormSubmitSuccess` lifecycle but does NOT await it; rsform captures
 * that promise via the form internals so this button keeps loading for the real
 * onSubmit duration. An explicit `onSubmit` prop, if provided, temporarily
 * overrides the form-level callback for this click only (by swapping the
 * shared onSubmit ref), so the two never fire together.
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
    // One-shot lock: after a successful submit (preventDuplicate), the button
    // stays disabled until the form is reset. Cleared by subscribing to the
    // form's `onFormReset` heartbeat event (Formily forms expose no `pristine`
    // boolean, so the lifecycle event is the reliable signal).
    const [locked, setLocked] = React.useState(false);
    // Synchronous re-entry guard so two clicks in the same tick (before the
    // `submitting` state re-renders and disables the button) can't both enter
    // `form.submit()`.
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
