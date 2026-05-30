// ============================================================
// Marble Reveal — Fragment Shader
// Cinematic luxury real estate composite shader.
// Combines animated marble, gold vein glow, organic reveal
// mask, and video compositing with post-processing.
//
// RESPONSIVE: All texture sampling uses cover-style UV scaling
// to prevent stretching on any viewport aspect ratio.
// ============================================================

precision mediump float;

// --- Uniforms ---
uniform float uTime;
uniform sampler2D uMarbleTexture;
uniform sampler2D uVideoTexture;
uniform sampler2D uNextVideoTexture;
uniform float uVideoTransition;
uniform vec2 uMouse;
uniform float uRevealProgress;
uniform float uAutoRevealPhase;
uniform float uGoldGlowIntensity;
uniform vec2 uResolution;
uniform float uDpr;
uniform float uScrollProgress;
uniform float uMarbleAspect;   // marble texture width / height
uniform float uVideoAspect;    // video texture width / height

// --- Varyings ---
varying vec2 vUv;

// ============================================================
// COVER-STYLE UV SCALING
// Replicates CSS object-fit: cover inside the shader.
// Ensures textures fill the viewport without distortion by
// cropping the excess dimension and centering.
// ============================================================

vec2 coverUV(vec2 uv, float viewportAspect, float textureAspect) {
  vec2 result = uv;

  if (viewportAspect > textureAspect) {
    // Viewport is wider than texture → crop top/bottom
    float scale = viewportAspect / textureAspect;
    result.y = (uv.y - 0.5) / scale + 0.5;
  } else {
    // Viewport is taller than texture → crop left/right
    float scale = textureAspect / viewportAspect;
    result.x = (uv.x - 0.5) / scale + 0.5;
  }

  return result;
}

// ============================================================
// ASPECT-CORRECTED SCREEN COORDINATES
// For distance-based effects (reveal mask, vignette, fog).
// Normalizes coordinates so circles appear circular regardless
// of viewport aspect ratio.
// ============================================================

vec2 aspectCorrectedUV(vec2 uv, float viewportAspect) {
  vec2 corrected = uv - 0.5;
  if (viewportAspect > 1.0) {
    // Landscape: stretch X
    corrected.x *= viewportAspect;
  } else {
    // Portrait: stretch Y
    corrected.y /= viewportAspect;
  }
  return corrected;
}

// ============================================================
// INLINE NOISE FUNCTIONS
// All noise is self-contained — no imports.
// ============================================================

// --- Hash functions ---
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash2(vec2 p) {
  p = vec2(
    dot(p, vec2(127.1, 311.7)),
    dot(p, vec2(269.5, 183.3))
  );
  return fract(sin(p) * 43758.5453123);
}

// --- Simplex 2D ---
vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289_2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute3(vec3 x) { return mod289_3(((x * 34.0) + 1.0) * x); }

