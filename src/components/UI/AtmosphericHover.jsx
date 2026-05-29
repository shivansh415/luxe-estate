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
uniform float uTime;
uniform vec2  uMouse;
uniform vec2  uResolution;
uniform sampler2D uReveal;
uniform float uRevealReady;
uniform float uRevealAspect;

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

/* ── 4-octave fBm ── */
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

/* ── Domain-warped fBm — produces cauliflower billows
       (Immersive-Garden-style atmospheric forms). ── */
float warpedFBM(vec2 p, float t) {
  vec2 q = vec2(
    fbm(p + vec2(0.0,  0.0) + t * 0.18),
    fbm(p + vec2(5.2,  1.3) - t * 0.14)
  );
  vec2 r = vec2(
    fbm(p + 2.4 * q + vec2(1.7, 9.2) + t * 0.10),
    fbm(p + 2.4 * q + vec2(8.3, 2.8) - t * 0.08)
  );
  return fbm(p + 2.8 * r);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 auv = vec2(uv.x * aspect, uv.y);

  /* CTA corner anchor (top-right of the canvas) */
  vec2 corner = vec2(aspect, 1.0);
  vec2 fromCorner = auv - corner;
  float cornerDist = length(fromCorner * vec2(0.92, 1.18));

  /* Cursor-shaped pull — drifts the smoke gently toward the cursor */
  vec2 mouseAuv = vec2(uMouse.x * aspect, uMouse.y);
  float mouseDist = length((auv - mouseAuv) * vec2(0.88, 1.12));
  float mousePull = smoothstep(0.62, 0.0, mouseDist);

  float reveal = smoothstep(0.0, 1.0, uProgress);

  /* ── Noise field driving smoke shape ── */
  float t = uTime * 0.55;
  vec2 noiseCoord = auv * 1.7 + vec2(0.4, -0.3);
  float warp1 = warpedFBM(noiseCoord, t);
  float warp2 = fbm(noiseCoord * 2.6 + vec2(3.1, 7.4) + t * 0.2);
  float micro = fbm(noiseCoord * 5.4 + vec2(11.0, 2.0) - t * 0.15);

  /* Displace the corner-distance field with the noise to break up
     any circular silhouette into organic billows. */
  float warpAmount = (0.36 + 0.10 * uMotion) * reveal;
  float distortedDist = cornerDist
    - warp1 * warpAmount * 0.92
    - warp2 * warpAmount * 0.32
    - mousePull * (0.10 + 0.05 * uMotion) * reveal;

  /* ── Smoke alpha — soft falloff with feathered fringe ── */
  /* Radius kept compact so the smoke stays anchored to the CTA corner
     and never reaches the canvas edges where the rectangular bound
     would become visible. */
  float radius   = 0.18 + reveal * 0.55;
  float core     = smoothstep(radius * 1.05, radius * 0.18, distortedDist);
  float fringe   = smoothstep(radius * 1.55, radius * 0.55,
                              distortedDist - micro * 0.085 * reveal);
  float smokeA   = max(core * 0.85, fringe * 0.45);
  smokeA *= reveal;

  /* ── Property-image reveal embedded in the smoke ── */
  /* Sample with UVs displaced by the same noise field so the image
     looks like it's inside the volume. Add a small cursor parallax. */
  vec2 parallax = (uMouse - 0.5) * 0.035;
  vec2 imageUV  = uv + vec2(warp1, warp2) * 0.045 * reveal + parallax;

  /* Cover-fit the property image into the canvas using uRevealAspect */
  float canvasAspect = aspect;
  vec2 fitUV = imageUV;
  if (uRevealAspect > canvasAspect) {
    float scale = canvasAspect / uRevealAspect;
    fitUV.x = (imageUV.x - 0.5) * scale + 0.5;
  } else {
    float scale = uRevealAspect / canvasAspect;
    fitUV.y = (imageUV.y - 0.5) * scale + 0.5;
  }
  fitUV = clamp(fitUV, 0.0, 1.0);

  vec3 propertyCol = texture2D(uReveal, fitUV).rgb;

  /* Image is only visible in the *dense* interior of the smoke,
     so it feels embedded — never appears on thin fringes. */
  float imageMask = smoothstep(radius * 0.85, radius * 0.32, distortedDist);
  imageMask *= reveal * uRevealReady;

  /* ── Gold marble-vein accents ── */
  float veinField = abs(fbm(noiseCoord * 3.2 + vec2(2.3, -4.7) + t * 0.12)
                        - micro);
  float veins = pow(1.0 - smoothstep(0.0, 0.12, veinField), 6.0);
  veins *= smoothstep(radius * 1.3, radius * 0.4, distortedDist);
  veins *= reveal;

  /* ── Compose colors ── */
  vec3 smokeColor = vec3(0.012, 0.011, 0.012);          /* deep ink */
  vec3 goldColor  = vec3(0.690, 0.478, 0.353);          /* #B07A5A */

  /* Smoke darkens. Image lights the dense core. Veins add gold. */
  vec3 col = smokeColor;
  col = mix(col, propertyCol * 0.92, imageMask);
  col += goldColor * veins * 0.55;

  /* ── Edge feather — kills the canvas's rectangular bounds.
        Two layers:
        1. A radial falloff anchored to the top-right CTA corner that
           softly attenuates anything more than ~40% away from the CTA.
        2. Per-axis smoothsteps from the left and bottom edges that
           guarantee alpha=0 across a wide band, so neither boundary
           can ever produce a visible line.                             */
  float cornerFalloff = 1.0 - smoothstep(0.32, 0.95,
                                          length((uv - vec2(1.0, 1.0)) *
                                                 vec2(1.0, aspect / max(aspect, 1.0))));
  float edgeFadeX = smoothstep(0.0, 0.55, uv.x);
  float edgeFadeY = smoothstep(0.0, 0.55, uv.y);
  float edgeFade  = edgeFadeX * edgeFadeY * cornerFalloff;

  float alpha = max(smokeA, imageMask * 0.78);
  alpha *= edgeFade;
  /* Global density softening keeps the volume premium and atmospheric
     rather than panel-like. Image term gets its own scaling above. */
  alpha *= 0.78;
  alpha  = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(col * alpha, alpha);
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
    time: 0,
    revealReady: 0,
    revealAspect: 16 / 9,
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
    const uTime = gl.getUniformLocation(program, 'uTime')
    const uMouse = gl.getUniformLocation(program, 'uMouse')
    const uResolution = gl.getUniformLocation(program, 'uResolution')
    const uReveal = gl.getUniformLocation(program, 'uReveal')
    const uRevealReady = gl.getUniformLocation(program, 'uRevealReady')
    const uRevealAspect = gl.getUniformLocation(program, 'uRevealAspect')

    /* ── Reveal texture (lazy, GPU-friendly) ──
       1×1 placeholder used until the property image decodes, so the
       shader never samples an undefined texture. The placeholder is
       silently replaced once the image is ready — no flicker because
       uRevealReady gates the image term in the fragment shader. */
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([10, 10, 12, 255])
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const revealImg = new Image()
    revealImg.crossOrigin = 'anonymous'
    let revealCancelled = false
    const finishImageUpload = () => {
      if (revealCancelled) return
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texImage2D(
          gl.TEXTURE_2D, 0, gl.RGBA,
          gl.RGBA, gl.UNSIGNED_BYTE, revealImg
        )
        if (revealImg.naturalWidth && revealImg.naturalHeight) {
          stateRef.current.revealAspect =
            revealImg.naturalWidth / revealImg.naturalHeight
        }
        stateRef.current.revealReady = 1
        if (stateRef.current.progress > 0) startRef.current?.()
      } catch (err) {
        console.warn('[AtmosphericHover] reveal upload failed:', err)
      }
    }
    if (typeof revealImg.decode === 'function') {
      revealImg.src = '/project-showcase-bg.jpeg'
      revealImg.decode().then(finishImageUpload).catch(finishImageUpload)
    } else {
      revealImg.onload = finishImageUpload
      revealImg.onerror = () => {} /* keep placeholder, gated by uRevealReady */
      revealImg.src = '/project-showcase-bg.jpeg'
    }

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

      /* Advance time only while smoke is visible — preserves the
         "no idle RAF" behavior on hover-out for battery life. */
      if (state.progress > 0.001 || state.targetProgress > 0) {
        state.time += dt
      }

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

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(uReveal, 0)

      gl.uniform1f(uProgress, state.progress)
      gl.uniform1f(uMotion, state.motion)
      gl.uniform1f(uTime, state.time)
      gl.uniform2f(uMouse, state.mouseX, state.mouseY)
      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform1f(uRevealReady, state.revealReady)
      gl.uniform1f(uRevealAspect, state.revealAspect)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      /* Keep RAF alive while smoke is on screen so the warped fBm
         keeps drifting — this is what makes the cloud feel alive
         instead of a static frame held after the expansion settles. */
      const stillRevealed = state.targetProgress > 0 || state.progress > 0.001
      if (!stillRevealed) {
        const progressSettled = Math.abs(state.targetProgress - state.progress) < 0.0015
        const mouseSettled =
          Math.abs(state.targetMouseX - state.mouseX) +
          Math.abs(state.targetMouseY - state.mouseY) < 0.0015
        const motionSettled = state.motion < 0.002 && state.targetMotion < 0.002
        if (progressSettled && mouseSettled && motionSettled) {
          state.progress = state.targetProgress
          state.isRunning = false
          rafRef.current = null
          return
        }
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
      revealCancelled = true
      revealImg.onload = null
      revealImg.onerror = null
      gl.deleteTexture(texture)
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
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(58vw, 880px)',
          height: 'min(62vh, 720px)',
          contain: 'strict',
          pointerEvents: 'none',
          zIndex: 102,
        }}
      />
    </>
  )
}
