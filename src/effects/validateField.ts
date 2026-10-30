import type { Form as FormilyForm, GeneralField } from '@formily/core';
import { onFieldMount, onFieldUnmount, onFieldValueChange } from '@formily/core';

/**
 * 跨字段的响应式校验器。`cb` 接收以触发器名为 key 的当前触发器值，以及目标
 * 字段模型；非空的字符串/数组结果会写入目标字段的 `selfErrors`，而空/null/
 * undefined 结果则清空它们。
 *
 * `triggers` 默认为 `[name]`。当目标字段卸载时其错误被清空；当它（重新）挂载
 * 且存在待处理错误时，这些错误会被重新应用。
 *
 * 返回一个 handle，其 `clearEffect()` 会冻结校验器，使后续的触发器变更变为
 * 无操作（Formily v2 的 hook 在 form 的整个生命周期内存活，因此我们用一个
 * 存活标志而非销毁 hook）。
 */
export type ValidateFieldCb = (
    values: Record<string, any>,
    targetField: GeneralField | undefined,
) => string | string[] | null | undefined | Promise<string | string[] | null | undefined>;

export interface ValidateFieldHandle {
    clearEffect: () => void;
}

export function validateField(
    form: FormilyForm,
    name: string,
    triggers: string[] | ValidateFieldCb,
    cb?: ValidateFieldCb,
): ValidateFieldHandle {
    const triggerList: string[] = Array.isArray(triggers) ? triggers : [name];
    const callback: ValidateFieldCb = Array.isArray(triggers)
        ? (cb as ValidateFieldCb)
        : (triggers as ValidateFieldCb);

    let alive = true;
    let pendingErrors: string[] | null = null;

    const apply = (errors: string[] | null): void => {
        if (!alive) return;
        const field = form.query(name).take();
        if (!field || !(field as any).mounted) {
            // 字段尚未挂载：记住这个判定结果，待挂载时再应用。
            pendingErrors = errors;
            return;
        }
        pendingErrors = null;
        (field as any).setSelfErrors(errors ?? []);
    };

    const run = (): void => {
        if (!alive) return;
        const values: Record<string, any> = {};
        for (const trigger of triggerList) {
            values[trigger] = form.getValuesIn(trigger);
        }
        const targetField = form.query(name).take();
        Promise.resolve(callback(values, targetField)).then((result) => {
            if (!alive) return;
            if (result == null || result === '') {
                apply(null);
            } else if (Array.isArray(result)) {
                apply(result.length ? result : null);
            } else {
                apply([String(result)]);
            }
        });
    };

    for (const trigger of triggerList) {
        onFieldValueChange(trigger, run);
    }
    onFieldMount(name, () => {
        if (!alive) return;
        // 应用在字段挂载前就已计算出的任何判定结果。
        if (pendingErrors) {
            const field = form.query(name).take();
            if (field && (field as any).mounted) {
                (field as any).setSelfErrors(pendingErrors);
                pendingErrors = null;
            }
        }
    });
    onFieldUnmount(name, () => {
        if (!alive) return;
        const field = form.query(name).take();
        if (field) {
            (field as any).setSelfErrors([]);
        }
    });

    run();

    return {
        clearEffect: () => {
            alive = false;
        },
    };
}
