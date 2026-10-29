/**
 * 演示用的源码字符串。放在 .ts（而非 .mdx）里，避免 MDX 把模板字符串中的
 * `<Form>` 当 JSX 解析。MDX 文件 import 后传给 <Demo code={...} />。
 */

export const BASIC_CODE = `import { Form } from 'rsform';

<Form
  initialValues={{ username: '', age: 18 }}
  onSubmit={async values => {
    console.log(values); // { username, age }
  }}
>
  <Form.Field name="username" title="用户名" required>
    <Form.Input placeholder="请输入用户名" />
  </Form.Field>
  <Form.Field name="age" title="年龄" required>
    <Form.InputNumber min={0} />
  </Form.Field>
  <Form.Submit>提交</Form.Submit>
</Form>`;

export const EFFECTS_CODE = `import { Form } from 'rsform';

<Form
  effects={$ =>
    $.validateField('confirm', ['password', 'confirm'], ({ password, confirm }) =>
      password === confirm ? '' : '两次密码不一致',
    )
  }
>
  <Form.Field name="password" title="密码" required>
    <Form.Input.Password />
  </Form.Field>
  <Form.Field name="confirm" title="确认密码" required>
    <Form.Input.Password />
  </Form.Field>
</Form>`;

export const ARRAY_ITEMS_CODE = `import { arrayUnion, Form } from 'rsform';

const ROLES = [{ label: '管理员', value: 'admin' }, { label: '开发', value: 'dev' }];

<Form initialValues={{ members: [] }} onSubmit={async v => console.log(v)}>
  <Form.ArrayItems name="members" itemDefaultValue={{ name: '', email: '', role: 'dev' }} min={1}>
    {() => (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Form.Field name="name" title="姓名" required>
          <Form.Input placeholder="姓名" />
        </Form.Field>
        <Form.Field name="email" title="邮箱" required
                    validator={arrayUnion('email', '该邮箱已存在')}>
          <Form.Input placeholder="邮箱" />
        </Form.Field>
        <Form.Field name="role" title="角色">
          <Form.Select options={ROLES} />
        </Form.Field>
      </div>
    )}
  </Form.ArrayItems>
  <Form.Submit>提交</Form.Submit>
</Form>`;

export const CASCADE_CODE = `import { Form } from 'rsform';

const PROVINCES = [{ label: '广东', value: 'gd' }, /* ... */];
const CITIES = { gd: [{ label: '广州', value: 'gz' }, /* ... */] };

<Form
  initialValues={{ province: '', city: '' }}
  effects={$ =>
    $.linkedFieldProps('city', ['province'], async ({ province }) => {
      if (!province) return { options: [] };
      await new Promise(r => setTimeout(r, 300)); // 模拟请求
      return { options: CITIES[province] ?? [] };
    })
  }
>
  <Form.Field name="province" title="省份" required>
    <Form.Select options={PROVINCES} />
  </Form.Field>
  <Form.Field name="city" title="城市" required>
    <Form.Select />
  </Form.Field>
</Form>`;

export const CONSUMER_CODE = `import { Form } from 'rsform';

<Form initialValues={{ name: 'rsform', age: 1, status: 'draft' }}>
  <Form.Field name="name" title="名称"><Form.Input /></Form.Field>
  <Form.Field name="age" title="数量"><Form.InputNumber min={0} /></Form.Field>
  <Form.Field name="status" title="状态"><Form.Select options={STATUS} /></Form.Field>

  {/* 订阅整个表单值——任一字段变化都会更新这里 */}
  <Form.Consumer>{values => <pre>{JSON.stringify(values)}</pre>}</Form.Consumer>

  {/* 只订阅 name——只有 name 变化才更新，改 age/status 不会重渲染这里 */}
  <Form.Consumer name="name">{name => <span>{name}</span>}</Form.Consumer>
</Form>`;

