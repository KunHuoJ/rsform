import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      rsform: resolve(__dirname, 'src/index.ts'),
      'rsform/antd': resolve(__dirname, 'src/controls/index.ts'),
      'rsform/table': resolve(__dirname, 'src/table/index.ts'),
      'rsform/array-items': resolve(__dirname, 'src/array-items/index.ts'),
      'rsform/effects': resolve(__dirname, 'src/effects/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.spec.{ts,tsx}'],
    // antd Table 在 jsdom 下渲染开销大（getComputedStyle 桩 + 滚动条测量），
    // 并行跑全套时单格编辑测试容易顶过 5s 默认超时，按表测试实际耗时放宽。
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
