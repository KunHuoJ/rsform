/**
 * rsform 中用于相对名解析和行索引计算的路径运算。
 *
 * rsform 的字段名遵循 Formily 的路径约定:
 *  - 绝对路径:`users` 或 `users.0.name`
 *  - 相对路径:`.name`(向上一层父级)、`..name`(向上两层父级),依此类推。
 *
 * 这些辅助函数基于点分隔的路径字符串运作,以保持接口精简且无依赖。
 */

/** 相对名中前导点的数量(0 表示绝对路径)。 */
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

/** 判断一个 name 是否为相对名(以点开头)。 */
export function isRelative(name: string): boolean {
    return typeof name === 'string' && name.length > 0 && name[0] === '.';
}

/** 将点分隔路径拆分为若干段。空段会被丢弃。 */
export function splitPath(path: string): string[] {
    return (path ?? '').split('.').filter(Boolean);
}

/** 将各段重新拼接为点分隔路径。 */
export function joinPath(segments: string[]): string {
    return segments.filter(Boolean).join('.');
}

/**
 * 将一个(可能是相对的)`name` 相对于父级 `preName` 进行解析。
 *
 *  - 相对名 `.name` 从 `preName` 剥去一段,再追加 `name`。
 *  - 相对名 `..name` 剥去两段,依此类推。
 *  - 绝对名 `name` 原样追加到 `preName` 之后。
 *
 * 示例(preName = 'users.0'):
 *  - resolve('users.0', 'name')   -> 'users.0.name'
 *  - resolve('users.0', '.name')  -> 'users.name'   (剥 1 段再追加 'name')
 *
 * 注意:单个前导点会剥去一层父级,其余部分再追加上去。
 * 因此 `.name` 配合 preName 'users.0' 会剥到 'users',再追加 'name' =>
 * 'users.name'。这相当于向上走一层后再命名一个兄弟节点。
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
 * 从位于 `pre` 之下的字段路径中解析出数组行索引。
 * 返回数字索引;若 `path` 不是 `pre` 的行子节点,则返回 -1。
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
