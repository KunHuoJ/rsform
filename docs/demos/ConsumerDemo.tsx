import * as React from 'react';
import {Form} from 'rsform/antd';

interface Status {
    label: string;
    value: string;
}

const STATUS: Status[] = [
    {label: '草稿', value: 'draft'},
    {label: '已发布', value: 'published'},
    {label: '已归档', value: 'archived'},
];

/**
 * Form.Consumer 演示：render-prop 订阅表单值。
 *  - 不带 name：订阅整个 form.values，任一字段变化都重渲染
 *  - 带 name：只订阅该叶子，只有该叶子变化才重渲染
 */
export function ConsumerDemo(): React.ReactElement {
    return (
        <Form initialValues={{name: 'rsform', age: 1, status: 'draft'}}>
            <Form.Field name="name" title="名称" required>
                <Form.Input placeholder="请输入名称" style={{width: 200}} />
            </Form.Field>
            <Form.Field name="age" title="数量" required>
                <Form.InputNumber min={0} style={{width: 200}} />
            </Form.Field>
            <Form.Field name="status" title="状态">
                <Form.Select options={STATUS} style={{width: 200}} />
            </Form.Field>

            {/* 订阅整个表单值——任一字段变化都会更新这里 */}
            <div className="rsfd-consumer-block">
                <div className="rsfd-consumer-label">订阅整个 form.values</div>
                <Form.Consumer>
                    {values => (
                        <pre className="rsfd-consumer-out">
{JSON.stringify(values)}
                        </pre>
                    )}
                </Form.Consumer>
            </div>

            {/* 只订阅单个字段——只有 name 变化才更新，改 age/status 不会重渲染这里 */}
            <div className="rsfd-consumer-block">
                <div className="rsfd-consumer-label">只订阅 name（其它字段变化不重渲染）</div>
                <Form.Consumer name="name">
                    {name => (
                        <div className="rsfd-consumer-out">
                            名称实时镜像：<strong>{String(name ?? '')}</strong>
                        </div>
                    )}
                </Form.Consumer>
            </div>
        </Form>
    );
}
