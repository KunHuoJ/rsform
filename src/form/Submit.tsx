import * as React from 'react';
import {Button} from 'antd';
import {useForm} from '@formily/react';
import {observer} from '@formily/reactive-react';
import {useFormInternals} from './RsfFormInternals';

export interface SubmitProps extends Omit<React.ComponentProps<typeof Button>, 'onClick' | 'htmlType' | 'loading'> {
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
 * the `onFormSubmit` lifecycle but does NOT await it; rsform captures that
 * promise via the form internals so this button keeps loading for the real
 * onSubmit duration. An explicit `onSubmit` prop, if provided, is passed to
 * `form.submit(onSubmit)` directly (awaited by Formily).
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
        try {
            setSubmitting(true);
            if (onSubmit) {
                // Explicit onSubmit: pass to form.submit so Formily awaits it.
                await form.submit(onSubmit);
            } else {
                // form.submit() fires the form's onSubmit via the lifecycle
                // (not awaited by Formily); await the captured promise too.
                await form.submit();
                const p = internals?.submitPromiseRef.current;
                if (p) {
                    await p;
                }
            }
        } finally {
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
