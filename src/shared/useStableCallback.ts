import * as React from 'react';
import { useLatestRef } from './useLatestRef';

/**
 * Returns a stable function reference whose body always sees the latest `fn`.
 *
 * The returned callback identity is stable across re-renders (deps-free), so
 * downstream React.memo / useCallback consumers don't invalidate when the
 * parent re-renders. The latest `fn` is held in a ref and invoked on each call.
 */
export function useStableCallback<A extends unknown[], R>(
    fn: (...args: A) => R,
): (...args: A) => R {
    const fnRef = useLatestRef(fn);
    return React.useCallback((...args: A) => fnRef.current(...args), [fnRef]);
}
