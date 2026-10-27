import * as React from 'react';
import {Form} from 'rsform/antd';

export function EffectsDemo(): React.ReactElement {
    return (
        <div className="rsfd-demo">
            <div className="rsfd-demo-label">Live demo — cross-field validation</div>
            <Form
                initialValues={{password: '', confirm: ''}}
                effects={$ =>
                    $.validateField(
                        'confirm',
                        ['password', 'confirm'],
                        ({password, confirm}) =>
                            password === confirm
                                ? ''
                                : 'passwords do not match',
                    )
                }
            >
                <Form.Field name="password" title="Password" required>
                    <Form.Input.Password placeholder="set a password" />
                </Form.Field>
                <Form.Field name="confirm" title="Confirm" required>
                    <Form.Input.Password placeholder="repeat it" />
                </Form.Field>
            </Form>
            <p style={{color: 'var(--rsf-muted)', fontSize: 13, marginTop: 8}}>
                Type a mismatch to see the error appear on the Confirm field; fix
                it to see the error clear.
            </p>
        </div>
    );
}
