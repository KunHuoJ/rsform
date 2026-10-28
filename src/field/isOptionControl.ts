import * as React from 'react';

/**
 * Static marker placed on option-control component types (Switch / Checkbox /
 * Radio) so rsform knows to inject `checked` instead of `value`.
 *
 * Tag a component: `RadioGroup.__rsfOptionControl = true` (see controls/).
 */
export const OPTION_CONTROL_MARKER = { __rsfOptionControl: true } as const;

/**
 * Whether a React element's component type carries the option-control marker.
 */
export function isOptionControl(element: React.ReactNode): boolean {
    if (!React.isValidElement(element)) {
        return false;
    }
    const type: any = element.type;
    return !!(type && type.__rsfOptionControl);
}
