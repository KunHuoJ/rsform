import type * as React from 'react';

interface DemoProps {
    /** Title shown in the demo header. */
    title?: string;
    children: React.ReactNode;
}

/**
 * 演示预览框：包裹 live demo 组件，提供统一的边框 + 标题样式。
 * 源码不再由本组件渲染——改用 Rspress 原生 ```tsx 代码块（Shiki 高亮 +
 * 可折叠）写在 <Demo> 下方，代码与预览天然在一起。
 */
export function Demo({ title, children }: DemoProps): React.ReactElement {
    return (
        <div className="rsfd-demo">
            <div className="rsfd-demo-head">
                <span className="rsfd-demo-label">{title ?? '实时演示'}</span>
            </div>
            <div className="rsfd-demo-body">{children}</div>
        </div>
    );
}
