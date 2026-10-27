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

export const TABLE_CODE = `import { Form } from 'rsform/table';

interface Row { name: string; qty: number; price: number }

<Form initialValues={{ rows }}>
  <Form.Table<Row>
    name="rows"
    pagination={false}
    removeButton
    columns={[
      { title: '名称', dataIndex: 'name', control: 'input' },
      { title: '数量', dataIndex: 'qty', control: 'inputNumber',
        validator: v => (v > 0 ? '' : '必须大于 0') },
      { title: '单价', dataIndex: 'price', control: 'inputNumber' },
    ]}
  />
</Form>`;
