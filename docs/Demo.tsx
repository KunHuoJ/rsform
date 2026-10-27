import * as React from 'react';
import {CodeBlock} from './CodeBlock';

interface DemoProps {
    /** Source code shown in the collapsible code block. */
    code: string;
    /** Title shown in the demo header. */
    title?: string;
    children: React.ReactNode;
}

/**
 * 演示容器：上半实时预览，下半可折叠源码（仿 antd pro-components 文档）。
 * 默认收起代码，点「显示代码」展开。
 */
export function Demo({code, title, children}: DemoProps): React.ReactElement {
    const [open, setOpen] = React.useState(false);
    return (
        <div className="rsfd-demo">
            <div className="rsfd-demo-head">
                <span className="rsfd-demo-label">{title ?? '实时演示'}</span>
                <button
                    type="button"
                    className="rsfd-demo-toggle"
                    onClick={() => setOpen(o => !o)}
                >
                    {open ? '收起代码' : '显示代码'}
                </button>
            </div>
            <div className="rsfd-demo-body">{children}</div>
            {open && (
                <div className="rsfd-demo-code">
                    <CodeBlock code={code} />
                </div>
            )}
        </div>
    );
}
