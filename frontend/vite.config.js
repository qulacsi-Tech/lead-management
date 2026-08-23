import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_ORIGIN = process.env.VITE_API_ORIGIN || 'http://localhost:8000'

/**
 * Dev-only parity with production SEO output.
 *
 * In production FastAPI serves the HTML and injects each URL's <head> tags and
 * the server-rendered content inside #root (backend/routers/seo.py). The Vite
 * dev server serves index.html off disk instead, so none of that appears on
 * :5173 — "view source" there shows a bare shell and a stale <title>, which
 * looks exactly like the feature is broken.
 *
 * This plugin closes that gap: for every HTML document request it asks the
 * backend what that path should carry and injects the same markup. Same source
 * of truth (/api/seo/preview calls the same builder the HTML route uses), so
 * dev and prod cannot drift.
 *
 * Silent no-op when the backend is not running — dev must not depend on it.
 */
function seoDevPreview() {
  return {
    name: 'seo-dev-preview',
    apply: 'serve',
    transformIndexHtml: {
      order: 'post',
      async handler(html, ctx) {
        const path = (ctx.originalUrl || '/').split('?')[0]
        try {
          const res = await fetch(
            `${API_ORIGIN}/api/seo/preview?path=${encodeURIComponent(path)}`,
          )
          if (!res.ok) return html
          const { head, body } = await res.json()
          let out = head ? html.replace(/<title>.*?<\/title>/is, head) : html
          if (body) {
            out = out.replace(
              /(<div id="root">)(<\/div>)/i,
              (_m, open, close) => open + body + close,
            )
          }
          return out
        } catch {
          // Backend down — serve the untouched shell rather than failing dev.
          return html
        }
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), seoDevPreview()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
  },
})
