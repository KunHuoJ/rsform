import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import rspressMermaid from 'rspress-plugin-mermaid';

const RSFORM_ROOT = path.resolve(__dirname, '..');

export default defineConfig({
    root: path.join(__dirname, 'content'),
    // GitHub Pages 子路径 https://kunhuoj.github.io/rsform/——生产用相对 base，
    // 本地 dev 用 '/'。
    base: process.env.NODE_ENV === 'production' ? '/rsform/' : '/',
    lang: 'zh',
    title: 'rsform',
    description: 'Formily v2 · antd 5 · 高性能表单',
    icon: '/icon.svg',
    logo: '/logo.svg',
    logoText: 'rsform',
    plugins: [rspressMermaid()],
    ssg: false,
    markdown: {
        defaultCodeOverflow: { behavior: 'fold', height: 300 },
    },
    // 自定义主题:Layout 包一层 antd ConfigProvider(中文化 + 浅深主题算法)。
    themeDir: path.join(__dirname, 'theme'),
    // 品牌 CSS 变量 + <Demo> 容器 + 自造 CodeBlock 样式(站点外壳由 Rspress 内置)。
    globalStyles: path.join(__dirname, 'custom.css'),
    builderConfig: {
        resolve: {
            alias: {
                'rsform/styles': path.join(RSFORM_ROOT, 'src/styles/index.css'),
                rsform: path.join(RSFORM_ROOT, 'src/index.ts'),
            },
        },
        dev: {
            lazyCompilation: false,
            hmr: false,
        },
        server: {
            open: true,
            port: 9527,
        },
    },
    sidebar: {
        '/intro': [
            {
                text: '入门',
                items: [
                    { text: '介绍', link: '/intro/intro' },
                    { text: '快速上手', link: '/intro/quickstart' },
                ],
            },
        ],
        '/components': [
            {
                text: '使用',
                items: [
                    { text: '基础表单', link: '/components/basic' },
                    { text: '订阅表单值（Form.Consumer）', link: '/components/consumer' },
                    { text: '草稿自动保存', link: '/components/draft' },
                    { text: '可增删列表（ArrayItems）', link: '/components/array-items' },
                    { text: '可编辑表格', link: '/components/table' },
                    { text: '表格性能压测', link: '/components/table-perf' },
                ],
            },
        ],
        '/advanced': [
            {
                text: '深入',
                items: [
                    { text: 'Effects 详解', link: '/advanced/effects-detail' },
                    { text: '迁移指南', link: '/advanced/migration' },
                    { text: 'API 参考', link: '/advanced/api' },
                ],
            },
        ],
        '/playground': [
            {
                text: '演练场',
                items: [{ text: '综合样板间', link: '/playground/playground' }],
            },
        ],
        '/theme': [
            {
                text: '主题',
                items: [{ text: '主题变量', link: '/theme/tokens' }],
            },
        ],
    },
    themeConfig: {
        socialLinks: [
            {
                icon: 'github',
                mode: 'link',
                content: 'https://github.com/KunHuoJ/rsform.git',
            },
        ],
    },
});
