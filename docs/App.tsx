import * as React from 'react';
import {BasicFormDemo} from './demos/BasicFormDemo';
import {EffectsDemo} from './demos/EffectsDemo';
import {ArrayItemsDemo} from './demos/ArrayItemsDemo';
import {TableDemo} from './demos/TableDemo';

const SECTIONS = [
    {id: 'intro', label: 'Introduction'},
    {id: 'basic', label: 'Basic Form'},
    {id: 'effects', label: 'Effects (reactive derivation)'},
    {id: 'array-items', label: 'ArrayItems (drag to sort)'},
    {id: 'table', label: 'High-perf Table'},
];

function useHashId(): string {
    const [hash, setHash] = React.useState(
        () => window.location.hash.replace(/^#/, '') || 'intro',
    );
    React.useEffect(() => {
        const onHash = () => setHash(window.location.hash.replace(/^#/, '') || 'intro');
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);
    return hash;
}

export function App(): React.ReactElement {
    const active = useHashId();
    return (
        <div className="rsfd-layout">
            <aside className="rsfd-sidebar">
                <div className="rsfd-brand">
                    <a href="#intro">rsform</a>
                </div>
                <div className="rsfd-tagline">
                    Formily v2 + antd 5 · high-perf editable tables
                </div>
                <ul className="rsfd-nav">
                    {SECTIONS.map(s => (
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
            </aside>
            <main className="rsfd-content">
                <section id="intro">
                    <h1>rsform</h1>
                    <p>
                        A high-performance React form library built on{' '}
                        <code>@formily/core</code> + <code>@formily/react</code> v2 and
                        antd 5. Effect-driven, auto-injecting <code>Field</code>, and a
                        fast editable <code>Table</code> that won't re-render every cell
                        on each keystroke.
                    </p>
                    <p>
                        Every demo below is live — it imports <code>rsform</code> straight
                        from the workspace source, so what you see is what ships.
                    </p>
                </section>

                <section id="basic">
                    <h2>Basic Form</h2>
                    <p>
                        <code>Form</code> + <code>Field</code> with auto-injected value/
                        onChange. <code>Form.Submit</code> awaits validation and the
                        onSubmit promise; <code>Form.FormError</code> aggregates form-level
                        errors.
                    </p>
                    <BasicFormDemo />
                </section>

                <section id="effects">
                    <h2>Effects (reactive derivation)</h2>
                    <p>
                        The <code>effects</code> callback receives a <code>$</code> helper
                        bundle. <code>linkedFieldProps</code> derives a field's props
                        async (e.g. cascading options); <code>validateField</code> runs
                        cross-field validation that tears itself down on unmount.
                    </p>
                    <EffectsDemo />
                </section>

                <section id="array-items">
                    <h2>ArrayItems (drag to sort)</h2>
                    <p>
                        A Formily <code>ArrayField</code> with <code>@dnd-kit/sortable</code>{' '}
                        drag handles, add/remove, and min/max guards.
                    </p>
                    <ArrayItemsDemo />
                </section>

                <section id="table">
                    <h2>High-perf Table</h2>
                    <p>
                        An editable table whose cells are <strong>not</strong> Formily{' '}
                        <code>&lt;Field&gt;</code>s — each cell reads its own{' '}
                        <code>form.values</code> leaf, so editing one cell re-renders{' '}
                        <strong>only that cell</strong> (not the whole N×M grid). The{' '}
                        <code>columns</code> reference is stable across edits.
                    </p>
                    <TableDemo />
                </section>
            </main>
        </div>
    );
}
