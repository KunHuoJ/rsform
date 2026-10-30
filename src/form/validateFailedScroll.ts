import { prefixCls } from '../shared/prefixCls';

/**
 * 将第一条可见的字段错误信息滚动到视图中(居中)。
 * 用作默认的 `validateFailed: 'scroll'` 行为。
 */
export function scrollToFirstError(): void {
    if (typeof document === 'undefined') {
        return;
    }
    const node = document.querySelector(`.${prefixCls}-field-error-message`);
    if (node) {
        node.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
}
