import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { isCoarsePointer } from '../utils/mobile'

const SKIP_CARD_WEBGL = isCoarsePointer()

/**
 * useCardWebGL
 *
 * Reusable React hook that implements a localized WebGL hover distortion effect.
 *
 * KEY ARCHITECTURE:
 * - Direct WebGL Canvas Integration: The video is rendered through WebGL on hover,
 *   overlaying the native HTML5 video smoothly without flashes.
 * - Localized WebGL Context: Three.js renderer is initialized on the canvas only when visible,
 *   and fully cleaned up on scroll-out, ensuring we stay well below browser context limits.
 * - Premium WebGL Refraction: Implements organic value noise displacement and chromatic aberration (RGB split).
 * - Internal Parallax & Zoom: Rather than scaling the card via CSS, the video content is zoomed and shifted
 *   internally in the shader, keeping card edges clean and rigid.
 */
export function useCardWebGL(canvasRef, containerRef, shouldLoadVideo) {
  const rafRef = useRef(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  const hoverStrengthRef = useRef(0)
  const targetHoverRef = useRef(0)
  const lastTimeRef = useRef(0)
  const startLoopRef = useRef(null)

  // Stable callbacks for mouse tracking
  const handleMouseMove = useCallback((e) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    targetMouseRef.current.x = (e.clientX - rect.left) / rect.width
    targetMouseRef.current.y = (e.clientY - rect.top) / rect.height
  }, [containerRef])

  const handleMouseEnter = useCallback(() => {
    targetHoverRef.current = 1
    startLoopRef.current?.()
  }, [])

  const handleMouseLeave = useCallback(() => {
    targetHoverRef.current = 0
    targetMouseRef.current.x = 0.5
    targetMouseRef.current.y = 0.5
  }, [])

  useEffect(() => {
    /* Touch devices: skip the entire Three.js renderer + video
       texture init. Removes one extra WebGL context per card on
       mobile, well below the hardware context limit. */
    if (SKIP_CARD_WEBGL) return

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !shouldLoadVideo) return

    // Event listeners
    container.addEventListener('mousemove', handleMouseMove, { passive: true })
    container.addEventListener('mouseenter', handleMouseEnter, { passive: true })
    container.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    // Find the video element
    const video = container.querySelector('video')
    if (!video) return

    let renderer, scene, camera, texture, material, geometry, mesh
    let isDisposed = false

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.15 : 1.5))
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)

      scene = new THREE.Scene()
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

      texture = new THREE.VideoTexture(video)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter

      geometry = new THREE.PlaneGeometry(2, 2)

      material = new THREE.ShaderMaterial({
        depthTest: false,
        depthWrite: false,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform vec2 uMouse;
          uniform float uHover;
          uniform float uTime;
          uniform float uTextureAspect;
          uniform float uCanvasAspect;
          varying vec2 vUv;

          // Smooth 2D noise for organic flow
          float noise(vec2 st) {
              vec2 i = floor(st);
              vec2 f = fract(st);
              float a = sin(dot(i, vec2(127.1, 311.7))) * 43758.5453123;
              float b = sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453123;
              float c = sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453123;
              float d = sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453123;
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix(mix(fract(a), fract(b), u.x), mix(fract(c), fract(d), u.x), u.y);
          }

          vec2 getCoverUv(vec2 uv, float texAspect, float winAspect) {
            vec2 newUv = uv;
            float s = winAspect / texAspect;
            if (s > 1.0) {
              newUv.y = (uv.y - 0.5) / s + 0.5;
            } else {
              newUv.x = (uv.x - 0.5) * s + 0.5;
            }
            return newUv;
          }

          void main() {
            // Apply cover logic to match object-fit
            vec2 uv = getCoverUv(vUv, uTextureAspect, uCanvasAspect);
            
            // WebGL-based internal zoom and 3D parallax shift on hover
            vec2 zoomedUv = (uv - 0.5) * (1.0 - uHover * 0.015) + 0.5;
            vec2 parallax = (uMouse - 0.5) * uHover * 0.006;
            vec2 baseUv = zoomedUv - parallax;
            
            // Localized fluid distortion ripple centered on cursor
            vec2 toMouse = vUv - uMouse;
            float dist = length(toMouse);
            
            // Soft sine ripple propagation
            float wave = sin(dist * 16.0 - uTime * 1.8) * smoothstep(0.4, 0.0, dist);
            
            // Micro-fluid turbulence using dynamic noise
            float n1 = noise(vUv * 6.0 + vec2(0.0, uTime * 0.25));
            float n2 = noise(vUv * 6.0 + vec2(uTime * 0.25, 0.0));
            
            // Combine displacement vectors (subtle refract)
            vec2 displacement = normalize(toMouse + vec2(0.001)) * wave * uHover * 0.012;
            displacement += vec2(n1 - 0.5, n2 - 0.5) * uHover * 0.003 * smoothstep(0.4, 0.0, dist);
            
            // Sample texture with premium chromatic aberration (RGB split)
            vec2 rUv = baseUv + displacement * 1.25;
            vec2 gUv = baseUv + displacement;
            vec2 bUv = baseUv + displacement * 0.75;
            
            // Prevent border bleeding
            rUv = clamp(rUv, 0.001, 0.999);
            gUv = clamp(gUv, 0.001, 0.999);
            bUv = clamp(bUv, 0.001, 0.999);
            
            vec4 color;
            color.r = texture2D(uTexture, rUv).r;
            color.g = texture2D(uTexture, gUv).g;
            color.b = texture2D(uTexture, bUv).b;
            color.a = texture2D(uTexture, gUv).a;
            
            // Subtle edge vignette for atmosphere
            float vignette = smoothstep(0.5, 0.0, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y))) * 0.12;
            color.rgb = mix(color.rgb, color.rgb * 0.85, vignette);
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          uTexture: { value: texture },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uHover: { value: 0.0 },
          uTime: { value: 0.0 },
          uTextureAspect: { value: video.videoWidth / video.videoHeight || 16/9 },
          uCanvasAspect: { value: canvas.clientWidth / canvas.clientHeight || 16/9 },
        }
      })

      mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)
    } catch (err) {
      console.warn('[Luxe Estates] Failed to init card WebGL context:', err)
    }

    const animate = () => {
      if (isDisposed) return

      // Skip WebGL render loop if card is not hovered and hover state is fully reset.
      // This eliminates GPU rendering load when scrolling past cards.
      if (targetHoverRef.current === 0 && hoverStrengthRef.current < 0.001) {
        hoverStrengthRef.current = 0
        if (material && material.uniforms.uHover.value !== 0) {
          material.uniforms.uHover.value = 0
          if (renderer && scene && camera) {
            renderer.render(scene, camera)
          }
        }
        rafRef.current = null
        return
      }

      const now = performance.now()
      const previousTime = lastTimeRef.current || now
      const delta = Math.min((now - previousTime) / 1000, 0.1)
      lastTimeRef.current = now

      // Premium exponential damping
      const mouseFactor = 1 - Math.exp(-6 * delta)
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * mouseFactor
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * mouseFactor

      const hoverLambda = targetHoverRef.current > hoverStrengthRef.current ? 4 : 2.5
      const hoverFactor = 1 - Math.exp(-hoverLambda * delta)
      hoverStrengthRef.current += (targetHoverRef.current - hoverStrengthRef.current) * hoverFactor

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const hover = hoverStrengthRef.current

      // WebGL render cycle
      if (renderer && scene && camera && material) {
        // Auto resize check
        const w = canvas.clientWidth
        const h = canvas.clientHeight
        if (canvas.width !== w || canvas.height !== h) {
          renderer.setSize(w, h, false)
          material.uniforms.uCanvasAspect.value = w / h
        }

        material.uniforms.uTime.value = now / 1000
        material.uniforms.uHover.value = hover
        material.uniforms.uMouse.value.set(mx, 1.0 - my)
        material.uniforms.uTextureAspect.value = video.videoWidth / video.videoHeight || 16/9

        renderer.render(scene, camera)
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    startLoopRef.current = () => {
      if (isDisposed || rafRef.current) return
      lastTimeRef.current = performance.now()
      rafRef.current = requestAnimationFrame(animate)
    }

    return () => {
      isDisposed = true
      startLoopRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)

      // Clean up WebGL resources
      try {
        if (texture) texture.dispose()
        if (material) material.dispose()
        if (geometry) geometry.dispose()
        if (renderer) {
          renderer.dispose()
          renderer.forceContextLoss()
        }
      } catch {
        // ignore
      }
    }
  }, [canvasRef, containerRef, shouldLoadVideo, handleMouseMove, handleMouseEnter, handleMouseLeave])
}
