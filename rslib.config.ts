import {defineConfig} from '@rslib/core';

// Shared externals: every subpath must use the consumer's own instances of
// these so Formily reactivity / antd theme / React renderer stay singular.
const externals = [
    '@formily/core',
    '@formily/react',
    '@formily/reactive',
    '@formily/reactive-react',
    '@formily/shared',
    'antd',
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    'immer',
    'hoist-non-react-statics',
];

// rsform self-reference regex for subpaths that import the core entry.
const selfExternal = /^rsform(\/.*)?$/;

export default defineConfig({
    platform: 'web',
    lib: [
        {
            format: 'esm',
            syntax: 'es2020',
            bundle: false,
            entry: {
                rsform: './src/index.ts',
                'rsform-antd': './src/controls/index.ts',
                'rsform-table': './src/table/index.ts',
                'rsform-array': './src/array-items/index.ts',
                'rsform-effects': './src/effects/index.ts',
            },
            dts: {
                bundle: false,
            },
            externals: [...externals, selfExternal],
        },
        {
            format: 'cjs',
            syntax: 'es2020',
            bundle: false,
            entry: {
                rsform: './src/index.ts',
                'rsform-antd': './src/controls/index.ts',
                'rsform-table': './src/table/index.ts',
                'rsform-array': './src/array-items/index.ts',
                'rsform-effects': './src/effects/index.ts',
            },
            externals: [...externals, selfExternal],
        },
    ],
});
