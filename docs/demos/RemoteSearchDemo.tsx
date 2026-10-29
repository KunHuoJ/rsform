import type * as React from 'react';
import { Form } from 'rsform';

interface UserOption {
    label: string;
    value: string;
}

// 模拟一个用户库；远程搜索即在它上面做关键词过滤 + 网络延迟。
const USER_DB: UserOption[] = [
    { label: '张三', value: 'zhangsan' },
    { label: '张伟', value: 'zhangwei' },
    { label: '李四', value: 'lisi' },
    { label: '李娜', value: 'lina' },
    { label: '王五', value: 'wangwu' },
    { label: '王芳', value: 'wangfang' },
    { label: '赵六', value: 'zhaoliu' },
    { label: '刘备', value: 'liubei' },
    { label: '关羽', value: 'guanyu' },
    { label: '张飞', value: 'zhangfei' },
];

// 模拟远程接口：关键词过滤 + 200ms 延迟。
function searchUser(kw: string): Promise<UserOption[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const list = kw
                ? USER_DB.filter((u) => u.label.includes(kw) || u.value.includes(kw))
                : USER_DB;
            resolve(list);
        }, 200);
    });
}

/**
 * 远程搜索 Select 演示：用户在 Select 里输入关键词，发请求拉 options。
 * 关键在 effects 里把 `$.debounce` 包的搜索函数透传给 Select 的 `onSearch`——
 * 高频输入先折叠，停顿后才发一次请求，用最新关键词。
 * 不需要在组件里写 useState(options) / useState(loading) / 手动清 timer。
 */
export function RemoteSearchDemo(): React.ReactElement {
    return (
        <Form
            initialValues={{ userId: '' }}
            effects={($) => {
                // 防抖搜索：停顿 300ms 后用最新关键词发请求，把结果灌进 options
                const search = $.debounce(async (kw: string) => {
                    const options = await searchUser(kw);
                    $.form.setFieldState('userId', (s: any) => {
                        s.componentProps = {
                            ...s.componentProps,
                            options,
                            loading: false,
                        };
                    });
                }, 300);
                // 透传给 Select：onSearch 触发搜索，关掉本地过滤
                $.form.setFieldState('userId', (s: any) => {
                    s.componentProps = {
                        showSearch: true,
                        filterOption: false,
                        onSearch: search,
                        loading: false,
                        options: [],
                    };
                });
                // 进入页面先拉一次全量，让用户有可选
                search('');
            }}
        >
            <Form.Field name="userId" title="用户" required>
                <Form.Select placeholder="输入姓名或拼音搜索" style={{ width: 280 }} />
            </Form.Field>
        </Form>
    );
}
