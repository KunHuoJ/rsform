import * as React from 'react';
import {BasicFormDemo} from './demos/BasicFormDemo';
import {EffectsDemo} from './demos/EffectsDemo';
import {ArrayItemsDemo} from './demos/ArrayItemsDemo';
import {TableDemo} from './demos/TableDemo';
import {CodeBlock} from './CodeBlock';
import {useTheme} from './useTheme';

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
            {id: 'array-items', label: 'ArrayItems 拖拽'},
            {id: 'table', label: '高性能表格'},
        ],
    },
];

const QUICKSTART_CODE = `pnpm add rsform @formily/core @formily/react antd react react-dom`;

const BASIC_CODE = `import { Form } from 'rsform/antd';

<Form
  initialValues={{ username: '', age: 18 }}
  onSubmit={async values => {
    console.log(values); // { username, age }
  }}
>
  <Form.Field name="username" title="用户名" required>
    <Form.Input placeholder="请输入用户名" />
  </Form.Field>
  <Form.Field name="age" title="年龄" required>
    <Form.InputNumber min={0} />
  </Form.Field>
  <Form.Submit>提交</Form.Submit>
</Form>`;

const EFFECTS_CODE = `import { Form } from 'rsform/antd';

<Form
  effects={$ =>
    $.validateField('confirm', ['password', 'confirm'], ({ password, confirm }) =>
      password === confirm ? '' : '两次密码不一致',
    )
  }
>
  <Form.Field name="password" title="密码" required>
    <Form.Input.Password />
  </Form.Field>
  <Form.Field name="confirm" title="确认密码" required>
    <Form.Input.Password />
  </Form.Field>
</Form>`;

const TABLE_CODE = `import { Form } from 'rsform/table';

interface Row { name: string; qty: number; price: number }

<Form initialValues={{ rows }}>
  <Form.Table<Row>
    name="rows"
    pagination={false}
    removeButton
    columns={[
      { title: '名称', dataIndex: 'name', control: 'input' },
      { title: '数量', dataIndex: 'qty', control: 'inputNumber',
        validator: v => (v > 0 ? '' : '必须大于 0') },
      { title: '单价', dataIndex: 'price', control: 'inputNumber' },
    ]}
  />
</Form>`;

