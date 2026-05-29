precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uMouse;
uniform float uHoverStrength;
uniform vec2 uResolution;

/* ── Simplex-style noise (compact) ──────────────────── */
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

/* ── Main ───────────────────────────────────────────── */
void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;

  // ── Base: deep cinematic dark with subtle gradient ──
  vec3 bgDark   = vec3(0.035, 0.032, 0.028);   // warm near-black
  vec3 bgMid    = vec3(0.055, 0.050, 0.042);    // slightly lighter center
  float vignette = 1.0 - smoothstep(0.2, 0.85, length(uv - 0.5) * 1.2);
  vec3 baseColor = mix(bgDark, bgMid, vignette * 0.4);

  // ── Animated noise texture — subtle organic movement ──
  float t = uTime * 0.15;
  float n1 = snoise(uv * 3.0 + vec2(t, t * 0.7)) * 0.5 + 0.5;
  float n2 = snoise(uv * 6.0 - vec2(t * 0.5, t * 0.3)) * 0.5 + 0.5;
  float noiseVal = mix(n1, n2, 0.3);

  // Very subtle noise coloring — hints of warmth
  vec3 noiseColor = mix(
    vec3(0.04, 0.038, 0.033),
    vec3(0.07, 0.06, 0.045),
    noiseVal
  );
  baseColor = mix(baseColor, noiseColor, 0.3);

  // ── Gold accent glow (very faint, ambient) ──
  vec3 goldColor = vec3(0.83, 0.69, 0.22);   // #D4AF37
  float goldNoise = snoise(uv * 2.0 + vec2(t * 0.3, -t * 0.2));
  float goldMask = smoothstep(0.3, 0.7, goldNoise) * 0.015;
  baseColor += goldColor * goldMask;

  // ── Mouse-driven displacement distortion ──
  vec2 mouseUV = uMouse;
  vec2 toMouse = uv - mouseUV;
  float mouseDist = length(toMouse);
  float mouseInfluence = smoothstep(0.6, 0.0, mouseDist);

  // Displacement: shift UV sampling based on mouse proximity
  float displaceStrength = uHoverStrength * 0.025;
  vec2 displacedUV = uv + normalize(toMouse + 0.001) * mouseInfluence * displaceStrength;
  float displaceNoise = snoise(displacedUV * 4.0 + vec2(t * 0.5));

  // Add displaced noise to color
  vec3 displaceColor = mix(
    vec3(0.045, 0.042, 0.036),
    vec3(0.08, 0.07, 0.05),
    displaceNoise * 0.5 + 0.5
  );
  baseColor = mix(baseColor, displaceColor, mouseInfluence * uHoverStrength * 0.4);

  // ── Hover glow: soft golden radiance from mouse position ──
  float glowRadius = 0.35;
  float glow = smoothstep(glowRadius, 0.0, mouseDist) * uHoverStrength;
  vec3 glowColor = goldColor * 0.06;
  baseColor += glowColor * glow;

  // ── Edge shimmer on hover ──
  float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float edgeGlow = smoothstep(0.08, 0.0, edgeDist) * uHoverStrength * 0.08;
  baseColor += goldColor * edgeGlow;

  // ── Cinematic grain ──
  float grain = (fract(sin(dot(uv * uResolution.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.018;
  baseColor += grain;

  // ── Final vignette darkening ──
  float outerVignette = smoothstep(0.3, 1.1, length((uv - 0.5) * vec2(aspect, 1.0)));
  baseColor *= 1.0 - outerVignette * 0.25;

  gl_FragColor = vec4(baseColor, 1.0);
}
