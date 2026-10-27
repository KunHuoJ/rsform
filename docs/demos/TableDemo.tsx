import * as React from 'react';
import {Form} from 'rsform/table';

interface Row {
    name: string;
    qty: number;
    price: number;
}

const INITIAL_ROWS: Row[] = [
    {name: '组件 A', qty: 2, price: 9.5},
    {name: '组件 B', qty: 1, price: 19.0},
    {name: '组件 C', qty: 5, price: 4.25},
    {name: '组件 D', qty: 3, price: 7.75},
];

/**
 * 高性能可编辑表格演示：单元格不是 Formily Field，而是各自只订阅 form.values
 * 的叶子节点——编辑一格只重渲染该格，不波及其余 N×M-1 格；columns 引用在编辑
 * 过程中保持稳定。
 */
export function TableDemo(): React.ReactElement {
    return (
        <Form initialValues={{rows: INITIAL_ROWS}}>
            <Form.Table<Row>
                name="rows"
                pagination={false}
                removeButton
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
                    },
                ]}
            />
        </Form>
    );
}
