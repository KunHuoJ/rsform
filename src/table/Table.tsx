import * as React from 'react';
import { ArrayField as FormilyArrayField } from '@formily/react';
import { observer } from '@formily/reactive-react';
import { Table as AntdTable } from 'antd';
import { useContentName } from '../field/useContentName';
import { FieldContext } from '../shared/FieldContext';
import { prefixCls } from '../shared/prefixCls';
import type { RsfTableProps } from './types';
import { useTable } from './useTable';

/**
 * rsform Table: a high-performance editable table backed by a Formily
 * ArrayField.
 *
 * The perf win over a naive "every cell is a Formily `<Field>`" table:
 *  - The Table body does NOT subscribe to the array value for cell edits — it
 *    reads the array via `untracked` and re-renders only on length changes
 *    (add/remove) via a `lenTick`. So an edit never walks the N×M cell tree.
 *  - Each cell is a `CellBridge`: it reads its own value reactively from a
 *    `form.values` leaf (so editing cell (i,j) re-renders ONLY cell (i,j)) and
 *    observes only its own `selfErrors` (a rare event). It is NOT a Formily
 *    `<Field>`, so it does not take part in the N×M reactive re-render cascade.
 *  - The `columns` array is referentially stable across value edits (its
 *    useMemo deps exclude the array value/length); fresh values are read via
 *    refs / the per-cell leaf subscription.
 *
 * The cell value flows: `onChange` → the cell field's `onInput(v)` (sets the
 * leaf value, runs the cell's validator, fires `onFieldValueChange` effects on
 * the cell path — all without replacing the row object, so sibling cells do
 * not re-render).
 */
const RsfTableBody = observer(function RsfTableBody<RecordType extends Record<string, any>>(
    props: RsfTableProps<RecordType>,
): React.ReactElement {
    const { dataSource, columns } = useTable(props);
    const { pagination, rowKey, className, scroll, tableProps } = props;

    // Default row key: the absolute index. antd passes a page-relative index
    // to rowKey(record, index); attach a synthetic __rsfIdx (absolute) to each
    // row so keys are stable across pages. Wrapped records are shallow copies
    // (never mutate Formily values); CellBridge reads only record[dataIndex],
    // so the new object reference does not break cell memoisation.
    const pag = typeof pagination === 'object' && pagination ? pagination : {};
    const page = pag.current && pag.current > 0 ? pag.current : 1;
    const size = pag.pageSize && pag.pageSize > 0 ? pag.pageSize : 0;

    const resolvedRowKey = React.useMemo(() => {
        if (rowKey == null) return '__rsfIdx';
        return rowKey;
    }, [rowKey]);

    const keyedDataSource = React.useMemo(() => {
        if (rowKey != null) return dataSource;
        return dataSource.map((row, i) => ({
            ...row,
            __rsfIdx: size > 0 ? (page - 1) * size + i : i,
        }));
        // keyedDataSource is recomputed each render (it is cheap and must
        // track value edits); it intentionally is NOT in the columns memo deps.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataSource, rowKey, page, size]);

    // antd Table defaults to `tableLayout: 'auto'`, under which the browser
    // auto-distributes column widths from content and a column's `width` is only
    // a suggestion — with many columns the table squishes each column to its
    // content's minimum (a short input renders ~tens of px regardless of a
    // declared `width: 120`). To make column `width`s actually take effect we
    // switch to fixed layout by providing `scroll.x`. antd auto-enables
    // `tableLayout: 'fixed'` whenever `scroll.x` is set, and fixed layout
    // honours each `<col width>` strictly. We sum the declared column widths as
    // the scroll width; if no column declares a width we fall back to
    // 'max-content' so the table still sizes to content. A user-supplied
    // `scroll` always wins.
    const resolvedScroll = React.useMemo(() => {
        if (scroll) return scroll;
        const total = columns.reduce((sum: number, col: any) => {
            const w = col?.width;
            return sum + (typeof w === 'number' ? w : 0);
        }, 0);
        return { x: total > 0 ? total : 'max-content' };
    }, [scroll, columns]);

    return (
        <AntdTable
            {...tableProps}
            className={`${prefixCls}-table ${className ?? ''}`.trim()}
            dataSource={keyedDataSource as any}
            columns={columns as any}
            rowKey={resolvedRowKey as any}
            pagination={pagination as any}
            scroll={resolvedScroll as any}
        />
    );
}) as <RecordType extends Record<string, any>>(
    props: RsfTableProps<RecordType>,
) => React.ReactElement;

/**
 * rsform Table wrapper: scopes the body inside a Formily `<ArrayField>` (so
 * `useField()` returns the array model for mutators) and a FieldContext with
 * the resolved array name as preName, so the body's `useTable` resolves
 * relative names correctly.
 */
export function Table<RecordType extends Record<string, any>>(
    props: RsfTableProps<RecordType>,
): React.ReactElement {
    const { name, ...rest } = props;
    const resolvedName = useContentName(name);
    return (
        <FormilyArrayField name={resolvedName} basePath="">
            <FieldContext.Provider
                value={{ preName: resolvedName, name: resolvedName, state: null }}
            >
                <RsfTableBody {...rest} name={resolvedName} />
            </FieldContext.Provider>
        </FormilyArrayField>
    );
}
