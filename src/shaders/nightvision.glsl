// Night Vision Post-Processing Shader
precision mediump float;

uniform sampler2D colorTexture;
uniform float time;
varying vec2 v_textureCoordinates;

// Simplex noise for grain
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec4 color = texture2D(colorTexture, v_textureCoordinates);

  // Convert to luminance
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Apply green tint
  vec3 nvColor = vec3(0.0, lum * 1.2, lum * 0.1);

  // Add grain noise
  float grain = random(v_textureCoordinates * time) * 0.1;
  nvColor += grain;

  // Vignette
  vec2 center = v_textureCoordinates - 0.5;
  float vignette = 1.0 - dot(center, center) * 1.5;
  nvColor *= vignette;

  // Boost contrast
  nvColor = pow(nvColor, vec3(0.8));

  gl_FragColor = vec4(nvColor, 1.0);
}
