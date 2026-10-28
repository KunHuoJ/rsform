/**
 * Build a cross-row uniqueness validator for an array field's child key.
 *
 * Usage: attach to a per-row `<Field>` (e.g. a row's `id` or `name`) as its
 * `validator`. The validator reads the whole array from the field's nearest
 * array ancestor and rejects a value that already appears in another row's
 * same key.
 *
 * `message` customises the error; defaults to a generic "duplicated" message.
 *
 * This is a generic uniqueness pattern (independent of any internal library).
 * Formily passes the validator a context `{ field, form }`; `ctx.field` is the
 * Formily field model whose `parent` chain leads to the array field.
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
        // Prefer the model's nearest-array-ancestor records; fall back to a
        // parent-chain walk then to form.values lookup by the field's address.
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
            // Walk up the field's address to find the array segment.
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
