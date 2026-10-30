import type { Form as FormilyForm } from '@formily/core';
import { onFieldValueChange } from '@formily/core';

function toArray(x: string | string[]): string[] {
    return Array.isArray(x) ? x : [x];
}

/**
 * 当任一依赖字段的值变化时，清空一个或多个目标字段。基于
 * `onFieldValueChange` 实现，因此初始化 / 回显时不会触发——只在真正由用户
 * 驱动的变更时触发。这是安全的级联清空模式（选择省份 → 清空城市），在这种
 * 场景下，若在挂载时抹掉回显值将会是一个 bug。
 *
 * 目标字段通过 `form.setValuesIn` 以 `clearValue`（默认 `undefined`）写入；
 * 若你的控件期望某个特定的空值哨兵，可传入 `''` / `null`。
 */
export function clearOn(
    form: FormilyForm,
    deps: string | string[],
    targets: string | string[],
    clearValue: any = undefined,
): void {
    const depList = toArray(deps);
    const targetList = toArray(targets);
    for (const dep of depList) {
        onFieldValueChange(dep, () => {
            for (const target of targetList) {
                form.setValuesIn(target, clearValue);
            }
        });
    }
}
