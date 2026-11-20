/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    target: 'es2018',
    outDir: 'dist',
    sourcemap: false
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
