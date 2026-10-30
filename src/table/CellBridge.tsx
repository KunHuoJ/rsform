import * as React from 'react';
import { useForm } from '@formily/react';
import { toJS } from '@formily/reactive';
import { observer } from '@formily/reactive-react';
import { type ControlKey, getControl } from '../controls/FormComMap';
import { prefixCls } from '../shared/prefixCls';

export interface CellBridgeProps {
    /** 绝对行索引（已做分页校正）。 */
    rowIndex: number;
    /** 行内的字段键（例如 'price'）。 */
    dataIndex: string;
    /** 数组 field 名称（例如 'rows'）。 */
    arrayName: string;
    /** 控件：FormComMap 的键字符串、组件类型，或 React 元素。 */
    control?: ControlKey | React.ComponentType<any> | React.ReactElement | (string & {});
    /** 合并进控件的额外 props（options、placeholder 等）。 */
    controlProps?: Record<string, any>;
    /** 挂到单元格已注册 field 上的 Formily 校验器。 */
    validator?: any;
    /** 本单元格是否必填（空值会校验失败）。 */
    required?: boolean;
    /** `required` 单元格为空时显示的错误信息。默认 '必填'。 */
    requiredMessage?: string;
    /** 单元格是否可编辑；false → 只读文本。 */
    editable?: boolean;
}

const cellPath = (arrayName: string, rowIndex: number, dataIndex: string) =>
    `${arrayName}.${rowIndex}.${dataIndex}`;

/** 判断某个值对 `required` 校验是否算作「空」。 */
function isEmptyValue(v: unknown): boolean {
    if (v == null) return true;
    if (typeof v === 'string') return v.trim() === '';
    if (Array.isArray(v)) return v.length === 0;
    return false;
}

