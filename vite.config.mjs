import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  resolve: { dedupe: ["react", "react-dom"] },
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client", "react/jsx-runtime", "@phosphor-icons/react/dist/csr/ArrowRight", "@phosphor-icons/react/dist/csr/ArrowDown", "@phosphor-icons/react/dist/csr/ArrowUp", "@phosphor-icons/react/dist/csr/X", "@phosphor-icons/react/dist/csr/List", "@phosphor-icons/react/dist/csr/Pause", "@phosphor-icons/react/dist/csr/Play", "@phosphor-icons/react/dist/csr/BookOpen"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
