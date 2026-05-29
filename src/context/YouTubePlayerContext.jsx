import { createContext, useContext, useState, useCallback } from 'react'

/**
 * YouTubePlayerContext
 *
 * Singleton playback manager — ensures only ONE YouTube iframe
 * exists in the entire DOM at any time.
 *
 * Any ProjectCard whose `youtubeId` doesn't match `activeCardId`
 * will unmount its iframe, preventing iframe accumulation and
 * memory leaks.
 */
const YouTubePlayerContext = createContext(null)

export function YouTubePlayerProvider({ children }) {
  // `activeCardId` is a unique key per card instance (not the YouTube video ID).
  // This allows the same video to be used on multiple cards without conflict.
  const [activeCardId, setActiveCardId] = useState(null)

  const activateCard = useCallback((cardId) => {
    setActiveCardId(cardId)
  }, [])

  const deactivateCard = useCallback((cardId) => {
    setActiveCardId((prev) => (prev === cardId ? null : prev))
  }, [])

  return (
    <YouTubePlayerContext.Provider
      value={{ activeCardId, activateCard, deactivateCard }}
    >
      {children}
    </YouTubePlayerContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useYouTubePlayer() {
  const ctx = useContext(YouTubePlayerContext)
  if (!ctx) {
    throw new Error('useYouTubePlayer must be used within YouTubePlayerProvider')
  }
  return ctx
}
