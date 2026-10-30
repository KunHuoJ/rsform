import * as React from 'react';
import { type Form as FormilyForm, LifeCycleTypes } from '@formily/core';
import { useForm } from '@formily/react';
import { debounce } from '../effects/debounce';

export interface UseFormDraftOptions {
    /** 自动保存的防抖毫秒数(默认 500)。 */
    debounceMs?: number;
    /**
     * 存储后端。默认使用 `window.localStorage`;在 SSR / 测试中可传入 mock。
     * 当 `window`/`localStorage` 不可用时,该 hook 退化为空操作(no-op)
     *(不保存、不弹出恢复提示),因此开箱即用地对 SSR 安全。
     */
    storage?: Storage;
    /** 提交成功后自动清除草稿(默认 `true`)。 */
    clearOnSubmit?: boolean;
    /** 草稿在此毫秒数后过期;读取时更旧的快照会被忽略。 */
    maxAge?: number;
}

export interface UseFormDraftResult {
    /** 存储中存在已保存的草稿 —— 应显示恢复提示。 */
    hasDraft: boolean;
    /** 已保存的草稿快照,若没有 / 已被忽略则为 `undefined`。 */
    draft: Record<string, any> | undefined;
    /** 将已保存的草稿载入表单(在当前值之上深合并)。 */
    restore: () => void;
    /** 不载入即关闭恢复提示 —— 草稿仍保留在存储中。 */
    dismiss: () => void;
    /** 从存储中删除已保存的草稿。 */
    clear: () => void;
}

const DEFAULT_DEBOUNCE_MS = 500;
const NOOP = (): void => {};

interface DraftEnvelope {
    v?: Record<string, any>;
    t?: number;
}

function readDraft(
    storage: Storage | undefined,
    key: string,
    maxAge: number | undefined,
): Record<string, any> | undefined {
    if (!storage) {
        return undefined;
    }
    let raw: string | null;
    try {
        raw = storage.getItem(key);
    } catch {
        return undefined;
    }
    if (!raw) {
        return undefined;
    }
    let env: DraftEnvelope;
    try {
        env = JSON.parse(raw) as DraftEnvelope;
    } catch {
        return undefined;
    }
    if (typeof env !== 'object' || env === null || env.v === undefined) {
        return undefined;
    }
    if (maxAge !== undefined && typeof env.t === 'number') {
        if (Date.now() - env.t > maxAge) {
            try {
                storage.removeItem(key);
            } catch {
                /* 忽略 */
            }
            return undefined;
        }
    }
    return env.v;
}

function writeDraft(storage: Storage | undefined, key: string, values: Record<string, any>): void {
    if (!storage) {
        return;
    }
    try {
        storage.setItem(key, JSON.stringify({ v: values, t: Date.now() }));
    } catch {
        /* 配额超限 / 存储被禁用 —— 忽略;草稿只是不会被持久化 */
    }
}

function removeDraft(storage: Storage | undefined, key: string): void {
    if (!storage) {
        return;
    }
    try {
        storage.removeItem(key);
    } catch {
        /* 忽略 */
    }
}

/**
 * 从 `localStorage`(或自定义存储)自动保存 / 恢复表单草稿。
 *
 * 在 `<Form>` 内部,传入一个对该表单用途唯一且稳定的 `key`
 *(例如 `'order-edit'`)调用它。挂载时它会检查存储中是否有已保存的草稿,
 * 并通过 `hasDraft` 暴露出来,便于你渲染恢复横幅;每次值变化都会被防抖并
 * 自动持久化,且(默认)在表单提交成功后清除草稿 —— 因此草稿只会为被放弃、
 * 未提交的工作而留存。
 *
 * @example
 * const draft = useFormDraft('order-edit');
 * return (
 *   <>
 *     {draft.hasDraft && (
 *       <DraftBanner onRestore={draft.restore} onDismiss={draft.dismiss} />
 *     )}
 *     <Form.Field name="name"><Form.Input /></Form.Field>
 *   </>
 * );
 */
export function useFormDraft(key: string, options: UseFormDraftOptions = {}): UseFormDraftResult {
    const form = useForm() as FormilyForm;
    const { debounceMs = DEFAULT_DEBOUNCE_MS, clearOnSubmit = true, maxAge } = options;
    const storage: Storage | undefined =
        options.storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);

    const [draft, setDraft] = React.useState<Record<string, any> | undefined>(() =>
        readDraft(storage, key, maxAge),
    );
    const hasDraft = draft !== undefined;

    // 对固定的 (storage, key, debounceMs),防抖持久化函数在多次渲染间保持稳定,
    // 因此下方的订阅 effect 也保持稳定。
    const save = React.useMemo(
        () =>
            debounce((values: Record<string, any>) => writeDraft(storage, key, values), debounceMs),
        [storage, key, debounceMs],
    );

    // 在每次值变更(用户输入 + effects)时自动保存。读取 `form.values`
    //(而非事件 payload)使其能稳健应对 Formily 不同版本间 payload 形状的变化。
    React.useEffect(() => {
        const id = form.subscribe(({ type }) => {
            if (type === LifeCycleTypes.ON_FORM_VALUES_CHANGE) {
                save(form.values);
            }
        });
        return () => form.unsubscribe(id);
    }, [form, save]);

    // 提交成功后自动清除草稿 —— 工作已提交,持久化的快照不再代表被放弃的数据。
    React.useEffect(() => {
        if (!clearOnSubmit) {
            return NOOP;
        }
        const id = form.subscribe(({ type }) => {
            if (type === LifeCycleTypes.ON_FORM_SUBMIT_SUCCESS) {
                removeDraft(storage, key);
            }
        });
        return () => form.unsubscribe(id);
    }, [form, clearOnSubmit, storage, key]);

    const restore = React.useCallback(() => {
        setDraft((current) => {
            if (current === undefined) {
                return undefined;
            }
            form.setValues(current, 'deepMerge');
            return undefined;
        });
    }, [form]);

    const dismiss = React.useCallback(() => setDraft(undefined), []);

    const clear = React.useCallback(() => {
        removeDraft(storage, key);
        setDraft(undefined);
    }, [storage, key]);

    return { hasDraft, draft, restore, dismiss, clear };
}
