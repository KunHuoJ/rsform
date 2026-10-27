# rsform

> 基于 Formily v2 + antd 5 的高性能 React 表单库——effect 驱动、自动注入 Field，可编辑表格编辑一格只重渲染一格。

[![CI](https://github.com/KunHuoJ/rsform/actions/workflows/ci.yml/badge.svg)](https://github.com/KunHuoJ/rsform/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/rsform.svg)](https://www.npmjs.com/package/rsform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

📖 **文档站**：https://kunhuoj.github.io/rsform/

## 为什么用 rsform

Formily 的响应式引擎很强，但直接用 `@formily/react` 样板太多：每个字段要手写 `value`/`onChange`、联动要手动订阅、可编辑表格每个格子做成完整 Field 导致 N×M 订阅卡顿。rsform 薄壳封装：

1. **自动注入 Field**：把控件丢进 `Form.Field`，`value`/`onChange` 自动流转，无需手写受控样板。
2. **Effect 驱动联动**：`effects={$ => ...}` 注入 `$` helper 集，声明式写跨字段校验、级联派生，无需 `useEffect`/`useState`。
3. **高性能可编辑表格**：单元格不是 Formily Field，每个单元格只订阅 `form.values` 的叶子节点——编辑一格只重渲染该格，N×M 表格不卡。

## 特性

- 🚀 **高性能可编辑表格**——编辑一格只重渲染一格，`columns` 引用稳定，不重建表格
- ⚡ **Effect 驱动**——`$` helper 集声明字段联动：跨字段校验、异步派生 props、按行联动
- ⊕ **自动注入 Field**——控件丢进 `Form.Field` 即受控，支持相对路径
- ↕ **可增删 ArrayItems**——Formily ArrayField mutators + dnd-kit 拖拽（可选，默认关）
- 🎨 **CSS 变量主题**——`--rsf-*` 变量，antd 风格默认值，覆盖即定制
- 🌗 **深色模式**——内置，按 `data-theme` 或系统偏好
- 📦 **单包多入口**——`rsform` 核心无 antd 依赖，控件/表格/数组按需引入
- 🧪 **完整测试**——Vitest，52+ 测试覆盖核心契约

## 快速上手

### 安装

```sh
pnpm add rsform @formily/core @formily/react antd react react-dom
```

### 最小示例

```jsx
import 'rsform/styles';              // 可选：引入默认 antd 风格主题
import { Form } from 'rsform/antd';

<Form
  initialValues={{ name: '', age: 18 }}
  onSubmit={async values => console.log(values)}
>
  <Form.Field name="name" title="姓名" required>
    <Form.Input placeholder="请输入姓名" />
  </Form.Field>
  <Form.Field name="age" title="年龄" required>
    <Form.InputNumber min={0} />
  </Form.Field>
  <Form.Submit>提交</Form.Submit>
</Form>
```

### Effect 联动

跨字段校验、级联派生，声明式写在 `effects` 里：

```jsx
<Form
  effects={$ =>
    // 密码一致性校验：依赖字段任一变化即重跑
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
</Form>
```

级联 Select（异步派生 options）：

```jsx
<Form
  effects={$ =>
    $.linkedFieldProps('city', ['province'], async ({ province }) => {
      await fetchCities(province); // 异步请求
      return { options: CITIES[province] ?? [] };
    })
  }
>
  <Form.Field name="province" title="省份"><Form.Select options={PROVINCES} /></Form.Field>
  <Form.Field name="city" title="城市"><Form.Select /></Form.Field>
</Form>
```

### 可编辑表格

```jsx
import { Form } from 'rsform/table';

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
</Form>
```

编辑一格只重渲染该格——读走 `form.values` 叶子订阅，写走 `field.onInput`（触发校验 + effect，不替换行对象）。详见[文档·高性能表格](https://kunhuoj.github.io/rsform/#table)。

## 子路径导出

单包 `rsform`，按需从子路径引入：

| 子路径 | 内容 |
|---|---|
| `rsform` | 核心：Form / Field / FormError / Formily（无 antd 依赖） |
| `rsform/antd` | antd 控件 + Submit（Form.Input / Form.Select / …） |
| `rsform/table` | 高性能可编辑表格 Form.Table |
| `rsform/array-items` | 可增删/拖拽列表 Form.ArrayItems |
| `rsform/effects` | effects `$` helper 集合 |
| `rsform/styles` | base 样式表（CSS 变量主题） |

`@formily/*`、`antd`、`react` 全部为 peer 依赖——消费者复用同一份 formily 实例，避免响应式失效。

## 主题定制

所有视觉 token 是 `--rsf-*` CSS 变量，覆盖即定制：

```css
:root {
  --rsf-color-primary: #722ed1;   /* 主色 */
  --rsf-color-error: #f5222d;     /* 错误色 */
  --rsf-field-margin: 16px;       /* 字段间距 */
}
```

也可不引入默认样式，按 `rsf-field` / `rsf-array-item` 等类名自写。完整变量清单见[文档·主题变量](https://kunhuoj.github.io/rsform/#tokens)。

## 技术栈

- **引擎**：`@formily/core` + `@formily/react` v2（开源 MIT）
- **UI**：antd 5 + React 19
- **打包**：`@rslib/core`（bundleless，ESM + CJS + dts）
- **文档**：Vite + React + MDX
- **测试**：Vitest + Testing Library（jsdom）

## 开发

```sh
pnpm install
pnpm dev            # 库 watch 构建
pnpm docs:dev       # 文档站本地预览（http://localhost:6173）
pnpm test           # 测试
pnpm typecheck      # 类型检查
pnpm build          # 库构建到 dist/
```

需 Node 22（`.nvmrc` 已锁，`nvm use` 即可）。

## License

[MIT](LICENSE)
