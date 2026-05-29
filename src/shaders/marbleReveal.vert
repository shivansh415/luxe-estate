// Marble Reveal - Vertex Shader
// Fullscreen quad passthrough for NDC-mapped geometry

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