export const TABLE_PERF_CODE = `import * as React from 'react';
import { Form, type RsfTableColumn } from 'rsform';

interface Row {
  name: string; qty: number; price: number; status: string;
  // ...共 20 个字段
}

const ROWS = 50;
const DEFAULT_ROW: Row = { name: '', qty: 0, price: 0, status: 'pending', /* ... */ };

function makeInitial(): Row[] {
  return Array.from({ length: ROWS }, (_, i) => ({
    name: \`行\${i + 1}\`, qty: i + 1, price: (i + 1) * 1.5,
    status: 'pending', /* ...其余字段 */
  }));
}

const columns: RsfTableColumn<Row>[] = [
  { title: '名称', dataIndex: 'name', control: 'input', width: 120, required: true },
  { title: '数量', dataIndex: 'qty', control: 'inputNumber', width: 80 },
  { title: '单价', dataIndex: 'price', control: 'inputNumber', width: 90 },
  { title: '状态', dataIndex: 'status', control: 'select', width: 100,
    controlProps: { options: STATUS_OPTS } },
  { title: '入库日期', dataIndex: 'inDate', control: 'date', width: 180 },
  { title: '启用', dataIndex: 'active', control: 'switch', width: 70 },
  // ...共 20 列
];

export function TablePerfDemo() {
  const [result, setResult] = React.useState('');
  return (
    <Form initialValues={{ rows: makeInitial() }} validateFailed="scroll"
          onSubmit={(values) => setResult(JSON.stringify(values, null, 2))}>
      <Form.Table<Row> name="rows" pagination={false}
        itemDefaultValue={DEFAULT_ROW} columns={columns} />
      <Form.Submit>提交</Form.Submit>
      {result && <pre>{result}</pre>}
    </Form>
  );
}`;

export const TABLE_CODE = `import { Button } from 'antd';
import { Form } from 'rsform';

interface Row { name: string; qty: number; price: number; status: string }

const STATUS = [
  { label: '待入库', value: 'pending' },
  { label: '已入库', value: 'done' },
];

const INITIAL_ROWS: Row[] = [
  { name: '组件 A', qty: 2, price: 9.5, status: 'done' },
  { name: '组件 B', qty: 1, price: 19.0, status: 'pending' },
];

<Form initialValues={{ rows: INITIAL_ROWS }}
  onSubmit={values => {
    // values 已是普通对象（库内用 toJS 转过），可直接 JSON.stringify
    console.log(values);
  }}
>
  <Form.Table<Row>
    name="rows"
    pagination={false}
    itemDefaultValue={{ name: '', qty: 1, price: 0, status: 'pending' }}
    columns={[
      { title: '名称', dataIndex: 'name', control: 'input', width: 160, required: true, requiredMessage: '必填名称' },
      { title: '数量', dataIndex: 'qty', control: 'inputNumber', width: 100,
        required: true, validator: v => (v > 0 ? '' : '必须大于 0') },
      { title: '单价', dataIndex: 'price', control: 'inputNumber', width: 100,
        validator: v => (v >= 0 ? '' : '不能为负') },
      { title: '状态', dataIndex: 'status', control: 'select', width: 120,
        controlProps: { options: STATUS } },
      { title: '小计', dataIndex: 'subtotal', width: 100, editable: false,
        render: (_v, r) => <span>{(Number(r.qty) * Number(r.price)).toFixed(2)}</span> },
      // 操作列：用 render 的 actions 自定义——上移/下方插入/删除
      { title: '操作', dataIndex: '__ops', width: 160, editable: false,
        render: (_v, _r, index, actions) => (
          <span>
            <Button type="link" size="small" disabled={index === 0}
              onClick={() => actions.moveUp(index)}>上移</Button>
            <Button type="link" size="small"
              onClick={() => actions.insert(index + 1)}>下方插入</Button>
            <Button type="link" danger size="small"
              onClick={() => actions.remove(index)}>删除</Button>
          </span>
        ) },
    ]}
  />
  <Form.Submit>提交</Form.Submit>
</Form>`;

export const TABLE_SUMMARY_CODE = `import { useForm } from '@formily/react';
import { Button } from 'antd';
import { Form } from 'rsform';

// 添加行：antd link 按钮（link 样式，不依赖 rsform/styles）
function AddRowButton({ arrayName, defaultRow }) {
  const form = useForm();
  return (
    <Button
      type="link"
      onClick={() => {
        const arr = form.values[arrayName] ?? [];
        form.setValuesIn(arrayName, [...arr, { ...defaultRow }]);
      }}
    >
      + 添加一行
    </Button>
  );
}

// 合计：Form.Consumer 订阅整个 rows，实时派生行数与合计金额
function Summary() {
  return (
    <Form.Consumer>
      {values => {
        const rows = values.rows ?? [];
        const total = rows.reduce((s, r) => s + Number(r.qty) * Number(r.price), 0);
        return <span>共 {rows.length} 行，合计 {total.toFixed(2)}</span>;
      }}
    </Form.Consumer>
  );
}`;

