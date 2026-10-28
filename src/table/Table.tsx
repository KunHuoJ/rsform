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
    const { pagination, rowKey, className } = props;

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

    return (
        <AntdTable
            className={`${prefixCls}-table ${className ?? ''}`.trim()}
            dataSource={keyedDataSource as any}
            columns={columns as any}
            rowKey={resolvedRowKey as any}
            pagination={pagination as any}
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
