import * as React from 'react';
import {prefixCls} from '../shared/prefixCls';

export interface NonEditableProps {
    value?: any;
    /** Transform the form value for display (e.g. option label lookup). */
    format?: (value: any) => React.ReactNode;
}

/**
 * Renders a field's value as plain text when `editable={false}`.
 * Falls back to '-' when the value is null/undefined/''.
 */
export function NonEditable({value, format}: NonEditableProps): React.ReactElement {
    const display = format ? format(value) : value;
    const text = display === null || display === undefined || display === '' ? '-' : display;
    return <span className={`${prefixCls}-field-text`}>{text}</span>;
}
