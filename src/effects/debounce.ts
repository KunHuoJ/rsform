/**
 * 后沿（trailing-edge）防抖。`ms` 时间内的重复调用会合并为对 `fn` 的单次
 * 调用，使用最新的参数，并在最后一次调用之后的 `ms` 时触发。纯工具函数
 * ——不依赖 Formily——适合在 `effects` 内用于驯服高频触发器（发起远程请求
 * 前的 Select `onSearch`、发起联想查询前的 Input `onChange`、…）。
 *
 * 返回的函数在其捕获的闭包的整个生命周期内保持稳定，因此可以安全地直接作为
 * prop 传入（无需 `useCallback`）。每次后续调用都会清除定时器；没有 form
 * 级别的销毁 hook，因此待执行的定时器可能在 form 卸载后不久触发——实践中
 * 无害，因为回调只接触（仍然有效的）form 模型。
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
