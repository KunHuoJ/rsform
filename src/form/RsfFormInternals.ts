import * as React from 'react';

/**
 * rsform-internal form wiring exposed to rsform components that live inside a
 * `<Form>` (currently just `Submit`). Kept separate from the antd-free
 * `FieldContext` because it carries submit/reset promise bookkeeping that only
 * rsform's own components need.
 *
 *  - `submitPromiseRef`: holds the promise returned by the form's `onSubmit`
 *    callback for the in-flight submit. `form.submit()` (no arg) fires the
 *    form's `onSubmit` through the `onFormSubmit` lifecycle but does NOT await
 *    it, so `Submit` reads this ref to keep its loading state alive for the
 *    real onSubmit duration.
 */
export interface RsfFormInternals {
    submitPromiseRef: React.MutableRefObject<Promise<any> | undefined>;
    /**
     * The form's `onSubmit` callback (held in a ref so the form, created once,
     * always invokes the freshest). `Submit` temporarily swaps this ref to its
     * own `onSubmit` prop for the duration of a click so the prop overrides —
     * not adds to — the form-level callback, then restores it.
     */
    onSubmitRef: React.MutableRefObject<((values: any) => void | Promise<void>) | undefined>;
}

export const RsfFormInternalsContext = React.createContext<RsfFormInternals | null>(null);

/** Read the nearest rsform form internals, or null outside a `<Form>`. */
export function useFormInternals(): RsfFormInternals | null {
    return React.useContext(RsfFormInternalsContext);
}
