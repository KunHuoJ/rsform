import type { Form as FormilyForm, GeneralField } from '@formily/core';
import { onFieldValueChange } from '@formily/core';

/**
 * compute 函数接收以依赖名为 key 的当前依赖值，以及目标字段模型（若已挂载）。
 * 它返回一个 partial 对象，该对象会被拆分：Formily 顶层 state key
 * （visible/title/required/…）直接设置到字段 state 上；其余部分
 * （options/disabled/placeholder/…）合并进 `componentProps` 并转发给控件。
 * 返回 Promise 则使该派生变为异步（例如拉取级联选项）。
 */
export type LinkedFieldPropsCompute = (
    values: Record<string, any>,
    targetField: GeneralField | undefined,
) => Record<string, any> | Promise<Record<string, any>>;

/**
 * 根据一个或多个依赖字段，响应式地派生出目标字段的 state/props。当任一依赖
 * 值变化时（以及首次注册时各执行一次），收集依赖值，调用
 * `compute({ [dep]: value })`，并将返回对象拆分后应用到目标字段的 state：
 *
 *  - Formily 顶层字段 state key（`visible`、`display`、`editable`、
 *    `required`、`title`、`value`、`dataSource`、…）直接设置到 state 上
 *    ——因此 `{visible: false}` 隐藏字段，`{title: 'X'}` 为其重命名。
 *  - 其余所有内容（`options`、`disabled`、`placeholder`、`loading`、…）
 *    合并进 `state.componentProps`，由 rsform 的 Field 通过 cloneElement
 *    转发给控件——因此 `{options: [...]}` 会抵达 Select。
 *
 * 异步结果由每个目标各自的单调递增 token 守护，使较慢的先发请求永远无法
 * 覆盖较新的请求。
 */
export function linkedFieldProps(
    form: FormilyForm,
    target: string,
    deps: string[],
    compute: LinkedFieldPropsCompute,
): void {
    let token = 0;

    // `linkedFieldProps` 直接设置到 `state` 上的 Formily 顶层字段 state key。
    // 其余任何内容都进入 `state.componentProps` 交给控件。
    const STATE_KEYS = new Set([
        'visible',
        'display',
        'hidden',
        'editable',
        'readEmpty',
        'selfEditable',
        'required',
        'title',
        'description',
        'value',
        'defaultValue',
        'dataSource',
        'loading',
        'validateStatus',
        'rules',
        'validator',
        'decorator',
        'component',
        'reactions',
        'content',
    ]);

    const run = (): void => {
        const myToken = ++token;
        const values: Record<string, any> = {};
        for (const dep of deps) {
            values[dep] = form.getValuesIn(dep);
        }
        const targetField = form.query(target).take();
        Promise.resolve(compute(values, targetField)).then((result) => {
            // 陈旧守护：已有更新的一次运行取代了本次，或者结果为空/无操作。
            if (myToken !== token || !result) {
                return;
            }
            form.setFieldState(target, (state: any) => {
                const compProps: Record<string, any> = {};
                for (const key of Object.keys(result)) {
                    if (STATE_KEYS.has(key)) {
                        state[key] = result[key];
                    } else {
                        compProps[key] = result[key];
                    }
                }
                if (Object.keys(compProps).length > 0) {
                    state.componentProps = {
                        ...(state.componentProps ?? {}),
                        ...compProps,
                    };
                }
            });
        });
    };

    for (const dep of deps) {
        onFieldValueChange(dep, run);
    }
    run();
}
