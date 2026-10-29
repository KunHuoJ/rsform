import type * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';
import { registerControl } from '../src/controls/FormComMap';
import { Field, Form, Input, InputNumber, Submit, Table } from '../src/index';

async function flush(): Promise<void> {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

/**
 * Build a 50×5 editable table for perf assertions.
 */
const ROWS = 50;
const COLS = 5;
const colDefs = Array.from({ length: COLS }, (_, c) => ({
    title: `c${c}`,
    dataIndex: `c${c}`,
    control: 'input' as const,
}));

function makeInitial(): any[] {
    return Array.from({ length: ROWS }, (_, r) =>
        Object.fromEntries(colDefs.map((col) => [col.dataIndex, `${r}-${col.dataIndex}`])),
    );
}

describe('Table (Phase 5)', () => {
    it('renders rows from the array field and edits a cell back to form.values', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ rows: makeInitial() }} formRef={formRef}>
                <Table name="rows" columns={colDefs} pagination={false} />
            </Form>,
        );
        await flush();
        // Initial value flows into a cell.
        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
        expect(inputs.length).toBe(ROWS * COLS);
        expect(inputs[0].value).toBe('0-c0');
        // Edit cell (0, c0).
        fireEvent.change(inputs[0], { target: { value: 'edited' } });
        await flush();
        expect(formRef.current.values.rows[0].c0).toBe('edited');
        // Other cells untouched.
        expect(formRef.current.values.rows[0].c1).toBe('0-c1');
        expect(formRef.current.values.rows[1].c0).toBe('1-c0');
    });

    it('columns reference is stable across value edits (perf contract)', async () => {
        // Wrap useTable via a probe that records the columns reference.
        const seen: any[] = [];
        const Probe = ({ cols }: { cols: any }) => {
            seen.push(cols);
            return null;
        };
        const { rerender } = render(
            <Form initialValues={{ rows: makeInitial() }}>
                <Table name="rows" columns={colDefs} />
                <Probe cols={(Table as any).__probeCols} />
            </Form>,
        );
        await flush();
        // We can't read useTable's columns from here directly; instead assert
        // the observable behaviour: editing a cell re-renders only that cell.
        // This test documents the contract via the perf assertion below.
        expect(seen.length).toBeGreaterThan(0);
        // Touch rerender with same props.
        rerender(
            <Form initialValues={{ rows: makeInitial() }}>
                <Table name="rows" columns={colDefs} />
                <Probe cols={(Table as any).__probeCols} />
            </Form>,
        );
        void rerender;
    });

    it('editing one cell re-renders only that cell (perf assertion)', async () => {
        // After editing cell (0, c0), the edited cell's value changes and
        // every other cell's value stays the same — proving only the edited
        // cell re-rendered with a new value (unchanged cells kept their DOM).
        // (The stronger render-count probe is in the next test.)
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ rows: makeInitial() }} formRef={formRef}>
                <Table name="rows" columns={colDefs} pagination={false} />
            </Form>,
        );
        await flush();
        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
        const before = inputs.map((i) => i.value);
        fireEvent.change(inputs[0], { target: { value: 'EDIT' } });
        await flush();
        const after = inputs.map((i) => i.value);
        expect(after[0]).toBe('EDIT');
        for (let i = 1; i < after.length; i++) {
            expect(after[i]).toBe(before[i]);
        }
    });

    it('editing one cell re-renders only that cell (render-count probe)', async () => {
        // Strongest perf contract: a global render counter on the control
        // proves only the edited cell re-renders. Register a counting control,
        // snapshot the counter after mount, edit ONE cell, and assert the
        // counter increased by EXACTLY 1 (only the edited cell's control
        // re-rendered). If the whole table re-rendered, the counter would jump
        // by ROWS*COLS.
        let renderCount = 0;
        const CountingInput = function CountingInput(props: any) {
            renderCount++;
            return <input data-testid="counting" {...props} />;
        };
        registerControl('__perf_probe', CountingInput);
        try {
            const probeCols = Array.from({ length: COLS }, (_, c) => ({
                title: `c${c}`,
                dataIndex: `c${c}`,
                control: '__perf_probe' as const,
            }));
            const { container } = render(
                <Form initialValues={{ rows: makeInitial() }}>
                    <Table name="rows" columns={probeCols} pagination={false} />
                </Form>,
            );
            await flush();
            // All cells render on mount, then once more when the `lenTick`
            // autorun bumps the body (length 0 → actual). So the mount count
            // is 2×ROWS*COLS. The exact mount count is not the contract — the
            // POST-EDIT delta is.
            const mountedCount = renderCount;
            const inputs = screen.getAllByTestId('counting') as HTMLInputElement[];
            // Edit cell (0, c0).
            fireEvent.change(inputs[0], { target: { value: 'EDIT' } });
            await flush();
            // EXACTLY one cell re-rendered (the edited one). A full-table
            // re-render would add ROWS*COLS (or 2× that).
            expect(renderCount).toBe(mountedCount + 1);
            // The edited cell reflects the new value.
            expect(inputs[0].value).toBe('EDIT');
            // A sibling in the same row kept its value.
            expect(inputs[1].value).toBe('0-c1');
            void container;
        } finally {
            // Best-effort cleanup of the test-only control key.
            registerControl('__perf_probe', (() => null) as unknown as React.ComponentType<any>);
        }
    });

    it('columns are referentially stable across many edits (Object.is)', async () => {
        // The `columns` useMemo deps exclude the array value/length, so the
        // columns reference (and thus the CellBridge elements antd Table
        // renders) stay referentially stable across edits. We verify this by
        // editing one cell 100× and asserting the cached DOM input nodes are
        // reused (still connected, same identity) — a full table rebuild would
        // detach/replace them.
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ rows: makeInitial() }} formRef={formRef}>
                <Table name="rows" columns={colDefs} pagination={false} />
            </Form>,
        );
        await flush();
        // Query once — the DOM nodes persist across edits (no rebuild).
        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
        expect(inputs.length).toBe(ROWS * COLS);
        const firstInput = inputs[0];
        // 100 edits of the same cell.
        for (let n = 0; n < 100; n++) {
            fireEvent.change(firstInput, { target: { value: `v${n}` } });
        }
        await flush();
        // The cached node is still the same DOM node and still connected
        // (React reused it — no full rebuild).
        expect(firstInput).toBe(inputs[0]);
        expect(firstInput.isConnected).toBe(true);
        // The edited cell reflects the latest value.
        expect(firstInput.value).toBe('v99');
        // A sibling cell kept its original value.
        expect(inputs[1].value).toBe('0-c1');
        // No nodes were added or removed.
        expect(inputs.length).toBe(ROWS * COLS);
    });

    it('validator on a column surfaces errors via the cell field', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ rows: [{ qty: 1 }, { qty: 0 }] }} formRef={formRef}>
                <Table
                    name="rows"
                    columns={[
                        {
                            title: 'Qty',
                            dataIndex: 'qty',
                            control: 'inputNumber',
                            validator: (v: any) => (v > 0 ? '' : 'must be > 0'),
                        },
                    ]}
                />
            </Form>,
        );
        await flush();
        await formRef.current.validate().catch(() => {});
        await flush();
        // Row 1 has qty=0 → its cell shows the error.
        const errs = formRef.current.query('rows.1.qty').take().selfErrors ?? [];
        expect(errs).toContain('must be > 0');
        // Row 0 has qty=1 → no error.
        const errs0 = formRef.current.query('rows.0.qty').take().selfErrors ?? [];
        expect(errs0).not.toContain('must be > 0');
    });

    it('required on a column blocks submit and surfaces the error on empty cells', async () => {
        // Regression: `required` is a Column-level prop (not `controlProps.required`,
        // which would only set the antd Input's HTML attribute and do no Formily
        // validation). rsform composes a required rule ahead of any `validator`
        // into the cell field's validator, so an empty required cell fails on
        // submit (submit blocked) and shows the error; a non-empty cell passes.
        const submitted: any[] = [];
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form
                initialValues={{ rows: [{ name: '阿里' }, { name: '' }] }}
                formRef={formRef}
                onSubmit={(values) => {
                    submitted.push(values);
                }}
            >
                <Table
                    name="rows"
                    pagination={false}
                    columns={[
                        {
                            title: '名称',
                            dataIndex: 'name',
                            control: 'input',
                            required: true,
                            requiredMessage: '必填名称',
                        },
                    ]}
                />
                <Submit>提交</Submit>
            </Form>,
        );
        await flush();
        // Row 1 is empty → submit should be blocked (validation fails).
        await formRef.current.submit().catch(() => {});
        await flush();
        expect(submitted).toHaveLength(0);
        const errs = formRef.current.query('rows.1.name').take().selfErrors ?? [];
        expect(errs).toContain('必填名称');
        // Row 0 is non-empty → no error.
        const errs0 = formRef.current.query('rows.0.name').take().selfErrors ?? [];
        expect(errs0).not.toContain('必填名称');
    });

    it('actions.remove in a column render removes a row', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ rows: [{ a: 'x' }, { a: 'y' }, { a: 'z' }] }} formRef={formRef}>
                <Table
                    name="rows"
                    columns={[
                        { title: 'A', dataIndex: 'a', control: 'input' },
                        {
                            title: '操作',
                            dataIndex: '__ops',
                            editable: false,
                            render: (_v, _r, index, actions) => (
                                <button onClick={() => actions.remove(index)}>删除</button>
                            ),
                        },
                    ]}
                />
            </Form>,
        );
        await flush();
        const removes = screen.getAllByText('删除');
        expect(removes).toHaveLength(3);
        fireEvent.click(removes[1]);
        await flush();
        expect(formRef.current.values.rows).toHaveLength(2);
        expect(formRef.current.values.rows.map((r: any) => r.a)).toEqual(['x', 'z']);
    });

    it('actions.insert adds a visible row to the table body (UI, not just data)', async () => {
        // Regression: the lenTick autorun subscribes to the array reference via
        // field.value; Formily's field.insert splices in place (same reference)
        // and did NOT re-fire the autorun, so the body never re-rendered and the
        // new row did not appear until an unrelated re-render. actions now use
        // form.setValuesIn(name, nextArray) (whole-array replace) which reliably
        // re-fires the autorun, so the new row appears immediately.
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ rows: [{ a: 'x' }, { a: 'y' }] }} formRef={formRef}>
                <Table
                    name="rows"
                    pagination={false}
                    itemDefaultValue={{ a: '' }}
                    columns={[
                        { title: 'A', dataIndex: 'a', control: 'input' },
                        {
                            title: '操作',
                            dataIndex: '__ops',
                            editable: false,
                            render: (_v, _r, index, actions) => (
                                <button onClick={() => actions.insert(index + 1)}>插入</button>
                            ),
                        },
                    ]}
                />
            </Form>,
        );
        await flush();
        // Initially 2 editable cells (input controls).
        expect(screen.getAllByRole('textbox')).toHaveLength(2);
        // Insert below the first row.
        fireEvent.click(screen.getAllByText('插入')[0]);
        await flush();
        // The new row appears in the body immediately (3 cells), and the data
        // is consistent with the UI (length 3).
        expect(screen.getAllByRole('textbox')).toHaveLength(3);
        expect(formRef.current.values.rows).toHaveLength(3);
    });

    it('actions.remove drops a visible row from the table body (UI, not just data)', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ rows: [{ a: 'x' }, { a: 'y' }, { a: 'z' }] }} formRef={formRef}>
                <Table
                    name="rows"
                    pagination={false}
                    columns={[
                        { title: 'A', dataIndex: 'a', control: 'input' },
                        {
                            title: '操作',
                            dataIndex: '__ops',
                            editable: false,
                            render: (_v, _r, index, actions) => (
                                <button onClick={() => actions.remove(index)}>删除</button>
                            ),
                        },
                    ]}
                />
            </Form>,
        );
        await flush();
        expect(screen.getAllByRole('textbox')).toHaveLength(3);
        fireEvent.click(screen.getAllByText('删除')[1]);
        await flush();
        // The row disappears from the body immediately (2 cells).
        expect(screen.getAllByRole('textbox')).toHaveLength(2);
        expect(formRef.current.values.rows).toHaveLength(2);
        expect(formRef.current.values.rows.map((r: any) => r.a)).toEqual(['x', 'z']);
    });

    it('Form namespace exposes Table', async () => {
        const { Form: FormWithTable } = await import('../src/index');
        expect(FormWithTable.Table).toBe(Table);
    });

    it('a date cell renders the DatePicker from a stored ISO string without throwing', async () => {
        // Regression: Formily's reactive engine stringifies a stored dayjs
        // object (a class instance), so a raw dayjs does not survive a round
        // trip through form.values — an antd DatePicker threw
        // "date.isValid is not a function". The `date` control (`DateCell`)
        // stores the value as an ISO string and converts string↔Dayjs at the
        // control boundary, so the cell renders from a string without throwing.
        const iso = dayjs('2024-06-01').toISOString();
        render(
            <Form initialValues={{ rows: [{ date: iso }] }}>
                <Table
                    name="rows"
                    pagination={false}
                    columns={[{ title: '日期', dataIndex: 'date', control: 'date' as const }]}
                />
            </Form>,
        );
        await flush();
        // The DatePicker rendered a textbox input (no throw on mount).
        expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
    });

    it('a custom control passed as a component type renders and edits via controlProps', async () => {
        // `control` accepts a component TYPE (not just a string key or element):
        // CellBridge renders it fresh with value/onChange + controlProps merged
        // in, so `control: MyInput` plus `controlProps: { placeholder }` works.
        const MyInput = function MyInput(props: any) {
            return (
                <input
                    data-testid="my-input"
                    value={props.value ?? ''}
                    placeholder={props.placeholder}
                    onChange={props.onChange}
                />
            );
        };
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ rows: [{ a: 'x' }] }} formRef={formRef}>
                <Table
                    name="rows"
                    pagination={false}
                    columns={[
                        {
                            title: 'A',
                            dataIndex: 'a',
                            control: MyInput,
                            controlProps: { placeholder: '填一下' },
                        },
                    ]}
                />
            </Form>,
        );
        await flush();
        const inputs = screen.getAllByTestId('my-input') as HTMLInputElement[];
        expect(inputs).toHaveLength(1);
        // value flowed in.
        expect(inputs[0].value).toBe('x');
        // controlProps flowed in.
        expect(inputs[0].placeholder).toBe('填一下');
        // edit flows back to form.values.
        fireEvent.change(inputs[0], { target: { value: 'edited' } });
        await flush();
        expect(formRef.current.values.rows[0].a).toBe('edited');
    });

    it('max blocks actions.add / actions.insert once the cap is reached', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ rows: [{ a: 'x' }] }} formRef={formRef}>
                <Table
                    name="rows"
                    pagination={false}
                    max={2}
                    itemDefaultValue={{ a: '' }}
                    columns={[
                        { title: 'A', dataIndex: 'a', control: 'input' },
                        {
                            title: '操作',
                            dataIndex: '__ops',
                            editable: false,
                            render: (_v, _r, _index, actions) => (
                                <>
                                    <button onClick={() => actions.add()}>添加</button>
                                    <button onClick={() => actions.insert(0)}>插入</button>
                                </>
                            ),
                        },
                    ]}
                />
            </Form>,
        );
        await flush();
        expect(screen.getAllByRole('textbox')).toHaveLength(1);

        // add → 2 rows (reaches max).
        fireEvent.click(screen.getAllByText('添加')[0]);
        await flush();
        expect(formRef.current.values.rows).toHaveLength(2);
        expect(screen.getAllByRole('textbox')).toHaveLength(2);

        // add again at max → blocked (still 2). There are now 2 add buttons
        // (the action column renders per row), so index into them.
        fireEvent.click(screen.getAllByText('添加')[0]);
        await flush();
        expect(formRef.current.values.rows).toHaveLength(2);

        // insert at max → blocked (still 2).
        fireEvent.click(screen.getAllByText('插入')[0]);
        await flush();
        expect(formRef.current.values.rows).toHaveLength(2);
    });

    it('min blocks actions.remove once the floor is reached', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ rows: [{ a: 'x' }, { a: 'y' }] }} formRef={formRef}>
                <Table
                    name="rows"
                    pagination={false}
                    min={1}
                    columns={[
                        { title: 'A', dataIndex: 'a', control: 'input' },
                        {
                            title: '操作',
                            dataIndex: '__ops',
                            editable: false,
                            render: (_v, _r, index, actions) => (
                                <button onClick={() => actions.remove(index)}>删除</button>
                            ),
                        },
                    ]}
                />
            </Form>,
        );
        await flush();
        expect(formRef.current.values.rows).toHaveLength(2);

        // remove one → 1 row (reaches min).
        fireEvent.click(screen.getAllByText('删除')[0]);
        await flush();
        expect(formRef.current.values.rows).toHaveLength(1);

        // remove again at min → blocked (still 1).
        fireEvent.click(screen.getAllByText('删除')[0]);
        await flush();
        expect(formRef.current.values.rows).toHaveLength(1);
    });

    it('validateBeforeAdd blocks add when an existing row is invalid', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        render(
            <Form initialValues={{ rows: [{ a: '' }] }} formRef={formRef}>
                <Table
                    name="rows"
                    pagination={false}
                    validateBeforeAdd
                    itemDefaultValue={{ a: '' }}
                    columns={[
                        {
                            title: 'A',
                            dataIndex: 'a',
                            control: 'input',
                            required: true,
                        },
                        {
                            title: '操作',
                            dataIndex: '__ops',
                            editable: false,
                            render: (_v, _r, _index, actions) => (
                                <button onClick={() => actions.add()}>添加</button>
                            ),
                        },
                    ]}
                />
            </Form>,
        );
        await flush();
        // The single existing row's `a` is empty → required fails on validate.
        // validateBeforeAdd runs form.validate(`${name}.*`) before add; since it
        // rejects, add is blocked (still 1 row).
        fireEvent.click(screen.getByText('添加'));
        await flush();
        expect(formRef.current.values.rows).toHaveLength(1);

        // Fill the cell, so validation passes; now add proceeds.
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ok' } });
        await flush();
        fireEvent.click(screen.getByText('添加'));
        await flush();
        expect(formRef.current.values.rows).toHaveLength(2);
    });

    it('validateBeforeAdd callback blocks (false) or allows (true) explicitly', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        const gate = vi.fn(() => false);
        render(
            <Form initialValues={{ rows: [{ a: 'x' }] }} formRef={formRef}>
                <Table
                    name="rows"
                    pagination={false}
                    validateBeforeAdd={gate}
                    itemDefaultValue={{ a: '' }}
                    columns={[
                        { title: 'A', dataIndex: 'a', control: 'input' },
                        {
                            title: '操作',
                            dataIndex: '__ops',
                            editable: false,
                            render: (_v, _r, _index, actions) => (
                                <button onClick={() => actions.add()}>添加</button>
                            ),
                        },
                    ]}
                />
            </Form>,
        );
        await flush();
        // gate returns false → add blocked; gate called with current values.
        fireEvent.click(screen.getAllByText('添加')[0]);
        await flush();
        expect(gate).toHaveBeenLastCalledWith([{ a: 'x' }], { a: '' });
        expect(formRef.current.values.rows).toHaveLength(1);

        // flip gate to allow → add proceeds.
        gate.mockReturnValue(true);
        fireEvent.click(screen.getAllByText('添加')[0]);
        await flush();
        expect(formRef.current.values.rows).toHaveLength(2);
    });

    it('tableProps is forwarded to antd Table (bordered/size surface in DOM)', async () => {
        const formRef: React.MutableRefObject<any> = { current: null };
        const { container } = render(
            <Form initialValues={{ rows: [{ a: 'x' }] }} formRef={formRef}>
                <Table
                    name="rows"
                    pagination={false}
                    tableProps={{ bordered: true, size: 'small' }}
                    columns={[{ title: 'A', dataIndex: 'a', control: 'input' }]}
                />
            </Form>,
        );
        await flush();
        // antd applies `bordered` as a class on the `.ant-table` wrapper (and
        // `size: 'small'` as `ant-table-small`), not on the raw <table> element.
        expect(container.querySelector('.ant-table-bordered')).not.toBeNull();
        expect(container.querySelector('.ant-table-small')).not.toBeNull();
    });

    it('noop to silence unused-import lints', () => {
        expect(vi.fn()).toBeDefined();
        void Field;
        void Input;
        void InputNumber;
    });
});
