import * as React from 'react';

export interface UseSelectFirstOptions {
    field: any;
    selectFirst?: boolean;
    children?: React.ReactNode | ((...args: any[]) => React.ReactNode);
}

/**
 * 当设置了 `selectFirst` 且字段尚无值时,在挂载时自动选中第一个未禁用的选项。
 * 针对单选的选项型控件(未设 `mode='multiple'` 的 Select、Radio.Group)。
 * 对多选为空操作(no-op)。
 *
 * “尚无值” 指 null/undefined/'' —— 空字符串被视作未设置,
 * 因此初始化为 `''` 的字段仍会选中第一个选项。
 */
export function useSelectFirst({ field, selectFirst, children }: UseSelectFirstOptions): void {
    const optionsRef = React.useRef<any>(null);
    React.useEffect(() => {
        const isEmpty = field == null || field.value == null || field.value === '';
        if (!selectFirst || !field || !isEmpty) {
            return;
        }
        if (!React.isValidElement(children)) {
            return;
        }
        const childProps: any = (children as React.ReactElement).props;
        const options = childProps?.options;
        if (!Array.isArray(options) || childProps?.mode === 'multiple') {
            return;
        }
        if (optionsRef.current === options) {
            return;
        }
        optionsRef.current = options;
        const first = options.find((opt: any) => {
            if (opt == null) return false;
            if (typeof opt === 'string' || typeof opt === 'number') return true;
            return opt.disabled !== true;
        });
        const firstValue =
            first == null
                ? undefined
                : typeof first === 'string' || typeof first === 'number'
                  ? first
                  : first.value;
        if (firstValue != null) {
            field.setValue(firstValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectFirst, field, children]);
}
