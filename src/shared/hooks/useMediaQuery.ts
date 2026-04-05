import { useEffect, useState } from 'react'

/**
 * Hook theo dõi media query breakpoint.
 * Dùng để phân biệt Mobile / Desktop trong AdaptiveSheet.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)

    mql.addEventListener('change', handler)
    setMatches(mql.matches)

    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Trả về true nếu viewport >= 640px (Desktop mode).
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 640px)')
}
