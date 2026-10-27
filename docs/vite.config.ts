import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

/**
 * rsform docs site — a Vite + React app rendering live demos that import rsform
 * straight from the workspace source (`../src`), so the docs always reflect the
 * latest code. (R5 spike: Rspress v2 is half-released — `@rspress/core@2.0.23`
 * is stable but `@rspress/theme-default` v2 is beta-only and pins a conflicting
 * `@rspress/shared`, and v1.47.1 core ships no `rspress` CLI bin — so we use a
 * plain Vite site, the documented fallback.)
 */
export default defineConfig({
    plugins: [react()],
    root: resolve(here),
    resolve: {
        alias: [
            // Order matters: longer subpaths first so 'rsform' doesn't shadow them.
            {
                find: 'rsform/table',
                replacement: resolve(here, '../src/table/index.ts'),
            },
            {
                find: 'rsform/antd',
                replacement: resolve(here, '../src/controls/index.ts'),
            },
            {
                find: 'rsform/array-items',
                replacement: resolve(here, '../src/array-items/index.ts'),
            },
            {
                find: 'rsform/effects',
                replacement: resolve(here, '../src/effects/index.ts'),
            },
            {
                find: 'rsform',
                replacement: resolve(here, '../src/index.ts'),
            },
        ],
    },
    server: {
        port: 6173,
    },
    build: {
        outDir: 'dist',
    },
});
