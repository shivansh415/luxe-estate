import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, Component, memo } from 'react'
import MarbleRevealPlane from './MarbleRevealPlane'
import CinematicPostProcessing from './CinematicPostProcessing'

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
    const maxDpr = window.innerWidth < 768 ? 1.15 : 1.5
    return [1, Math.min(window.devicePixelRatio, maxDpr)]
  }, [])

  // Memoize GL config to prevent Canvas prop diffing
  const glConfig = useMemo(() => ({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
    depth: false,
  }), [])

  const cameraConfig = useMemo(() => ({ position: [0, 0, 1] }), [])

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
          performance={{ min: 0.6 }}
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
