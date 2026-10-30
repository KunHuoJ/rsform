/**
 * antd InputNumber 的重新导出。rsform Field 会自动注入 `value`/`onChange`
 * （数值，而非 antd 的事件）。直接从 antd 重新导出，以便为消费方保留该组件
 * 完整的 prop 类型。
 */
export { InputNumber } from 'antd';
