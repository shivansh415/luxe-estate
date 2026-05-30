import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, Component, memo } from 'react'
import MarbleRevealPlane from './MarbleRevealPlane'
import CinematicPostProcessing from './CinematicPostProcessing'
import { isMobile } from '../../utils/mobile'

/**
 * WebGLErrorBoundary
 */
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.warn('[Luxe Estates] WebGL rendering failed, using fallback:', error.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(ellipse at center, #151515 0%, #0a0a0a 100%)',
          zIndex: 0,
          pointerEvents: 'none',
        }} />
      )
    }
    return this.props.children
  }
}

/**
 * CinematicScene
 *
 * Main WebGL scene. Receives REFS (not values) for scroll state
 * to avoid re-renders on every scroll frame.
 *
 * PERFORMANCE: Canvas config is memoized. The Canvas element itself
 * never re-renders — MarbleRevealPlane reads refs in useFrame.
 */
function CinematicScene({ scrollProgressRef, currentSectionRef, onWebGLProgress }) {
  const dpr = useMemo(() => {
    /* Mobile: lock DPR to 1.0 — the marble shader is fragment-bound,
       and even DPR 1.15 doubles fragment work for marginal visual gain.
       Desktop: cap at 1.5. Never honor 3x retina. */
    if (isMobile()) return [1, 1]
    return [1, Math.min(window.devicePixelRatio || 1, 1.5)]
  }, [])

  // Memoize GL config to prevent Canvas prop diffing
  const glConfig = useMemo(() => ({
    /* Antialias is expensive on mobile GPUs and provides marginal value
       at DPR 1 — the marble shader is the visible surface, not geometry edges. */
    antialias: !isMobile(),
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
    depth: false,
  }), [])

  const cameraConfig = useMemo(() => ({ position: [0, 0, 1] }), [])

  /* Mobile auto-degrade floor: if frame time spikes, R3F can lower
     resolution faster (down to 0.5 of current DPR). */
  const performanceProfile = useMemo(
    () => ({ min: isMobile() ? 0.5 : 0.6 }),
    []
  )

  return (
    <div
      className="webgl-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <WebGLErrorBoundary>
        <Canvas
          gl={glConfig}
          dpr={dpr}
          camera={cameraConfig}
          performance={performanceProfile}
          style={{ background: '#0a0a0a' }}
        >
          <Suspense fallback={null}>
            <MarbleRevealPlane
              scrollProgressRef={scrollProgressRef}
              currentSectionRef={currentSectionRef}
              onWebGLProgress={onWebGLProgress}
            />
          </Suspense>
          <CinematicPostProcessing />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  )
}

// Memo the entire scene — it should NEVER re-render after mount
export default memo(CinematicScene)
