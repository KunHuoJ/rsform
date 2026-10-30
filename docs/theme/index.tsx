/**
 * 主题入口（关键：Rspress v2 用 `@rspress/core/theme` 数组别名 `[自定义主题目录, 默认主题]`
 * 解析「主题」。App 内部 `import { Layout } from '@rspress/core/theme'` 拿的就是这个入口
 * 导出的 `Layout`。
 *
 * 若没有这个 `index`，别名会直接落到**默认主题**的 `index`，于是 `theme/Layout.tsx`
 * 永远没人 import——这正是之前 `Layout` 覆盖不生效的根因。
 *
 * 约定（Rspress v2 推荐，见 discussion #1891）：
 *  - `export * from '@rspress/core/theme-original'` 把默认主题所有导出原样转出。
 *  - 再用 `export { Layout } from './Layout'` 把同名导出换成我们自己的 `Layout.tsx`。
 *    ESM 规范下，显式具名导出优先于 `export *`，同名不报错、后者被覆盖。
 */
// @ts-expect-error rsbuild 构建期别名，tsc 解析不到，rspress build/dev 能解析
export * from '@rspress/core/theme-original';
export { Layout } from './Layout';
