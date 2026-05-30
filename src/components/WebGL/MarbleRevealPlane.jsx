/* eslint-disable react-hooks/refs */
import { useRef, useMemo, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCursorLerp } from '../../hooks/useCursorLerp'
import { useVideoTextures } from '../../hooks/useVideoTextures'
import { isMobile } from '../../utils/mobile'
import vertexShader from '../../shaders/marbleReveal.vert?raw'
import fragmentShaderSrc from '../../shaders/marbleReveal.frag?raw'

/* Inject `#define MOBILE` at the top of the fragment shader on mobile.
   The shader's #ifdef MOBILE branches skip the 9-tap Sobel + Voronoi
   in detectVeins and reduce fBm from 5 octaves to 3. */
const fragmentShader = isMobile()
  ? '#define MOBILE\n' + fragmentShaderSrc
  : fragmentShaderSrc

/**
 * MarbleRevealPlane
 *
 * Fullscreen shader plane: marble + video reveal system.
 *
 * RESPONSIVE:
 *  - Passes uMarbleAspect and uVideoAspect uniforms to the shader
 *    so cover-style UV scaling keeps textures un-distorted on any
 *    viewport aspect ratio (including portrait mobile).
 *  - Dynamically detects video intrinsic dimensions via videoWidth/videoHeight.
 *  - Marble aspect is detected once via an Image load of the texture file.
 *
 * PERFORMANCE CRITICAL:
 *  - Reads scrollProgress and currentSection from REFS, not props.
 *    This means the parent never re-renders this component during scroll.
 *  - ShaderMaterial is created ONCE and never disposed/recreated.
 *    Resolution changes are handled by updating the uniform in useFrame.
 *  - All per-frame work happens in a single useFrame callback.
 *  - No state updates, no object creation, no GC pressure in the hot loop.
 */
