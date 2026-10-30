/**
 * 主题入口（关键：Rspress v2 用 `@rspress/core/theme` 数组别名 `[自定义主题目录, 默认主题]`
 * 解析「主题」。App 内部从该别名导入 Layout，拿的就是这个入口导出的 Layout。
 *
 * 若没有这个 `index`，别名会直接落到**默认主题**的 `index`，于是 `theme/Layout.tsx`
 * 永远没人 import——这正是之前 `Layout` 覆盖不生效的根因。
 *
 * 约定（Rspress v2 推荐，见 discussion #1891）：
 *  - `export * from '@theme-original'` 把默认主题所有导出原样转出。
 *  - 再用 `export { Layout } from './Layout'` 把同名导出换成我们自己的 `Layout.tsx`。
 *    ESM 规范下，显式具名导出优先于 `export *`，同名不报错、后者被覆盖。
 *
 * 用 `@theme-original` 别名而非带 core 前缀的写法：两者等价（initRsbuild 都注册了），
 * 但 Rspress 的 breaking-change 检测正则会把带 core 前缀的 theme-original 写法误匹配
 * 为旧写法而刷一条假警告（正则没做边界判断）。用 `@theme-original` 绕过。
 */
// @ts-expect-error rsbuild 构建期别名，tsc 解析不到，rspress build/dev 能解析
export * from '@theme-original';
export { Layout } from './Layout';
