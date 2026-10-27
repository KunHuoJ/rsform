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
  },
});
