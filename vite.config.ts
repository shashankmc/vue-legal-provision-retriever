import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueLegalProvisionRetriever',
      fileName: (format: string) =>
        format === 'es' ? 'vue-legal-provision-retriever.js' : 'vue-legal-provision-retriever.umd.cjs',
    },
    rollupOptions: {
      // The port types are a declared dependency and must stay a real import:
      // a consumer comparing against legal-provision-types should not end up
      // with a second copy baked into this bundle.
      external: ['vue', 'legal-provision-types'],
      output: {
        globals: {
          vue: 'Vue',
          'legal-provision-types': 'LegalProvisionTypes',
        },
      },
    },
  },
})
