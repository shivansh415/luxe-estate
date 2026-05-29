import { memo } from 'react'
import { useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

/**
 * CinematicPostProcessing
 *
 * FIX M-4: Previously used window.innerWidth read at render-time which
 * was stale on resize and threw in SSR/test contexts.
 * Now uses useThree().size which is reactive — updates automatically
 * when the Canvas resizes.
 */
function CinematicPostProcessing() {
  const { size } = useThree()

  // Disable bloom on mobile-sized viewports
  if (size.width < 768) return null

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.1}
        luminanceThreshold={0.88}
        luminanceSmoothing={0.5}
      />
    </EffectComposer>
  )
}

export default memo(CinematicPostProcessing)
