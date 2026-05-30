import { useRef, useEffect, useCallback } from 'react'
import { isCoarsePointer } from '../utils/mobile'

/* Coarse-pointer status is stable per device session — read once at
   module load. This lets the hook early-return on mobile without
   violating the rules of hooks (the hook order is consistent for
   the lifetime of the component on a given device). */
const SKIP_GLASS = isCoarsePointer()

/**
 * useCardGlassEffect
 *
 * Ultra-lightweight pure WebGL hover distortion for thumbnail images.
 *
 * ARCHITECTURE (performance-first):
 * - Static ImageTexture (one-time GPU upload, not per-frame like VideoTexture)
 * - Renders ONLY during hover + damping out (RAF self-terminates when idle)
 * - WebGL context created ONCE and kept alive — not tied to viewport visibility
 * - Event listeners attached once at mount, cleaned up at unmount
 * - Low DPR (capped at 1.25) for minimal fragment cost
 * - Simple radial displacement + chromatic split — no FBM, no domain warping
 * - Canvas localized inside card bounds, not fullscreen
 */

function createShader(gl, type, source) {
  const s = gl.createShader(type)
  gl.shaderSource(s, source)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s)
    return null
  }
  return s
}

function createProgram(gl, vs, fs) {
  const p = gl.createProgram()
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    return null
  }
  return p
}

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

// Shader with cover-crop logic to handle any canvas-to-texture aspect mismatch.
// Flips vUv.y to correct WebGL's bottom-to-top Y axis.
const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uMouse;
uniform float uHover;
uniform float uTime;
uniform float uTexAspect;
uniform float uCanvasAspect;
varying vec2 vUv;

// object-fit: cover equivalent — crops texture to fill canvas
vec2 getCoverUv(vec2 uv, float texAspect, float canAspect) {
  float s = canAspect / texAspect;
  if (s > 1.0) {
    // Canvas is wider than texture: crop top/bottom
    uv.y = (uv.y - 0.5) / s + 0.5;
  } else {
    // Canvas is taller than texture: crop left/right
    uv.x = (uv.x - 0.5) * s + 0.5;
  }
  return uv;
}

