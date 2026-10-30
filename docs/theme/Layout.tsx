import type * as React from 'react';
// @ts-expect-error rsbuild build-time alias, resolved by Rspress
import { usePage } from '@rspress/core/runtime';
// `@rspress/core/theme-original`、`@rspress/core/runtime` 均为 rsbuild 构建期别名，
// tsc 解析不到，但 `rspress dev/build` 能解析（已验证）。
// 从 `@rspress/core/theme-original`（默认主题的 index）取默认 `Layout` 与 `useThemeState`——
// 不能从 `@rspress/core/theme` 取，那会回到本目录的 `index.tsx` → 循环引用。
// @ts-expect-error rsbuild build-time alias, resolved by Rspress
import { Layout as OriginalLayout, useThemeState } from '@rspress/core/theme-original';
import { theme as antdTheme, ConfigProvider } from 'antd';
import zhCNRaw from 'antd/locale/zh_CN';

// Vite/webpack 对 antd/locale/zh_CN（CJS）的 default-import interop 不自动拆 .default，
// 传给 ConfigProvider 的会是 { default: 真locale } 包装 → antd 不认回退英文。显式拆一层。
const zhCN = (zhCNRaw as any).default ?? zhCNRaw;

/**
 * 全局包一层 antd ConfigProvider：
 *  - `locale={zhCN}`：antd 5 控件（DatePicker 日历、Pagination、Modal 按钮文案）中文化。
 *  - `theme.algorithm`：随 rsform 文档站浅/深主题切换（`useThemeState()` 给当前主题）。
 *
 * 首页（frontmatter `pageType: blank`）走纯落地页：Rspress 内置 Layout 对 blank 页只渲染
 * `<Content/>`（mdx 正文）、不渲染 Nav/侧栏。但 blank 页不带 `.rp-doc` 容器，而 Rspress 的
 * 标题样式（h1/h2 大字、`.rp-header-anchor` 锚点图标 `opacity:0` 仅 hover 显示）全部 scoped
 * 在 `.rp-doc` 下——缺了它，标题会显示成「`#rsform` 这种带 # 号的小字」（锚点图标常显 +
 * 无大字），像 markdown 没解析。所以 blank 页要手动补一层 `.rp-doc` 包裹。
 */
export function Layout(props: React.ComponentProps<typeof OriginalLayout>): React.ReactElement {
    const [theme] = useThemeState();
    const { page } = usePage();
    const isLanding = (page as any)?.pageType === 'blank';

    const content = isLanding ? (
        <div className="rsfd-landing">
            <div className="rsfd-landing-inner rp-doc">
                <OriginalLayout {...props} />
            </div>
        </div>
    ) : (
        <OriginalLayout {...props} />
    );

    return (
        <ConfigProvider
            locale={zhCN}
            theme={{
                algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            }}
        >
            {content}
        </ConfigProvider>
    );
}
