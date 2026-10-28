import { prefixCls } from '../shared/prefixCls';
import { FieldError } from './FieldError';

export interface FieldUiProps {
    label?: React.ReactNode;
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
    required,
    error,
    className,
    children,
}: FieldUiProps): React.ReactElement {
    return (
        <div className={`${prefixCls}-field ${className ?? ''}`.trim()}>
            {label != null && (
                <label className={`${prefixCls}-field-label`}>
                    {required && <span className={`${prefixCls}-field-required`}>*</span>}
                    {label}
                </label>
            )}
            <div className={`${prefixCls}-field-control`}>{children}</div>
            <FieldError error={error} />
        </div>
    );
}
