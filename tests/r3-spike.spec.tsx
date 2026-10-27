import {describe, it, expect} from 'vitest';
import {render} from '@testing-library/react';
import {Table} from 'antd';

describe('R3: antd5 Table render index', () => {
    it('records the page-2 render indices', () => {
        const indices: number[] = [];
        const records: number[] = [];
        const data = Array.from({length: 25}, (_, i) => ({id: i, name: `row${i}`}));
        render(
            <Table
                dataSource={data}
                rowKey="id"
                pagination={{pageSize: 10, current: 2}}
                columns={[
                    {
                        title: 'Name',
                        dataIndex: 'name',
                        render: (value: any, record: any, index: number) => {
                            indices.push(index);
                            records.push(record.id);
                            return `${index}:${value}`;
                        },
                    },
                ]}
            />,
        );
        // eslint-disable-next-line no-console
        console.log(`R3_RESULT indices=${JSON.stringify(indices)} records=${JSON.stringify(records)}`);
        // Page 2 records are rows 10..19. If render `index` matches records
        // (10..19) → ABSOLUTE (no offset needed). If index is [0..9] while
        // records are [10..19] → PAGE-RELATIVE (CellBridge must offset).
        const isAbsolute = indices[0] === records[0];
        // eslint-disable-next-line no-console
        console.log(`R3_VERDICT isAbsolute=${isAbsolute}`);
        expect(true).toBe(true);
    });
});
