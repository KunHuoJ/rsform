import * as React from 'react';
import { useForm } from '@formily/react';
import { Button } from 'antd';
import dayjs from 'dayjs';
import { arrayUnion, Form, type RsfTableColumn } from 'rsform';

/**
 * Playground：采购订单创建——把 rsform 全部能力揉进一个真实业务表单。
 *
 * 覆盖：
 *  - 基础控件：Input / TextArea / InputNumber / Select / RadioGroup / Switch / DatePicker
 *  - 级联 Select（linkedFieldProps 异步派生 subcategory options）
 *  - 跨字段校验（validateField：交付日期必须晚于下单日期）
 *  - ArrayItems（联系人：min/max + validateBeforeAdd + 跨行唯一手机号 + 正则校验）
 *  - Table（物料明细：required + validator + 按行派生 total + date + switch + 操作列）
 *  - 按行联动（onEachRowMultiChange：qty/price 变 → 重算 total 入 form.values）
 *  - Form.Consumer 实时汇总（物料数、合计、联系人数）
 *  - validateFailed="scroll" + Submit 拿到 toJS 后的普通对象
 */

interface Contact {
    name: string;
    phone: string;
    role: string;
}

interface ItemRow {
    name: string;
    spec: string;
    qty: number;
    unit: string;
    price: number;
    total: number;
    deliveryDate: string;
    active: boolean;
}

const PRIORITY = [
    { label: '低', value: 'low' },
    { label: '中', value: 'mid' },
    { label: '高', value: 'high' },
    { label: '紧急', value: 'urgent' },
];

const CATEGORY = [
    { label: '原材料', value: 'raw' },
    { label: '半成品', value: 'semi' },
    { label: '成品', value: 'final' },
];

const SUBCATEGORY: Record<string, { label: string; value: string }[]> = {
    raw: [
        { label: '钢材', value: 'steel' },
        { label: '塑料', value: 'plastic' },
        { label: '电子元件', value: 'elec' },
    ],
    semi: [
        { label: 'PCB 板', value: 'pcb' },
        { label: '机箱', value: 'case' },
    ],
    final: [
        { label: '服务器', value: 'server' },
        { label: '工作站', value: 'workstation' },
        { label: '配件', value: 'parts' },
    ],
};

const UNIT = [
    { label: '个', value: 'ge' },
    { label: '箱', value: 'xiang' },
    { label: '千克', value: 'kg' },
    { label: '米', value: 'm' },
];

const CONTACT_ROLE = [
    { label: '采购人', value: 'buyer' },
    { label: '审批人', value: 'approver' },
    { label: '收货人', value: 'receiver' },
];

const DEFAULT_CONTACT: Contact = { name: '', phone: '', role: 'buyer' };
const DEFAULT_ITEM: ItemRow = {
    name: '',
    spec: '',
    qty: 1,
    unit: 'ge',
    price: 0,
    total: 0,
    deliveryDate: '',
    active: true,
};

const toDayjs = (v: unknown) => (v ? dayjs(v as string) : null);
const toIso = (d: any) => (d && d.isValid ? d.toISOString() : '');

/** 手机号校验：格式 + 跨行唯一（复用 arrayUnion）。 */
const phoneUnique = arrayUnion('phone', '手机号重复');
const phoneValidator = (
    value: any,
    rule: any,
    ctx: any,
): string | Promise<string | null | undefined> => {
    if (!value || !/^1\d{10}$/.test(String(value))) return '请输入有效手机号';
    return phoneUnique(value, rule, ctx) ?? '';
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginTop: 20 }}>
            <h3
                style={{
                    margin: '0 0 8px',
                    fontSize: 15,
                    borderLeft: '3px solid #722ed1',
                    paddingLeft: 8,
                }}
            >
                {title}
            </h3>
            {children}
        </section>
    );
}

/**
 * 小计列的只读展示控件。必须是 CellBridge 的 `control`（而非列的 `render`），
 * 这样它订阅 `items.i.total` 叶子：effect 一写入就重渲染这一格。
 * 列的 `render` 是表体渲染时的快照，表体编辑不重渲染 → 永远是旧值。
 */
function TotalCell({ value }: { value?: any }) {
    return <span>{(Number(value) || 0).toFixed(2)}</span>;
}

