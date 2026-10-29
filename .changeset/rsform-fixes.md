---
"rsform": patch
---

修复表格 rowKey 当行下标、Submit.onSubmit 双触发、Consumer hook 顺序；移除 FormError；收窄列 control 类型。

- **table**：`resolveAbsoluteIndex` 不再把 `rowKey` 当数组下标。字符串 `rowKey` 是稳定身份，不是行位置——用它当 cell 路径会把读写/effect 送到错误叶子（`rows.${业务id}.x`）。单元格现在始终用页码修正后的数组下标。无合法用例变化；此前 `rowKey="id"` 的错位配置被修好。
- **form**：`Form.Submit` 的 `onSubmit` prop 现在是**真覆盖**（不叠加）`<Form onSubmit>`。此前两者都会触发，因为 `form.submit(cb)` 既调用 callback 又走 `onFormSubmitSuccess` 生命周期。Submit 现在在点击期间临时替换共享的 `onSubmitRef`、结束后恢复，两者不再同时触发。不传 `onSubmit` 的路径不变。
- **form**：`Form.Consumer` 不再按 `name` 条件调用 `useContentName`（内含 `useContext`）。`name` 在 `undefined` ↔ 字符串间切换不再违反 Rules of Hooks。
- **form**：移除 `FormError` 组件及其 `Form.FormError` 命名空间挂载、`FormErrorProps` 导出。表单级错误聚合在实际业务里用处有限——校验失败已由 `validateFailed="scroll"` 滚动 + 格下红字覆盖，需要自定义聚合用 `Form.Consumer` 订阅 `form.errors` 即可。`src/form/FormError.tsx` 删除，`src/index.ts` / `src/form/FormNamespace.ts` / `src/form/index.ts` 同步摘除导出与挂载；`docs` 与 `tests/controls.spec.tsx` 相关用例清理。
- **array-items**：`ArrayItems` 上下移按钮默认不渲染，新增 `sortable` 开关按需开启（多数表单不需要排序）。新增 `renderAdd(add)` / `renderRemove(index, remove)` 完全自定义增删按钮，`onRemove(index, values) => boolean | Promise<boolean>` 删除前拦截（返回 `false` 取消，用于二次确认），`removeText` 自定义删除按钮文字。`addText`/`addDisabled`/`validateBeforeAdd`/`min`/`max` 保持不变。
- **table**：`RsfTableColumn.control` / `CellBridgeProps.control` 类型收窄为 `ControlKey | ComponentType | ReactElement | (string & {})`，IDE 能自动补全内置控件 key，同时允许运行时注册的字符串。
- **docs**：订正 `required` 说明（触发 Formily 内置非空校验，不是仅展示）；订正 `validateFailed` 默认值（无默认，不传不处理）、`onReset`（暂未生效）；补 `Form.DatePicker`/`Form.Button`/`arrayUnion`/`getControl`/`getControls`/`validateField` 重载；补分页受控警告、Submit.onSubmit 覆盖语义；补 `table-perf` 源码片段；新增「从 @formily/antd 迁移」指引页。见 `basic.mdx` / `api.mdx` / `effects-detail.mdx` / `table-perf.mdx` / `migration.mdx`。
