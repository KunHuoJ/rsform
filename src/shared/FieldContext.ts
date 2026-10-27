import * as React from 'react';

/**
 * FieldContext carries the resolved field path and Formily field model down
 * the tree so descendants (relative-name children, table cells, array rows)
 * can resolve their own names and write through the right mutator.
 */
export interface IFieldContext {
    /** Resolved path prefix for relative names (empty at the form root). */
    preName: string;
    /** This field's resolved full name. */
    name: string;
    /** The Formily field model, or null at the form root. */
    state: any;
    /** Array mutators if this field is an ArrayField. */
    mutators?: any;
}

const ROOT_CONTEXT: IFieldContext = {
    preName: '',
    name: '',
    state: null,
};

export const FieldContext = React.createContext<IFieldContext>(ROOT_CONTEXT);

/**
 * Read the nearest FieldContext. Outside a Form this returns the root
 * context (empty preName, null state) rather than throwing, so utility
 * hooks that may run in test isolation don't blow up.
 */
export function useFieldContext<T = IFieldContext>(): T {
    return React.useContext(FieldContext) as unknown as T;
}

export const FieldContextProvider = FieldContext.Provider;