/** 物料明细列定义。total 由 onEachRowMultiChange 派生写入 form.values，列只读展示。 */
const itemColumns: RsfTableColumn<ItemRow>[] = [
    {
        title: '名称',
        dataIndex: 'name',
        control: 'input',
        width: 140,
        required: true,
        requiredMessage: '必填物料名',
    },
    { title: '规格', dataIndex: 'spec', control: 'input', width: 120 },
    {
        title: '数量',
        dataIndex: 'qty',
        control: 'inputNumber',
        width: 90,
        required: true,
        validator: (v: number) => (v > 0 ? '' : '必须大于 0'),
    },
    {
        title: '单位',
        dataIndex: 'unit',
        control: 'select',
        width: 90,
        controlProps: { options: UNIT },
    },
    {
        title: '单价',
        dataIndex: 'price',
        control: 'inputNumber',
        width: 100,
        required: true,
        validator: (v: number) => (v >= 0 ? '' : '不能为负'),
    },
    {
        title: '小计',
        dataIndex: 'total',
        width: 100,
        control: <TotalCell />,
    },
    { title: '交货日期', dataIndex: 'deliveryDate', control: 'date', width: 170 },
    { title: '启用', dataIndex: 'active', control: 'switch', width: 70 },
    {
        title: '操作',
        dataIndex: '__ops',
        width: 150,
        editable: false,
        render: (_v: any, _r: ItemRow, index: number, actions: any) => (
            <span style={{ display: 'inline-flex', gap: 4 }}>
                <Button
                    type="link"
                    size="small"
                    disabled={index === 0}
                    onClick={() => actions.moveUp(index)}
                >
                    上移
                </Button>
                <Button type="link" danger size="small" onClick={() => actions.remove(index)}>
                    删除
                </Button>
            </span>
        ),
    },
];

/** 添加物料行按钮：表格外用 useForm 追加，长度变化触发表体重渲染。 */
function AddItemButton() {
    const form: any = useForm();
    return (
        <Button
            type="link"
            onClick={() => {
                const arr = form?.values?.items ?? [];
                form.setValuesIn('items', [...arr, { ...DEFAULT_ITEM }]);
            }}
        >
            + 添加物料
        </Button>
    );
}

/** 实时汇总：订阅整个 form.values，派生物料数 / 合计 / 联系人数。 */
function LiveSummary() {
    return (
        <Form.Consumer>
            {(values: any) => {
                const items: ItemRow[] = values.items ?? [];
                const contacts: Contact[] = values.contacts ?? [];
                const total = items.reduce((s, r) => s + (Number(r.total) || 0), 0);
                return (
                    <div className="rsfd-table-summary" style={{ marginTop: 8 }}>
                        <span>
                            联系人 <strong>{contacts.length}</strong> 人
                        </span>
                        <span>
                            物料 <strong>{items.length}</strong> 项
                        </span>
                        <span>
                            合计金额：<strong>{total.toFixed(2)}</strong>
                        </span>
                    </div>
                );
            }}
        </Form.Consumer>
    );
}

