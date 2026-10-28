import { createForm, type Form as FormilyForm } from '@formily/core';
import { FormProvider } from '@formily/react';
import * as React from 'react';
import { type EffectsProp, type MergeEffectsOptions, mergeEffects } from '../effects/mergeEffects';
import { FieldContext } from '../shared/FieldContext';
import { type RsfFormInternals, RsfFormInternalsContext } from './RsfFormInternals';
import { scrollToFirstError } from './validateFailedScroll';

export interface FormProps {
    /** External form instance; rsform creates one if omitted. */
    form?: FormilyForm;
    initialValues?: Record<string, any>;
    /** Async initial values; the form mounts after they resolve. */
    asyncInitialValues?: () => Promise<Record<string, any>>;
    /**
     * Effect function (or array of them, fanned out in order). Each receives
     * the rsform `$` helpers bundle: use `$.linkedFieldProps`,
     * `$.validateField`, `$.onEachRowChange`, etc., or call bare Formily
     * lifecycle hooks directly (they auto-register on the active form). For
     * raw form access use `$.form`.
     */
    effects?: EffectsProp;
    onSubmit?: (values: any) => void | Promise<void>;
    onReset?: () => void;
    validateFirst?: boolean;
    /** 'scroll' (default behaviour) or a custom callback on validate failure. */
    validateFailed?: 'scroll' | ((firstErrorField: any) => void);
    formRef?: React.MutableRefObject<FormilyForm | null>;
    children?: React.ReactNode;
}

function buildMergeEffects(
    effects: FormProps['effects'],
    validateFailed: FormProps['validateFailed'],
    onSubmitRef: React.MutableRefObject<FormProps['onSubmit']>,
    onResetRef: React.MutableRefObject<FormProps['onReset']>,
    submitPromiseRef: React.MutableRefObject<Promise<any> | undefined>,
): (form: FormilyForm) => void {
    const opts: MergeEffectsOptions = {
        validateFailed,
        onSubmitRef: onSubmitRef as {
            current: ((values: any) => void | Promise<void>) | undefined;
        },
        onResetRef: onResetRef as { current: (() => void) | undefined },
        scrollToFirstError: validateFailed === 'scroll' ? scrollToFirstError : undefined,
        submitPromiseRef,
    };
    return mergeEffects(effects, opts);
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

    // Holds the in-flight onSubmit promise so Submit can keep its loading state
    // alive for the real onSubmit duration (form.submit() fires onSubmit through
    // the onFormSubmit lifecycle but does not await it).
    const submitPromiseRef = React.useRef<Promise<any> | undefined>(undefined);
    const internals: RsfFormInternals = React.useMemo(() => ({ submitPromiseRef }), []);

    React.useEffect(() => {
        if (!asyncInitialValues) {
            return;
        }
        let cancelled = false;
        asyncInitialValues().then((values) => {
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
            initialValues:
                asyncValues && Object.keys(asyncValues).length
                    ? { ...asyncValues, ...(initialValues ?? {}) }
                    : initialValues,
            effects: buildMergeEffects(
                effects,
                validateFailed,
                onSubmitRef,
                onResetRef,
                submitPromiseRef,
            ),
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
            <RsfFormInternalsContext.Provider value={internals}>
                <FieldContext.Provider value={{ preName: '', name: '', state: null }}>
                    {children}
                </FieldContext.Provider>
            </RsfFormInternalsContext.Provider>
        </FormProvider>
    );
}
