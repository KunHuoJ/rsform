import type * as React from 'react';
import { Form, useFormDraft } from 'rsform';

/**
 * 草稿自动保存 / 恢复演示。`useFormDraft` 在 `<Form>` 内部调用，给定一个
 * 稳定 key。表单每次值变化都会防抖写进 localStorage；提交成功后草稿自动清除；
 * 重新进入页面发现历史草稿时，弹出「恢复 / 忽略」横条。
 *
 * 想体验恢复：随便填几个字段 → 刷新本页 → 顶部出现恢复横条。
 */
export function DraftDemo(): React.ReactElement {
    return (
        <Form
            initialValues={{ name: '', email: '', memo: '' }}
            onSubmit={async (values) => {
                // 模拟提交；提交成功后草稿自动从 localStorage 清除
                await new Promise((r) => setTimeout(r, 400));
                // eslint-disable-next-line no-console
                console.log('submitted', values);
            }}
        >
            <DraftBody />
        </Form>
    );
}

function DraftBody(): React.ReactElement {
    // key 用业务语义命名（同一种表单复用同一 key，刷新/重开都能恢复）
    const draft = useFormDraft('rsf-demo-draft', { debounceMs: 400 });

    return (
        <>
            {draft.hasDraft && (
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        padding: '8px 12px',
                        marginBottom: 12,
                        background: '#fffbe6',
                        border: '1px solid #ffe58f',
                        borderRadius: 4,
                    }}
                >
                    <span>发现未提交的草稿，是否恢复？</span>
                    <button type="button" onClick={draft.restore}>
                        恢复
                    </button>
                    <button type="button" onClick={draft.dismiss}>
                        忽略
                    </button>
                </div>
            )}
            <Form.Field name="name" label="姓名" required>
                <Form.Input placeholder="姓名" />
            </Form.Field>
            <Form.Field name="email" label="邮箱">
                <Form.Input placeholder="邮箱" />
            </Form.Field>
            <Form.Field name="memo" label="备注">
                <Form.TextArea placeholder="备注" rows={2} />
            </Form.Field>
            <Form.Submit preventDuplicate>提交</Form.Submit>
        </>
    );
}
