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
    plugins: [mdx(), react({include: /\.(jsx|tsx|mdx)$/})],
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
