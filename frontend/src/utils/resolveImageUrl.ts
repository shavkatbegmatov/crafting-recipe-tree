/**
 * Resolve a backend image path to a fully qualified URL.
 *
 * Backend stores image paths like "/uploads/foo.png" (relative).
 * In local dev, Vite proxies /uploads to the backend (http://localhost:8080).
 * In production, frontend and backend live on different domains, so the
 * relative path must be prefixed with the backend base URL.
 *
 * VITE_API_BASE_URL is set at build time (see Dockerfile ARG).
 * - empty / unset: returns the path as-is (dev mode + nginx proxy fallback)
 * - e.g. "https://api.example.com": returns the absolute URL
 */
export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return `${base}${url}`
}
