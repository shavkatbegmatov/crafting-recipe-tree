import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentGameVersion } from '../hooks/useGameVersions'

const STORAGE_KEY = 'craftTree.selectedVersion'

interface GameVersionContextType {
  /** Selected version string (e.g. "5.7.0"). `null` means "current". */
  selectedVersion: string | null
  /** Effective version actually used by API queries — falls back to current. */
  effectiveVersion: string | null
  setSelectedVersion: (v: string | null) => void
  isLoadingCurrent: boolean
}

const GameVersionContext = createContext<GameVersionContextType>({
  selectedVersion: null,
  effectiveVersion: null,
  setSelectedVersion: () => {},
  isLoadingCurrent: false,
})

function loadInitial(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v && v.length > 0 ? v : null
  } catch {
    return null
  }
}

export function GameVersionProvider({ children }: { children: React.ReactNode }) {
  const [selectedVersion, setSelectedVersionState] = useState<string | null>(loadInitial)
  const { data: current, isLoading: isLoadingCurrent } = useCurrentGameVersion()
  const queryClient = useQueryClient()

  const setSelectedVersion = useCallback(
    (v: string | null) => {
      setSelectedVersionState(v)
      try {
        if (v === null) localStorage.removeItem(STORAGE_KEY)
        else localStorage.setItem(STORAGE_KEY, v)
      } catch {
        // ignore storage failures
      }
      // Force re-fetch of all version-dependent data.
      queryClient.invalidateQueries({ queryKey: ['recipeTree'] })
      queryClient.invalidateQueries({ queryKey: ['rawTotals'] })
      queryClient.invalidateQueries({ queryKey: ['usedIn'] })
      queryClient.invalidateQueries({ queryKey: ['item'] })
    },
    [queryClient],
  )

  // If no explicit selection, the effective version is whatever the backend says is current.
  const effectiveVersion = useMemo(() => {
    if (selectedVersion) return selectedVersion
    return current?.version ?? null
  }, [selectedVersion, current])

  // If the user manually selected a version that no longer exists / has been deleted,
  // fall back gracefully on next mount.
  useEffect(() => {
    if (!selectedVersion || !current) return
    // (No automatic reset here — versions list query will surface the issue.)
  }, [selectedVersion, current])

  const value = useMemo<GameVersionContextType>(
    () => ({
      selectedVersion,
      effectiveVersion,
      setSelectedVersion,
      isLoadingCurrent,
    }),
    [selectedVersion, effectiveVersion, setSelectedVersion, isLoadingCurrent],
  )

  return <GameVersionContext.Provider value={value}>{children}</GameVersionContext.Provider>
}

export function useGameVersion() {
  return useContext(GameVersionContext)
}
