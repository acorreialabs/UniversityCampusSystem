import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = process.env.VITE_PROXY_TARGET || 'http://localhost:4100';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.WEB_PORT) || 5173,
    host: true,
    // Proxy same-origin: o browser chama /api/... e /health no próprio Vite,
    // que reencaminha para a API. Assim funciona em localhost e por qualquer
    // IP da rede (telemóvel) sem depender de VITE_API_BASE_URL com IP fixo
    // (que, se mudar de rede, deixa o login pendurado em "A autenticar…").
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/health': { target: API_TARGET, changeOrigin: true },
    },
  },
});