export default function MarbleRevealPlane({ scrollProgressRef, currentSectionRef, onWebGLProgress }) {
  const meshRef = useRef()
  const materialRef = useRef()

  const onWebGLProgressRef = useRef(onWebGLProgress)
  useEffect(() => {
    onWebGLProgressRef.current = onWebGLProgress
  }, [onWebGLProgress])

  // --- Internal animation state (NEVER stored in React state) ---
  const stateRef = useRef({
    revealProgress: 0,
    autoRevealPhase: 0.5,
    goldGlowIntensity: 0.5,
    currentSectionIndex: 0,
    previousSectionIndex: -1,
    isTransitioning: false,
    transitionStartTime: 0,
    lastWidth: 0,
    lastHeight: 0,
    marbleAspect: 1.0,       // Updated in TextureLoader onLoad callback above
    videoAspect: 16.0 / 9.0, // Default 16:9 until video metadata available
    marbleAspectDetected: false,
  })

  // --- Cursor tracking (exponential damp, λ=8) ---
  const { update: updateCursor } = useCursorLerp()

  // --- Dual-buffer video system ---
  const { update: videoUpdate, switchToSection } = useVideoTextures(
    useCallback(() => {
      onWebGLProgressRef.current?.('webglVideo', true)
    }, [])
  )

  // --- Marble texture (loaded once, never disposed until unmount) ---
  // FIX L-6: Use onLoad callback from TextureLoader to detect aspect ratio.
  // This eliminates the second redundant Image() network request.
  const marbleTexture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load('/textures/marble-generated.png', (loadedTex) => {
      // Detect intrinsic aspect from the already-loaded image element
      const img = loadedTex.image
      if (img && img.naturalWidth && img.naturalHeight) {
        stateRef.current.marbleAspect = img.naturalWidth / img.naturalHeight
        stateRef.current.marbleAspectDetected = true
      }
      onWebGLProgressRef.current?.('webglMarble', true)
    })
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  // --- Fallback black texture ---
  const fallbackTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 2
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, 2, 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    return tex
  }, [])



  // --- ShaderMaterial — created ONCE, no dependency on size ---
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMarbleTexture: { value: marbleTexture },
        uVideoTexture: { value: fallbackTexture },
        uNextVideoTexture: { value: fallbackTexture },
        uVideoTransition: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uRevealProgress: { value: 0 },
        uAutoRevealPhase: { value: 0.5 },
        uGoldGlowIntensity: { value: 0.5 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uDpr: { value: Math.min(window.devicePixelRatio, 2) },
        uScrollProgress: { value: 0 },
        uMarbleAspect: { value: 1.0 },
        uVideoAspect: { value: 16.0 / 9.0 },
      },
      depthTest: false,
      depthWrite: false,
    })
  }, [marbleTexture, fallbackTexture]) // ← NO size dependency

  // Store material ref
  useEffect(() => {
    materialRef.current = shaderMaterial
  }, [shaderMaterial])

  // --- THE HOT LOOP — one single useFrame, everything reads from refs ---
  useFrame((threeState, delta) => {
    if (!materialRef.current) return

    const uniforms = materialRef.current.uniforms
    const state = stateRef.current

    // ── Resolution update (only when changed, no material rebuild) ──
    const w = threeState.size.width
    const h = threeState.size.height
    if (w !== state.lastWidth || h !== state.lastHeight) {
      uniforms.uResolution.value.set(w, h)
      uniforms.uDpr.value = Math.min(window.devicePixelRatio, 2)
      state.lastWidth = w
      state.lastHeight = h
    }

    // ── Update texture aspect ratios ──
    uniforms.uMarbleAspect.value = state.marbleAspect
    uniforms.uVideoAspect.value = state.videoAspect

    // ── Time ──
    uniforms.uTime.value += delta

    // ── Scroll progress (read from ref, zero re-renders) ──
    uniforms.uScrollProgress.value = scrollProgressRef.current

    // ── Cursor ──
    const cursor = updateCursor()
    uniforms.uMouse.value.set(cursor.x, cursor.y)

    // ── Reveal progress — exponential damp matching cursor feel ──
    const revealTarget = cursor.isMoving ? 1.0 : 0.0
    const revealLambda = cursor.isMoving ? 15.0 : 3.0  // fast on, graceful off
    const revealFactor = 1 - Math.exp(-revealLambda * delta)
    state.revealProgress += (revealTarget - state.revealProgress) * revealFactor
    uniforms.uRevealProgress.value = state.revealProgress

    // ── Auto reveal phase ──
    const autoSpeed = cursor.isMoving ? 0.15 : 0.3
    state.autoRevealPhase = 0.65 + Math.sin(uniforms.uTime.value * autoSpeed) * 0.35
    uniforms.uAutoRevealPhase.value = state.autoRevealPhase

    // ── Gold glow intensity ──
    state.goldGlowIntensity = 0.3 + Math.sin(uniforms.uTime.value * 0.25 + 1.0) * 0.15
    uniforms.uGoldGlowIntensity.value = state.goldGlowIntensity

    // ── Detect section change (from ref, no re-render) ──
    const targetSection = currentSectionRef.current
    if (targetSection !== state.currentSectionIndex) {
      state.previousSectionIndex = state.currentSectionIndex
      state.currentSectionIndex = targetSection
      state.isTransitioning = true
      state.transitionStartTime = performance.now()
      switchToSection(targetSection)
    }

    // ────────────────────────────────────────────────────────
    //  SINGLE-BUFFER VIDEO TEXTURE + SECTION TRANSITION
    //
    //  Each section has ONE video with native loop=true.
    //  Ping-pong encoding makes the browser loop seamless.
    //  No dual-buffer, no blend factor, no changed flag.
    // ────────────────────────────────────────────────────────

    if (state.isTransitioning && state.previousSectionIndex >= 0) {
      // Old section texture
      const oldTex = videoUpdate(state.previousSectionIndex)
      uniforms.uVideoTexture.value = oldTex.primary

      // New section texture
      const newTex = videoUpdate(state.currentSectionIndex)
      uniforms.uNextVideoTexture.value = newTex.primary

      // Detect video intrinsic aspect from the current video texture
      const videoEl = newTex.primary?.image
      if (videoEl && videoEl.videoWidth && videoEl.videoHeight) {
        state.videoAspect = videoEl.videoWidth / videoEl.videoHeight
      }

      // Transition progress (cubic ease-out over 1.8s)
      const elapsed = (performance.now() - state.transitionStartTime) / 1000
      const rawT = Math.min(1, elapsed / 1.8)
      const eased = 1 - Math.pow(1 - rawT, 3)
      uniforms.uVideoTransition.value = eased

      if (rawT >= 1) {
        state.isTransitioning = false
        state.previousSectionIndex = -1
        uniforms.uVideoTransition.value = 0
        uniforms.uVideoTexture.value = newTex.primary
      }
    } else {
      // Normal playback — single texture, no blend
      const tex = videoUpdate(state.currentSectionIndex)
      uniforms.uVideoTexture.value = tex.primary
      uniforms.uVideoTransition.value = 0

      // Detect video intrinsic aspect from the current video
      const videoEl = tex.primary?.image
      if (videoEl && videoEl.videoWidth && videoEl.videoHeight) {
        state.videoAspect = videoEl.videoWidth / videoEl.videoHeight
      }
    }
  })

  // --- Cleanup ---
  useEffect(() => {
    return () => {
      marbleTexture.dispose()
      fallbackTexture.dispose()
      if (materialRef.current) {
        materialRef.current.dispose()
      }
    }
  }, [marbleTexture, fallbackTexture])

  return (
    <mesh ref={meshRef} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  )
}
