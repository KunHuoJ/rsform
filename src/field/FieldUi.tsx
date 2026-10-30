import { prefixCls } from '../shared/prefixCls';
import { FieldError } from './FieldError';

export interface FieldUiProps {
    label?: React.ReactNode;
    /** `htmlFor` 目标 —— 注入到控件上的 id,用于关联 label ↔ 控件。 */
    htmlFor?: string;
    required?: boolean;
    error?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
}

/**
 * 字段的布局外壳:一行标签(可带必填星号)加上控件,下方跟一条内联错误信息。
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
