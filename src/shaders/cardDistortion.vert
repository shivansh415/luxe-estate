varying vec2 vUv;
uniform vec2 uMouse;
uniform float uHoverStrength;
uniform float uTime;

void main() {
  vUv = uv;

  vec3 pos = position;

  // Soft displacement toward mouse — creates a gentle "push" effect
  vec2 mouseOffset = uMouse - uv;
  float dist = length(mouseOffset);
  float influence = smoothstep(0.8, 0.0, dist);

  // Subtle Z-axis displacement for depth
  pos.z += influence * uHoverStrength * 0.06;

  // Very gentle XY wave displacement
  float wave = sin(uTime * 0.8 + uv.x * 3.14159) * 0.003;
  pos.x += wave * uHoverStrength;
  pos.y += sin(uTime * 0.6 + uv.y * 2.71828) * 0.002 * uHoverStrength;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
