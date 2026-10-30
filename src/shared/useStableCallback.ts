import * as React from 'react';
import { useLatestRef } from './useLatestRef';

/**
 * 返回一个引用稳定的函数,其函数体始终能看到最新的 `fn`。
 *
 * 返回的回调标识在多次重渲染间保持稳定(无依赖),因此下游的
 * React.memo / useCallback 消费者不会因父组件重渲染而失效。最新的
 * `fn` 保存在一个 ref 中,并在每次调用时被执行。
 */
export function useStableCallback<A extends unknown[], R>(
    fn: (...args: A) => R,
): (...args: A) => R {
    const fnRef = useLatestRef(fn);
    return React.useCallback((...args: A) => fnRef.current(...args), [fnRef]);
}
