import * as React from 'react';
import {prefixCls} from '../shared/prefixCls';

export interface FieldErrorProps {
    error?: React.ReactNode;
}

/** Class name applied to the error message node, used for scroll-to-error. */
export const errorClassName = `${prefixCls}-field-error-message`;

export function FieldError({error}: FieldErrorProps): React.ReactElement | null {
    if (!error) {
        return null;
    }
    return <div className={errorClassName}>{error}</div>;
}
