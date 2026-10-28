import React from 'react';
import { arrayUnion, Form } from 'rsform';

interface Member {
    name: string;
    email: string;
    role: string;
}

const ROLES = [
    { label: '管理员', value: 'admin' },
    { label: '开发', value: 'dev' },
    { label: '测试', value: 'qa' },
    { label: '产品', value: 'pm' },
];

const DEFAULT_MEMBER: Member = { name: '', email: '', role: 'dev' };

const INITIAL_MEMBERS: Member[] = [
    { name: '张三', email: 'zhangsan@example.com', role: 'admin' },
    { name: '李四', email: 'lisi@example.com', role: 'dev' },
    { name: '王五', email: 'wangwu@example.com', role: 'qa' },
];

/**
 * ArrayItems 演示：团队成员名单（多字段行 + 跨行唯一校验 + min/max + 提交）。
 *
 * 每行三个字段：姓名、邮箱、角色。`name="email"`（无前导点 = append 到当前行 →
 * members.N.email）绑定到当前行；`arrayUnion('email')` 跨行校验邮箱唯一。
 * `min={1}` 保证至少一名成员；提交拿到全量普通对象数据。
 */
export function ArrayItemsDemo(): React.ReactElement {
    const [result, setResult] = React.useState<string>('');
    return (
        <Form
            initialValues={{ members: INITIAL_MEMBERS }}
            onSubmit={(values) => {
                setResult(JSON.stringify(values, null, 2));
            }}
        >
            <Form.ArrayItems name="members" itemDefaultValue={DEFAULT_MEMBER} min={1}>
                {() => (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Form.Field name="name" title="姓名" required>
                            <Form.Input placeholder="姓名" style={{ width: 120 }} />
                        </Form.Field>
                        <Form.Field
                            name="email"
                            title="邮箱"
                            required
                            validator={arrayUnion('email', '该邮箱已存在')}
                        >
                            <Form.Input placeholder="邮箱" style={{ width: 200 }} />
                        </Form.Field>
                        <Form.Field name="role" title="角色">
                            <Form.Select
                                options={ROLES}
                                style={{ width: 120 }}
                                placeholder="角色"
                            />
                        </Form.Field>
                    </div>
                )}
            </Form.ArrayItems>
            <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Form.Submit>提交</Form.Submit>
            </div>
            {result && (
                <pre className="rsfd-output" style={{ marginTop: 12 }}>
                    {result}
                </pre>
            )}
        </Form>
    );
}