/**
 * 组合单元格的校验器：把必填规则（当 `required` 时）排在用户的 `validator`
 * 之前。必填规则在值为空时返回固定信息；用户校验器只在值非空时
 * （或不要求必填时）才运行。
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
    // 先跑必填；若未通过则短路（不要对空值运行用户校验器——
    // 它可能在 undefined 上抛错）。
    return (value: any) => {
        const reqError = reqRule(value);
        if (reqError) return reqError;
        const result = validator(value);
        return result;
    };
}

/**
 * 高性能可编辑单元格。它不是 Formily 的 `<Field>`：
 *
 *  - 单元格的显示值响应式地从 form-values 的深层路径
 *    `form.values[arrayName][rowIndex][dataIndex]` 读取。Formily 的 `form.values`
 *    是一棵深度可观察的树，因此这里只读取那一个叶子——编辑单元格 (i,j)
 *    只通知单元格 (i,j) 的 observer，而非其余 N×M-1 个单元格。（这是与
 *    「整个数组值」订阅的关键区别，后者会在每次编辑时触发每个单元格。）
 *  - `onChange` 通过单元格 field 的 `onInput(v)` 写入。`onInput` 设置叶子值
 *    （只触发本单元格的叶子 observer → 单个单元格重渲染）、运行单元格的校验器，
 *    并沿 Formily 的 field 生命周期传播，使单元格路径上的 `onFieldValueChange`
 *    副作用得以触发——全程不替换行对象（因此同行的兄弟单元格不会重渲染）。
 *    `form.setValuesIn(cellPath, v)` 同样能做到单个单元格重渲染，
 *    但不会触发校验或 field 副作用。
 *  - 单元格在 `useEffect` 中为每个可编辑单元格注册一个 Formily field
 *    （通过 `form.createField`）。该 field 模型用于校验 + onInput，
 *    但 CellBridge 不订阅该 field 的值（它读取 `form.values` 的叶子）；
 *    它只订阅该 field 的 `selfErrors`（一个范围很窄、很少触发的读取）。
 *  - Table body 不会为单元格编辑订阅数组值——它只在长度变化（增加/删除）时
 *    借助 `lenTick` 重渲染——因此一次编辑绝不会遍历整个行/单元格树。
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

    // 组合单元格的校验器：必填规则（若有）排在用户校验器之前。
    // 做了 memo，使 createField 副作用只在组合后校验器的标识真正变化时才重跑。
    const composedValidator = React.useMemo(
        () => composeValidator(required, requiredMessage, validator),
        [required, requiredMessage, validator],
    );

    // 挂载时为每个可编辑单元格注册一个 Formily field——这正是 `onInput`
    // 写入的那个 field（使编辑时校验器 + `onFieldValueChange` 副作用触发），
    // 也是单元格所观察的 `selfErrors` 所属的 field。只在组合后校验器变化时才重跑。
    // 这里不读取该 field 的值（下方对深层 values 的读取负责显示）；只读 `selfErrors`。
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
            // 若该路径上已存在 field，createField 可能是空操作
            // （例如 StrictMode 下的重新挂载）；这没有问题。
        }
    }, [form, path, composedValidator, editable]);

    // 显示值：只读取这棵深度可观察的 form.values 树的该叶子。
    // 编辑本单元格只通知本 observer；编辑任何其他单元格通知的是另一个叶子，
    // 因此本单元格绝不会因它而重渲染。
    // `toJS` 把响应式 Proxy 还原为普通值——对于值是带原型方法的类实例的控件
    // 是必需的（例如 antd DatePicker 的 dayjs 对象：Proxy 会剥掉 `.isValid`，
    // 使 picker 失效）。普通基本类型（string/number/boolean）则原样透传。
    const raw = form?.values?.[arrayName]?.[rowIndex]?.[dataIndex];
    const value = toJS(raw);

    // 响应式地读取本单元格的错误（observer 层）。这是单元格内唯一的另一处
    // 响应式读取，且很少变化。
    const field = form?.query?.(path)?.take?.();
    const error: string | undefined = field?.selfErrors?.[0];

    const handleChange = React.useCallback(
        (next: any) => {
            if (!form) return;
            // 取出值：antd Input 传入的是合成事件（next.target.value），
            // 而 InputNumber/Select/Switch 传入的是裸值/checked。
            // 与 commonMap 的约定保持一致。
            const v =
                next && typeof next === 'object' && 'target' in next
                    ? (next as React.ChangeEvent<HTMLInputElement>).target.value
                    : next;
            // 通过单元格 field 的 `onInput` 写入：设置叶子值
            // （只触发本单元格的叶子 observer → 单个单元格重渲染）、运行校验器，
            // 并沿 Formily 生命周期传播，使 `onFieldValueChange` 副作用触发——
            // 全程不替换行对象（同行的兄弟单元格不会重渲染）。
            // `form.setValuesIn(cellPath, v)` 同样能做到单个单元格重渲染，
            // 但不会触发校验或 field 副作用。若 field 尚未注册，
            // 则回退到 `setValuesIn`。
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
        // 一个具体的元素：克隆它并注入 value/onChange + controlProps。
        content = React.cloneElement(control as React.ReactElement<any>, {
            value,
            onChange: handleChange,
            ...controlProps,
        });
    } else if (typeof control === 'function') {
        // 一个组件类型（function/class/forwardRef/memo）：用 value/onChange
        // + controlProps 重新渲染它。这是带 props 的自定义控件最顺手的形式——
        // `control: MyInput` 加上 `controlProps: {...}`——无需预先注册字符串键，
        // 也无需包成元素。
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
 * 解析绝对行索引。antd5 Table 的 `render(value, record, index)` 传入的是
 * 分页相对索引（R3 spike）。我们通过当前页 + pageSize 把它校正为绝对索引。
 * 这里不使用行的稳定 id（`rowKey`）——稳定的身份标识并不是数组索引，
 * 把二者混为一谈会把单元格的读/写/副作用发到错误的叶子路径
 * （`rows.${businessId}.x`）。
 */
export function resolveAbsoluteIndex(
    relativeIndex: number,
    current?: number,
    pageSize?: number,
): number {
    const page = current && current > 0 ? current : 1;
    const size = pageSize && pageSize > 0 ? pageSize : 0;
    return size > 0 ? (page - 1) * size + relativeIndex : relativeIndex;
}
