import { useRef, useEffect, useCallback } from 'react'
import { isCoarsePointer } from '../utils/mobile'

const SKIP_TOUCH_TRACKING = isCoarsePointer()

/**
 * useCursorLerp
 *
 * Frame-rate independent exponential damping for the marble reveal.
 *
 * TECHNIQUE (from immersive-g.com analysis):
 *   They use: damp(current, target, λ, dt)
 *   Formula:  current + (target - current) * (1 - exp(-λ * dt))
 *
 *   λ (lambda) = smoothing strength.
 *   Higher λ = faster convergence (more responsive).
 *   Lower λ  = slower convergence (more trailing).
 *
 *   immersive-g.com uses λ ≈ 6 for their cursor.
 *   At 60fps: factor = 1 - exp(-6 * 0.0167) ≈ 0.095 per frame
 *   At 30fps: factor = 1 - exp(-6 * 0.0333) ≈ 0.181 per frame
 *   → Same visual speed regardless of frame rate.
 *
 *   This gives buttery smooth trailing that feels:
 *   - Responsive (no perceived input lag)
 *   - Silky (soft catch-up tail)
 *   - Premium (like luxury camera motion)
 *
 * @param {number} lambda — damping strength (default 8, slightly snappier than IG's 6)
 */
export function useCursorLerp(lambda = 8) {
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const targetRef = useRef({ x: 0.5, y: 0.5 })
  const isMovingRef = useRef(false)
  const lastMoveTime = useRef(0)
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastFrameTime = useRef(0)

  useEffect(() => {
    /* Touch / coarse-pointer devices: skip ALL pointer tracking.
       The marble reveal shader's "isMoving" state is driven by
       cursor delta; on mobile, finger-drag during scroll would
       constantly fire reveal animations during normal scrolling
       and cause visible flicker. The shader's auto-reveal phase
       (uAutoRevealPhase) provides an idle ambient animation that
       is plenty atmospheric on its own. */
    if (SKIP_TOUCH_TRACKING) return

    const handleMouseMove = (e) => {
      const prevX = targetRef.current.x
      const prevY = targetRef.current.y
      targetRef.current.x = e.clientX / window.innerWidth
      targetRef.current.y = 1.0 - (e.clientY / window.innerHeight)
      velocityRef.current.x = targetRef.current.x - prevX
      velocityRef.current.y = targetRef.current.y - prevY
      isMovingRef.current = true
      lastMoveTime.current = performance.now()
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  /**
   * Called every frame from useFrame.
   * Uses exponential damping for frame-rate independent buttery smoothing.
   */
  const update = useCallback(() => {
    const now = performance.now()
    const previousTime = lastFrameTime.current || now
    const dt = Math.min((now - previousTime) / 1000, 0.1) // cap at 100ms to prevent jumps
    lastFrameTime.current = now

    // Frame-rate independent exponential damping
    // factor ≈ 0.12 at 60fps, ≈ 0.22 at 30fps → same visual speed
    const factor = 1 - Math.exp(-lambda * dt)

    mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * factor
    mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * factor

    if (now - lastMoveTime.current > 200) {
      isMovingRef.current = false
    }

    return {
      x: mouseRef.current.x,
      y: mouseRef.current.y,
      isMoving: isMovingRef.current,
      velocity: velocityRef.current
    }
  }, [lambda])

  return { update, mouseRef, targetRef, isMovingRef, velocityRef }
}
