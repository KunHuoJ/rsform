import type * as React from 'react';
import type { ArrayField, Form as FormilyForm } from '@formily/core';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { ControlKey } from '../controls/FormComMap';

/**
 * 交给列 `render` 的行操作，让自定义单元格能够修改数组：
 * 增加/插入/删除/移动行。所有操作都基于绝对行索引（已做分页校正）。
 * 未传入值时，`add`/`insert` 默认使用 Table 的 `itemDefaultValue`。
 */
export interface RsfTableColumnActions<RecordType = any> {
    /** 追加一行（默认使用 Table 的 `itemDefaultValue`）。 */
    add: (value?: RecordType) => void;
    /** 在 `index` 处插入一行（默认使用 `itemDefaultValue`）。 */
    insert: (index: number, value?: RecordType) => void;
    /** 删除 `index` 处的行。 */
    remove: (index: number) => void;
    /** 把一行从 `from` 移动到 `to`。 */
    move: (from: number, to: number) => void;
    /** 把 `index` 处的行上移一位。 */
    moveUp: (index: number) => void;
    /** 把 `index` 处的行下移一位。 */
    moveDown: (index: number) => void;
    /** Formily form 实例（读取 `form.values`、调用 `form.submit()` 等）。 */
    form: FormilyForm;
    /** 底层 Formily ArrayField 模型（其变更方法、`field.value`）。 */
    field: ArrayField;
}

/**
 * 高性能可编辑 Table 的列定义。与 antd 的 `ColumnType` 对应，
 * 但额外加入了 rsform 由 `dataIndex` 驱动的可编辑单元格接线。
 *
 * 性能关键约定：`useTable` 会对构建出的 `ColumnsType` 数组做 memo，
 * 使其引用在值编辑时保持稳定（依赖项不含数组值/长度）。
 * 每个列的 `render` 都是稳定闭包，通过 ref 读取最新的行值，
 * 并交给一个 memo 过的 `CellBridge`。
 */
export interface RsfTableColumn<RecordType = any> {
    /** 列标题。 */
    title?: React.ReactNode;
    /**
     * 本列所编辑的行对象字段键（例如 'price'）。
     *
     * 指定了 `RecordType` 时，IDE 会自动补全其键名；同时保留对任意 `string`
     * 的放宽（通过 `(string & {})`），因此操作列这类并不对应真实行字段的
     * `dataIndex`（如 'actions'）依然合法，不会报类型错误。
     */
    dataIndex: (keyof RecordType & string) | (string & {});
    /** 列宽。 */
    width?: number | string;
    /**
     * 单元格如何渲染。省略时，单元格为只读文本。
     *  - FormComMap 的键字符串（'input' | 'inputNumber' | 'select' | …）
     *    → 从注册表中查出对应控件。
     *  - React 组件类型（`control: MyInput`）→ 用 value/onChange + controlProps
     *    重新渲染。这是带 props 的自定义控件最顺手的写法——
     *    无需注册键，也无需包成元素。
     *  - React 元素（`control: <MyInput />`）→ 克隆并注入 value/onChange
     *    + controlProps（与 Field 一样）。
     *
     * 该联合类型包含内置的 `ControlKey` 字面量（因此 IDE 会自动补全
     * 'input' | 'inputNumber' | 'select' | 'radioGroup' | 'switch' | 'date'）、
     * 组件类型、React 元素，以及一个放宽的 `string`，
     * 以支持通过 `registerControl` 在运行时注册的控件。
     */
    control?: ControlKey | React.ComponentType<any> | React.ReactElement | (string & {});
    /** 本单元格是否可编辑。设置了 `control` 时默认为 true。 */
    editable?: boolean;
    /**
     * 本单元格是否必填。为 true 时，空值会导致校验失败
     * （阻止提交，错误显示在单元格下方）。它排在 `validator` 之前组合，
     * 因此单元格可以既必填又带自定义校验器。
     */
    required?: boolean;
    /** `required` 单元格为空时显示的错误信息。默认：'必填'。 */
    requiredMessage?: string;
    /** 挂到单元格已注册 field 上的 Formily 校验器。 */
    validator?: any;
    /** 合并进控件的额外 props（options、placeholder 等）。 */
    controlProps?: Record<string, any>;
    /** 对齐方式；透传给 antd 列。 */
    align?: 'left' | 'center' | 'right';
    /** 固定列；透传给 antd。 */
    fixed?: 'left' | 'right' | boolean;
    /**
     * 完全覆盖 CellBridge 的自定义 render（只读展示）。
     * 接收单元格值、行记录、绝对行索引，以及一个 `actions` 对象，
     * 其 `add`/`insert`/`remove`/`move`/`moveUp`/`moveDown` 用于修改数组——
     * 因此自定义列可以放置增加/删除/排序按钮。
     */
    render?: (
        value: any,
        record: RecordType,
        index: number,
        actions: RsfTableColumnActions<RecordType>,
    ) => React.ReactNode;
}

