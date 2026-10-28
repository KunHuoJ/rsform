import * as React from 'react';

export interface UseSelectFirstOptions {
    field: any;
    selectFirst?: boolean;
    children?: React.ReactNode | ((...args: any[]) => React.ReactNode);
}

/**
 * Auto-select the first non-disabled option on mount when `selectFirst` is set
 * and the field has no value yet. Targets single-select option controls
 * (Select without `mode='multiple'`, Radio.Group). No-op for multi-select.
 *
 * "No value yet" means null/undefined/'' — an empty string is treated as
 * unset so a field initialised to `''` still picks the first option.
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
