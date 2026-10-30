import type * as React from 'react';
// @ts-expect-error rsbuild build-time alias, resolved by Rspress
import { usePage } from '@rspress/core/runtime';
// `@theme-original`、`@rspress/core/runtime` 均为 rsbuild 构建期别名，
// tsc 解析不到，但 `rspress dev/build` 能解析（已验证）。
// 从 `@theme-original`（默认主题的 index）取默认 `Layout` 与 `useThemeState`——
// 不能从 `@rspress/core/theme` 取，那会回到本目录的 `index.tsx` → 循环引用。
// 用 `@theme-original` 而非 `@rspress/core/theme-original`：两者等价，但后者会被
// Rspress 的 breaking-change 检测正则误匹配为旧写法而刷一条假警告。
// @ts-expect-error rsbuild build-time alias, resolved by Rspress
import { Layout as OriginalLayout, useThemeState } from '@theme-original';
import { theme as antdTheme, ConfigProvider } from 'antd';
import zhCNRaw from 'antd/locale/zh_CN';

// Vite/webpack 对 antd/locale/zh_CN（CJS）的 default-import interop 不自动拆 .default，
// 传给 ConfigProvider 的会是 { default: 真locale } 包装 → antd 不认回退英文。显式拆一层。
const zhCN = (zhCNRaw as any).default ?? zhCNRaw;
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
