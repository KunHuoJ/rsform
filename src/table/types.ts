import type * as React from 'react';
import type { ColumnsType } from 'antd/es/table';

/**
 * Row actions handed to a column's `render` so a custom cell can mutate the
 * array: add/insert/remove/move rows. All operate on absolute row indices
 * (page-corrected). `add`/`insert` default to the Table's `itemDefaultValue`
 * when no value is passed.
 */
export interface RsfTableColumnActions<RecordType = any> {
    /** Append a row (defaults to the Table's `itemDefaultValue`). */
    add: (value?: RecordType) => void;
    /** Insert a row at `index` (defaults to `itemDefaultValue`). */
    insert: (index: number, value?: RecordType) => void;
    /** Remove the row at `index`. */
    remove: (index: number) => void;
    /** Move a row from `from` to `to`. */
    move: (from: number, to: number) => void;
    /** Move the row at `index` up one. */
    moveUp: (index: number) => void;
    /** Move the row at `index` down one. */
    moveDown: (index: number) => void;
    /** The Formily form instance (read `form.values`, call `form.submit()`, …). */
    form: any;
    /** The underlying Formily ArrayField model (its mutators, `field.value`). */
    field: any;
}

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
     *  - a React component type (`control: MyInput`) → rendered fresh with
     *    value/onChange + controlProps. The most ergonomic form for a custom
     *    control with props — no need to register a key or wrap in an element.
     *  - a React element (`control: <MyInput />`) → cloned with value/onChange
     *    + controlProps injected (like Field).
     */
    control?: string | React.ComponentType<any> | React.ReactElement;
    /** Whether this cell is editable. Defaults to true when `control` is set. */
    editable?: boolean;
    /**
     * Whether this cell is required. When true, an empty value fails validation
     * (submit is blocked, the error shows under the cell). Composed ahead of
     * `validator` so a cell can be both required and have a custom validator.
     */
    required?: boolean;
    /** Error message shown when a `required` cell is empty. Default: '必填'. */
    requiredMessage?: string;
    /** Formily validator attached to the cell's registered field. */
    validator?: any;
    /** Extra props merged into the control (options, placeholder, …). */
    controlProps?: Record<string, any>;
    /** Align; passed through to antd column. */
    align?: 'left' | 'center' | 'right';
    /** Fixed column; passed through to antd. */
    fixed?: 'left' | 'right' | boolean;
    /**
     * Custom render that fully overrides the CellBridge (read-only display).
     * Receives the cell value, the row record, the absolute row index, and an
     * `actions` object whose `add`/`insert`/`remove`/`move`/`moveUp`/`moveDown`
     * mutate the array — so a custom column can host add/remove/sort buttons.
     */
    render?: (
        value: any,
        record: RecordType,
        index: number,
        actions: RsfTableColumnActions<RecordType>,
    ) => React.ReactNode;
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
    /**
     * antd `scroll`. If omitted, rsform computes `scroll.x` from the sum of the
     * declared column `width`s (so each column's `width` is strictly honoured
     * via fixed table layout; 'max-content' when no column declares a width).
     * Pass your own to override.
     */
    scroll?: Record<string, any>;
    /**
     * Default value used by row-mutation actions (`actions.add` /
     * `actions.insert` in a column `render`) when no value is passed. Lets a
     * custom action column add rows without knowing the row shape.
     */
    itemDefaultValue?: any;
    /** ClassName for the table wrapper. */
    className?: string;
}

/** The built antd columns type rsform hands to `<Table columns>`. */
export type BuiltColumns<RecordType = any> = ColumnsType<RecordType>;