function useHashId(): string {
    const [hash, setHash] = React.useState(
        () => window.location.hash.replace(/^#/, '') || 'intro',
    );
    React.useEffect(() => {
        const onHash = () =>
            setHash(window.location.hash.replace(/^#/, '') || 'intro');
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

function DemoFrame({label, children}: {label: string; children: React.ReactNode}) {
    return (
        <div className="rsfd-demo">
            <div className="rsfd-demo-head">
                <span className="rsfd-demo-label">{label}</span>
            </div>
            <div className="rsfd-demo-body">{children}</div>
        </div>
    );
}

export function App(): React.ReactElement {
    const active = useHashId();
    const [theme, toggle] = useTheme();

    return (
        <>
            <header className="rsfd-topbar">
                <a href="#intro" className="rsfd-topbar-brand">
                    <span className="rsfd-logo">r</span>
                    rsform
                    <span className="rsfd-topbar-tagline">
                        Formily v2 · antd 5 · 高性能表格
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
                        href="https://github.com/rsform/rsform"
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
                    <section id="intro">
                        <div className="rsfd-hero">
                            <h1>rsform</h1>
                            <p className="rsfd-hero-sub">
                                基于 Formily v2 + antd 5 的高性能 React 表单库。effect
                                驱动、自动注入 Field，以及编辑一格只重渲染一格的高性能可编辑表格。
                            </p>
                            <div className="rsfd-hero-actions">
                                <a href="#quickstart" className="rsfd-btn rsfd-btn-primary">
                                    快速上手
                                </a>
                                <a
                                    href="https://github.com/rsform/rsform"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rsfd-btn rsfd-btn-ghost"
                                >
                                    GitHub
                                </a>
                            </div>
                        </div>

                        <div className="rsfd-features">
                            <div className="rsfd-feature">
                                <div className="rsfd-feature-icon">⚡</div>
                                <h3>Effect 驱动</h3>
                                <p>在 effects 回调里用 $ helper 声明字段联动，跨字段校验、级联派生一键搞定。</p>
                            </div>
                            <div className="rsfd-feature">
                                <div className="rsfd-feature-icon">⊕</div>
                                <h3>自动注入 Field</h3>
                                <p>把控件丢进 Form.Field，value/onChange 自动流转，无需手写受控样板。</p>
                            </div>
                            <div className="rsfd-feature">
                                <div className="rsfd-feature-icon">▦</div>
                                <h3>高性能表格</h3>
                                <p>单元格非 Formily Field，编辑一格只重渲染该格，N×M 表格不卡。</p>
                            </div>
                            <div className="rsfd-feature">
                                <div className="rsfd-feature-icon">↕</div>
                                <h3>可拖拽 ArrayItems</h3>
                                <p>Formily ArrayField mutators + dnd-kit 拖拽排序，增删移开箱即用。</p>
                            </div>
                        </div>
                    </section>

                    <section id="quickstart">
                        <h2>快速上手</h2>
                        <p>安装 rsform 及其 peer 依赖：</p>
                        <CodeBlock code={QUICKSTART_CODE} />
                        <p>子路径导出：核心 <code>rsform</code>、控件 <code>rsform/antd</code>、表格 <code>rsform/table</code>、数组 <code>rsform/array-items</code>、effects <code>rsform/effects</code>。</p>
                        <div className="rsfd-callout">
                            <span className="rsfd-callout-icon">ℹ</span>
                            <span>rsform 薄壳包裹 antd 5 控件与 Formily v2 引擎，所有 <code>@formily/*</code>、antd、react 均为 peer——消费者复用同一份 formily 实例，避免响应式失效。</span>
                        </div>
                    </section>

                    <section id="basic">
                        <h2>基础表单</h2>
                        <p>
                            <code>Form</code> + <code>Form.Field</code> 自动注入 value/onChange。
                            <code>Form.Submit</code> 等待校验通过再触发 onSubmit；
                            <code>Form.FormError</code> 聚合表单级错误。
                        </p>
                        <CodeBlock code={BASIC_CODE} />
                        <DemoFrame label="实时演示">
                            <BasicFormDemo />
                        </DemoFrame>
                    </section>

                    <section id="effects">
                        <h2>Effects 响应式联动</h2>
                        <p>
                            <code>effects</code> 回调收到一个 <code>$</code> helper 集合。
                            <code>$.validateField</code> 做跨字段响应式校验，依赖字段任一变化即重跑，
                            字段卸载时自动拆卸。<code>$.linkedFieldProps</code> 异步派生字段 props（如级联 options）。
                        </p>
                        <CodeBlock code={EFFECTS_CODE} />
                        <DemoFrame label="实时演示 · 跨字段校验">
                            <EffectsDemo />
                        </DemoFrame>
                    </section>

                    <section id="array-items">
                        <h2>ArrayItems 拖拽排序</h2>
                        <p>
                            基于 Formily <code>ArrayField</code> mutators + <code>@dnd-kit/sortable</code>
                            拖拽手柄，支持增删与拖动排序。<code>Form.Field</code> 的相对路径
                            <code>name=".label"</code> 自动绑定到当前行。
                        </p>
                        <DemoFrame label="实时演示 · 拖动手柄排序">
                            <ArrayItemsDemo />
                        </DemoFrame>
                    </section>

                    <section id="table">
                        <h2>高性能可编辑表格</h2>
                        <p>
                            可编辑表格的每个单元格<strong>不是</strong> Formily <code>&lt;Field&gt;</code>——
                            每个单元格只订阅 <code>form.values</code> 的叶子节点。编辑一格只重渲染
                            <strong>该格</strong>，不波及其余 N×M−1 格；<code>columns</code> 引用在整个编辑过程中保持稳定。
                        </p>
                        <CodeBlock code={TABLE_CODE} />
                        <DemoFrame label="实时演示 · 单元格编辑">
                            <TableDemo />
                        </DemoFrame>
                        <div className="rsfd-callout">
                            <span className="rsfd-callout-icon">⚡</span>
                            <span>写入走 <code>field.onInput</code>：仅触发该格订阅、跑校验、触发 effect，且不替换行对象——同行其它格也不重渲染。</span>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
