import * as React from 'react';
import {useTheme} from './useTheme';

// 把 content/*.mdx 全部以组件形式静态导入，用于 hash 路由渲染。
// Vite + @mdx-js/rollup 会把每个 .mdx 编译成 React 组件。
const pages = import.meta.glob('./content/*.mdx', {eager: true}) as Record<
    string,
    {default: React.ComponentType}
>;

const NAV_GROUPS: {title: string; items: {id: string; label: string}[]}[] = [
    {
        title: '入门',
        items: [
            {id: 'intro', label: '介绍'},
            {id: 'quickstart', label: '快速上手'},
        ],
    },
    {
        title: '组件',
        items: [
            {id: 'basic', label: '基础表单'},
            {id: 'effects', label: 'Effects 联动'},
            {id: 'array-items', label: 'ArrayItems 列表'},
            {id: 'table', label: '可编辑表格'},
        ],
    },
    {
        title: '深入',
        items: [
            {id: 'effects-detail', label: 'Effects 详解'},
            {id: 'api', label: 'API 参考'},
        ],
    },
    {
        title: '主题',
        items: [{id: 'tokens', label: '主题变量'}],
    },
];

function pageComponent(id: string): React.ComponentType | null {
    const key = Object.keys(pages).find(k => k.endsWith(`/${id}.mdx`));
    return key ? pages[key].default : null;
}

function useHashId(): string {
    const [hash, setHash] = React.useState(
        () => window.location.hash.replace(/^#/, '') || 'intro',
    );
    React.useEffect(() => {
        const onHash = () => {
            const next = window.location.hash.replace(/^#/, '') || 'intro';
            setHash(next);
            window.scrollTo({top: 0});
        };
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);
    return hash;
}

function SunIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
    );
}
function MoonIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}
function GithubIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
        </svg>
    );
}

export function App(): React.ReactElement {
    const active = useHashId();
    const [theme, toggle] = useTheme();
    const Page = pageComponent(active) ?? pageComponent('intro')!;

    return (
        <>
            <header className="rsfd-topbar">
                <a href="#intro" className="rsfd-topbar-brand">
                    <span className="rsfd-logo">r</span>
                    rsform
                    <span className="rsfd-topbar-tagline">
                        Formily v2 · antd 5 · 高性能表单
                    </span>
                </a>
                <div className="rsfd-topbar-actions">
                    <button
                        type="button"
                        className="rsfd-icon-btn"
                        onClick={toggle}
                        aria-label="切换主题"
                        title={theme === 'dark' ? '切到浅色' : '切到深色'}
                    >
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>
                    <a
                        className="rsfd-gh-link"
                        href="https://github.com/KunHuoJ/rsform.git"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="GitHub"
                    >
                        <GithubIcon />
                    </a>
                </div>
            </header>

            <div className="rsfd-layout">
                <aside className="rsfd-sidebar">
                    {NAV_GROUPS.map(group => (
                        <div key={group.title} className="rsfd-nav-group">
                            <div className="rsfd-nav-group-title">{group.title}</div>
                            <ul className="rsfd-nav">
                                {group.items.map(s => (
                                    <li key={s.id}>
                                        <a
                                            href={`#${s.id}`}
                                            className={active === s.id ? 'is-active' : ''}
                                        >
                                            {s.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </aside>

                <main className="rsfd-content">
                    <Page />
                </main>
            </div>
        </>
    );
}
