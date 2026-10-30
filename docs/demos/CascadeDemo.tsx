import type * as React from 'react';
import { Form } from 'rsform';

interface CityOption {
    label: string;
    value: string;
}

const PROVINCES: CityOption[] = [
    { label: '广东', value: 'gd' },
    { label: '江苏', value: 'js' },
    { label: '浙江', value: 'zj' },
];

const CITIES: Record<string, CityOption[]> = {
    gd: [
        { label: '广州', value: 'gz' },
        { label: '深圳', value: 'sz' },
        { label: '珠海', value: 'zh' },
    ],
    js: [
        { label: '南京', value: 'nj' },
        { label: '苏州', value: 'su' },
        { label: '无锡', value: 'wx' },
    ],
    zj: [
        { label: '杭州', value: 'hz' },
        { label: '宁波', value: 'nb' },
        { label: '温州', value: 'wz' },
    ],
};

/**
 * 级联 Select 演示：linkedFieldProps 异步派生「城市」的 options。
 * 切换省份时，城市清空并重新加载对应选项——派生逻辑声明在 effects 里，
 * 不需要在组件里写 useEffect/useState 管理联动状态。
 */
export function CascadeDemo(): React.ReactElement {
    return (
        <Form
            initialValues={{ province: '', city: '' }}
            effects={($) =>
                $.linkedFieldProps('city', ['province'], async ({ province }) => {
                    if (!province) return { options: [] };
                    // 模拟异步请求
                    await new Promise((r) => setTimeout(r, 300));
                    return { options: CITIES[province] ?? [], disabled: false };
                })
            }
        >
            <Form.Field name="province" label="省份" required>
                <Form.Select options={PROVINCES} placeholder="请选择省份" style={{ width: 200 }} />
            </Form.Field>
            <Form.Field name="city" label="城市" required>
                <Form.Select placeholder="请先选择省份" style={{ width: 200 }} />
            </Form.Field>
        </Form>
    );
}
