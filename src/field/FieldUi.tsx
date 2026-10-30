import { prefixCls } from '../shared/prefixCls';
import { FieldError } from './FieldError';

export interface FieldUiProps {
    label?: React.ReactNode;
    /** `htmlFor` target — the id injected onto the control, to link label ↔ control. */
    htmlFor?: string;
    required?: boolean;
    error?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
}

/**
 * Layout shell for a field: a label row (with optional required asterisk) and
 * the control, followed by an inline error message below.
 */
export function FieldUi({
    label,
    htmlFor,
    required,
    error,
    className,
    children,
}: FieldUiProps): React.ReactElement {
    return (
        <div className={`${prefixCls}-field ${className ?? ''}`.trim()}>
            {label != null && (
                <label className={`${prefixCls}-field-label`} htmlFor={htmlFor}>
                    {required && <span className={`${prefixCls}-field-required`}>*</span>}
                    {label}
                </label>
            )}
            <div className={`${prefixCls}-field-control`}>{children}</div>
            <FieldError error={error} />
        </div>
    );
}
