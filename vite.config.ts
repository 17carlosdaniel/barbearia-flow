import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Headers de segurança (dev e preview). Em produção, configure no servidor (nginx/Apache).
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=()",
  // Em desenvolvimento, liberamos conexões para Supabase e Google OAuth,
  // mantendo as demais restrições razoavelmente seguras.
  "Content-Security-Policy": [
    "default-src 'self' *",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *",
    "style-src 'self' 'unsafe-inline' *",
    "img-src 'self' data: https: blob: *",
    "font-src 'self' data: https: *",
    "connect-src 'self' ws: wss: https: *",
    "frame-ancestors 'self' *",
    "base-uri 'self' *",
    "form-action 'self' *",
  ].join("; "),
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // escuta em 0.0.0.0 e :: (acessível na rede e por ngrok)
    port: 8080,
    allowedHosts: true, // permite acesso via ngrok e outros túneis (host muda a cada sessão)
    hmr: {
      overlay: false,
    },
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react") || id.includes("scheduler")) return "vendor-react";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("lucide-react")) return "vendor-icons";
          return "vendor";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
