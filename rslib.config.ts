import {defineConfig} from '@rslib/core';

// Shared externals: the consumer must use their own instances of these so
// Formily reactivity / antd theme / React renderer stay singular.
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
    'immer',
    'hoist-non-react-statics',
];

export default defineConfig({
    platform: 'web',
    lib: [
        {
            format: 'esm',
            syntax: 'es2020',
            bundle: false,
            entry: {
                rsform: './src/index.ts',
            },
            dts: {
                bundle: false,
            },
            externals,
        },
        {
            format: 'cjs',
            syntax: 'es2020',
            bundle: false,
            entry: {
                rsform: './src/index.ts',
            },
            externals,
        },
    ],
});
