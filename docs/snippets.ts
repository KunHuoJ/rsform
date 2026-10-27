/**
 * 演示用的源码字符串。放在 .ts（而非 .mdx）里，避免 MDX 把模板字符串中的
 * `<Form>` 当 JSX 解析。MDX 文件 import 后传给 <Demo code={...} />。
 */

export const BASIC_CODE = `import { Form } from 'rsform/antd';

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

export const EFFECTS_CODE = `import { Form } from 'rsform/antd';

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

export const ARRAY_ITEMS_CODE = `import { Form } from 'rsform/array-items';

<Form initialValues={{ tags: [{ label: 'react' }, { label: 'formily' }] }}>
  <Form.ArrayItems name="tags" itemDefaultValue={{ label: '' }}>
    {() => (
      <Form.Field name=".label" title="标签">
        <Form.Input placeholder="输入标签" />
      </Form.Field>
    )}
  </Form.ArrayItems>
</Form>`;

export const ARRAY_ITEMS_DRAG_CODE = `<Form.ArrayItems name="steps" dragable>
  {() => <Form.Field name=".name"><Form.Input /></Form.Field>}
</Form.ArrayItems>`;

export const CASCADE_CODE = `import { Form } from 'rsform/antd';

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

export const CONSUMER_CODE = `import { Form } from 'rsform/antd';

<Form initialValues={{ name: 'rsform', age: 1, status: 'draft' }}>
  <Form.Field name="name" title="名称"><Form.Input /></Form.Field>
  <Form.Field name="age" title="数量"><Form.InputNumber min={0} /></Form.Field>
  <Form.Field name="status" title="状态"><Form.Select options={STATUS} /></Form.Field>

  {/* 订阅整个表单值——任一字段变化都会更新这里 */}
  <Form.Consumer>{values => <pre>{JSON.stringify(values)}</pre>}</Form.Consumer>

  {/* 只订阅 name——只有 name 变化才更新，改 age/status 不会重渲染这里 */}
  <Form.Consumer name="name">{name => <span>{name}</span>}</Form.Consumer>
</Form>`;

export const TABLE_CODE = `import { Form } from 'rsform/table';

interface Row { name: string; qty: number; price: number; status: string }

const STATUS = [
  { label: '待入库', value: 'pending' },
  { label: '已入库', value: 'done' },
];

const INITIAL_ROWS: Row[] = [
  { name: '组件 A', qty: 2, price: 9.5, status: 'done' },
  { name: '组件 B', qty: 1, price: 19.0, status: 'pending' },
];

<Form initialValues={{ rows: INITIAL_ROWS }}>
  <Form.Table<Row>
    name="rows"
    pagination={false}
    removeButton
    removeButtonProps={{ title: '操作', width: 80 }}
    itemDefaultValue={{ name: '', qty: 1, price: 0, status: 'pending' }}
    columns={[
      { title: '名称', dataIndex: 'name', control: 'input', width: 160 },
      { title: '数量', dataIndex: 'qty', control: 'inputNumber', width: 100,
        validator: v => (v > 0 ? '' : '必须大于 0') },
      { title: '单价', dataIndex: 'price', control: 'inputNumber', width: 100,
        validator: v => (v >= 0 ? '' : '不能为负') },
      { title: '状态', dataIndex: 'status', control: 'select', width: 120,
        controlProps: { options: STATUS } },
      { title: '小计', dataIndex: 'subtotal', width: 100, editable: false,
        render: (_v, r) => <span>{(Number(r.qty) * Number(r.price)).toFixed(2)}</span> },
    ]}
  />
</Form>`;

export const TABLE_SUMMARY_CODE = `import { useForm } from '@formily/react';
import { Button } from 'antd';
import { Form } from 'rsform/table';

// 添加行：antd link 按钮（与删除按钮统一 link 样式，不依赖 rsform/styles）
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

export const TABLE_CUSTOM_REMOVE_CODE = `import { Button } from 'antd';
import { Form } from 'rsform/table';

<Form.Table<Row>
  name="rows"
  removeButton
  removeButtonProps={{
    title: '操作',
    width: 100,
    // 自定义删除按钮：render(index, record, onRemove)
    // 用 antd Button type="link" 自定义，也可换任意元素
    render: (index, record, onRemove) => (
      <Button type="link" danger size="small" onClick={onRemove}>
        删除
      </Button>
    ),
  }}
  columns={[/* ... */]}
/>`;

