import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Returns a callback that takes the user one step back in browser history,
 * or navigates to {@code fallback} when the current route is the very first
 * entry (e.g. user opened the URL directly — "back" would leave the site).
 *
 * React Router 6 marks the first session entry with `location.key === 'default'`,
 * which is what we use to detect that case.
 */
export function useGoBack(fallback: string = '/'): () => void {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(() => {
    if (location.key === 'default') {
      navigate(fallback, { replace: true })
    } else {
      navigate(-1)
    }
  }, [navigate, location.key, fallback])
}
