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
- **effects**：新增 `$.clearOn(deps, targets, clearValue?)` 级联清空糖——底层 `onFieldValueChange`，初始 / 回显不触发，一行声明多依赖 → 多目标清空。新增 `$.debounce(fn, ms)` 联动防抖糖——纯工具、跨渲染稳定、trailing-edge，用于远程搜索 / 输入联想。新增 `$.setVisible` / `$.setRequired` / `$.setEditable` 字段状态语义糖（`setFieldState` 直写）。均从 `rsform` 命名导出并挂在 `$` 上；`effects-detail.mdx` 补对应章节与「$ helper 全集」表，新增「远程搜索 Select」live demo。
- **form**：`Form.Submit` 新增 `preventDuplicate` prop——① 同步重入锁（ref）防止同一 tick 连点跑两次 `form.submit()`；② 成功提交后按钮一次性锁定，直到 `form.reset()` 才解锁。`api.mdx` 补 props。
- **form**：新增 `useFormDraft(key, options?)` 草稿自动保存 / 恢复 hook。表单每次值变化防抖写进 `localStorage`（默认 500ms，复用 `$.debounce`）；提交成功（订阅 `ON_FORM_SUBMIT_SUCCESS`）后自动清草稿；重新进入发现历史草稿时 `hasDraft=true`，`restore()` 用 `form.setValues(draft, 'deepMerge')` 恢复（不触发 `onFieldValueChange`，回显安全、不误清联动字段）。支持 `storage`（默认 `window.localStorage`，SSR 降级 no-op）、`clearOnSubmit`、`maxAge`（过期草稿读取时即清除）。新增 `draft.mdx` 文档页 + `DraftDemo` live demo + `api.mdx` 条目。从 `rsform` 命名导出。
- **table**：`Form.Table` 新增 `max`/`min`/`validateBeforeAdd`/`tableProps` props。`max`/`min` 限制行数上下限，到限后 `actions.add`/`actions.insert`/`actions.remove` 静默拒绝。`validateBeforeAdd` 支持两种形态：`true`（便捷，先 `form.validate(\`${name}.*\`)` 校验已有行）或 `(values, itemDefault) => boolean | string | void` 回调（同 `ArrayItems` 签名自定义门禁）。`tableProps` 透传 antd `Table` props（`virtual`/`bordered`/`size`/`rowSelection`/`onChange`/`onRow`/`sticky`…），rsform 接管的 `columns`/`dataSource`/`pagination`/`rowKey`/`scroll` 优先——此前缺失 `tableProps` 是硬缺口，antd Table 一票能力都用不了，虚拟滚动也借此白拿（antd 5.9+ `virtual`）。`table.mdx` / `api.mdx` 同步补 props 与 actions 签名（`add`/`insert` 改 `Promise<void>`）。
