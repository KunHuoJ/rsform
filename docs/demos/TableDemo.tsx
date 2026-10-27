import * as React from 'react';
import {useForm} from '@formily/react';
import {Button} from 'antd';
import {Form} from 'rsform/table';

interface Row {
    name: string;
    qty: number;
    price: number;
    status: string;
}

const STATUS = [
    {label: '待入库', value: 'pending'},
    {label: '已入库', value: 'done'},
    {label: '已退回', value: 'rejected'},
];

const DEFAULT_ROW: Row = {name: '', qty: 1, price: 0, status: 'pending'};

const INITIAL_ROWS: Row[] = [
    {name: '组件 A', qty: 2, price: 9.5, status: 'done'},
    {name: '组件 B', qty: 1, price: 19.0, status: 'pending'},
    {name: '组件 C', qty: 5, price: 4.25, status: 'done'},
    {name: '组件 D', qty: 3, price: 7.75, status: 'rejected'},
];

/**
 * 添加行按钮：用 useForm 拿到 form，往数组追加一行默认值。
 * setValuesIn 替换整个数组 → 长度变化 → 表体的 lenTick 重渲染（只重渲表体，
 * 不波及已编辑的单元格值，单元格各自订阅自己的叶子）。
 * 用 antd `Button type="link"` 与删除按钮统一 link 样式（不依赖 rsform/styles）。
 */
function AddRowButton({arrayName, defaultRow}: {arrayName: string; defaultRow: Row}) {
    const form: any = useForm();
    return (
        <Button
            type="link"
            onClick={() => {
                const arr = form?.values?.[arrayName] ?? [];
                form.setValuesIn(arrayName, [...arr, {...defaultRow}]);
            }}
        >
            + 添加一行
        </Button>
    );
}

/**
 * 合计：用 Form.Consumer 订阅整个 rows，实时算出行数与合计金额。
 * 演示 Form.Consumer 在表格场景的应用——只读展示派生值，无需手写订阅。
 */
function Summary() {
    return (
        <Form.Consumer>
            {(values: {rows?: Row[]}) => {
                const rows = values.rows ?? [];
                const total = rows.reduce(
                    (sum, r) => sum + (Number(r.qty) || 0) * (Number(r.price) || 0),
                    0,
                );
                return (
                    <div className="rsfd-table-summary">
                        <span>共 <strong>{rows.length}</strong> 行</span>
                        <span>合计金额：<strong>{total.toFixed(2)}</strong></span>
                    </div>
                );
            }}
        </Form.Consumer>
    );
}

/**
 * 高性能可编辑表格演示：单元格不是 Formily Field，而是各自只订阅 form.values
 * 的叶子节点——编辑一格只重渲染该格，不波及其余 N×M-1 格；columns 引用在编辑
 * 过程中保持稳定。底部合计用 Form.Consumer 订阅 rows 实时派生。
 */
export function TableDemo(): React.ReactElement {
    return (
        <Form initialValues={{rows: INITIAL_ROWS}}>
            <Form.Table<Row>
                name="rows"
                pagination={false}
                removeButton
                removeButtonProps={{title: '操作', width: 80}}
                itemDefaultValue={DEFAULT_ROW}
                columns={[
                    {
                        title: '名称',
                        dataIndex: 'name',
                        control: 'input',
                        width: 160,
                    },
                    {
                        title: '数量',
                        dataIndex: 'qty',
                        control: 'inputNumber',
                        width: 100,
                        validator: (v: number) => (v > 0 ? '' : '必须大于 0'),
                    },
                    {
                        title: '单价',
                        dataIndex: 'price',
                        control: 'inputNumber',
                        width: 100,
                        validator: (v: number) => (v >= 0 ? '' : '不能为负'),
                    },
                    {
                        title: '状态',
                        dataIndex: 'status',
                        control: 'select',
                        width: 120,
                        controlProps: {options: STATUS},
                    },
                    {
                        title: '小计',
                        dataIndex: 'subtotal',
                        width: 100,
                        editable: false,
                        render: (_v: any, record: Row) => {
                            const sub =
                                (Number(record.qty) || 0) * (Number(record.price) || 0);
                            return <span>{sub.toFixed(2)}</span>;
                        },
                    },
                ]}
            />
            <AddRowButton arrayName="rows" defaultRow={DEFAULT_ROW} />
            <Summary />
        </Form>
    );
}
