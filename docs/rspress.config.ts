import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import rspressMermaid from 'rspress-plugin-mermaid';

/**
 * rsform docs site — Rspress 2.
 *
 * Prose lives in `docs/content/*.mdx`; live demos are plain `.tsx` components
 * imported into MDX. `rsform` / `rsform/styles` resolve to the workspace source
 * so docs always reflect the latest code.
 *
 * Key facts (verified via scaffold build):
 *  - `ssg: false`: antd 5 under SSR has interop issues, and live form demos
 *    need client rendering anyway (forms submit/validate/cascade at runtime).
 *  - Aliases live under `builderConfig.resolve.alias` (NOT `source.alias`).
 *    `rsform/styles` MUST come before `rsform` — rspack alias is a prefix
 *    match, so the longer key wins only if listed first.
 *  - OutDir is `doc_build` (Rspress default), surfaced to CI via the root
 *    `docs:build` script / `docs.yml`.
 */
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
    // mermaid 图表支持(intro 架构图用)。
    plugins: [rspressMermaid()],
    ssg: false,
    // 代码块全局默认折叠：超过 300px 自动收起，带展开按钮。
    // 单块用 ```tsx fold / fold=false / height=400 精细控制。
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
            // rspack dev 的 lazyCompilation + HMR 在 workspace 源码 alias（rsform →
            // ../src → @formily/* pnpm 符号链接）下会 panic（"revoke the parent
            // module" / "Dependency with ID not found"）。关掉 lazy 编译与 HMR，
            // 全量一次性编译避开内存模块图竞态。dev 失效时回退 build + preview。
            lazyCompilation: false,
            hmr: false,
        },
    },
    // 侧栏：4 组（对应顶部 nav），每组带中文小标题。Rspress v2 顶层禁用
    // `_meta.json`（只能用 `_nav.json`），各子目录用各自 `_meta.json` 定顺序，
    // 这里用显式 `sidebar` 给出分组与中文名，dev / build 行为一致。首页
    // `index.md` 不进侧栏（点 logo 回首页）。
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
