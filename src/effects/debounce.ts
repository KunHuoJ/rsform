/**
 * Trailing-edge debounce. Repeated calls within `ms` collapse into a single
 * invocation of `fn` with the latest arguments, fired `ms` after the last
 * call. Plain utility — no Formily dependency — useful inside `effects` for
 * taming high-frequency triggers (a Select's `onSearch` before a remote
 * request, an Input's `onChange` before a联想 query, …).
 *
 * The returned function is stable for the lifetime of the closure it
 * captures, so it is safe to pass directly as a prop (no `useCallback`
 * needed). Timers are cleared on every subsequent call; there is no
 * form-level dispose hook, so a pending timer may fire shortly after a form
 * unmount — in practice harmless because the callback only touches the
 * (still-valid) form model.
 */
export function debounce<A extends unknown[]>(
    fn: (...args: A) => void | Promise<void>,
    ms: number,
): (...args: A) => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: A;
    return (...args: A) => {
        lastArgs = args;
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn(...lastArgs);
        }, ms);
    };
}
