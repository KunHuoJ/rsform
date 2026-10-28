/**
 * Shallow equality check for two values. Returns true if they are referentially
 * equal, or if they are both plain objects/arrays with the same primitive
 * values at the same keys (one level deep).
 */
export function shallowEqual<T>(a: T, b: T): boolean {
    if (Object.is(a, b)) {
        return true;
    }
    if (a == null || b == null) {
        return false;
    }
    if (typeof a !== 'object' || typeof b !== 'object') {
        return false;
    }
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) {
        return false;
    }
    for (const key of aKeys) {
        if (
            !Object.prototype.hasOwnProperty.call(b, key) ||
            !Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
        ) {
            return false;
        }
    }
    return true;
}
