/**
 * Mobile / coarse-pointer / reduced-motion detection.
 *
 * Single source of truth across the codebase so we don't sprinkle
 * `window.matchMedia(...)` calls in hot paths. Cached at module scope
 * and updated on resize / orientationchange.
 *
 * Usage:
 *   import { isMobile, isCoarsePointer, prefersReducedMotion } from '../utils/mobile'
 *   if (isMobile()) ...
 *
 * SSR-safe: returns false when window is undefined.
 */

const MOBILE_QUERY = '(max-width: 768px)'
const COARSE_POINTER_QUERY = '(hover: none), (pointer: coarse)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const hasWindow = typeof window !== 'undefined'

const evalQuery = (q) => (hasWindow ? window.matchMedia(q).matches : false)

let _isMobile = evalQuery(MOBILE_QUERY)
let _isCoarse = evalQuery(COARSE_POINTER_QUERY)
let _reducedMotion = evalQuery(REDUCED_MOTION_QUERY)

const refresh = () => {
  _isMobile = evalQuery(MOBILE_QUERY)
  _isCoarse = evalQuery(COARSE_POINTER_QUERY)
  _reducedMotion = evalQuery(REDUCED_MOTION_QUERY)
}

if (hasWindow) {
  window.addEventListener('resize', refresh, { passive: true })
  window.addEventListener('orientationchange', refresh, { passive: true })
}

export const isMobile = () => _isMobile
export const isCoarsePointer = () => _isCoarse
export const prefersReducedMotion = () => _reducedMotion

/**
 * Returns true if the device should run the "lite" experience —
 * mobile viewport OR coarse pointer OR reduced motion.
 *
 * This is the single gate every mobile-specific code branch should use.
 */
export const isLiteExperience = () => _isMobile || _isCoarse || _reducedMotion
