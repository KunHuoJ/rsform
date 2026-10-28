/**
 * High-performance editable Table backed by a Formily
 * ArrayField. Cells are `CellBridge`s (NOT Formily Fields): each cell reads
 * its own value reactively from a `form.values` leaf (single-cell re-render on
 * edit), onChange writes through the cell field's `onInput` (so validators +
 * `onFieldValueChange` effects fire), and the Table body re-renders only on
 * length changes. The `columns` array is referentially stable across value
 * edits, so editing one cell re-renders exactly that cell.
 */
import { Form as BaseForm } from '../form/FormNamespace';
import { Table } from './Table';

export type { CellBridgeProps } from './CellBridge';
export { CellBridge } from './CellBridge';
export type { BuiltColumns, RsfTableColumn, RsfTableColumnActions, RsfTableProps } from './types';
export { useTable } from './useTable';
export { Table };

/**
 * Form namespace helper: attaches Table onto the shared Form as `Form.Table`.
 * rsform's single entry (`src/index.ts`) re-exports `Table` and attaches it
 * there; this barrel is the implementation surface for the table module.
 */
export type TableForm = typeof BaseForm & {
    Table: typeof Table;
};

export const Form: TableForm = Object.assign(BaseForm, {
    Table,
}) as TableForm;
