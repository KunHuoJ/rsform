import * as React from 'react';
import { createForm, type Form as FormilyForm } from '@formily/core';
import { FormProvider } from '@formily/react';
import { type EffectsProp, type MergeEffectsOptions, mergeEffects } from '../effects/mergeEffects';
import { FieldContext } from '../shared/FieldContext';
import { type RsfFormInternals, RsfFormInternalsContext } from './RsfFormInternals';
import { scrollToFirstError } from './validateFailedScroll';

export interface FormProps {
    /** 外部传入的表单实例;省略时 rsform 会自行创建一个。 */
    form?: FormilyForm;
    initialValues?: Record<string, any>;
    /** 异步初始值;表单在其解析完成后才挂载。 */
    asyncInitialValues?: () => Promise<Record<string, any>>;
    /**
     * Effect 函数(或其数组,按顺序依次展开执行)。每个函数都会收到
     * rsform 的 `$` 辅助工具集:可使用 `$.linkedFieldProps`、
     * `$.validateField`、`$.onEachRowChange` 等,或直接调用裸的 Formily
     * 生命周期 hooks(它们会自动注册到当前激活的表单上)。如需访问原始
     * 表单实例,使用 `$.form`。
     */
    effects?: EffectsProp;
    onSubmit?: (values: any) => void | Promise<void>;
    onReset?: () => void;
    validateFirst?: boolean;
    /** 'scroll'(默认行为)或校验失败时触发的自定义回调。 */
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

    // 将最新的 onSubmit/onReset 保存在 ref 中,使得(在创建时一次性注册的)
    // 表单 effects 始终调用最新的回调,而无需重建表单。
    const onSubmitRef = React.useRef<FormProps['onSubmit']>(onSubmit);
    const onResetRef = React.useRef<FormProps['onReset']>(onReset);
    onSubmitRef.current = onSubmit;
    onResetRef.current = onReset;

    // 保存进行中的 onSubmit promise,使 Submit 能在真实 onSubmit 执行期间
    // 保持其 loading 状态(form.submit() 通过 onFormSubmit 生命周期触发
    // onSubmit,但并不会 await 它)。
    const submitPromiseRef = React.useRef<Promise<any> | undefined>(undefined);
    const internals: RsfFormInternals = React.useMemo(
        () => ({ submitPromiseRef, onSubmitRef }),
        [],
    );

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
        // 仅在异步值首次到达或提供了外部表单时才重建表单。初始值 / effects
        // 的变化在运行时并不会重建表单。
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formProp, asyncValues]);

    React.useEffect(() => {
        if (formRef) {
            formRef.current = form;
        }
    }, [form, formRef]);

    // 在渲染期间同步暴露表单,使子级 effects(它们先于本组件自身的 effect
    // 运行)就能读取到 formRef.current —— 这对以编程方式创建字段(例如
    // 高性能 Table 的 CellBridge)以及那些通过 useEffect 驱动表单的测试是必需的。
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
