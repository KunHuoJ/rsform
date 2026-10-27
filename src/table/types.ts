import type * as React from 'react';
import type {ColumnsType} from 'antd/es/table';

/**
 * Column definition for the high-performance editable Table. Mirrors antd's
 * `ColumnType` but adds rsform's `dataIndex`-driven editable cell wiring.
 *
 * The perf-critical contract: `useTable` memoises the built `ColumnsType`
 * array so its reference is stable across value edits (deps exclude the array
 * value / length). Each column's `render` is a stable closure that reads the
 * latest row value via a ref and hands it to a memoised `CellBridge`.
 */
export interface RsfTableColumn<RecordType = any> {
    /** Column title. */
    title?: React.ReactNode;
    /** Key into the row object this column edits (e.g. 'price'). */
    dataIndex: string;
    /** Column width. */
    width?: number | string;
    /**
     * How the cell renders. If omitted, the cell is read-only text.
     *  - a FormComMap key string ('input' | 'inputNumber' | 'select' | …)
     *    → the control is looked up from the registry.
     *  - a React element → cloned with value/onChange injected (like Field).
     */
    control?: string | React.ReactElement;
    /** Whether this cell is editable. Defaults to true when `control` is set. */
    editable?: boolean;
    /** Formily validator attached to the cell's registered field. */
    validator?: any;
    /** Extra props merged into the control (options, placeholder, …). */
    controlProps?: Record<string, any>;
    /** Align; passed through to antd column. */
    align?: 'left' | 'center' | 'right';
    /** Fixed column; passed through to antd. */
    fixed?: 'left' | 'right' | boolean;
    /** Custom render that fully overrides the CellBridge (read-only display). */
    render?: (value: any, record: RecordType, index: number) => React.ReactNode;
}

export interface RsfTableProps<RecordType = any> {
    /** Array field name whose value backs the table rows. */
    name: string;
    /** Column definitions. */
    columns: RsfTableColumn<RecordType>[];
    /** Row key field; defaults to the 0-based absolute index. */
    rowKey?: string | ((record: RecordType, index: number) => React.Key);
    /** antd pagination; defaults to no pagination (all rows). */
    pagination?: false | Record<string, any>;
    /** Show a remove column with a per-row delete button. */
    removeButton?: boolean;
    /** Props for the remove button (title, text, …). */
    removeButtonProps?: Record<string, any>;
    /** Disable the remove button (e.g. at min rows). */
    disableRemove?: boolean;
    /** Default value pushed when adding a row via the remove column's add. */
    itemDefaultValue?: any;
    /** ClassName for the table wrapper. */
    className?: string;
}

/** The built antd columns type rsform hands to `<Table columns>`. */
export type BuiltColumns<RecordType = any> = ColumnsType<RecordType>;
