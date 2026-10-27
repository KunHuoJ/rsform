import {Switch as AntdSwitch} from 'antd';
import {OPTION_CONTROL_MARKER} from '../field/isOptionControl';

/**
 * antd Switch re-export, tagged as an rsform option-control so the Field
 * injects `checked` (boolean) instead of `value`. The tag is a static property
 * on the component type — it does not affect the rendered output.
 */
export const Switch = Object.assign(AntdSwitch, OPTION_CONTROL_MARKER) as typeof AntdSwitch;
