import { prefixCls } from '../shared/prefixCls';

/**
 * Scroll the first visible field error message into view (centered).
 * Used as the default `validateFailed: 'scroll'` behaviour.
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
