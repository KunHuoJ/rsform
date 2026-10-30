/**
 * 基于 Formily ArrayField 的轻量增删/移动列表,理念类似 antd 的
 * Form.List。`min`/`max`/`validateBeforeAdd` 用于拦截修改操作;
 * 上移/下移按钮通过 Formily mutators 重新排序(不引入拖拽库)。
 * 同时导出 `arrayUnion` 用于跨行唯一性校验。
 */
import { Form as BaseForm } from '../form/FormNamespace';
import { ArrayItems } from './ArrayItems';

export type { ArrayItemsProps } from './ArrayItems';

import { arrayUnion } from './arrayUnion';
import { ArrayFieldContext, useArrayField } from './useArrayItems';

export type { ArrayUnionValidator } from './arrayUnion';

/**
 * Form 命名空间辅助工具:将 ArrayItems 作为 `Form.ArrayItems` 挂到
 * 共享的 Form 上。rsform 的统一入口(`src/index.ts`)会重新导出
 * `ArrayItems` 并在那里挂载;此 barrel 文件是 array-items 模块的
 * 实现层接口。
 */
export type ArrayItemsForm = typeof BaseForm & {
    ArrayItems: typeof ArrayItems;
};

export const Form: ArrayItemsForm = Object.assign(BaseForm, {
    ArrayItems,
}) as ArrayItemsForm;

export { ArrayFieldContext, ArrayItems, arrayUnion, useArrayField };
