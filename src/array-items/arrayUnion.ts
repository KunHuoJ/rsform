/**
 * 为数组字段的某个子键构建跨行唯一性校验器。
 *
 * 用法:将其作为 `validator` 挂到每行的 `<Field>` 上(例如某行的
 * `id` 或 `name`)。校验器会从该字段最近的数组祖先读取整个数组,
 * 并在某个值已出现在其他行的同一键时拒绝该值。
 *
 * `message` 用于自定义错误信息;默认为一条通用的"重复"提示。
 *
 * 这是一个通用的唯一性校验模式(不依赖任何内部库)。Formily 会向
 * 校验器传入上下文 `{ field, form }`;`ctx.field` 是 Formily 字段模型,
 * 其 `parent` 链会指向数组字段。
 */
export type ArrayUnionValidator = (
    value: any,
    rule: any,
    ctx: { field: any; form: any } | any,
) => string | null | undefined | Promise<string | null | undefined>;

export function arrayUnion(key: string, message = '该值已存在'): ArrayUnionValidator {
    return (value: any, _rule: any, ctx: any) => {
        if (value == null || value === '') {
            return '';
        }
        const field = ctx?.field ?? ctx;
        const form = ctx?.form ?? field?.form;
        // 优先使用模型最近数组祖先的 records;其次回退到沿 parent 链
        // 向上查找,最后再按字段地址到 form.values 中查找。
        let arr: any[] | undefined;
        let node = field;
        while (node) {
            const v = node?.records ?? node?.value;
            if (Array.isArray(v)) {
                arr = v;
                break;
            }
            node = node?.parent;
        }
        if (!Array.isArray(arr) && form) {
            // 沿字段地址向上查找数组所在的那一段。
            const addr = String(field?.address ?? field?.path ?? '');
            const segs = addr.split('.').filter(Boolean);
            for (let i = segs.length - 1; i >= 0; i--) {
                if (/^\d+$/.test(segs[i]) && i > 0) {
                    const cand = form.getValuesIn(segs.slice(0, i).join('.'));
                    if (Array.isArray(cand)) {
                        arr = cand;
                        break;
                    }
                }
            }
        }
        if (!Array.isArray(arr)) {
            return '';
        }
        let dup = 0;
        for (const row of arr) {
            const v = row?.[key];
            if (v != null && v !== '' && String(v) === String(value)) {
                dup++;
                if (dup > 1) {
                    return message;
                }
            }
        }
        return '';
    };
}
