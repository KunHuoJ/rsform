import * as React from 'react';
import {useForm} from '@formily/react';
import {observer} from '@formily/reactive-react';
import {useContentName} from '../field/useContentName';

export interface FormConsumerProps {
    /**
     * Field name to subscribe to. Relative names (`.foo`, `..foo`) resolve
     * against the nearest FieldContext — same path rules as Form.Field.
     *
     * When omitted, subscribes to the whole `form.values`: `children` receives
     * the complete values object and re-renders on any field change.
     */
    name?: string;
    /**
     * Render prop: receives the subscribed data and returns nodes.
     *  - without `name`: `data` is the whole `form.values`
     *  - with `name`: `data` is that field's value (only re-renders on leaf change)
     */
    children: (data: any) => React.ReactNode;
}

/**
 * Render-prop subscriber over reactive form state — a declarative way to read
 * form values inline without dropping into `useForm()` + `observer` by hand.
 *
 * Built on Formily v2's reactive engine: reads happen inside an `observer`, so
 * the engine tracks exactly the leaves touched and re-renders only when those
 * leaves change.
 *
 *  - `<Form.Consumer>{values => …}</Form.Consumer>` — any field change re-renders.
 *  - `<Form.Consumer name="province">{v => …}</Form.Consumer>` — only that leaf.
 *
 * Note: this is rsform's own convenience component; it is not a port of any
 * icloud-ui API (icloud-ui exposes a `useData()` hook instead). Implemented
 * clean-room on Formily v2's reactive primitives.
 */
export const Consumer = observer(function Consumer({name, children}: FormConsumerProps) {
    const form = useForm();
    const resolved = name ? useContentName(name) : '';
    // Read inside the observer so Formily tracks the leaves we touch — a
    // whole-values subscribe tracks everything; a named subscribe tracks the
    // single leaf, so only its change re-renders this component.
    const data = resolved ? form.getValuesIn(resolved) : form.values;
    return <>{children(data)}</>;
});
