import type * as React from 'react';
import { DateCell } from './DatePicker';
import { Input } from './Input';
import { InputNumber } from './InputNumber';
import { RadioGroup } from './RadioGroup';
import { Select } from './Select';
import { Switch } from './Switch';

/**
 * rsform 控件注册表。将一个简短的字符串 key 映射到一个控件组件，使表格列定义
 * （以及其他数据驱动的 UI）无需导入组件即可指名使用某个控件。高性能 Table 的
 * CellBridge 会在此按某列的 `control` key 查找，从而为每个单元格渲染正确的输入控件。
 *
 * 这些 key 是稳定的 rsform 约定；消费方可通过 `registerControl(key, component)`
 * 注册自己的 key，从而在不 fork 的情况下扩展 Table。
 */
export type ControlComponent = React.ComponentType<any>;

/**
 * 控件注册表的类型接口。内置键在此声明；消费方可通过 TS 的**声明合并**
 * （declaration merging）扩充本接口，从而让自定义控件的 key 也进入
 * `ControlKey`（IDE 自动补全 + 类型校验），而无需 fork：
 *
 * ```ts
 * import type { ControlComponent } from 'rsform';
 * declare module 'rsform' {
 *     interface RsfControlRegistry {
 *         rate: ControlComponent;
 *     }
 * }
 * ```
 *
 * 声明合并后，`<Table>` 列的 `control: 'rate'` 以及 `registerControl('rate', Rate)`
 * 都会被类型系统识别。
 */
export interface RsfControlRegistry {
    input: ControlComponent;
    inputNumber: ControlComponent;
    select: ControlComponent;
    radioGroup: ControlComponent;
    switch: ControlComponent;
    date: ControlComponent;
}

/**
 * 已知控件 key 的联合类型，取自 `RsfControlRegistry` 的键。它随消费方对
 * `RsfControlRegistry` 的声明合并而自动扩展。
 */
export type ControlKey = keyof RsfControlRegistry & string;

const registry: Record<string, ControlComponent> = {
    input: Input,
    inputNumber: InputNumber,
    select: Select,
    radioGroup: RadioGroup,
    switch: Switch,
    // `date` 是为单元格接线的 DatePicker：在 form.values 中以 ISO 字符串存储值，
    // 并在控件边界处做字符串与 Dayjs 的互转，使 dayjs 实例永不进入响应式存储
    // （否则 Formily 会将其字符串化并破坏 picker）。
    date: DateCell,
};

/** 按 key 查找已注册的控件。若未注册则返回 undefined。 */
export function getControl(key: ControlKey | (string & {})): ControlComponent | undefined {
    return registry[key];
}

/** 在 `key` 下注册或替换一个控件。 */
export function registerControl(
    key: ControlKey | (string & {}),
    component: ControlComponent,
): void {
    registry[key] = component;
}

/** 完整的控件注册表（一份防御性拷贝）。 */
export function getControls(): Record<string, ControlComponent> {
    return { ...registry };
}
