import * as React from 'react';
import {Form} from 'rsform/antd';

/**
 * 基础表单演示：Form + Form.Field 自动注入 value/onChange，Form.Submit 等校验，
 * Form.FormError 聚合表单级错误。外层 demo 容器由 App 统一提供。
 */
export function BasicFormDemo(): React.ReactElement {
    const [submitted, setSubmitted] = React.useState<null | Record<string, any>>(null);
    return (
        <>
            <Form
                initialValues={{username: '', age: 18}}
                onSubmit={async values => {
                    await new Promise(r => setTimeout(r, 400));
                    setSubmitted(values);
                }}
            >
                <Form.Field name="username" title="用户名" required>
                    <Form.Input placeholder="请输入用户名" />
                </Form.Field>
                <Form.Field
                    name="age"
                    title="年龄"
                    required
                    validator={v => (v >= 0 ? '' : '必须 ≥ 0')}
                >
                    <Form.InputNumber min={0} style={{width: 120}} />
                </Form.Field>
                <Form.Field name="bio" title="简介">
                    <Form.TextArea rows={2} placeholder="选填" />
                </Form.Field>
                <Form.FormError />
                <div style={{marginTop: 12}}>
                    <Form.Submit>提交</Form.Submit>
                </div>
            </Form>
            {submitted && (
                <div className="rsfd-output">
                    提交结果：{JSON.stringify(submitted)}
                </div>
            )}
        </>
    );
}
