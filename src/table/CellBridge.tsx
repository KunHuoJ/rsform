import * as React from 'react';
import { useForm } from '@formily/react';
import { toJS } from '@formily/reactive';
import { observer } from '@formily/reactive-react';
import { getControl } from '../controls/FormComMap';
import { prefixCls } from '../shared/prefixCls';

export interface CellBridgeProps {
    /** Absolute row index (page-corrected). */
    rowIndex: number;
    /** The field key within the row (e.g. 'price'). */
    dataIndex: string;
    /** The array field name (e.g. 'rows'). */
    arrayName: string;
    /** Control: a FormComMap key string, a component type, or a React element. */
    control?: string | React.ComponentType<any> | React.ReactElement;
    /** Extra props merged into the control (options, placeholder, …). */
    controlProps?: Record<string, any>;
    /** Formily validator attached to the cell's registered field. */
    validator?: any;
    /** Whether this cell is required (empty value fails validation). */
    required?: boolean;
    /** Error message shown when a `required` cell is empty. Default '必填'. */
    requiredMessage?: string;
    /** Whether the cell is editable; false → read-only text. */
    editable?: boolean;
}

const cellPath = (arrayName: string, rowIndex: number, dataIndex: string) =>
    `${arrayName}.${rowIndex}.${dataIndex}`;

/** Whether a value counts as "empty" for `required` validation. */
function isEmptyValue(v: unknown): boolean {
    if (v == null) return true;
    if (typeof v === 'string') return v.trim() === '';
    if (Array.isArray(v)) return v.length === 0;
    return false;
}

/**
 * Compose the cell's validator: a required rule (when `required`) ahead of the
 * user's `validator`. The required rule returns a fixed message on empty; the
 * user validator runs only when the value is non-empty (or when not required).
 */
function composeValidator(
    required: boolean | undefined,
    requiredMessage: string | undefined,
    validator: any,
): any {
    const reqMsg = requiredMessage ?? '必填';
    const reqRule = required ? (value: any) => (isEmptyValue(value) ? reqMsg : '') : null;
    if (!reqRule) return validator;
    if (typeof validator !== 'function') return reqRule;
    // Run required first; if it fails, short-circuit (don't run the user
    // validator on an empty value — it may throw on undefined).
    return (value: any) => {
        const reqError = reqRule(value);
        if (reqError) return reqError;
        const result = validator(value);
        return result;
    };
}

/**
 * The high-perf editable cell. NOT a Formily `<Field>`:
 *
 *  - The cell's DISPLAY value is read reactively from the deep form-values path
 *    `form.values[arrayName][rowIndex][dataIndex]`. Formily's `form.values` is a
 *    deeply observable tree, so this reads ONLY that leaf — editing cell (i,j)
 *    notifies just cell (i,j)'s observer, not the other N×M-1 cells. (This is
 *    the key difference from a "whole array value" subscription, which would
 *    re-fire every cell on every edit.)
 *  - `onChange` writes through the cell field's `onInput(v)`. `onInput` sets the
 *    leaf value (firing only this cell's leaf observer → single-cell re-render),
 *    runs the cell's validator, and propagates through the Formily field
 *    lifecycle so `onFieldValueChange` effects on the cell path fire — all
 *    without replacing the row object (so sibling cells in the same row do not
 *    re-render). `form.setValuesIn(cellPath, v)` would also do single-cell
 *    re-render but would NOT trigger validation or field effects.
 *  - The cell registers a Formily field in `useEffect` (via `form.createField`)
 *    for every EDITABLE cell. The field model exists for validation + onInput,
 *    but CellBridge does NOT subscribe to the field's value (it reads the
 *    `form.values` leaf); it subscribes only to the field's `selfErrors` (a
 *    narrow, rare-event read).
 *  - The Table body does NOT subscribe to the array value for cell edits — it
 *    re-renders only on length changes (add/remove) via a `lenTick` — so an edit
 *    never walks the whole row/cell tree.
 */
