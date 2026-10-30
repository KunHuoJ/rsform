import type React from 'react';
import { Form } from 'rsform';

/**
 * 跨字段校验演示：在 effects 里用 $.validateField 声明式地做响应式联动校验，
 * 依赖字段任一变化即重跑，字段卸载时自动清理。
 */
export function EffectsDemo(): React.ReactElement {
    return (
        <Form
            initialValues={{ password: '', confirm: '' }}
            effects={($) =>
                $.validateField('confirm', ['password', 'confirm'], ({ password, confirm }) =>
                    password === confirm ? '' : '两次密码不一致',
                )
            }
        >
            <Form.Field name="password" label="密码" required>
                <Form.Input.Password placeholder="请设置密码" />
            </Form.Field>
            <Form.Field name="confirm" label="确认密码" required>
                <Form.Input.Password placeholder="请再次输入" />
            </Form.Field>
        </Form>
    );
}
