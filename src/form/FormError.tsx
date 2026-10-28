import { useForm } from '@formily/react';
import { observer } from '@formily/reactive-react';
import type * as React from 'react';
import { prefixCls } from '../shared/prefixCls';

export interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Render only errors (default), or include warnings too. */
    includeWarnings?: boolean;
    /** Custom render for the error list; receives the messages. */
    render?: (messages: string[]) => React.ReactNode;
    className?: string;
}

/**
 * Aggregates all error messages from the nearest rsform and renders them as a
 * single block. Reactive: re-renders when errors change. Useful above the
 * Submit button for a whole-form error summary.
 */
export const FormError = observer(function FormError({
    includeWarnings = false,
    render,
    className,
    ...rest
}: FormErrorProps): React.ReactElement | null {
    const form = useForm();
    const feedback = includeWarnings ? [...form.errors, ...form.warnings] : form.errors;
    const messages: string[] = [];
    for (const f of feedback) {
        if (!f) continue;
        const msgs = (f as any).messages;
        if (Array.isArray(msgs)) {
            for (const m of msgs) {
                if (m != null && m !== '') messages.push(String(m));
            }
        }
    }
    if (messages.length === 0) {
        return null;
    }
    const body = render ? (
        render(messages)
    ) : (
        <ul className={`${prefixCls}-form-error-list`}>
            {messages.map((m, i) => (
                <li key={i}>{m}</li>
            ))}
        </ul>
    );
    return (
        <div className={`${prefixCls}-form-error ${className ?? ''}`.trim()} {...rest}>
            {body}
        </div>
    );
});
