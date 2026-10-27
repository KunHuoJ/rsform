import * as React from 'react';

/**
 * Returns a ref object whose `.current` is always the latest `value`.
 *
 * Use this to read the latest value inside a stable callback whose dependency
 * array must NOT include `value` (e.g. a perf-critical stable onChange).
 */
export function useLatestRef<T>(value: T): React.MutableRefObject<T> {
    const ref = React.useRef<T>(value);
    ref.current = value;
    return ref;
}
