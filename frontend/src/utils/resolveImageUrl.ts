/**
 * Resolve an image path to a URL the browser can fetch.
 *
 * Two kinds of image URLs coexist in this app:
 *
 *   1. Static assets shipped with the frontend — paths like
 *      "/images/items/grafit.png". These live in `frontend/public/images/`
 *      and are copied into the nginx container at build time, so they must
 *      be served from the SAME origin as the frontend. We keep them as
 *      relative paths.
 *
 *   2. User uploads stored on the backend — paths like "/uploads/foo.png".
 *      The backend's WebMvcConfig maps `/uploads/**` to a directory on disk.
 *      In production the frontend and backend live on different origins, so
 *      these paths must be prefixed with VITE_API_BASE_URL (baked in at
 *      build time via the Dockerfile ARG).
 *
 * In local dev VITE_API_BASE_URL is empty, so both kinds fall back to
 * relative paths, which Vite's dev server / nginx then proxies to the
 * backend via the /uploads location block.
 */
export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  // Frontend static asset — serve from same origin (nginx inside frontend container)
  if (url.startsWith('/images/')) return url
  // Backend upload — needs the backend's public URL in production
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return `${base}${url}`
}
