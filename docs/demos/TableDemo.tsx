import * as React from 'react';
import {Form} from 'rsform/table';

interface Row {
    name: string;
    qty: number;
    price: number;
}

const INITIAL_ROWS: Row[] = [
    {name: 'Widget', qty: 2, price: 9.5},
    {name: 'Gadget', qty: 1, price: 19.0},
    {name: 'Gizmo', qty: 5, price: 4.25},
    {name: 'Doohickey', qty: 3, price: 7.75},
];

export function TableDemo(): React.ReactElement {
    return (
        <div className="rsfd-demo">
            <div className="rsfd-demo-label">Live demo — edit a cell</div>
            <Form initialValues={{rows: INITIAL_ROWS}}>
                <Form.Table<Row>
                    name="rows"
                    pagination={false}
                    removeButton
                    columns={[
                        {
                            title: 'Name',
                            dataIndex: 'name',
                            control: 'input',
                            width: 160,
                        },
                        {
                            title: 'Qty',
                            dataIndex: 'qty',
                            control: 'inputNumber',
                            width: 100,
                            validator: (v: number) => (v > 0 ? '' : 'must be > 0'),
                        },
                        {
                            title: 'Price',
                            dataIndex: 'price',
                            control: 'inputNumber',
                            width: 100,
                        },
                    ]}
                />
            </Form>
        </div>
    );
}
