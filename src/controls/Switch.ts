import { Switch as AntdSwitch } from 'antd';
import { OPTION_CONTROL_MARKER } from '../field/isOptionControl';

/**
 * antd Switch 的重新导出，被标记为 rsform 的 option-control，使 Field 注入
 * `checked`（布尔值）而非 `value`。该标记是组件类型上的一个静态属性
 * ——不影响渲染输出。
 */
export const Switch = Object.assign(AntdSwitch, OPTION_CONTROL_MARKER) as typeof AntdSwitch;
