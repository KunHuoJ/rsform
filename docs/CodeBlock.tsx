import * as React from 'react';

interface CodeBlockProps {
    code: string;
    lang?: string;
}

/**
 * 简易代码块：等宽展示 + 悬停复制按钮。无语法高亮依赖，保持站点轻量；
 * 代码即文档，所见即所写。
 */
export function CodeBlock({code}: CodeBlockProps): React.ReactElement {
    const [copied, setCopied] = React.useState(false);
    const onCopy = () => {
        navigator.clipboard?.writeText(code).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        });
    };
    return (
        <div className="rsfd-codeblock">
            <button
                type="button"
                className="rsfd-code-copy"
                onClick={onCopy}
                aria-label="复制代码"
            >
                {copied ? '已复制' : '复制'}
            </button>
            <pre>
                <code>{code}</code>
            </pre>
        </div>
    );
}
