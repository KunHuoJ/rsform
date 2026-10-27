/**
 * Path math used across rsform for relative-name resolution and row indexing.
 *
 * rsform field names follow Formily's path conventions:
 *  - absolute: `users` or `users.0.name`
 *  - relative: `.name` (one parent up), `..name` (two parents up), etc.
 *
 * These helpers operate on dot-separated path strings to keep the surface
 * tiny and dependency-free.
 */

/** Number of leading dots in a relative name (0 means absolute). */
export function relativeDepth(name: string): number {
    if (typeof name !== 'string' || name.length === 0) {
        return 0;
    }
    let i = 0;
    while (i < name.length && name[i] === '.') {
        i++;
    }
    return i;
}

/** Whether a name is relative (starts with a dot). */
export function isRelative(name: string): boolean {
    return typeof name === 'string' && name.length > 0 && name[0] === '.';
}

/** Split a dot path into segments. Empty segments are dropped. */
export function splitPath(path: string): string[] {
    return (path ?? '').split('.').filter(Boolean);
}

/** Join segments back into a dot path. */
export function joinPath(segments: string[]): string {
    return segments.filter(Boolean).join('.');
}

/**
 * Resolve a (possibly relative) `name` against a parent `preName`.
 *
 *  - relative `.name` peels one segment off `preName` then appends `name`.
 *  - relative `..name` peels two segments, etc.
 *  - absolute `name` is appended verbatim to `preName`.
 *
 * Examples (preName = 'users.0'):
 *  - resolve('users.0', 'name')   -> 'users.0.name'
 *  - resolve('users.0', '.name')  -> 'users.0.name'   (peel 1, append 'name'? NO)
 *
 * Note: a single leading dot peels ONE parent and the remainder is appended.
 * So `.name` with preName 'users.0' peels to 'users' then appends 'name' =>
 * 'users.name'. That mirrors walking up one level then naming a sibling.
 */
export function resolvePath(preName: string, name: string): string {
    if (!name) {
        return preName;
    }
    if (!isRelative(name)) {
        return joinPath([...splitPath(preName), ...splitPath(name)]);
    }
    const depth = relativeDepth(name);
    const remainder = name.slice(depth);
    const parentSegments = splitPath(preName);
    const peeled = parentSegments.slice(0, Math.max(parentSegments.length - depth, 0));
    return joinPath([...peeled, ...splitPath(remainder)]);
}

/**
 * Parse the array row index out of a field path that lives under `pre`.
 * Returns the numeric index, or -1 if `path` is not a row-child of `pre`.
 *
 *  - parseRowIndex('users', 'users.0.name')  -> 0
 *  - parseRowIndex('users', 'users.3.name')  -> 3
 *  - parseRowIndex('users', 'others.0.name')  -> -1
 */
export function parseRowIndex(pre: string, path: string): number {
    const preSegments = splitPath(pre);
    const pathSegments = splitPath(path);
    if (pathSegments.length !== preSegments.length + 2) {
        return -1;
    }
    for (let i = 0; i < preSegments.length; i++) {
        if (pathSegments[i] !== preSegments[i]) {
            return -1;
        }
    }
    const idx = Number(pathSegments[preSegments.length]);
    return Number.isFinite(idx) && Math.floor(idx) === idx && idx >= 0 ? idx : -1;
}
