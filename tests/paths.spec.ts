import { describe, expect, it } from 'vitest';
import { isRelative, parseRowIndex, relativeDepth, resolvePath } from '../src/shared/paths';

describe('shared/paths', () => {
    it('resolves absolute names by appending to preName', () => {
        expect(resolvePath('users', 'name')).toBe('users.name');
        expect(resolvePath('users.0', 'name')).toBe('users.0.name');
    });

    it('resolves relative names by peeling parent segments', () => {
        // .name peels one parent off 'users.0' -> 'users' then appends 'name'
        expect(resolvePath('users.0', '.name')).toBe('users.name');
        // ..name peels two parents off 'users.0' -> '' then appends 'name'
        expect(resolvePath('users.0', '..name')).toBe('name');
    });

    it('detects relative depth and relativity', () => {
        expect(isRelative('.name')).toBe(true);
        expect(isRelative('name')).toBe(false);
        expect(relativeDepth('.name')).toBe(1);
        expect(relativeDepth('..name')).toBe(2);
        expect(relativeDepth('name')).toBe(0);
    });

    it('parses the row index out of a child path', () => {
        expect(parseRowIndex('users', 'users.0.name')).toBe(0);
        expect(parseRowIndex('users', 'users.3.name')).toBe(3);
        expect(parseRowIndex('users', 'others.0.name')).toBe(-1);
    });

    it('handles empty names by returning preName', () => {
        expect(resolvePath('users.0', '')).toBe('users.0');
    });
});
