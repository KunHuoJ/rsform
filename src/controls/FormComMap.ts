import type * as React from 'react';
import { Input } from './Input';
import { InputNumber } from './InputNumber';
import { RadioGroup } from './RadioGroup';
import { Select } from './Select';
import { Switch } from './Switch';

/**
 * rsform control registry. Maps a short string key to a control component,
 * so table column definitions (and other data-driven UI) can name a control
 * without importing the component. The high-perf Table's CellBridge looks up
 * a column's `control` key here to render the right input per cell.
 *
 * Keys are stable rsform conventions; consumers may register their own keys
 * via `registerControl(key, component)` to extend the Table without forking.
 */
export type ControlKey = 'input' | 'inputNumber' | 'select' | 'radioGroup' | 'switch';

export type ControlComponent = React.ComponentType<any>;

const registry: Record<string, ControlComponent> = {
    input: Input,
    inputNumber: InputNumber,
    select: Select,
    radioGroup: RadioGroup,
    switch: Switch,
};

/** Look up a registered control by key. Returns undefined if not registered. */
export function getControl(key: ControlKey | string): ControlComponent | undefined {
    return registry[key];
}

/** Register or replace a control under `key`. */
export function registerControl(key: string, component: ControlComponent): void {
    registry[key] = component;
}

/** The full control registry (a defensive copy). */
export function getControls(): Record<string, ControlComponent> {
    return { ...registry };
}
