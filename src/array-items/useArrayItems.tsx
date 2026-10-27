import * as React from 'react';

/**
 * Reactively read the nearest Formily array field model (created by
 * `ArrayItems` via Formily's `<ArrayField>`). Returns null outside an array
 * field context.
 *
 * The model exposes the array value plus mutators: `push`, `pop`, `insert`,
 * `remove`, `shift`, `unshift`, `move`, `moveUp`, `moveDown`. rsform's
 * ArrayItems wraps these with `min`/`max`/`validateBeforeAdd` gating.
 */
export function useArrayField<T = any>(): (T & {
    push: (...items: any[]) => Promise<void>;
    pop: () => Promise<void>;
    insert: (index: number, ...items: any[]) => Promise<void>;
    remove: (index: number) => Promise<void>;
    shift: () => Promise<void>;
    unshift: (...items: any[]) => Promise<void>;
    move: (from: number, to: number) => Promise<void>;
    moveUp: (index: number) => Promise<void>;
    moveDown: (index: number) => Promise<void>;
}) | null {
    return React.useContext(ArrayFieldContext);
}

/** Internal context carrying the array field model down to each row. */
export const ArrayFieldContext = React.createContext<any>(null);
