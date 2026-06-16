/**
 * Joriy muhitdan WebSocket (STOMP) URL'ini aniqlaydi.
 * - Dev: Vite proxy orqali shu origin (`ws://host/ws`).
 * - Prod: VITE_API_BASE_URL backend'ning ommaviy URL'iga ishora qiladi.
 */
export function getWsUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL
  if (apiBase) {
    return apiBase.replace(/^http/, 'ws') + '/ws'
  }
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/ws`
}
