import * as React from 'react';

type Theme = 'dark' | 'light';

function resolveInitial(): Theme {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('rsf-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 浅/深主题 hook：首次按 localStorage，缺省回退系统偏好；切换写回 localStorage，
 * 并把 data-theme 同步到 <html>（styles.css 据此切色板）。
 */
export function useTheme(): [Theme, () => void] {
    const [theme, setTheme] = React.useState<Theme>(resolveInitial);

    React.useEffect(() => {
        document.documentElement.dataset.theme = theme;
        window.localStorage.setItem('rsf-theme', theme);
    }, [theme]);

    const toggle = React.useCallback(() => {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }, []);

    return [theme, toggle];
}
