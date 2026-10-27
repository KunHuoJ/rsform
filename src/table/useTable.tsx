import * as React from 'react';
import {Button as AntdButton} from 'antd';
import {useForm, useField} from '@formily/react';
import {autorun, untracked} from '@formily/reactive';
import {useLatestRef} from '../shared/useLatestRef';
import {CellBridge, resolveAbsoluteIndex} from './CellBridge';
import type {BuiltColumns, RsfTableProps} from './types';

/**
 * Build the antd `columns` array for the high-perf Table.
 *
 * Perf contract: the returned `columns` reference is stable across value edits
 * — its `useMemo` deps are `[columns, name, current, pageSize, removeButton,
 * disableRemove, removeButtonProps]`, deliberately EXCLUDING the array value
 * / length. Each column's `render` reads the latest row value via a ref
 * (`useLatestRef`) so a stable closure always sees fresh data without being
 * rebuilt.
 *
 * Reactivity strategy (avoids re-rendering all N×M cells on one edit):
 *  - The Table body reads the array via `untracked` (NOT subscribed to edits),
 *    so a cell edit does NOT re-render the Table body / walk the cell tree.
 *  - A `lenTick` React state is bumped by an `autorun` that reads the array
 *    length. The autorun re-fires on every array change, but `setLenTick` only
 *    triggers a re-render when the length actually changes (React bails on an
 *    equal state value). So cell edits (length unchanged) never re-render the
 *    body; add/remove (length changed) do.
 *  - Each `CellBridge` reads its OWN leaf of `form.values` reactively, so an
 *    edit re-renders only the edited cell.
 */
export function useTable<RecordType extends Record<string, any>>(
    props: RsfTableProps<RecordType>,
): {
    dataSource: RecordType[];
    columns: BuiltColumns<RecordType>;
} {
    const {
        name,
        columns: propColumns,
        pagination,
        removeButton,
        disableRemove,
        removeButtonProps,
    } = props;

    const form: any = useForm();
    const field: any = useField();

    // The array value backing the rows. Read via `untracked` so the Table body
    // does NOT subscribe to cell edits (which would re-render every cell). The
    // `lenTick` below is the only thing that re-renders the body, and only on
    // length changes.
    const rawValue = untracked(() => field?.value);
    const dataSource: RecordType[] = Array.isArray(rawValue)
        ? rawValue
        : Array.isArray(form?.values?.[name])
            ? form.values[name]
            : [];

    // Re-render the body only when the array LENGTH changes (add/remove). The
    // autorun re-fires on every array value change, but `setLenTick` bails
    // (React Object.is) when the length is unchanged — so cell edits never
    // re-render the body. Reading `field.value.length` inside `autorun`
    // subscribes to the array (the only subscription on the array value).
    const [, setLenTick] = React.useState(0);
    React.useEffect(() => {
        if (!field) return;
        const dispose = autorun(() => {
            const len = Array.isArray(field.value) ? field.value.length : 0;
            untracked(() => setLenTick(len));
        });
        return () => dispose();
    }, [field]);

    // antd5 `render(value, record, index)` passes a PAGE-RELATIVE index (R3
    // spike). Read the latest pagination out of refs so the render closures
    // stay stable (don't enter the columns useMemo deps via pagination object
    // identity churn).
    const pag = typeof pagination === 'object' && pagination ? pagination : {};
    const current = pag.current;
    const pageSize = pag.pageSize;
    const currentRef = useLatestRef(current);
    const pageSizeRef = useLatestRef(pageSize);

    const removeText = removeButtonProps?.text ?? '删除';
    const idField = typeof props.rowKey === 'string' ? props.rowKey : undefined;

    const columns = React.useMemo<BuiltColumns<RecordType>>(() => {
        const built: BuiltColumns<RecordType> = propColumns.map(col => {
            return {
                title: col.title ?? col.dataIndex,
                dataIndex: col.dataIndex,
                width: col.width,
                align: col.align,
                fixed: col.fixed,
                render: (_value: any, record: any, index: number) => {
                    const abs = resolveAbsoluteIndex(
                        index,
                        record,
                        currentRef.current,
                        pageSizeRef.current,
                        idField,
                    );
                    return (
                        <CellBridge
                            rowIndex={abs}
                            dataIndex={col.dataIndex}
                            arrayName={name}
                            control={col.control}
                            controlProps={col.controlProps}
                            validator={col.validator}
                            editable={col.editable ?? col.control != null}
                        />
                    );
                },
            } as any;
        });

        if (removeButton) {
            built.push({
                title: removeButtonProps?.title ?? '操作',
                key: '__rsf_remove',
                width: removeButtonProps?.width ?? 80,
                fixed: removeButtonProps?.fixed ?? 'right',
                render: (_value: any, _record: any, index: number) => {
                    const abs = resolveAbsoluteIndex(
                        index,
                        _record,
                        currentRef.current,
                        pageSizeRef.current,
                        idField,
                    );
                    const onRemove = () => {
                        field?.remove?.(abs);
                    };
                    // Custom render wins — hand the caller the absolute index,
                    // the record, and an onRemove callback.
                    if (typeof removeButtonProps?.render === 'function') {
                        return removeButtonProps.render(abs, _record, onRemove);
                    }
                    // Default: antd link-style Button — link look out of the
                    // box (no need to import rsform/styles), `danger` tints the
                    // remove button red. `className` lets consumers override.
                    return (
                        <AntdButton
                            type="link"
                            danger
                            size="small"
                            disabled={!!disableRemove}
                            onClick={onRemove}
                            className={removeButtonProps?.className}
                        >
                            {removeText}
                        </AntdButton>
                    );
                },
            } as any);
        }

        return built;
        // Deliberately EXCLUDE dataSource/value/length: columns must stay
        // referentially stable across edits. Fresh values are read via refs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        propColumns,
        name,
        current,
        pageSize,
        removeButton,
        disableRemove,
        removeButtonProps,
    ]);

    return {dataSource, columns};
}
