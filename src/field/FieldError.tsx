import type * as React from 'react';
import { prefixCls } from '../shared/prefixCls';

export interface FieldErrorProps {
    error?: React.ReactNode;
}

/** 应用于错误信息节点的类名,用于滚动定位到错误处。 */
export const errorClassName = `${prefixCls}-field-error-message`;

export function FieldError({ error }: FieldErrorProps): React.ReactElement | null {
    if (!error) {
        return null;
    }
    return <div className={errorClassName}>{error}</div>;
}
