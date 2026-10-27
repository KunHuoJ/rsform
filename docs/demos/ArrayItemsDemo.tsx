import * as React from 'react';
import {Form} from 'rsform/array-items';

/**
 * ArrayItems 演示：默认不启用拖拽——多数表单只需增删。需要排序的场景加
 * `dragable` 属性启用拖拽手柄。Form.Field 相对路径 name=".label" 自动绑到当前行。
 */
export function ArrayItemsDemo(): React.ReactElement {
    return (
        <Form initialValues={{tags: [{label: 'react'}, {label: 'formily'}, {label: 'antd'}]}}>
            <Form.ArrayItems name="tags" itemDefaultValue={{label: ''}}>
                {() => (
                    <Form.Field name=".label" title="标签">
                        <Form.Input placeholder="输入标签" style={{width: 200}} />
                    </Form.Field>
                )}
            </Form.ArrayItems>
        </Form>
    );
}
