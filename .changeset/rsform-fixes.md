---
"rsform": patch
---

修复表格 rowKey 当行下标、Submit.onSubmit 双触发、Consumer hook 顺序；收窄列 control 类型。

- **table**：`resolveAbsoluteIndex` 不再把 `rowKey` 当数组下标。字符串 `rowKey` 是稳定身份，不是行位置——用它当 cell 路径会把读写/effect 送到错误叶子（`rows.${业务id}.x`）。单元格现在始终用页码修正后的数组下标。无合法用例变化；此前 `rowKey="id"` 的错位配置被修好。
- **form**：`Form.Submit` 的 `onSubmit` prop 现在是**真覆盖**（不叠加）`<Form onSubmit>`。此前两者都会触发，因为 `form.submit(cb)` 既调用 callback 又走 `onFormSubmitSuccess` 生命周期。Submit 现在在点击期间临时替换共享的 `onSubmitRef`、结束后恢复，两者不再同时触发。不传 `onSubmit` 的路径不变。
- **form**：`Form.Consumer` 不再按 `name` 条件调用 `useContentName`（内含 `useContext`）。`name` 在 `undefined` ↔ 字符串间切换不再违反 Rules of Hooks。
- **table**：`RsfTableColumn.control` / `CellBridgeProps.control` 类型收窄为 `ControlKey | ComponentType | ReactElement | (string & {})`，IDE 能自动补全内置控件 key，同时允许运行时注册的字符串。
- **docs**：订正 `required` 说明（它会触发 Formily 内置非空校验，不是仅展示），见 `basic.mdx` 与 `api.mdx`。
