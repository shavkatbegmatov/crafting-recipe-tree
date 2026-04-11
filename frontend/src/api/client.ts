import axios from 'axios'

// In production, VITE_API_BASE_URL is baked in at build time (see Dockerfile ARG),
// pointing to the backend's public URL, e.g. "https://api.example.com".
// In dev or when not set, fall back to relative "/api" which is proxied by
// Vite dev server (vite.config.ts) or by nginx (nginx.conf).
const apiRoot = import.meta.env.VITE_API_BASE_URL
const baseURL = apiRoot ? `${apiRoot}/api` : '/api'

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — clear token
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

export default client
