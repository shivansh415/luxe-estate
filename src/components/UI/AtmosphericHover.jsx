import { useRef, useEffect } from 'react'

/**
 * AtmosphericHover — Stable Immersive Corner Reveal
 *
 * Static-noise, cursor-reactive ink reveal inspired by Immersive Garden.
 * It renders only while reveal/cursor values are changing, then holds the
 * last frame with no idle RAF and no time-driven drift.
 */

/* ── Vertex Shader ─────────────────────────────────────── */
const VERT_SRC = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

/* ── Fragment Shader — Ink Blotch ────────────────────────── */
const FRAG_SRC = `
precision highp float;

uniform float uProgress;
uniform float uMotion;
uniform vec2  uMouse;
uniform vec2  uResolution;

/* ── Simple 2D hash ── */
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)),
           dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}

/* ── Gradient noise with quintic interpolation ── */
float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(dot(hash2(i + vec2(0,0)), f - vec2(0,0)),
        dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
    mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)),
        dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x),
    u.y
  );
}

/* ── FBM: compact static detail, no time input ── */
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * gnoise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

float warpedFBM(vec2 p) {
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0)),
    fbm(p + vec2(5.2, 1.3))
  );

  vec2 r = vec2(
    fbm(p + 2.4 * q + vec2(1.7, 9.2)),
    fbm(p + 2.4 * q + vec2(8.3, 2.8))
  );

  return fbm(p + 2.8 * r);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;

  vec2 auv = vec2(uv.x * aspect, uv.y);
  vec2 corner = vec2(aspect, 1.0);
  vec2 fromCorner = auv - corner;

  float cornerDist = length(fromCorner * vec2(0.9, 1.18));
  float topEdgeDist = max(1.0 - uv.y, 0.0);
  float rightEdgeDist = max(1.0 - uv.x, 0.0);
  float edgeDist = min(topEdgeDist * 1.28, rightEdgeDist * 1.1);
  float dist = min(cornerDist, edgeDist + 0.22);
  vec2 mouse = vec2(uMouse.x * aspect, uMouse.y);
  float mousePull = smoothstep(0.55, 0.0, length((auv - mouse) * vec2(0.85, 1.1)));

  vec2 noiseCoord = auv * 1.85;
  float warp1 = warpedFBM(noiseCoord);
  float warp2 = fbm(noiseCoord * 2.7 + vec2(3.1, 7.4));
  float paperGrain = fbm(noiseCoord * 6.0 + vec2(11.0, 2.0));

  float reveal = smoothstep(0.0, 1.0, uProgress);
  float warpAmount = (0.31 + 0.08 * uMotion) * reveal;
  float distortedDist = dist
    - warp1 * warpAmount * 0.78
    - warp2 * warpAmount * 0.24
    - mousePull * (0.08 + 0.04 * uMotion) * reveal;

  float inkRadius = reveal * 0.94;
  float core = smoothstep(inkRadius, inkRadius * 0.16, distortedDist);
  float hardCore = smoothstep(inkRadius * 0.42, 0.0, distortedDist);
  float fringe = smoothstep(inkRadius * 1.48, inkRadius * 0.52, distortedDist - paperGrain * 0.065 * reveal);
  float alpha = max(core * 0.98, fringe * 0.62);
  alpha = mix(alpha, 1.0, hardCore * 0.58);
  alpha *= reveal;

  alpha = clamp(alpha, 0.0, 1.0);

  vec3 inkColor = vec3(0.008, 0.008, 0.009);

  gl_FragColor = vec4(inkColor * alpha, alpha);
}
`

