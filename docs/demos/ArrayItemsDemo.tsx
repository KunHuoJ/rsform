import * as React from 'react';
import {Form} from 'rsform/array-items';

export function ArrayItemsDemo(): React.ReactElement {
    return (
        <div className="rsfd-demo">
            <div className="rsfd-demo-label">Live demo — drag the handle to reorder</div>
            <Form initialValues={{tags: [{label: 'react'}, {label: 'formily'}, {label: 'antd'}]}}>
                <Form.ArrayItems name="tags" itemDefaultValue={{label: ''}}>
                    {() => (
                        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                            <Form.Field name=".label" title="Tag">
                                <Form.Input placeholder="a tag" style={{width: 200}} />
                            </Form.Field>
                        </div>
                    )}
                </Form.ArrayItems>
            </Form>
        </div>
    );
}
