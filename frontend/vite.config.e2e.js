import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'OTP_', 'API_'],
  test: {
    globals: true,
    testTimeout: 60000,
    hookTimeout: 50000,
    include: ['tests/e2e/**/*.e2e.test.{js,jsx}'],
    globalSetup: './tests/e2e/globalSetup.js',
  },
})