export interface RsfTableProps<RecordType = any> {
    /** 其值支撑表格行的数组 field 名称。 */
    name: string;
    /** 列定义。 */
    columns: RsfTableColumn<RecordType>[];
    /** 行 key 字段；默认使用从 0 开始的绝对索引。 */
    rowKey?:
        | (keyof RecordType & string)
        | (string & {})
        | ((record: RecordType, index: number) => React.Key);
    /** antd 分页；默认不分页（显示所有行）。 */
    pagination?: false | Record<string, any>;
    /**
     * antd 的 `scroll`。省略时，rsform 会按声明的各列 `width` 之和
     * 计算 `scroll.x`（从而通过固定表格布局严格生效每列的 `width`；
     * 没有任何列声明宽度时取 'max-content'）。
     * 传入自己的值可覆盖。
     */
    scroll?: Record<string, any>;
    /**
     * 行变更操作（列 `render` 中的 `actions.add` / `actions.insert`）
     * 未传入值时使用的默认值。让自定义操作列无需知道行结构即可新增行。
     */
    itemDefaultValue?: Partial<RecordType>;
    /** 表格外层容器的 className。 */
    className?: string;
    /**
     * antd `Table` props 透传（例如 `virtual`、`bordered`、`size`、
     * `rowSelection`、`onChange`、`onRow`、`sticky`）。rsform 自己拥有的 props
     * （`columns` / `dataSource` / `pagination` / `rowKey` / `scroll`）会被显式设置
     * 并优先生效；其余 props 均透传。传入 `virtual: true`
     * 配合 `scroll: { y }` 可启用 antd 内置的虚拟滚动。
     */
    tableProps?: Omit<
        TableProps<RecordType>,
        'columns' | 'dataSource' | 'pagination' | 'rowKey' | 'scroll'
    >;
    /**
     * 行数上限。一旦数组达到 `max`，行变更操作
     * （`actions.add` / `actions.insert`）会被阻止。省略时无上限。
     */
    max?: number;
    /**
     * 行数下限（默认 0）。一旦数组达到 `min`，`actions.remove` 会被阻止。
     */
    min?: number;
    /**
     * 在新增行落入数组之前进行拦截。
     *  - `true`（便捷用法）：先对已有行执行 `form.validate(\`${name}.*\`)`；
     *    若有任一行不合法，则阻止 add/insert（错误已显示在各单元格下方）。
     *  - 函数（逃生舱，签名与 `ArrayItems` 相同）：以
     *    `(values, itemDefaultValue)` 调用；返回 `false`/字符串则阻止，
     *    返回 `true`/`undefined` 则允许。
     */
    validateBeforeAdd?:
        | boolean
        | ((
              values: RecordType[],
              itemDefaultValue: Partial<RecordType>,
          ) => boolean | string | void);
}

/** rsform 交给 `<Table columns>` 的构建后 antd 列类型。 */
export type BuiltColumns<RecordType = any> = ColumnsType<RecordType>;
