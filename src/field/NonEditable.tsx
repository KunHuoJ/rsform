import type * as React from 'react';
import { prefixCls } from '../shared/prefixCls';

export interface NonEditableProps {
    value?: any;
    /** 转换表单值以供显示(例如查找选项的 label)。 */
    format?: (value: any) => React.ReactNode;
}

/**
 * 当 `editable={false}` 时将字段值渲染为纯文本。
 * 当值为 null/undefined/'' 时回退显示 '-'。
 */
export function NonEditable({ value, format }: NonEditableProps): React.ReactElement {
    const display = format ? format(value) : value;
    const text = display === null || display === undefined || display === '' ? '-' : display;
    return <span className={`${prefixCls}-field-text`}>{text}</span>;
}