export const TABLE_COLUMN_ACTIONS_CODE = `import { Button } from 'antd';
import { Form } from 'rsform';

<Form.Table<Row>
  name="rows"
  itemDefaultValue={{ name: '', qty: 1, price: 0, status: 'pending' }}
  columns={[
    { title: '名称', dataIndex: 'name', control: 'input' },
    { title: '数量', dataIndex: 'qty', control: 'inputNumber' },
    // 自定义操作列：render 的第 4 个参数 actions 提供增删移
    {
      title: '操作',
      dataIndex: '__ops',
      editable: false,
      render: (_v, record, index, actions) => (
        <span>
          <Button type="link" size="small" disabled={index === 0}
            onClick={() => actions.moveUp(index)}>上移</Button>
          <Button type="link" size="small"
            onClick={() => actions.insert(index + 1)}>下方插入</Button>
          <Button type="link" danger size="small"
            onClick={() => actions.remove(index)}>删除</Button>
        </span>
      ),
    },
  ]}
/>`;

export const PLAYGROUND_CODE = `import * as React from 'react';
import dayjs from 'dayjs';
import { arrayUnion, Form } from 'rsform';

// 小计列：必须是 CellBridge 的 control（订阅 items.i.total 叶子），
// 不能用列的 render——render 是表体快照，编辑时不重渲染，小计不会更新。
function TotalCell({ value }: { value?: any }) {
  return <span>{(Number(value) || 0).toFixed(2)}</span>;
}

const phoneUnique = arrayUnion('phone', '手机号重复');
const phoneValidator = (v: any, rule: any, ctx: any) =>
  !v || !/^1\\d{10}$/.test(String(v)) ? '请输入有效手机号' : phoneUnique(v, rule, ctx) ?? '';

<Form
  initialValues={{ orderName: '', orderDate: '', priority: 'mid', contacts: [], items: [] }}
  validateFailed="scroll"
  effects={$ => {
    // 跨字段校验：交付日期必须晚于下单日期
    $.validateField('deliveryDate', ['orderDate', 'deliveryDate'], ({ orderDate, deliveryDate }) =>
      !deliveryDate || !orderDate ? '' : dayjs(deliveryDate).isAfter(dayjs(orderDate)) ? '' : '交付日期必须晚于下单日期',
    );
    // 级联：分类 → 子分类 options（异步派生，只管 options → 回显安全）
    $.linkedFieldProps('subcategory', ['category'], async ({ category }) => {
      if (!category) return { options: [] };
      await new Promise(r => setTimeout(r, 200));
      return { options: SUBCATEGORY[category] ?? [] };
    });
    // 用户切分类才清空子分类（clearOn 初始不触发，回显不会误清）
    $.clearOn('category', 'subcategory', '');
    // 按行派生：qty/price 任一变 → 重算 total 入 form.values
    $.onEachRowMultiChange('items', ['qty', 'price'], ({ values, setFieldState }) =>
      setFieldState('total', { value: (Number(values.qty) || 0) * (Number(values.price) || 0) }),
    );
  }}
  onSubmit={values => console.log(values)}
>
  <Form.Field name="orderName" title="订单名称" required>
    <Form.Input />
  </Form.Field>
  <Form.Field name="orderDate" title="下单日期" required format={toDayjs} parse={toIso}>
    <Form.DatePicker />
  </Form.Field>

  {/* ArrayItems：联系人，跨行唯一手机号 + 正则校验 */}
  <Form.ArrayItems name="contacts" itemDefaultValue={{ name: '', phone: '' }} min={1} max={8}>
    {() => (
      <>
        <Form.Field name="name" title="姓名" required><Form.Input /></Form.Field>
        <Form.Field name="phone" title="手机号" required validator={phoneValidator}>
          <Form.Input />
        </Form.Field>
      </>
    )}
  </Form.ArrayItems>

  {/* Table：物料明细，小计由 effect 派生，列只读展示 */}
  <Form.Table
    name="items"
    columns={[
      { title: '名称', dataIndex: 'name', control: 'input', required: true },
      { title: '数量', dataIndex: 'qty', control: 'inputNumber', required: true },
      { title: '单价', dataIndex: 'price', control: 'inputNumber', required: true },
      { title: '小计', dataIndex: 'total', control: <TotalCell /> },
    ]}
  />

  {/* Consumer 实时汇总 */}
  <Form.Consumer>
    {values => <span>合计：{(values.items ?? []).reduce((s, r) => s + (Number(r.total) || 0), 0).toFixed(2)}</span>}
  </Form.Consumer>

  <Form.Submit>提交订单</Form.Submit>
</Form>`;
