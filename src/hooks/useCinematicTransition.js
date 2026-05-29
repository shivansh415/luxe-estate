import { useContext } from 'react'
import { CinematicTransitionContext } from '../context/CinematicTransitionContext'

export function useCinematicTransition() {
  return useContext(CinematicTransitionContext)
}
