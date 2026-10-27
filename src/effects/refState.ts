import {produce, type Draft} from 'immer';

/**
 * Non-reactive per-form scratch storage. Effects often need to keep a piece of
 * mutable state that must NOT trigger Formily reactions (counters, caches,
 * "last value" snapshots). `setRefState`/`getRefState` provide a WeakMap-backed
 * store keyed by form instance + string key, so it is GC-friendly and never
 * participates in the reactive graph.
 *
 * Passing a function as `value` treats it as an immer updater against the
 * current value (convenient for mutating drafts in place).
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