export const CellBridge = observer(function CellBridge({
    rowIndex,
    dataIndex,
    arrayName,
    control,
    controlProps,
    validator,
    required,
    requiredMessage,
    editable = true,
}: CellBridgeProps): React.ReactElement {
    const form: any = useForm();
    const path = cellPath(arrayName, rowIndex, dataIndex);

    // Compose the cell's validator: required rule (if any) ahead of the user
    // validator. Memoised so the createField effect only re-runs when the
    // composed validator's identity actually changes.
    const composedValidator = React.useMemo(
        () => composeValidator(required, requiredMessage, validator),
        [required, requiredMessage, validator],
    );

    // Register a Formily field on mount for every EDITABLE cell — this is the
    // field `onInput` writes through (so validators + `onFieldValueChange`
    // effects fire on edit) and whose `selfErrors` the cell observes. Re-run
    // only when the composed validator changes. The field's value is NOT read
    // here (the deep values read below drives display); only `selfErrors` is.
    React.useEffect(() => {
        if (!form || editable === false) {
            return;
        }
        try {
            form.createField({
                name: path,
                basePath: '',
                validator: composedValidator,
            });
        } catch {
            // createField may no-op if a field already exists at this path
            // (e.g. re-mount in StrictMode); that is fine.
        }
    }, [form, path, composedValidator, editable]);

    // Display value: read ONLY this leaf of the deeply-observable form.values
    // tree. Editing this cell notifies just this observer; editing any other
    // cell notifies a different leaf, so this cell never re-renders for it.
    // `toJS` unwraps the reactive Proxy back to a plain value — required for
    // controls whose value is a class instance with prototype methods (e.g. an
    // antd DatePicker dayjs object: the Proxy strips `.isValid`, breaking the
    // picker). Plain primitives (string/number/boolean) pass through unchanged.
    const raw = form?.values?.[arrayName]?.[rowIndex]?.[dataIndex];
    const value = toJS(raw);

    // Read this cell's errors reactively (observer layer). This is the only
    // other reactive read inside a cell, and it changes rarely.
    const field = form?.query?.(path)?.take?.();
    const error: string | undefined = field?.selfErrors?.[0];

    const handleChange = React.useCallback(
        (next: any) => {
            if (!form) return;
            // Extract the value: antd Input passes a synthetic event
            // (next.target.value), while InputNumber/Select/Switch pass the
            // bare value/checked. Match commonMap's convention.
            const v =
                next && typeof next === 'object' && 'target' in next
                    ? (next as React.ChangeEvent<HTMLInputElement>).target.value
                    : next;
            // Write through the cell field's `onInput`: sets the leaf value
            // (firing only this cell's leaf observer → single-cell re-render),
            // runs the validator, and propagates through the Formily lifecycle
            // so `onFieldValueChange` effects fire — all without replacing the
            // row object (sibling cells in the same row do not re-render).
            // `form.setValuesIn(cellPath, v)` would also single-cell re-render
            // but would NOT trigger validation or field effects. Falls back to
            // `setValuesIn` if the field has not been registered yet.
            const cellField = form.query?.(path)?.take?.();
            if (cellField) {
                cellField.onInput(v);
            } else {
                form.setValuesIn(path, v);
            }
        },
        [form, path],
    );

    const readOnly = editable === false || control == null;

    let content: React.ReactNode;
    if (readOnly) {
        content = value == null || value === '' ? '-' : String(value);
    } else if (React.isValidElement(control)) {
        // A concrete element: clone it with value/onChange + controlProps.
        content = React.cloneElement(control as React.ReactElement<any>, {
            value,
            onChange: handleChange,
            ...controlProps,
        });
    } else if (typeof control === 'function') {
        // A component TYPE (function/class/forwardRef/memo): render it fresh
        // with value/onChange + controlProps. This is the most ergonomic form
        // for a custom control that takes props — `control: MyInput` plus
        // `controlProps: {...}` — no need to pre-register a string key or wrap
        // in an element.
        const ControlComp = control as React.ComponentType<any>;
        content = <ControlComp value={value} onChange={handleChange} {...controlProps} />;
    } else if (typeof control === 'string') {
        const ControlComp = getControl(control);
        if (!ControlComp) {
            content = String(value ?? '');
        } else {
            content = <ControlComp value={value} onChange={handleChange} {...controlProps} />;
        }
    } else {
        content = String(value ?? '');
    }

    return (
        <div className={`${prefixCls}-table-cell`}>
            {content}
            {error && <div className={`${prefixCls}-field-error-message`}>{error}</div>}
        </div>
    );
});

/**
 * Resolve the absolute row index. antd5 Table's `render(value, record, index)`
 * passes a PAGE-RELATIVE index (R3 spike). We correct it to absolute via the
 * current page + pageSize, falling back to the record's stable id field when
 * available (the most robust signal).
 */
export function resolveAbsoluteIndex(
    relativeIndex: number,
    record: any,
    current?: number,
    pageSize?: number,
    idField?: string,
): number {
    if (idField != null && record != null && record[idField] != null) {
        const n = Number(record[idField]);
        if (Number.isFinite(n)) return n;
    }
    const page = current && current > 0 ? current : 1;
    const size = pageSize && pageSize > 0 ? pageSize : 0;
    return size > 0 ? (page - 1) * size + relativeIndex : relativeIndex;
}
