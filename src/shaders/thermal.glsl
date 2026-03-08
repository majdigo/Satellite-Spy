// Thermal / FLIR Post-Processing Shader
precision mediump float;

uniform sampler2D colorTexture;
varying vec2 v_textureCoordinates;

// Temperature color palette (cold blue -> warm red -> hot white)
vec3 temperatureColor(float t) {
  if (t < 0.25) return mix(vec3(0.0, 0.0, 0.2), vec3(0.0, 0.0, 1.0), t * 4.0);
  if (t < 0.5) return mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), (t - 0.25) * 4.0);
  if (t < 0.75) return mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.5) * 4.0);
  return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.75) * 4.0);
}

void main() {
  vec4 color = texture2D(colorTexture, v_textureCoordinates);

  // Compute luminance as "temperature"
  float temp = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Apply thermal palette
  vec3 thermal = temperatureColor(temp);

  // Boost contrast
  thermal = pow(thermal, vec3(0.9));

  gl_FragColor = vec4(thermal, 1.0);
}
