import type * as React from 'react';
import { Radio } from 'antd';

export interface RadioGroupProps
    extends Omit<React.ComponentProps<typeof Radio.Group>, 'optionType'> {
    /**
     * How options render. Defaults to `'button'` (rsform convention) so a
     * basic `<Field name="x"><RadioGroup options=[…]/></Field>` reads as a
     * segmented button group without extra config.
     */
    optionType?: 'button' | 'default';
}

/**
 * antd Radio.Group wrapper that defaults `optionType='button'` and accepts
 * `options` (the common rsform shape). rsform Field auto-injects `value`/
 * `onChange` — the selected option's value, not a boolean, so RadioGroup is
 * NOT tagged as an option-control (no `checked` swap).
 */
export function RadioGroup({
    optionType = 'button',
    ...rest
}: RadioGroupProps): React.ReactElement {
    return <Radio.Group optionType={optionType} {...rest} />;
}
