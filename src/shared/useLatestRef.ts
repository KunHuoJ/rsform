import * as React from 'react';

/**
 * 返回一个 ref 对象,其 `.current` 始终指向最新的 `value`。
 *
 * 用它在一个稳定回调内部读取最新值,而该回调的依赖数组又不能包含
 * `value`(例如对性能敏感的稳定 onChange)。
 */
export function useLatestRef<T>(value: T): React.MutableRefObject<T> {
    const ref = React.useRef<T>(value);
    ref.current = value;
    return ref;
}
