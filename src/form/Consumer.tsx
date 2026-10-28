import type * as React from 'react';
import { useForm } from '@formily/react';
import { observer } from '@formily/reactive-react';
import { useContentName } from '../field/useContentName';

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

export const Consumer = observer(function Consumer({ name, children }: FormConsumerProps) {
    const form = useForm();
    const resolved = name ? useContentName(name) : '';
    // Read inside the observer so Formily tracks the leaves we touch — a
    // whole-values subscribe tracks everything; a named subscribe tracks the
    // single leaf, so only its change re-renders this component.
    const data = resolved ? form.getValuesIn(resolved) : form.values;
    return <>{children(data)}</>;
});
