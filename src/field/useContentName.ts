import { useFieldContext } from '../shared/FieldContext';
import { resolvePath } from '../shared/paths';

/**
 * Resolve a (possibly relative) field name against the parent FieldContext.
 *
 *  - absolute `name` is appended to the parent `preName`
 *  - relative `.name` peels one parent up then appends the remainder
 *  - relative `..name` peels two parents, etc.
 *
 * Returns the full resolved dot path usable as a Formily field name.
 */
export function useContentName(name: string): string {
    const { preName } = useFieldContext();
    return resolvePath(preName, name);
}
