/**
 * 以 Formily ArrayField 为底层的高性能可编辑 Table。
 * 单元格是 `CellBridge`（并非 Formily Field）：每个单元格响应式地从
 * `form.values` 的某个叶子读取自己的值（编辑时只重渲染单个单元格），
 * onChange 通过单元格 field 的 `onInput` 写入（这样校验器 +
 * `onFieldValueChange` 副作用才会触发），而 Table body 只在长度变化时重渲染。
 * `columns` 数组在值编辑时保持引用稳定，因此编辑一个单元格恰好只重渲染该单元格。
 */
import { Form as BaseForm } from '../form/FormNamespace';
import { Table } from './Table';

export type { CellBridgeProps } from './CellBridge';
export { CellBridge } from './CellBridge';
export type { BuiltColumns, RsfTableColumn, RsfTableColumnActions, RsfTableProps } from './types';
export { useTable } from './useTable';
export { Table };

/**
 * Form 命名空间辅助：把 Table 挂到共享的 Form 上，作为 `Form.Table`。
 * rsform 的单一入口（`src/index.ts`）会重新导出 `Table` 并在那里完成挂载；
 * 本 barrel 文件是 table 模块的实现层出口。
 */
export type TableForm = typeof BaseForm & {
    Table: typeof Table;
};

export const Form: TableForm = Object.assign(BaseForm, {
    Table,
}) as TableForm;
