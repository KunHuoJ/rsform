import * as React from 'react';
import { useField, useForm } from '@formily/react';
import { autorun, untracked } from '@formily/reactive';
import { useLatestRef } from '../shared/useLatestRef';
import { CellBridge, resolveAbsoluteIndex } from './CellBridge';
import type { BuiltColumns, RsfTableProps } from './types';

/**
 * Build the antd `columns` array for the high-perf Table.
 *
 * Perf contract: the returned `columns` reference is stable across value edits
 * — its `useMemo` deps are `[columns, name, current, pageSize,
 * itemDefaultValue]`, deliberately EXCLUDING the array value / length. Each
 * column's `render` reads the latest row value via a ref (`useLatestRef`) so a
 * stable closure always sees fresh data without being rebuilt.
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
    const { name, columns: propColumns, pagination } = props;

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

    const columns = React.useMemo<BuiltColumns<RecordType>>(() => {
        // Row-mutation actions handed to a column `render`. All structural
        // mutations go through `form.setValuesIn(name, nextArray)` — an
        // immutable whole-array replace — rather than Formily's `field.*`
        // mutators. Reason: the `lenTick` autorun (below) subscribes to the
        // array *reference* via `field.value`; `setValuesIn` replaces that
        // reference and reliably re-fires the autorun, so add/insert/remove
        // re-render the body immediately. The `field.*` mutators splice the
        // array in place (same reference), which does NOT re-fire the autorun,
        // so the body would not re-render and the new row would not appear
        // until the next unrelated re-render (the "insert then add → +2 rows"
        // bug). `add`/`insert` default to the Table's `itemDefaultValue`.
        // Cell EDITS do NOT go through here — they use `cellField.onInput(v)`
        // (a single leaf, no array replacement), so the per-cell perf contract
        // is preserved; only structural changes re-render the body, as they
        // should.
        const itemDefault = props.itemDefaultValue;
        const getArr = (): RecordType[] => {
            const v = form?.values?.[name];
            return Array.isArray(v) ? (v as RecordType[]) : [];
        };
        const setArr = (next: RecordType[]) => {
            form?.setValuesIn?.(name, next);
        };
        const actions = () => ({
            add: (value?: RecordType) => setArr([...getArr(), value ?? itemDefault]),
            insert: (index: number, value?: RecordType) => {
                const arr = getArr();
                const at = Math.max(0, Math.min(index, arr.length));
                setArr([...arr.slice(0, at), value ?? itemDefault, ...arr.slice(at)]);
            },
            remove: (index: number) => setArr(getArr().filter((_, k) => k !== index)),
            move: (from: number, to: number) => {
                const arr = getArr();
                if (from < 0 || to < 0 || from >= arr.length || to >= arr.length || from === to) {
                    return;
                }
                const next = arr.slice();
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                setArr(next);
            },
            moveUp: (index: number) => actions().move(index, index - 1),
            moveDown: (index: number) => actions().move(index, index + 1),
            form,
            field,
        });

        const built: BuiltColumns<RecordType> = propColumns.map((col) => {
            return {
                title: col.title ?? col.dataIndex,
                dataIndex: col.dataIndex,
                width: col.width,
                align: col.align,
                fixed: col.fixed,
                render: (_value: any, record: any, index: number) => {
                    const abs = resolveAbsoluteIndex(
                        index,
                        currentRef.current,
                        pageSizeRef.current,
                    );
                    // A custom `render` overrides the CellBridge entirely —
                    // pass it the cell value, the row record, the absolute
                    // index, and row-mutation actions (add/insert/remove/…).
                    // This is how users build action columns (delete/move/…):
                    // no built-in remove column; put a delete button in your
                    // own render via `actions.remove(index)`.
                    if (typeof col.render === 'function') {
                        const cellValue = record?.[col.dataIndex];
                        return col.render(cellValue, record, abs, actions());
                    }
                    return (
                        <CellBridge
                            rowIndex={abs}
                            dataIndex={col.dataIndex}
                            arrayName={name}
                            control={col.control}
                            controlProps={col.controlProps}
                            validator={col.validator}
                            required={col.required}
                            requiredMessage={col.requiredMessage}
                            editable={col.editable ?? col.control != null}
                        />
                    );
                },
            } as any;
        });

        return built;
        // Deliberately EXCLUDE dataSource/value/length: columns must stay
        // referentially stable across edits. Fresh values are read via refs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propColumns, name, current, pageSize, props.itemDefaultValue]);

    return { dataSource, columns };
}
