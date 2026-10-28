import type * as React from 'react';
import { DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

/**
 * antd DatePicker re-export. rsform Field auto-injects `value`/`onChange` (the
 * picker passes a dayjs object, not a synthetic event).
 *
 * Note on dayjs + Formily reactivity: Formily's reactive engine serialises a
 * stored dayjs object (a class instance) to a string, so a raw dayjs does not
 * survive a round-trip through `form.values`. For a `Form.Field` bound
 * DatePicker, pass `format`/`parse` on the Field to convert string↔dayjs. For
 * the high-perf Table, `registerControl('date', DateCell)` (below) wires this
 * conversion in automatically — see `FormComMap`.
 */

/** Convert a stored value (string | Dayjs | Date | null) into a Dayjs, or null. */
function toDayjs(v: unknown): Dayjs | null {
    if (v == null || v === '') return null;
    if (typeof v === 'string') {
        const d = dayjs(v);
        return d.isValid() ? d : null;
    }
    // Already a Dayjs (or Date) — coerce defensively.
    const d = dayjs(v as any);
    return d.isValid() ? d : null;
}

/** Convert a Dayjs back to a stored value (ISO string). */
function fromDayjs(d: Dayjs | null): string | null {
    return d && d.isValid() ? d.toISOString() : null;
}

/**
 * DatePicker wired for the high-perf Table's cell: stores the value as an ISO
 * string in `form.values` and converts string↔Dayjs at the control boundary,
 * so the dayjs instance never enters the reactive store (where Formily would
 * stringify it and break the picker).
 *
 * `onChange` fires with a Dayjs; we convert to an ISO string before calling the
 * cell's handleChange. Display converts the stored string back to a Dayjs.
 */
export function DateCell(props: React.ComponentProps<typeof DatePicker>): React.ReactElement {
    const { value, onChange, ...rest } = props as any;
    return (
        <DatePicker
            {...rest}
            value={toDayjs(value)}
            onChange={(d: Dayjs | null) => {
                onChange?.(fromDayjs(d));
            }}
        />
    );
}

export { DatePicker };
