---
title: 快速上手
description: 5 分钟从零搭建一个 rsform 表单
---

# 快速上手

> 5 分钟从零搭建一个完整表单：安装 → 引入 → 字段 → 提交。

## 安装

rsform 的引擎 `@formily/core` + `@formily/react` 是 peer 依赖（必须由你安装，避免 formily 实例分裂导致响应式失效）。`antd` / `react` / `react-dom` 通常是你的项目已有的，无需重复安装。

```sh title="安装"
pnpm add rsform @formily/core @formily/react
```

:::warning
`@formily/core` 和 `@formily/react` 必须由消费者安装，且版本与 rsform 要求一致。否则会形成两份 formily 实例，响应式追踪失效。
:::

## 引入

rsform 是单入口：`import { Form } from 'rsform'` 一个 `Form` 拿到全部语法糖。

```tsx title="入口"
import 'rsform/styles'; // 基础样式（可选）
import { Form } from 'rsform'; // Form.Field / Form.Input / Form.Submit / Form.Table …
```

| 路径 | 内容 |
| --- | --- |
| `rsform` | `Form` 命名空间（Field / 控件 / Submit / Table / ArrayItems）+ effects helper |
| `rsform/styles` | 基础样式表（CSS 变量主题） |

## 一个表单

```tsx title="最小表单"
import 'rsform/styles';
import { Form } from 'rsform';

export default function App() {
    return (
        <Form onSubmit={(values) => console.log(values)}>
            <Form.Field name="name" label="姓名" required>
                <Form.Input />
            </Form.Field>
            <Form.Submit>提交</Form.Submit>
        </Form>
    );
}
```

字段自动注入：`Form.Field` 用 `commonMap` 把 Formily 的 `field.value`/`field.onInput` 桥接成 antd 控件的 `value`/`onChange`，无需手写受控样板。

## 加联动

Effect 驱动联动：在 `effects` 回调里用 `onFieldReact` 声明字段间联动。

```tsx title="字段联动"
import { Form, onFieldReact } from 'rsform';

<Form
    effects={() => {
        // 选了「其他」就显示补充输入框
        onFieldReact('other_reason', (field) => {
            field.visible = field.query('reason').value() === '其他';
        });
    }}
    onSubmit={(values) => console.log(values)}
>
    <Form.Field name="reason" label="原因">
        <Form.Select
            options={[
                { label: '个人原因', value: 'personal' },
                { label: '其他', value: '其他' },
            ]}
        />
    </Form.Field>
    <Form.Field name="other_reason" label="补充">
        <Form.Input />
    </Form.Field>
    <Form.Submit>提交</Form.Submit>
</Form>
```

:::tip
`onFieldReact` 里读了哪个字段，Formily 响应式引擎就自动订阅它，无需手动声明依赖。
:::

## 主题定制

所有视觉 token 是 `--rsf-*` CSS 变量，覆盖即可定制：

```css title="自定义主色"
:root {
    --rsf-color-primary: #722ed1; /* 主色 */
    --rsf-color-error: #f5222d; /* 错误色 */
    --rsf-label-color: #262626; /* label 色 */
}
```

完整变量清单见 [主题变量](/theme/tokens)。

## 下一步

- [介绍](/intro/intro) — rsform 的定位与架构
- [基础表单](/components/basic) — 自动注入、提交校验、错误展示
- [Effects 详解](/advanced/effects-detail) — 全部 effects helper
