import * as React from 'react';

/**
 * 放置在选项型控件组件类型(Switch / Checkbox / Radio)上的静态标记,
 * 让 rsform 知道应注入 `checked` 而非 `value`。
 *
 * 为组件打标记:`RadioGroup.__rsfOptionControl = true`(参见 controls/)。
 */
export const OPTION_CONTROL_MARKER = { __rsfOptionControl: true } as const;

/**
 * 判断一个 React 元素的组件类型是否带有选项型控件标记。
 */
export function isOptionControl(element: React.ReactNode): boolean {
    if (!React.isValidElement(element)) {
        return false;
    }
    const type: any = element.type;
    return !!(type && type.__rsfOptionControl);
}
