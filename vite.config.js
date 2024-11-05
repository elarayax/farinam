import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        hmr: {
            overlay: false, // Desactiva el overlay de error
        },
    },
    build: {
        rollupOptions: {
            external: ['electron', 'fs'], // Excluye electron y fs de la construcción
        },
    },
    optimizeDeps: {
        exclude: ['fs', 'electron'], // Excluye fs y electron de las dependencias optimizadas
    },
});
