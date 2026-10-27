import * as React from 'react';
import {Form} from 'rsform/array-items';

/**
 * ArrayItems 演示：Formily ArrayField mutators + @dnd-kit 拖拽手柄，支持
 * 增删与拖动排序。Form.Field 的相对路径 name=".label" 自动绑定到当前行。
 */
export function ArrayItemsDemo(): React.ReactElement {
    return (
        <Form
            initialValues={{tags: [{label: 'react'}, {label: 'formily'}, {label: 'antd'}]}}
        >
            <Form.ArrayItems name="tags" itemDefaultValue={{label: ''}}>
                {() => (
                    <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                        <Form.Field name=".label" title="标签">
                            <Form.Input placeholder="输入标签" style={{width: 200}} />
                        </Form.Field>
                    </div>
                )}
            </Form.ArrayItems>
        </Form>
    );
}
