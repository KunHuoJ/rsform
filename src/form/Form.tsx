import * as React from 'react';
import {createForm, onFormSubmit, onFormSubmitValidateFailed, type Form as FormilyForm} from '@formily/core';
import {FormProvider} from '@formily/react';
import {FieldContext} from '../shared/FieldContext';
import {scrollToFirstError} from './validateFailedScroll';

export interface FormProps {
    /** External form instance; rsform creates one if omitted. */
    form?: FormilyForm;
    initialValues?: Record<string, any>;
    /** Async initial values; the form mounts after they resolve. */
    asyncInitialValues?: () => Promise<Record<string, any>>;
    /**
     * Effect function (or array of them). For Phase 1 these are passed
     * through to Formily's `createForm` effects verbatim; Phase 2 layers the
     * rsform sugar (`linkedFieldProps`, `validateField`, etc.) on top.
     */
    effects?: ((form: FormilyForm) => void) | Array<(form: FormilyForm) => void>;
    onSubmit?: (values: any) => void | Promise<void>;
    onReset?: () => void;
    validateFirst?: boolean;
    /** 'scroll' (default behaviour) or a custom callback on validate failure. */
    validateFailed?: 'scroll' | ((firstErrorField: any) => void);
    formRef?: React.MutableRefObject<FormilyForm | null>;
    children?: React.ReactNode;
}

function mergeEffects(
    effects: FormProps['effects'],
    validateFailed: FormProps['validateFailed'],
    onSubmitRef: React.MutableRefObject<FormProps['onSubmit']>,
    onResetRef: React.MutableRefObject<FormProps['onReset']>,
): (form: FormilyForm) => void {
    const fns: Array<(form: FormilyForm) => void> = [];
    if (Array.isArray(effects)) {
        fns.push(...effects);
    } else if (typeof effects === 'function') {
        fns.push(effects);
    }
    fns.push(form => {
        onFormSubmit(() => {
            if (onSubmitRef.current) {
                return onSubmitRef.current(form.values);
            }
        });
    });
    // onReset is exposed via formRef.current.reset(); the onReset prop is held
    // in a ref for future wiring and to keep the public API stable.
    void onResetRef;
    if (validateFailed) {
        fns.push(form => {
            onFormSubmitValidateFailed(() => {
                if (validateFailed === 'scroll') {
                    scrollToFirstError();
                } else {
                    const first = form.query('*').take(field => (field as any)?.errors?.length > 0);
                    validateFailed(first);
                }
            });
        });
    }
    return (form: FormilyForm) => {
        fns.forEach(fn => fn(form));
    };
}

export function Form(props: FormProps): React.ReactElement {
    const {
        form: formProp,
        initialValues,
        asyncInitialValues,
        effects,
        onSubmit,
        onReset,
        validateFirst,
        validateFailed,
        formRef,
        children,
    } = props;

    const [asyncValues, setAsyncValues] = React.useState<Record<string, any> | null>(
        asyncInitialValues ? null : {},
    );

    // Keep latest onSubmit/onReset in refs so the form effects (registered once
    // at creation) always invoke the freshest callbacks without recreating the form.
    const onSubmitRef = React.useRef<FormProps['onSubmit']>(onSubmit);
    const onResetRef = React.useRef<FormProps['onReset']>(onReset);
    onSubmitRef.current = onSubmit;
    onResetRef.current = onReset;

    React.useEffect(() => {
        if (!asyncInitialValues) {
            return;
        }
        let cancelled = false;
        asyncInitialValues().then(values => {
            if (!cancelled) {
                setAsyncValues(values ?? {});
            }
        });
        return () => {
            cancelled = true;
        };
    }, [asyncInitialValues]);

    const form = React.useMemo<FormilyForm>(() => {
        if (formProp) {
            return formProp;
        }
        return createForm({
            initialValues: asyncValues && Object.keys(asyncValues).length
                ? {...asyncValues, ...(initialValues ?? {})}
                : initialValues,
            effects: mergeEffects(effects, validateFailed, onSubmitRef, onResetRef),
            validateFirst,
        });
        // Re-create the form only when the async values first land or when an
        // external form is supplied. Initial values / effects changes are NOT
        // meant to recreate the form at runtime.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formProp, asyncValues]);

    React.useEffect(() => {
        if (formRef) {
            formRef.current = form;
        }
    }, [form, formRef]);

    // Expose the form synchronously during render so child effects (which run
    // before this component's own effect) can already read formRef.current —
    // needed for programmatic field creation (e.g. the high-perf Table's
    // CellBridge) and for tests that drive the form from a useEffect.
    if (formRef) {
        formRef.current = form;
    }

    if (asyncInitialValues && asyncValues === null) {
        return <div className="rsf-form-loading">loading…</div>;
    }

    return (
        <FormProvider form={form}>
            <FieldContext.Provider value={{preName: '', name: '', state: null}}>
                {children}
            </FieldContext.Provider>
        </FormProvider>
    );
}
