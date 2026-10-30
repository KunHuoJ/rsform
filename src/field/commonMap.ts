/**
 * 为绑定到某个 Formily 字段的控件元素构建注入 props 集合。
 *
 *  - `value` 经过 `format` 处理后用于显示(表单值 -> 控件值)
 *  - `onChange` 将控件的原始值经 `parse` 处理后交给 `field.onInput`
 *  - `onBlur` 重新喂入当前值以触发校验
 *  - 对于选项型控件(Switch/Checkbox/Radio),调用方应使用 `checked`
 *    而非 `value`(本辅助函数两者都返回,由调用方自行选择)
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
    const { format, parse } = opts;
    const value = format ? format(field.value) : field.value;
    const onChange = (input: any) => {
        const parsed = parse ? parse(input) : input;
        field.onInput(parsed);
    };
    const onBlur = () => {
        // 重新喂入当前值以触发失焦校验(validate-on-blur)。
        field.onInput(field.value);
    };
    const onFocus = () => {
        // 为将来的聚焦联动预留;当前有意为空操作(no-op)。
    };
    const result: CommonMapResult = { value, onChange, onBlur, onFocus };
    if (opts.isOptionControl) {
        result.checked = !!value;
    }
    return result;
}
