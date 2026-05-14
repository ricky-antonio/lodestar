import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    pool: 'forks',
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'components/**', 'app/api/**'],
      exclude: [
        'lib/supabase/client.ts',
        'lib/supabase/server.ts',
        'components/ui/**',
      ],
      thresholds: { lines: 70, functions: 70, branches: 65 },
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
})
