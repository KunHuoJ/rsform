import type * as React from 'react';
import { DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

/**
 * antd DatePicker 的重新导出。rsform Field 会自动注入 `value`/`onChange`
 * （picker 传出的是一个 dayjs 对象，而非合成事件）。
 *
 * 关于 dayjs + Formily 响应式的说明：Formily 的响应式引擎会把存储的 dayjs
 * 对象（一个类实例）序列化成字符串，因此原始 dayjs 无法在 `form.values`
 * 的往返中存活。对于绑定到 `Form.Field` 的 DatePicker，请在 Field 上传入
 * `format`/`parse` 来在字符串与 dayjs 之间转换。对于高性能 Table，
 * `registerControl('date', DateCell)`（见下文）会自动接入这一转换
 * ——参见 `FormComMap`。
 */

/** 将存储值（string | Dayjs | Date | null）转换为 Dayjs，或 null。 */
function toDayjs(v: unknown): Dayjs | null {
    if (v == null || v === '') return null;
    if (typeof v === 'string') {
        const d = dayjs(v);
        return d.isValid() ? d : null;
    }
    // 已经是 Dayjs（或 Date）——做防御性强制转换。
    const d = dayjs(v as any);
    return d.isValid() ? d : null;
}

/** 将 Dayjs 转换回存储值（ISO 字符串）。 */
function fromDayjs(d: Dayjs | null): string | null {
    return d && d.isValid() ? d.toISOString() : null;
}

/**
 * 为高性能 Table 的单元格接线的 DatePicker：在 `form.values` 中以 ISO 字符串
 * 存储值，并在控件边界处做字符串与 Dayjs 的互转，使 dayjs 实例永不进入响应式
 * 存储（否则 Formily 会将其字符串化并破坏 picker）。
 *
 * `onChange` 触发时带出一个 Dayjs；我们先将其转为 ISO 字符串，再调用单元格的
 * handleChange。显示时把存储的字符串转换回 Dayjs。
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
