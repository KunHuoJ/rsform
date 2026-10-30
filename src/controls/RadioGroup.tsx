import type * as React from 'react';
import { Radio } from 'antd';

export interface RadioGroupProps
    extends Omit<React.ComponentProps<typeof Radio.Group>, 'optionType'> {
    /**
     * 选项的渲染方式。默认为 `'button'`（rsform 约定），使一个基础的
     * `<Field name="x"><RadioGroup options=[…]/></Field>` 无需额外配置
     * 即可呈现为分段式按钮组。
     */
    optionType?: 'button' | 'default';
}

/**
 * antd Radio.Group 封装，默认 `optionType='button'` 并接受 `options`
 * （常见的 rsform 形态）。rsform Field 会自动注入 `value`/`onChange`
 * ——注入的是选中项的 value，而非布尔值，因此 RadioGroup 不被标记为
 * option-control（不做 `checked` 替换）。
 */
export function RadioGroup({
    optionType = 'button',
    ...rest
}: RadioGroupProps): React.ReactElement {
    return <Radio.Group optionType={optionType} {...rest} />;
}
