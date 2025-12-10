echo 'import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { nodePolyfills } from "vite-plugin-node-polyfills"

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "process"]
    })
  ],
  server: {
    port: 3000,
    host: true
  },
  define: {
    global: "globalThis",
    "process.env": {}
  },
  build: {
    target: "esnext",
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    include: ["buffer", "process"],
    esbuildOptions: {
      define: {
        global: "globalThis"
      }
    }
  }
})' > vite.config.js

