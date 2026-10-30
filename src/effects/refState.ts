import { type Draft, produce } from 'immer';

/**
 * 非响应式的、按 form 隔离的临时存储。effects 经常需要保存一块可变状态，
 * 而这块状态绝不能触发 Formily 的 reaction（计数器、缓存、「上一个值」快照）。
 * `setRefState`/`getRefState` 提供一个以 WeakMap 为底、按 form 实例 + 字符串
 * key 建索引的存储，因此它对 GC 友好，且永不参与响应式依赖图。
 *
 * 将函数作为 `value` 传入时，会把它当作针对当前值的 immer updater
 * （便于就地修改 draft）。
 */

type Store = Map<string, any>;
const stores = new WeakMap<object, Store>();

function getStore(form: object): Store {
    let store = stores.get(form);
    if (!store) {
        store = new Map();
        stores.set(form, store);
    }
    return store;
}

export function setRefState(form: object, key: string, value: any): void {
    const store = getStore(form);
    if (typeof value === 'function') {
        const current = store.get(key);
        store.set(key, produce(current, value as (draft: Draft<any>) => void));
    } else {
        store.set(key, value);
    }
}

export function getRefState<T = any>(form: object, key: string): T | undefined {
    return getStore(form).get(key) as T | undefined;
}