void main() {
  // Correct Y-axis: WebGL UV origin is bottom-left, image is top-left
  vec2 screenUv = vec2(vUv.x, 1.0 - vUv.y);

  // Apply cover-crop to match object-fit: cover behavior
  vec2 baseUv = getCoverUv(screenUv, uTexAspect, uCanvasAspect);

  // Internal parallax zoom on hover (keeps card edges rigid)
  vec2 uv = (baseUv - 0.5) * (1.0 - uHover * 0.018) + 0.5;
  vec2 parallax = (uMouse - 0.5) * uHover * 0.008;
  uv -= parallax;

  // Localized radial distortion from cursor (in screen space for correct radius)
  vec2 toMouse = screenUv - uMouse;
  float dist = length(toMouse);
  float wave = sin(dist * 14.0 - uTime * 1.6) * smoothstep(0.45, 0.0, dist);
  vec2 disp = normalize(toMouse + 0.001) * wave * uHover * 0.01;

  // Chromatic aberration (RGB split) — 3 taps only
  vec2 rUv = clamp(uv + disp * 1.2, 0.001, 0.999);
  vec2 gUv = clamp(uv + disp, 0.001, 0.999);
  vec2 bUv = clamp(uv + disp * 0.8, 0.001, 0.999);

  vec4 color;
  color.r = texture2D(uTex, rUv).r;
  color.g = texture2D(uTex, gUv).g;
  color.b = texture2D(uTex, bUv).b;
  color.a = 1.0;

  // Subtle vignette (in screen space so it wraps card edges, not texture edges)
  float vig = smoothstep(0.5, 0.0, min(min(screenUv.x, 1.0 - screenUv.x), min(screenUv.y, 1.0 - screenUv.y))) * 0.1;
  color.rgb *= 1.0 - vig;

  gl_FragColor = color;
}
`

/**
 * @param {React.RefObject} canvasRef  — ref to the <canvas> element inside the card
 * @param {React.RefObject} containerRef — ref to the card container div
 * @param {boolean} imgReady — true once the thumbnail <img> has loaded (onLoad fired)
 */
export function useCardGlassEffect(canvasRef, containerRef, imgReady) {
  const rafRef = useRef(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  const hoverRef = useRef(0)
  const targetHoverRef = useRef(0)
  const lastTimeRef = useRef(0)
  const glRef = useRef(null)          // WebGL context (persists)
  const programRef = useRef(null)     // shader program
  const uniformsRef = useRef(null)    // uniform locations
  const initDoneRef = useRef(false)   // prevent double init

  // Stable mouse handlers — direct DOM, no React rerender
  const handleMouseMove = useCallback((e) => {
    const c = containerRef.current
    if (!c) return
    const r = c.getBoundingClientRect()
    targetMouseRef.current.x = (e.clientX - r.left) / r.width
    targetMouseRef.current.y = (e.clientY - r.top) / r.height
  }, [containerRef])

  const startLoop = useCallback(() => {
    if (rafRef.current) return // already running

    const animate = () => {
      const gl = glRef.current
      const canvas = canvasRef.current
      const uniforms = uniformsRef.current

      // Self-terminate when fully un-hovered and damped to zero
      if (targetHoverRef.current === 0 && hoverRef.current < 0.001) {
        hoverRef.current = 0
        rafRef.current = null
        // Final render at hover=0 to restore clean state
        if (gl && canvas && uniforms) {
          gl.viewport(0, 0, canvas.width, canvas.height)
          gl.uniform1f(uniforms.uHover, 0)
          gl.uniform2f(uniforms.uMouse, 0.5, 0.5)
          gl.drawArrays(gl.TRIANGLES, 0, 6)
        }
        return
      }

      const now = performance.now()
      const dt = Math.min((now - (lastTimeRef.current || now)) / 1000, 0.1)
      lastTimeRef.current = now

      // Exponential damping — smooth interpolation
      const mf = 1 - Math.exp(-8 * dt)
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * mf
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * mf

      const hl = targetHoverRef.current > hoverRef.current ? 5 : 3
      hoverRef.current += (targetHoverRef.current - hoverRef.current) * (1 - Math.exp(-hl * dt))

      if (gl && canvas && uniforms) {
        // Resize check (cheap — integer compare)
        const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
        const nw = Math.round(canvas.clientWidth * dpr)
        const nh = Math.round(canvas.clientHeight * dpr)
        if (canvas.width !== nw || canvas.height !== nh) {
          canvas.width = nw
          canvas.height = nh
        }

        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.uniform2f(uniforms.uMouse, mouseRef.current.x, mouseRef.current.y)
        gl.uniform1f(uniforms.uHover, hoverRef.current)
        gl.uniform1f(uniforms.uTime, now / 1000)
        // Update canvas aspect on every frame (handles resize)
        gl.uniform1f(uniforms.uCanvasAspect, canvas.clientWidth / canvas.clientHeight || 1)
        gl.uniform1f(uniforms.uTexAspect, uniforms._texAspect)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(animate)
  }, [canvasRef])

  const handleMouseEnter = useCallback(() => {
    targetHoverRef.current = 1
    startLoop()
  }, [startLoop])

  const handleMouseLeave = useCallback(() => {
    targetHoverRef.current = 0
    targetMouseRef.current.x = 0.5
    targetMouseRef.current.y = 0.5
    // Don't kill RAF — let it damp to zero naturally, then self-terminate
  }, [])

  // ONE-TIME WebGL init — runs when thumbnail loads, never re-runs
  useEffect(() => {
    /* Touch / coarse-pointer devices: skip the entire WebGL init.
       There's no hover, so the distortion is dead code. This removes
       up to ~8 WebGL contexts and texture uploads on the mobile home
       page — critical because mobile context limits start at 8. */
    if (SKIP_GLASS) return

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !imgReady || initDoneRef.current) return

    const img = container.querySelector('img')
    if (!img || !img.naturalWidth) return

    initDoneRef.current = true

    // Attach event listeners ONCE
    container.addEventListener('mousemove', handleMouseMove, { passive: true })
    container.addEventListener('mouseenter', handleMouseEnter, { passive: true })
    container.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    // Low DPR for performance
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
    canvas.width = Math.round(canvas.clientWidth * dpr)
    canvas.height = Math.round(canvas.clientHeight * dpr)

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    })
    if (!gl) return

    glRef.current = gl

    const vs = createShader(gl, gl.VERTEX_SHADER, VERT)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const prog = createProgram(gl, vs, fs)
    if (!prog) return

    programRef.current = prog

    // Fullscreen quad
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    // Upload thumbnail as static texture (one-time GPU upload)
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

    // Compute texture aspect ratio from loaded image
    const texAspect = img.naturalWidth / img.naturalHeight || 16 / 9
    const canvasAspect = canvas.clientWidth / canvas.clientHeight || 16 / 9

    // Cache uniform locations
    uniformsRef.current = {
      uTex: gl.getUniformLocation(prog, 'uTex'),
      uMouse: gl.getUniformLocation(prog, 'uMouse'),
      uHover: gl.getUniformLocation(prog, 'uHover'),
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uTexAspect: gl.getUniformLocation(prog, 'uTexAspect'),
      uCanvasAspect: gl.getUniformLocation(prog, 'uCanvasAspect'),
      _texAspect: texAspect,  // store for render loop
    }

    gl.useProgram(prog)
    gl.uniform1i(uniformsRef.current.uTex, 0)
    gl.uniform1f(uniformsRef.current.uTexAspect, texAspect)
    gl.uniform1f(uniformsRef.current.uCanvasAspect, canvasAspect)

    // Initial render at hover=0 so canvas shows the un-distorted image
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(uniformsRef.current.uMouse, 0.5, 0.5)
    gl.uniform1f(uniformsRef.current.uHover, 0)
    gl.uniform1f(uniformsRef.current.uTime, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    return () => {
      initDoneRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)

      // FIX M-10: disable vertex attribute before deleting buffer
      // Prevents dangling attribute state on browsers that share WebGL state (Firefox)
      const aPos = gl.getAttribLocation(prog, 'aPos')
      if (aPos >= 0) gl.disableVertexAttribArray(aPos)

      gl.deleteTexture(tex)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      programRef.current = null
      uniformsRef.current = null
      glRef.current = null
      const ext = gl.getExtension('WEBGL_lose_context')
      if (ext) ext.loseContext()
    }
  }, [canvasRef, containerRef, imgReady, handleMouseMove, handleMouseEnter, handleMouseLeave])
}
