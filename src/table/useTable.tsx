import * as React from 'react';
import { useField, useForm } from '@formily/react';
import { autorun, untracked } from '@formily/reactive';
import { useLatestRef } from '../shared/useLatestRef';
import { CellBridge, resolveAbsoluteIndex } from './CellBridge';
import type { BuiltColumns, RsfTableProps } from './types';

/**
 * 为高性能 Table 构建 antd 的 `columns` 数组。
 *
 * 性能约定：返回的 `columns` 引用在值编辑时保持稳定——它的 `useMemo`
 * 依赖项是 `[columns, name, current, pageSize, itemDefaultValue]`，
 * 刻意排除数组值 / 长度。每个列的 `render` 通过 ref（`useLatestRef`）
 * 读取最新的行值，因此稳定的闭包始终能看到新鲜数据而无需重建。
 *
 * 响应式策略（避免一次编辑就重渲染全部 N×M 个单元格）：
 *  - Table body 通过 `untracked` 读取数组（不订阅编辑），
 *    因此一次单元格编辑不会重渲染 Table body / 遍历单元格树。
 *  - 一个 `lenTick` React state 由读取数组长度的 `autorun` 递增。该 autorun
 *    会在每次数组变化时重新触发，但 `setLenTick` 只在长度真正变化时才触发重渲染
 *    （React 对相等的 state 值会跳过更新）。因此单元格编辑（长度不变）
 *    绝不重渲染 body；增加/删除（长度变化）才会。
 *  - 每个 `CellBridge` 响应式地读取它自己那个 `form.values` 叶子，
 *    因此一次编辑只重渲染被编辑的那个单元格。
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

    // 支撑各行的数组值。通过 `untracked` 读取，使 Table body
    // 不订阅单元格编辑（否则会重渲染每个单元格）。下方的 `lenTick`
    // 是唯一会重渲染 body 的东西，且仅在长度变化时触发。
    const rawValue = untracked(() => field?.value);
    const dataSource: RecordType[] = Array.isArray(rawValue)
        ? rawValue
        : Array.isArray(form?.values?.[name])
          ? form.values[name]
          : [];

    // 只在数组长度变化（增加/删除）时重渲染 body。autorun 会在每次数组值变化时
    // 重新触发，但长度不变时 `setLenTick` 会被跳过（React 的 Object.is）——
    // 因此单元格编辑绝不重渲染 body。在 `autorun` 内读取 `field.value.length`
    // 即订阅了该数组（这是对数组值的唯一订阅）。
    const [, setLenTick] = React.useState(0);
    React.useEffect(() => {
        if (!field) return;
        const dispose = autorun(() => {
            const len = Array.isArray(field.value) ? field.value.length : 0;
            untracked(() => setLenTick(len));
        });
        return () => dispose();
    }, [field]);

    // antd5 的 `render(value, record, index)` 传入的是分页相对索引（R3 spike）。
    // 从 ref 中读取最新的分页信息，使 render 闭包保持稳定
    // （不会因 pagination 对象标识的频繁变化而进入 columns 的 useMemo 依赖项）。
    const pag = typeof pagination === 'object' && pagination ? pagination : {};
    const current = pag.current;
    const pageSize = pag.pageSize;
    const currentRef = useLatestRef(current);
    const pageSizeRef = useLatestRef(pageSize);

    const columns = React.useMemo<BuiltColumns<RecordType>>(() => {
        // 交给列 `render` 的行变更操作。所有结构性变更都走
        // `form.setValuesIn(name, nextArray)`——一次不可变的整数组替换——
        // 而不走 Formily 的 `field.*` 变更方法。原因：下方的 `lenTick` autorun
        // 通过 `field.value` 订阅的是数组的*引用*；`setValuesIn` 会替换该引用
        // 并可靠地重新触发 autorun，因此增加/插入/删除会立即重渲染 body。
        // 而 `field.*` 变更方法是就地 splice 数组（引用不变），不会重新触发
        // autorun，于是 body 不会重渲染，新行也不会出现，直到下一次无关的重渲染
        // （即「先 insert 再 add → 多出 2 行」的 bug）。`add`/`insert` 默认使用
        // Table 的 `itemDefaultValue`。单元格*编辑*不走这里——它们使用
        // `cellField.onInput(v)`（单个叶子，不做数组替换），因此每个单元格的
        // 性能约定得以保留；只有结构性变更才重渲染 body，这正是应有的行为。
        // `itemDefaultValue` 对外是 `Partial<RecordType>`（新增行的默认值可只给
        // 部分字段），内部把它当作一整行来追加/插入，故在此做一次收窄。
        const itemDefault = props.itemDefaultValue as RecordType;
        const max = props.max;
        const min = props.min ?? 0;
        const validateBeforeAdd = props.validateBeforeAdd;

        // 在新增行落入数组之前进行拦截。
        //  - `true`（便捷用法）：对已有行运行 `form.validate(`${name}.*`)`；
        //    当任一被校验字段不合法时 `form.validate` 会 reject（抛错），
        //    因此捕获到的抛错会阻止新增。错误已显示在各单元格下方，所以我们静默退出。
        //  - 函数（逃生舱，签名与 `ArrayItems` 相同）：返回
        //    `false`/字符串则阻止，返回 `true`/`undefined` 则允许。
        const ensureValid = async (): Promise<boolean> => {
            if (!validateBeforeAdd) return true;
            if (validateBeforeAdd === true) {
                if (!form) return true;
                try {
                    await form.validate(`${name}.*`);
                    return true;
                } catch {
                    return false;
                }
            }
            const result = await validateBeforeAdd(getArr(), itemDefault);
            return result !== false && typeof result !== 'string';
        };
        const withinMax = (len: number) => max == null || len < max;
        const aboveMin = (len: number) => len > min;

        const getArr = (): RecordType[] => {
            const v = form?.values?.[name];
            return Array.isArray(v) ? (v as RecordType[]) : [];
        };
        const setArr = (next: RecordType[]) => {
            form?.setValuesIn?.(name, next);
        };
        const actions = () => ({
            add: async (value?: RecordType) => {
                const arr = getArr();
                if (!withinMax(arr.length)) return;
                if (!(await ensureValid())) return;
                setArr([...arr, value ?? itemDefault]);
            },
            insert: async (index: number, value?: RecordType) => {
                const arr = getArr();
                if (!withinMax(arr.length)) return;
                if (!(await ensureValid())) return;
                const at = Math.max(0, Math.min(index, arr.length));
                setArr([...arr.slice(0, at), value ?? itemDefault, ...arr.slice(at)]);
            },
            remove: (index: number) => {
                const arr = getArr();
                if (!aboveMin(arr.length)) return;
                setArr(arr.filter((_, k) => k !== index));
            },
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
                    // 自定义 `render` 会完全覆盖 CellBridge——
                    // 把单元格值、行记录、绝对索引以及行变更操作
                    // （add/insert/remove/…）传给它。用户正是借此构建操作列
                    // （删除/移动/…）：没有内置的删除列；在自己的 render 里
                    // 通过 `actions.remove(index)` 放一个删除按钮即可。
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
        // 刻意排除 dataSource/value/length：columns 必须在编辑时保持引用稳定。
        // 新鲜的值通过 ref 读取。
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        propColumns,
        name,
        current,
        pageSize,
        props.itemDefaultValue,
        props.max,
        props.min,
        props.validateBeforeAdd,
    ]);

    return { dataSource, columns };
}
