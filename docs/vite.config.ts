import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

/**
 * rsform docs site — Vite + React + MDX. Prose lives in .mdx files; demos are
 * plain .tsx components imported into MDX. `rsform*` resolves to workspace
 * source so docs always reflect the latest code. (R5/R5' spikes: Rspress v2 is
 * unbuildable — core 2.0.23 stable but theme-default v2 is beta-only with a
 * mismatched @rspress/runtime contract; v1.47.2 core has no CLI bin. Vite+MDX
 * stays on a single build chain, the chosen path.)
 */
export default defineConfig({
    // @vitejs/plugin-react 默认只处理 .jsx/.tsx——不要把 .mdx 加进 include，
    // 否则 dev 模式 babel 会把 MDX 产物再当 JSX 解析（## 标题 → Unexpected token）。
    // .mdx 交给 @mdx-js/rollup，它产出合法 JSX 后再由 react 插件处理。
    plugins: [mdx(), react()],
    root: resolve(here),
    resolve: {
        alias: [
            // Order matters: longer subpaths first so 'rsform' doesn't shadow them.
            {
                find: 'rsform/styles',
                replacement: resolve(here, '../src/styles/index.css'),
            },
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