export default function AtmosphericHover({ isActive }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const stateRef = useRef({
    progress: 0,
    targetProgress: 0,
    mouseX: 0.92,
    mouseY: 0.92,
    targetMouseX: 0.92,
    targetMouseY: 0.92,
    motion: 0,
    targetMotion: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    hasPointer: false,
    lastFrameTime: 0,
    isRunning: false,
  })

  /* ── WebGL initialization ─────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
      }) ||
      canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
      })
    if (!gl) {
      console.warn('[AtmosphericHover] WebGL not available')
      return
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.05)
      const width = Math.max(1, Math.round(rect.width * dpr))
      const height = Math.max(1, Math.round(rect.height * dpr))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
        if (stateRef.current.progress > 0) startRef.current?.()
      }
    }

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, VERT_SRC)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.warn('[AtmosphericHover] VS error:', gl.getShaderInfoLog(vs))
      return
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, FRAG_SRC)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.warn('[AtmosphericHover] FS error:', gl.getShaderInfoLog(fs))
      return
    }

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[AtmosphericHover] Link error:', gl.getProgramInfoLog(program))
      return
    }

    // Quad for the localized top-right canvas
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )
    const aPos = gl.getAttribLocation(program, 'aPosition')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    // Uniform locations
    const uProgress = gl.getUniformLocation(program, 'uProgress')
    const uMotion = gl.getUniformLocation(program, 'uMotion')
    const uMouse = gl.getUniformLocation(program, 'uMouse')
    const uResolution = gl.getUniformLocation(program, 'uResolution')

    // Alpha blending
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    resize()

    // Render loop
    const render = () => {
      const state = stateRef.current
      const now = performance.now()
      const dt = Math.min((now - state.lastFrameTime) / 1000, 0.1)
      state.lastFrameTime = now

      const lambda = state.targetProgress > state.progress ? 2.65 : 3.8
      const factor = 1 - Math.exp(-lambda * dt)
      state.progress += (state.targetProgress - state.progress) * factor

      const mouseFactor = 1 - Math.exp(-18.0 * dt)
      state.mouseX += (state.targetMouseX - state.mouseX) * mouseFactor
      state.mouseY += (state.targetMouseY - state.mouseY) * mouseFactor
      state.targetMotion *= Math.exp(-10.0 * dt)
      state.motion += (state.targetMotion - state.motion) * mouseFactor

      if (state.progress < 0.001 && state.targetProgress === 0) {
        state.progress = 0
        state.isRunning = false
        rafRef.current = null
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        return
      }

      // Draw
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.uniform1f(uProgress, state.progress)
      gl.uniform1f(uMotion, state.motion)
      gl.uniform2f(uMouse, state.mouseX, state.mouseY)
      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      const progressSettled = Math.abs(state.targetProgress - state.progress) < 0.0015
      const mouseSettled =
        Math.abs(state.targetMouseX - state.mouseX) + Math.abs(state.targetMouseY - state.mouseY) < 0.0015
      const motionSettled = state.motion < 0.002 && state.targetMotion < 0.002

      if (progressSettled && mouseSettled && motionSettled) {
        state.progress = state.targetProgress
        state.isRunning = false
        rafRef.current = null
        return
      }

      rafRef.current = requestAnimationFrame(render)
    }

    startRef.current = () => {
      const state = stateRef.current
      if (!state.isRunning) {
        state.isRunning = true
        state.lastFrameTime = performance.now()
        rafRef.current = requestAnimationFrame(render)
      }
    }

    const handlePointerMove = (event) => {
      const state = stateRef.current
      const rect = canvas.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = 1 - (event.clientY - rect.top) / rect.height
      const dx = state.hasPointer ? event.clientX - state.lastPointerX : 0
      const dy = state.hasPointer ? event.clientY - state.lastPointerY : 0
      const speed = Math.min(Math.hypot(dx, dy) / Math.max(window.innerWidth, window.innerHeight) * 6, 1)

      state.targetMouseX = Math.min(1, Math.max(0, x))
      state.targetMouseY = Math.min(1, Math.max(0, y))
      state.targetMotion = Math.max(state.targetMotion, speed)
      state.lastPointerX = event.clientX
      state.lastPointerY = event.clientY
      state.hasPointer = true

      if (state.targetProgress > 0) startRef.current?.()
    }

    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buffer)
    }
  }, [])

  /* ── Hover state → trigger expansion ── */
  useEffect(() => {
    stateRef.current.targetProgress = isActive ? 1.0 : 0.0
    document.body.classList.toggle('hover-immersive-active', isActive)
    startRef.current?.()

    return () => {
      if (!isActive) return
      document.body.classList.remove('hover-immersive-active')
    }
  }, [isActive])

  return (
    <>
      <div className="immersive-ink-backing" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(92vw, 1440px)',
          height: 'min(88vh, 1040px)',
          contain: 'strict',
          pointerEvents: 'none',
          zIndex: 102,
        }}
      />
    </>
  )
}