float snoise2(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
   -0.577350269189626,
    0.024390243902439
  );

  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod289_2(i);
  vec3 p = permute3(
    permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(0.5 - vec3(
    dot(x0, x0),
    dot(x12.xy, x12.xy),
    dot(x12.zw, x12.zw)
  ), 0.0);
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// --- Simplex 3D ---
vec4 mod289_4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute4(vec4 x) { return mod289_4(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise3(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289_3(i);
  vec4 p = permute4(permute4(permute4(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// --- FBM (5 octaves, simplex 2D) ---
// On mobile: 3 octaves halves the per-pixel noise cost.
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
#ifdef MOBILE
  const int OCTAVES = 3;
#else
  const int OCTAVES = 5;
#endif
  for (int i = 0; i < OCTAVES; i++) {
    value += amplitude * snoise2(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// --- Voronoi 2D ---
vec2 voronoi(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float f1 = 8.0;
  float f2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      vec2 delta = g + o - f;
      float d = dot(delta, delta);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return vec2(sqrt(f1), sqrt(f2));
}

// ============================================================
// GOLD VEIN DETECTION
// Analyzes marble texture to find vein structures using
// Sobel-like gradient magnitude + golden color detection.
// Uses cover-corrected UVs for marble sampling.
// ============================================================

float detectVeins(vec2 marbleUv) {
#ifdef MOBILE
  /* Mobile fast path: skip the 9-tap Sobel and Voronoi (each costs
     9 noise samples). Use a cheap luminance + golden-channel test
     only — visually 95% identical at typical mobile DPRs. */
  vec3 marbleCol = texture2D(uMarbleTexture, marbleUv).rgb;
  float goldenness = max(0.0, (marbleCol.r + marbleCol.g) * 0.5 - marbleCol.b * 0.8);
  goldenness = smoothstep(0.05, 0.25, goldenness);
  float lum = dot(marbleCol, vec3(0.299, 0.587, 0.114));
  float luminanceMask = smoothstep(0.45, 0.85, lum);
  float veinMask = max(goldenness * 0.7, luminanceMask * 0.35);
  return smoothstep(0.1, 0.6, veinMask);
#else
  vec2 texel = 1.0 / uResolution;

  // Sobel-like edge detection on marble luminance
  float tl = dot(texture2D(uMarbleTexture, marbleUv + vec2(-texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float t  = dot(texture2D(uMarbleTexture, marbleUv + vec2(0.0, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float tr = dot(texture2D(uMarbleTexture, marbleUv + vec2(texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float ml = dot(texture2D(uMarbleTexture, marbleUv + vec2(-texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float mr = dot(texture2D(uMarbleTexture, marbleUv + vec2(texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float bl = dot(texture2D(uMarbleTexture, marbleUv + vec2(-texel.x, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float b  = dot(texture2D(uMarbleTexture, marbleUv + vec2(0.0, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float br = dot(texture2D(uMarbleTexture, marbleUv + vec2(texel.x, texel.y)).rgb, vec3(0.299, 0.587, 0.114));

  // Sobel gradient
  float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
  float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
  float gradientMag = length(vec2(gx, gy));

  // Detect golden color regions (R and G higher than B)
  vec3 marbleCol = texture2D(uMarbleTexture, marbleUv).rgb;
  float goldenness = max(0.0, (marbleCol.r + marbleCol.g) * 0.5 - marbleCol.b * 0.8);
  goldenness = smoothstep(0.05, 0.25, goldenness);

  // Voronoi-based vein pattern for additional organic structure
  // Use raw UV for procedural noise (not texture UV) for consistent scale
  vec2 vor = voronoi(marbleUv * 8.0 + snoise2(marbleUv * 3.0) * 0.5);
  float veinLine = smoothstep(0.02, 0.08, vor.y - vor.x);
  veinLine = 1.0 - veinLine;

  // Combine all detection methods
  float veinMask = gradientMag * 3.0;
  veinMask = max(veinMask, goldenness * 0.6);
  veinMask = max(veinMask, veinLine * 0.3);
  veinMask = smoothstep(0.1, 0.6, veinMask);

  return veinMask;
#endif
}

// ============================================================
// GOLD GLOW EFFECT
// Animated emissive glow along detected veins with traveling
// light and pulsing intensity.
// ============================================================

vec3 goldGlow(vec2 uv, float veinMask) {
  // Muted, elegant gold — NOT neon
  vec3 goldColor = vec3(0.85, 0.68, 0.25);

  // Animated pulse — very subtle
  float veinNoiseOffset = snoise2(uv * 5.0) * 2.0;
  float pulse = sin(uTime * 0.3 + veinNoiseOffset) * 0.5 + 0.5;

  // Traveling light wave through veins
  float travelWave = snoise2(uv * 3.0 + uTime * 0.1);
  travelWave = smoothstep(-0.2, 0.8, travelWave);

  // Dramatically reduced glow intensity
  float glowIntensity = smoothstep(0.1, 0.9, veinMask);
  glowIntensity *= pulse * 0.5 + travelWave * 0.3;
  glowIntensity *= uGoldGlowIntensity * 0.25; // ← 75% reduction

  // Almost invisible warm highlight
  vec3 warmHighlight = vec3(0.9, 0.65, 0.2) * smoothstep(0.6, 1.0, veinMask) * 0.04;

  return goldColor * glowIntensity + warmHighlight;
}

// ============================================================
// ANIMATED MARBLE
// Living, breathing marble with UV distortion, floating light,
// and subtle grain. Uses cover-corrected UVs.
// ============================================================

vec3 animatedMarble(vec2 marbleUv, vec2 uv) {
  // Subtle UV distortion — breathing marble
  vec2 distortedUv = marbleUv;
  distortedUv += snoise2(marbleUv * 2.0 + uTime * 0.05) * 0.003;
  distortedUv += snoise2(marbleUv * 4.0 - uTime * 0.03) * 0.001;

  // Sample marble with distorted, cover-corrected UVs
  vec3 marble = texture2D(uMarbleTexture, distortedUv).rgb;

  // ── CINEMATIC DARKENING ──
  // Crush the marble luminance down to a dark luxury level.
  // Think: marble seen through dim museum lighting.
  marble *= 0.38;

  // Lift black point slightly for creamy shadows (not pure black)
  marble += 0.02;

  // Floating light — barely perceptible ambient drift
  // Use raw UV for screen-space positioning
  vec2 lightPos = vec2(
    0.5 + sin(uTime * 0.06) * 0.4 + cos(uTime * 0.08) * 0.2,
    0.5 + cos(uTime * 0.07) * 0.3 + sin(uTime * 0.05) * 0.15
  );
  float lightDist = length(uv - lightPos);
  float floatingLight = smoothstep(0.5, 0.0, lightDist) * 0.015;
  marble += floatingLight;

  // Subtle film grain
  float grain = (hash(uv * uResolution + uTime * 100.0) - 0.5) * 0.012;
  marble += grain;

  return marble;
}

// ============================================================
// REVEAL MASK SYSTEM
// Organic, watercolor-like reveal driven by cursor and noise.
// Uses ASPECT-CORRECTED distances so the reveal brush stays
// circular on any viewport shape.
// ============================================================

float revealMask(vec2 uv, vec2 mouse, float viewportAspect) {
  // Aspect-correct both UV and mouse for distance calculation
  vec2 correctedUv = aspectCorrectedUV(uv, viewportAspect);
  vec2 correctedMouse = aspectCorrectedUV(mouse, viewportAspect);

  // --- Primary organic reveal ---
  // Distort the distance field with layered noise for irregular edges
  vec2 noiseOffset = vec2(
    snoise2(uv * 8.0 + uTime * 0.2),
    snoise2(uv * 8.0 + uTime * 0.2 + 100.0)
  ) * 0.06;

  // Use aspect-corrected distance but apply noise in raw UV space
  float distortedDist = length(correctedUv - correctedMouse + noiseOffset);

  // Add FBM noise to the distance for watercolor edges
  distortedDist += fbm(uv * 5.0 + uTime * 0.1) * 0.08;

  // Additional high-frequency distortion for paint-like spreading
  distortedDist += snoise2(uv * 15.0 + uTime * 0.12) * 0.02;

  // Scale the reveal radius based on viewport —
  // on portrait mobile, use a slightly larger base radius
  float revealRadius = 0.3 + uRevealProgress * 0.15;

  // Main reveal with organic falloff
  float revealBase = smoothstep(revealRadius, 0.0, distortedDist);

  // --- Noise-based tendrils ---
  // Thin reveal lines extending from the main reveal area
  float tendrilNoise = snoise2(uv * 12.0 + uTime * 0.15);
  float tendrilMask = smoothstep(0.02, 0.0, abs(tendrilNoise - 0.5));
  tendrilMask *= smoothstep(0.5, 0.2, length(correctedUv - correctedMouse));

  // Secondary tendril layer at different frequency
  float tendril2 = snoise2(uv * 18.0 - uTime * 0.1 + 50.0);
  float tendrilMask2 = smoothstep(0.015, 0.0, abs(tendril2 - 0.3));
  tendrilMask2 *= smoothstep(0.6, 0.25, length(correctedUv - correctedMouse));

  // Combine primary reveal with tendrils
  float finalReveal = max(revealBase, tendrilMask * 0.3);
  finalReveal = max(finalReveal, tendrilMask2 * 0.15);

  return finalReveal;
}

// ============================================================
// AUTOMATIC REVEAL
// Subtle ambient reveals even without cursor interaction.
// Uses aspect-corrected distances for circular shapes.
// ============================================================

float autoReveal(vec2 uv, float viewportAspect) {
  vec2 correctedUv = aspectCorrectedUV(uv, viewportAspect);

  // Drifting auto-reveal center
  vec2 autoCenter = vec2(
    0.5 + sin(uTime * 0.07) * 0.3,
    0.5 + cos(uTime * 0.09) * 0.2
  );
  vec2 correctedAutoCenter = aspectCorrectedUV(autoCenter, viewportAspect);

  float autoDist = length(correctedUv - correctedAutoCenter);
  float autoMask = smoothstep(0.15, 0.0, autoDist + fbm(uv * 6.0 + uTime * 0.08) * 0.1);
  autoMask *= 0.15;

  // Second auto-reveal point for variety
  vec2 autoCenter2 = vec2(
    0.5 + cos(uTime * 0.05 + 2.0) * 0.25,
    0.5 + sin(uTime * 0.06 + 1.5) * 0.25
  );
  vec2 correctedAutoCenter2 = aspectCorrectedUV(autoCenter2, viewportAspect);

  float autoDist2 = length(correctedUv - correctedAutoCenter2);
  float autoMask2 = smoothstep(0.12, 0.0, autoDist2 + fbm(uv * 7.0 - uTime * 0.06) * 0.08);
  autoMask2 *= 0.08;

  // Subtle breathing pulse
  float pulse = sin(uTime * 0.5) * 0.5 + 0.5;

  float totalAuto = (autoMask + autoMask2) * pulse * uAutoRevealPhase;
  return totalAuto;
}

// ============================================================
// MAIN
// ============================================================

void main() {
  vec2 uv = vUv;
  float viewportAspect = uResolution.x / uResolution.y;

  // ── Compute cover-style UVs for texture sampling ──
  vec2 marbleUv = coverUV(uv, viewportAspect, uMarbleAspect);
  vec2 videoUv = coverUV(uv, viewportAspect, uVideoAspect);

  // --- Animated marble (cover-corrected) ---
  vec3 marbleColor = animatedMarble(marbleUv, uv);

  // --- Gold vein detection and glow (cover-corrected marble UVs) ---
  float veinMask = detectVeins(marbleUv);
  vec3 goldVeinGlow = goldGlow(marbleUv, veinMask);

  // --- Reveal mask (aspect-corrected distances) ---
  float cursorReveal = revealMask(uv, uMouse, viewportAspect);
  float autoRevealVal = autoReveal(uv, viewportAspect);
  float totalReveal = clamp(cursorReveal + autoRevealVal, 0.0, 1.0);

  // ── Video compositing with cover-corrected UVs ──
  vec4 videoColor = texture2D(uVideoTexture, videoUv);
  if (uVideoTransition > 0.001) {
    vec4 nextVideo = texture2D(uNextVideoTexture, videoUv);
    videoColor = mix(videoColor, nextVideo, uVideoTransition);
  }

  // ── Cinematic video grading ──
  // Dreamy desaturation + warm color shift
  float luma = dot(videoColor.rgb, vec3(0.299, 0.587, 0.114));
  videoColor.rgb = mix(vec3(luma), videoColor.rgb, 0.80);
  videoColor.rgb *= vec3(1.02, 0.98, 0.90); // warm shift

  // Filmic contrast — lift shadows, compress highlights
  videoColor.rgb = videoColor.rgb * 0.92 + 0.03;
  videoColor.rgb = smoothstep(vec3(0.02), vec3(1.0), videoColor.rgb);

  // ── Edge glow at reveal boundary (greatly reduced) ──
  float edgeGlow = smoothstep(0.0, 0.15, totalReveal) * smoothstep(0.4, 0.15, totalReveal);
  vec3 edgeGlowColor = edgeGlow * vec3(0.85, 0.68, 0.25) * 0.10;

  float edgeGlow2 = smoothstep(0.0, 0.08, totalReveal) * smoothstep(0.25, 0.08, totalReveal);
  vec3 edgeGlowColor2 = edgeGlow2 * vec3(0.9, 0.6, 0.15) * 0.04;

  // ── COMPOSITING — the heart of the cinematic look ──
  vec3 marbleWithGlow = marbleColor;
  marbleWithGlow += goldVeinGlow * 0.6;
  marbleWithGlow = min(marbleWithGlow, vec3(0.45));

  // Reveal: marble → video based on reveal mask
  vec3 finalColor = mix(marbleWithGlow, videoColor.rgb, totalReveal);
  finalColor += edgeGlowColor + edgeGlowColor2;

  // ══════════════════════════════════════════════════
  //  POST-PROCESSING — Cinematic grade
  // ══════════════════════════════════════════════════

  // ── ACES Filmic Tonemapping (approximation) ──
  vec3 x = finalColor;
  finalColor = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);

  // ── Deep cinematic vignette (aspect-corrected) ──
  // Use aspect-corrected distance so the vignette is circular,
  // not elliptical, preventing over-darkening on portrait
  vec2 vigUv = uv - 0.5;
  // Normalize the longer axis to keep vignette shape consistent
  float vigMaxDim = max(viewportAspect, 1.0 / viewportAspect);
  if (viewportAspect > 1.0) {
    vigUv.x *= viewportAspect;
  } else {
    vigUv.y /= viewportAspect;
  }
  float vigDist = length(vigUv) / vigMaxDim;
  // Slightly tighter vignette on mobile for cinematic framing
  float vigStrength = viewportAspect < 1.0 ? 0.5 : 0.55;
  float vignette = 1.0 - vigDist * vigStrength;
  vignette = smoothstep(0.0, 1.0, vignette);
  vignette = pow(vignette, 1.3);
  finalColor *= vignette;

  // ── Atmospheric fog — pushes distant values toward deep black ──
  // Use the same aspect-corrected distance for consistent fog
  float fogDist = vigDist;
  float fogStart = viewportAspect < 1.0 ? 0.4 : 0.35;
  float fogMask = smoothstep(fogStart, 0.72, fogDist);
  finalColor = mix(finalColor, vec3(0.02, 0.015, 0.01), fogMask * 0.35);

  // ── Subtle film grain ──
  float filmGrain = (hash(uv * uResolution * uDpr + fract(uTime * 37.0) * 100.0) - 0.5) * 0.012;
  finalColor += filmGrain;

  // ── Micro bloom — only on the very brightest gold peaks ──
  float brightness = dot(finalColor, vec3(0.299, 0.587, 0.114));
  float bloomMask = smoothstep(0.85, 1.0, brightness);
  finalColor += finalColor * bloomMask * 0.03;

  // Final clamp
  finalColor = clamp(finalColor, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, 1.0);
}
