import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  envDir: 'env',
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      'stage-finance.qubiqon.io',
      'dev-finance.qubiqon.io',
      'project-management-dev.qubiqon.io',
      'supply-dev.qubiqon.io',
      'qhrms-dev.qubiqon.io'
    ],
    proxy: {
      '/api': {
        target: 'https://localhost:7201',
        changeOrigin: true,
        secure: false
      }
    }
  }
});