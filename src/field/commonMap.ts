/**
 * Build the injection props bag for a control element bound to a Formily field.
 *
 *  - `value` runs through `format` for display (form value -> control value)
 *  - `onChange` runs the raw control value through `parse` then `field.onInput`
 *  - `onBlur` re-feeds the current value to trigger validation
 *  - for option controls (Switch/Checkbox/Radio) callers should use `checked`
 *    instead of `value` (this helper returns both; the caller picks)
 */
export interface CommonMapOptions {
    format?: (value: any) => any;
    parse?: (input: any) => any;
    isOptionControl?: boolean;
}

export interface CommonMapResult {
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    onFocus: () => void;
    checked?: any;
}

export function commonMap(field: any, opts: CommonMapOptions = {}): CommonMapResult {
    const {format, parse} = opts;
    const value = format ? format(field.value) : field.value;
    const onChange = (input: any) => {
        const parsed = parse ? parse(input) : input;
        field.onInput(parsed);
    };
    const onBlur = () => {
        // Re-feed current value to trigger validate-on-blur.
        field.onInput(field.value);
    };
    const onFocus = () => {
        // Placeholder for future focus reactions; intentionally a no-op.
    };
    const result: CommonMapResult = {value, onChange, onBlur, onFocus};
    if (opts.isOptionControl) {
        result.checked = !!value;
    }
    return result;
}
