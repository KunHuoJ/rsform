import * as React from 'react';
import dayjs from 'dayjs';
import { Form } from 'rsform';

interface Row {
    name: string;
    code: string;
    desc: string;
    qty: number;
    price: number;
    weight: number;
    stock: number;
    status: string;
    category: string;
    warehouse: string;
    supplier: string;
    owner: string;
    batch: string;
    inDate: string | null;
    expireDate: string | null;
    active: boolean;
    priority: string;
    unit: string;
    remark: string;
    barcode: string;
}

const ROWS = 50;

const STATUS_OPTS = [
    { label: '在库', value: 'in_stock' },
    { label: '在途', value: 'transit' },
    { label: '缺货', value: 'shortage' },
    { label: '冻结', value: 'frozen' },
];
const CATEGORY_OPTS = [
    { label: '电子', value: 'elec' },
    { label: '五金', value: 'metal' },
    { label: '耗材', value: 'consumable' },
    { label: '包材', value: 'package' },
];
const WAREHOUSE_OPTS = [
    { label: '北京仓', value: 'bj' },
    { label: '上海仓', value: 'sh' },
    { label: '广州仓', value: 'gz' },
    { label: '成都仓', value: 'cd' },
];
const PRIORITY_OPTS = [
    { label: '高', value: 'high' },
    { label: '中', value: 'mid' },
    { label: '低', value: 'low' },
];
const UNIT_OPTS = [
    { label: '个', value: 'pc' },
    { label: '箱', value: 'box' },
    { label: '千克', value: 'kg' },
    { label: '米', value: 'm' },
];

const DEFAULT_ROW: Row = {
    name: '',
    code: '',
    desc: '',
    qty: 1,
    price: 0,
    weight: 0,
    stock: 0,
    status: 'in_stock',
    category: 'elec',
    warehouse: 'bj',
    supplier: '',
    owner: '',
    batch: '',
    inDate: null,
    expireDate: null,
    active: true,
    priority: 'mid',
    unit: 'pc',
    remark: '',
    barcode: '',
};

function makeInitial(): Row[] {
    return Array.from({ length: ROWS }, (_, r) => ({
        ...DEFAULT_ROW,
        name: `物料-${String(r + 1).padStart(3, '0')}`,
        code: `SKU-${1000 + r}`,
        desc: `这是物料 ${r + 1} 的描述`,
        qty: (r % 9) + 1,
        price: Number((10 + r * 0.7).toFixed(2)),
        weight: Number((0.5 + r * 0.3).toFixed(2)),
        stock: (r * 7) % 100,
        status: STATUS_OPTS[r % STATUS_OPTS.length].value,
        category: CATEGORY_OPTS[r % CATEGORY_OPTS.length].value,
        warehouse: WAREHOUSE_OPTS[r % WAREHOUSE_OPTS.length].value,
        supplier: `供应商${(r % 5) + 1}`,
        owner: `负责人${(r % 4) + 1}`,
        batch: `B${2024}-${String(r + 1).padStart(4, '0')}`,
        inDate: dayjs().subtract(r, 'day').toISOString(),
        expireDate: dayjs().add(r, 'day').toISOString(),
        active: r % 2 === 0,
        priority: PRIORITY_OPTS[r % PRIORITY_OPTS.length].value,
        unit: UNIT_OPTS[r % UNIT_OPTS.length].value,
        remark: r % 3 === 0 ? '加急' : '',
        barcode: `69${String(1000000000 + r).padStart(12, '0')}`.slice(0, 13),
    }));
}

const COLUMNS = [
    { title: '名称', dataIndex: 'name', control: 'input' as const, width: 120 ,controlProps: {required: true, allowClear: true} },
    { title: '编码', dataIndex: 'code', control: 'input' as const, width: 100 },
    { title: '描述', dataIndex: 'desc', control: 'input' as const, width: 160 },
    { title: '数量', dataIndex: 'qty', control: 'inputNumber' as const, width: 80 },
    { title: '单价', dataIndex: 'price', control: 'inputNumber' as const, width: 90 },
    { title: '重量', dataIndex: 'weight', control: 'inputNumber' as const, width: 80 },
    { title: '库存', dataIndex: 'stock', control: 'inputNumber' as const, width: 80 },
    {
        title: '状态',
        dataIndex: 'status',
        control: 'select' as const,
        width: 100,
        controlProps: { options: STATUS_OPTS },
    },
    {
        title: '分类',
        dataIndex: 'category',
        control: 'select' as const,
        width: 100,
        controlProps: { options: CATEGORY_OPTS },
    },
    {
        title: '仓库',
        dataIndex: 'warehouse',
        control: 'select' as const,
        width: 100,
        controlProps: { options: WAREHOUSE_OPTS },
    },
    { title: '供应商', dataIndex: 'supplier', control: 'input' as const, width: 100 },
    { title: '负责人', dataIndex: 'owner', control: 'input' as const, width: 90 },
    { title: '批次', dataIndex: 'batch', control: 'input' as const, width: 110 },
    { title: '入库日期', dataIndex: 'inDate', control: 'date' as const, width: 180 },
    { title: '到期日期', dataIndex: 'expireDate', control: 'date' as const, width: 180 },
    { title: '启用', dataIndex: 'active', control: 'switch' as const, width: 70 },
    {
        title: '优先级',
        dataIndex: 'priority',
        control: 'select' as const,
        width: 90,
        controlProps: { options: PRIORITY_OPTS },
    },
    {
        title: '单位',
        dataIndex: 'unit',
        control: 'select' as const,
        width: 90,
        controlProps: { options: UNIT_OPTS },
    },
    { title: '备注', dataIndex: 'remark', control: 'input' as const, width: 90 },
    { title: '条码', dataIndex: 'barcode', control: 'input' as const, width: 140 },
];

/**
 * 50 行 × 20 列混合控件性能演示：input / inputNumber / select / date / switch。
 *
 * 编辑任意一格——只该格重渲染，表体不遍历整棵 1000 格的单元格树，FPS 不掉。
 * 对比「每格 Formily Field」实现，编辑一格的渲染量从 O(N×M)=O(1000) 降到 O(1)。
 */
export function TablePerfDemo(): React.ReactElement {
    return (
        <Form
            initialValues={{ rows: makeInitial() }}
            onSubmit={(values) => {
                console.log(values)
            }}
        >
            <Form.Table<Row>
                name="rows"
                pagination={false}
                itemDefaultValue={DEFAULT_ROW}
                columns={COLUMNS}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Form.Submit>提交</Form.Submit>
                <span style={{ color: '#888', fontSize: 12 }}>
                    {ROWS} 行 × {COLUMNS.length} 列 = {ROWS * COLUMNS.length} 个可编辑单元格
                </span>
            </div>
        </Form>
    );
}
