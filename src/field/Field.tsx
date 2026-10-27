import * as React from 'react';
import {Field as FormilyField, useField} from '@formily/react';
import {observer} from '@formily/reactive-react';
import {FieldContext} from '../shared/FieldContext';
import {prefixCls} from '../shared/prefixCls';
import {commonMap} from './commonMap';
import {FieldUi} from './FieldUi';
import {NonEditable} from './NonEditable';
import {isOptionControl} from './isOptionControl';
import {useContentName} from './useContentName';
import {useSelectFirst} from './selectFirst';

export interface FieldRenderApi {
    value: any;
    onChange: (value: any) => void;
    state: any;
}

export interface FieldProps {
    /** Field name; may be relative (`.foo`, `..foo`) against the parent context. */
    name: string;
    title?: React.ReactNode;
    required?: boolean;
    editable?: boolean;
    /** Transform the form value before passing it to the control. */
    format?: (value: any) => any;
    /** Transform the control's onChange value before writing it to the form. */
    parse?: (value: any) => any;
    /** Auto-select the first option on mount (for single-select option controls). */
    selectFirst?: boolean;
    /** Render only the control, no label/error shell. */
    hideUi?: boolean;
    /** Show only the required marker + control, hide the title. */
    requiredOnlyUi?: boolean;
    /** Formily validator. */
    validator?: any;
    /** Formily field reactions. */
    reactions?: any;
    /** Optional Formily basePath override. */
    basePath?: string;
    /** A control element, or a render-prop receiving {value, onChange, state}. */
    children?: React.ReactElement | ((api: FieldRenderApi) => React.ReactNode);
}

interface FieldBodyProps {
    resolvedName: string;
    title?: React.ReactNode;
    required?: boolean;
    editable?: boolean;
    format?: (value: any) => any;
    parse?: (value: any) => any;
    selectFirst?: boolean;
    hideUi?: boolean;
    requiredOnlyUi?: boolean;
    content?: React.ReactElement | ((api: FieldRenderApi) => React.ReactNode);
}

/**
 * Renders the field's content from the Formily field model. Lives inside the
 * Formily <Field> so it can read the field via useField() — keeping all hooks
 * at the component top level (no hooks in render-prop callbacks).
 */
function FieldBodyImpl(props: FieldBodyProps): React.ReactElement | null {
    const field: any = useField();
    if (!field) {
        return null;
    }
    const {
        title, required, editable, format, parse,
        selectFirst, hideUi, requiredOnlyUi, content: children,
    } = props;

    useSelectFirst({field, selectFirst, children});

    const isNonEditable = editable === false || field.editable === false;

    let content: React.ReactNode;
    if (isNonEditable) {
        content = <NonEditable value={field.value} format={format} />;
    } else if (typeof children === 'function') {
        content = children({
            value: field.value,
            onChange: (value: any) => field.onInput(parse ? parse(value) : value),
            state: field,
        });
    } else if (React.isValidElement(children)) {
        const childEl = children as React.ReactElement<any>;
        const optionCtrl = isOptionControl(childEl);
        const inject = commonMap(field, {format, parse, isOptionControl: optionCtrl});
        const injectProps: Record<string, any> = {
            onChange: inject.onChange,
            onBlur: inject.onBlur,
            onFocus: inject.onFocus,
        };
        if (optionCtrl) {
            injectProps.checked = inject.checked;
        } else {
            injectProps.value = inject.value;
        }
        if (!childEl.props.placeholder && typeof title === 'string') {
            injectProps.placeholder = `请输入${title}`;
        }
        // Forward `linkedFieldProps`-derived control props. The effects helper
        // merges its `compute` result into `field.componentProps`; spread those
        // onto the control so e.g. cascading `options` reach the Select.
        const componentProps = (field as any)?.componentProps;
        if (componentProps && typeof componentProps === 'object') {
            Object.assign(injectProps, componentProps);
        }
        content = React.cloneElement(childEl, injectProps);
    } else {
        content = children ?? null;
    }

    let node: React.ReactNode;
    if (hideUi) {
        node = content;
    } else if (requiredOnlyUi) {
        node = (
            <div className={`${prefixCls}-field ${prefixCls}-field-required-only`}>
                {required && <span className={`${prefixCls}-field-required`}>*</span>}
                {content}
            </div>
        );
    } else {
        node = (
            <FieldUi label={title} required={required} error={(field as any)?.selfErrors?.[0]}>
                {content}
            </FieldUi>
        );
    }

    return (
        <FieldContext.Provider value={{preName: props.resolvedName, name: props.resolvedName, state: field, mutators: field?.mutators}}>
            {node}
        </FieldContext.Provider>
    );
}

/**
 * `observer` is required because Formily's <Field> uses `component={[]}` (no
 * rendered component), so its own ReactiveInternal never reads `field.value` /
 * `field.errors` during render and therefore won't re-subscribe to those
 * changes. Wrapping FieldBody makes it reactive to value/error/pattern changes
 * so render-prop children, injected controls and the error message all update.
 */
const FieldBody = observer(FieldBodyImpl);

/**
 * rsform Field wraps Formily's <Field> and auto-injects value/onChange into the
 * child control, switches to `checked` for option controls, supports
 * format/parse transforms, editable=false -> NonEditable, selectFirst, relative
 * name resolution, and publishes a FieldContext for descendants.
 */
export function Field(props: FieldProps): React.ReactElement {
    const {
        name, title, required, editable, format, parse,
        selectFirst, hideUi, requiredOnlyUi, validator, reactions, basePath, children,
    } = props;

    const resolvedName = useContentName(name);

    return (
        <FormilyField
            name={resolvedName}
            basePath={basePath ?? ''}
            title={title}
            required={required}
            editable={editable}
            validator={validator}
            reactions={reactions}
            component={[]}
        >
            <FieldBody
                resolvedName={resolvedName}
                title={title}
                required={required}
                editable={editable}
                format={format}
                parse={parse}
                selectFirst={selectFirst}
                hideUi={hideUi}
                requiredOnlyUi={requiredOnlyUi}
                content={children}
            />
        </FormilyField>
    );
}
