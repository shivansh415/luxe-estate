import { createContext } from 'react'

export const CinematicTransitionContext = createContext({
  isTransitioning: false,
  runTransition: async ({ onCovered } = {}) => {
    onCovered?.()
  },
})
