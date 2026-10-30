import type * as React from 'react';
import { useForm } from '@formily/react';
import { observer } from '@formily/reactive-react';
import { useFieldContext } from '../shared/FieldContext';
import { resolvePath } from '../shared/paths';

export interface FormConsumerProps {
    /**
     * 要订阅的字段名。相对名称(`.foo`、`..foo`)会相对于最近的
     * FieldContext 解析 —— 与 Form.Field 的路径规则相同。
     *
     * 省略时,订阅整个 `form.values`:`children` 会收到完整的 values 对象,
     * 并在任意字段变化时重渲染。
     */
    name?: string;
    /**
     * Render prop:接收所订阅的数据并返回节点。
     *  - 不带 `name`:`data` 为整个 `form.values`
     *  - 带 `name`:`data` 为该字段的值(仅在该叶子变化时才重渲染)
     */
    children: (data: any) => React.ReactNode;
}

export const Consumer = observer(function Consumer({ name, children }: FormConsumerProps) {
    const form = useForm();
    // 无条件读取字段上下文(Hooks 规则):`useContentName` 会在对 `name`
    // 的条件判断内部调用 useContext,当 `name` 在多次渲染间于 undefined 和
    // 字符串之间切换时就会出问题。
    const { preName } = useFieldContext();
    const resolved = name ? resolvePath(preName, name) : '';
    // 在 observer 内部读取,使 Formily 能追踪我们触及的叶子 —— 订阅整个
    // values 会追踪所有内容;具名订阅只追踪单个叶子,因此只有它变化时
    // 才会重渲染本组件。
    const data = resolved ? form.getValuesIn(resolved) : form.values;
    return <>{children(data)}</>;
});
