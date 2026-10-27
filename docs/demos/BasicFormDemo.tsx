import * as React from 'react';
import {Form} from 'rsform/antd';

export function BasicFormDemo(): React.ReactElement {
    const [submitted, setSubmitted] = React.useState<null | Record<string, any>>(null);
    return (
        <div className="rsfd-demo">
            <div className="rsfd-demo-label">Live demo</div>
            <Form
                initialValues={{username: '', age: 18}}
                onSubmit={async values => {
                    await new Promise(r => setTimeout(r, 400));
                    setSubmitted(values);
                }}
            >
                <Form.Field name="username" title="Username" required>
                    <Form.Input placeholder="your name" />
                </Form.Field>
                <Form.Field
                    name="age"
                    title="Age"
                    required
                    validator={v => (v >= 0 ? '' : 'must be ≥ 0')}
                >
                    <Form.InputNumber min={0} style={{width: 120}} />
                </Form.Field>
                <Form.Field name="bio" title="Bio">
                    <Form.TextArea rows={2} placeholder="optional" />
                </Form.Field>
                <Form.FormError />
                <div style={{marginTop: 12}}>
                    <Form.Submit>Submit</Form.Submit>
                </div>
            </Form>
            {submitted && (
                <div className="rsfd-output">
                    submitted: {JSON.stringify(submitted)}
                </div>
            )}
        </div>
    );
}
