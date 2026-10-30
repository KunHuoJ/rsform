import * as React from 'react';

/**
 * 响应式地读取最近的 Formily 数组字段模型(由 `ArrayItems` 通过
 * Formily 的 `<ArrayField>` 创建)。在数组字段上下文之外返回 null。
 *
 * 该模型暴露数组值以及一系列 mutators:`push`、`pop`、`insert`、
 * `remove`、`shift`、`unshift`、`move`、`moveUp`、`moveDown`。rsform 的
 * ArrayItems 在此之上包裹了 `min`/`max`/`validateBeforeAdd` 拦截逻辑。
 */
export function useArrayField<T = any>():
    | (T & {
          push: (...items: any[]) => Promise<void>;
          pop: () => Promise<void>;
          insert: (index: number, ...items: any[]) => Promise<void>;
          remove: (index: number) => Promise<void>;
          shift: () => Promise<void>;
          unshift: (...items: any[]) => Promise<void>;
          move: (from: number, to: number) => Promise<void>;
          moveUp: (index: number) => Promise<void>;
          moveDown: (index: number) => Promise<void>;
      })
    | null {
    return React.useContext(ArrayFieldContext);
}

/** 内部上下文,将数组字段模型向下传递给每一行。 */
export const ArrayFieldContext = React.createContext<any>(null);
