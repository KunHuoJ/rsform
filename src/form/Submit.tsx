import * as React from 'react';
import { useForm } from '@formily/react';
import { observer } from '@formily/reactive-react';
import { Button } from 'antd';
import { useFormInternals } from './RsfFormInternals';

export interface SubmitProps
    extends Omit<React.ComponentProps<typeof Button>, 'onClick' | 'htmlType' | 'loading'> {
    /** Override the form's onSubmit for this submit only (defaults to the Form onSubmit prop). */
    onSubmit?: (values: any) => void | Promise<void>;
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
    children,
    disabled,
    ...rest
}: SubmitProps): React.ReactElement {
    const form = useForm();
    const internals = useFormInternals();
    const [submitting, setSubmitting] = React.useState(false);

    const handleClick = async () => {
        // When an `onSubmit` prop is given, temporarily swap the form's
        // onSubmitRef so the form-level callback (wired via onFormSubmitSuccess)
        // is OVERRIDDEN for this click, not invoked in addition to it. Restored
        // in finally. Routing through the ref (instead of `form.submit(cb)`)
        // avoids Formily firing both the passed callback AND the lifecycle.
        const ref = internals?.onSubmitRef;
        const prev = ref?.current;
        if (onSubmit && ref) {
            ref.current = onSubmit;
        }
        try {
            setSubmitting(true);
            // `form.submit()` (no arg) fires onSubmit via the lifecycle (not
            // awaited by Formily); await the captured promise too. The ref swap
            // above makes the lifecycle invoke the Submit's `onSubmit` when set.
            await form.submit();
            const p = internals?.submitPromiseRef.current;
            if (p) {
                await p;
            }
        } finally {
            if (ref) {
                ref.current = prev;
            }
            setSubmitting(false);
        }
    };

    return (
        <Button
            type="primary"
            htmlType="button"
            {...rest}
            disabled={disabled || submitting || form.submitting || form.validating}
            loading={submitting || form.submitting || form.validating}
            onClick={handleClick}
        >
            {children ?? '提交'}
        </Button>
    );
});