export function PlaygroundDemo(): React.ReactElement {
    const formRef = React.useRef<any>(null);
    // 最近一次提交的值：提交后渲染到输出区，让页面可见验证结果（不只是 console.log）
    const [submitted, setSubmitted] = React.useState<any>(null);

    return (
        <Form
            formRef={formRef}
            initialValues={{
                orderName: '',
                orderDate: '',
                deliveryDate: '',
                priority: 'mid',
                category: '',
                subcategory: '',
                enabled: true,
                remark: '',
                contacts: [
                    { name: '张三', phone: '13800138000', role: 'buyer' },
                    { name: '', phone: '', role: 'approver' },
                ] as Contact[],
                items: [
                    {
                        name: '钢板',
                        spec: '5mm',
                        qty: 10,
                        unit: 'kg',
                        price: 12.5,
                        total: 125,
                        deliveryDate: '',
                        active: true,
                    },
                ] as ItemRow[],
            }}
            validateFailed="scroll"
            effects={($) => {
                // 1) 跨字段校验：交付日期必须晚于下单日期
                $.validateField(
                    'deliveryDate',
                    ['orderDate', 'deliveryDate'],
                    ({ orderDate, deliveryDate }) => {
                        if (!deliveryDate || !orderDate) return '';
                        return dayjs(deliveryDate).isAfter(dayjs(orderDate))
                            ? ''
                            : '交付日期必须晚于下单日期';
                    },
                );

                // 2) 级联：分类 → 子分类 options（异步派生，只管 options，不碰 value → 回显安全）
                $.linkedFieldProps('subcategory', ['category'], async ({ category }) => {
                    if (!category) return { options: [] };
                    await new Promise((r) => setTimeout(r, 200));
                    return { options: SUBCATEGORY[category] ?? [] };
                });
                //    用户切分类才清空子分类（clearOn 初始不触发，回显不会误清）
                $.clearOn('category', 'subcategory', '');

                // 3) 按行派生：物料 qty/price 任一变 → 重算 total 入 form.values
                $.onEachRowMultiChange('items', ['qty', 'price'], ({ values, setFieldState }) => {
                    setFieldState('total', {
                        value: (Number(values.qty) || 0) * (Number(values.price) || 0),
                    });
                });
            }}
            onSubmit={(values) => {
                console.log(values);
                setSubmitted(values);
            }}
        >
            <Section title="基本信息">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                    <Form.Field name="orderName" label="订单名称" required>
                        <Form.Input placeholder="请输入订单名称" />
                    </Form.Field>
                    <Form.Field name="priority" label="优先级" required>
                        <Form.RadioGroup options={PRIORITY} />
                    </Form.Field>
                    <Form.Field
                        name="orderDate"
                        label="下单日期"
                        required
                        format={toDayjs}
                        parse={toIso}
                    >
                        <Form.DatePicker style={{ width: '100%' }} />
                    </Form.Field>
                    <Form.Field
                        name="deliveryDate"
                        label="交付日期"
                        required
                        format={toDayjs}
                        parse={toIso}
                    >
                        <Form.DatePicker style={{ width: '100%' }} />
                    </Form.Field>
                    <Form.Field name="category" label="物料分类" required>
                        <Form.Select
                            style={{ width: '100%' }}
                            options={CATEGORY}
                            placeholder="请选择分类"
                        />
                    </Form.Field>
                    <Form.Field name="subcategory" label="子分类">
                        <Form.Select style={{ width: '100%' }} placeholder="请先选择分类" />
                    </Form.Field>
                    <Form.Field name="enabled" label="启用订单">
                        <Form.Switch />
                    </Form.Field>
                    <Form.Field name="remark" label="备注">
                        <Form.TextArea rows={2} placeholder="选填" />
                    </Form.Field>
                </div>
            </Section>

            <Section title="联系人（ArrayItems）">
                <Form.ArrayItems
                    name="contacts"
                    itemDefaultValue={DEFAULT_CONTACT}
                    min={1}
                    max={8}
                    validateBeforeAdd={(values: Contact[]) =>
                        values.length >= 8 ? '最多 8 位联系人' : true
                    }
                >
                    {() => (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Form.Field name="name" label="姓名" required>
                                <Form.Input placeholder="姓名" style={{ width: 100 }} />
                            </Form.Field>
                            <Form.Field
                                name="phone"
                                label="手机号"
                                required
                                validator={phoneValidator}
                            >
                                <Form.Input placeholder="11 位手机号" style={{ width: 160 }} />
                            </Form.Field>
                            <Form.Field name="role" label="角色">
                                <Form.Select
                                    options={CONTACT_ROLE}
                                    style={{ width: 110 }}
                                    placeholder="角色"
                                />
                            </Form.Field>
                        </div>
                    )}
                </Form.ArrayItems>
            </Section>

            <Section title="物料明细（Table）">
                <Form.Table<ItemRow>
                    name="items"
                    pagination={false}
                    itemDefaultValue={DEFAULT_ITEM}
                    columns={itemColumns}
                />
                <AddItemButton />
            </Section>

            <Section title="实时汇总">
                <LiveSummary />
            </Section>

            <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Form.Submit>提交订单</Form.Submit>
                <Form.Button
                    type="default"
                    onClick={() => {
                        formRef.current?.reset();
                        setSubmitted(null);
                    }}
                >
                    重置
                </Form.Button>
            </div>

            {submitted && (
                <div className="rsfd-output">
                    <div style={{ marginBottom: 6, color: 'var(--rsf-muted)', fontSize: 12 }}>
                        onSubmit 输出（普通对象，可直接 JSON.stringify / 送接口）：
                    </div>
                    {JSON.stringify(submitted, null, 2)}
                </div>
            )}
        </Form>
    );
}
