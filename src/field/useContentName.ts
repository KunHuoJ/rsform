import { useFieldContext } from '../shared/FieldContext';
import { resolvePath } from '../shared/paths';

/**
 * 相对于父级 FieldContext 解析一个(可能是相对的)字段名。
 *
 *  - 绝对的 `name` 会被追加到父级 `preName` 之后
 *  - 相对的 `.name` 向上剥离一层父级后再追加余下部分
 *  - 相对的 `..name` 向上剥离两层父级,以此类推
 *
 * 返回可用作 Formily 字段名的完整点分路径。
 */
export function useContentName(name: string): string {
    const { preName } = useFieldContext();
    return resolvePath(preName, name);
}
