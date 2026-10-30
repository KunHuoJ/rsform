import * as FormilyReact from '@formily/react';
import { Field } from '../field/Field';
import { Consumer } from './Consumer';
import { Form as FormComponent } from './Form';

/**
 * rsform.Form 即 Form 组件,并将各子组件作为静态属性挂载:
 * Form.Field、Form.Consumer、Form.Formily(完整的 @formily/react 命名空间)。
 *
 * antd 控件(Form.Input、Form.Select、…)、Form.Submit、Form.Button、
 * Form.Table 和 Form.ArrayItems 在 `src/index.ts`(单一 `rsform` 入口)中挂载,
 * 因此 `import { Form } from 'rsform'` 能得到完整命名空间。本 `FormNamespace`
 * 模块只保留核心的(不依赖 antd 的)部分,以便单一入口复用它而不涉及循环依赖。
 */
export const Form = Object.assign(FormComponent, {
    Field,
    Consumer,
    Formily: FormilyReact,
}) as typeof FormComponent & {
    Field: typeof Field;
    Consumer: typeof Consumer;
    Formily: typeof FormilyReact;
};

export type { FormConsumerProps } from './Consumer';
export type { FormProps } from './Form';
