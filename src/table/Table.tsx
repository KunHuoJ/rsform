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
 * rsform Table：以 Formily ArrayField 为底层的高性能可编辑表格。
 *
 * 相比朴素的「每个单元格都是 Formily `<Field>`」表格，性能收益在于：
 *  - Table body 不会为单元格编辑订阅数组值——它通过 `untracked` 读取数组，
 *    只在长度变化（增加/删除）时借助 `lenTick` 重渲染。因此一次编辑
 *    绝不会遍历 N×M 的单元格树。
 *  - 每个单元格是一个 `CellBridge`：它响应式地从 `form.values` 的某个叶子
 *    读取自己的值（因此编辑单元格 (i,j) 只重渲染单元格 (i,j)），且只观察
 *    自己的 `selfErrors`（罕见事件）。它并非 Formily `<Field>`，
 *    所以不参与 N×M 的响应式重渲染级联。
 *  - `columns` 数组在值编辑时保持引用稳定（其 useMemo 依赖项不含数组值/长度）；
 *    最新的值通过 ref / 每个单元格的叶子订阅读取。
 *
 * 单元格值的流向：`onChange` → 单元格 field 的 `onInput(v)`（设置叶子值，
 * 运行单元格的校验器，触发单元格路径上的 `onFieldValueChange` 副作用——
 * 全程不替换行对象，因此同行的兄弟单元格不会重渲染）。
 */
const RsfTableBody = observer(function RsfTableBody<RecordType extends Record<string, any>>(
    props: RsfTableProps<RecordType>,
): React.ReactElement {
    const { dataSource, columns } = useTable(props);
    const { pagination, rowKey, className, scroll, tableProps } = props;

    // 默认行 key：绝对索引。antd 传给 rowKey(record, index) 的是分页相对索引；
    // 给每行附加一个合成的 __rsfIdx（绝对索引），使 key 在跨页时保持稳定。
    // 被包装的记录是浅拷贝（绝不改动 Formily 的值）；CellBridge 只读取
    // record[dataIndex]，因此新的对象引用不会破坏单元格的 memo。
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
        // keyedDataSource 在每次渲染时重新计算（代价很低且必须跟踪值编辑）；
        // 它刻意不进入 columns 的 memo 依赖项。
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataSource, rowKey, page, size]);

    // antd Table 默认 `tableLayout: 'auto'`，此布局下浏览器会根据内容
    // 自动分配列宽，列的 `width` 只是建议值——列数一多，表格会把每列挤压到
    // 其内容的最小宽度（一个短输入框无论声明了 `width: 120` 都只渲染约几十 px）。
    // 为了让列的 `width` 真正生效，我们通过提供 `scroll.x` 切换到固定布局。
    // 只要设置了 `scroll.x`，antd 就会自动启用 `tableLayout: 'fixed'`，
    // 而固定布局会严格遵守每个 `<col width>`。我们把声明的各列宽度之和
    // 作为滚动宽度；若没有任何列声明宽度，则回退到 'max-content'，
    // 使表格仍按内容计算尺寸。用户自行传入的 `scroll` 始终优先。
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
 * rsform Table 包装器：把 body 作用域限定在一个 Formily `<ArrayField>` 内
 * （使 `useField()` 返回数组模型以供调用变更方法），并包裹一个 FieldContext，
 * 以解析出的数组名作为 preName，让 body 的 `useTable` 能正确解析相对名称。
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
