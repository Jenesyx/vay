// CRT + VHS look for the video inside the TV.
// Barrel-curved glass, scanlines, slot mask, chroma bleed, VHS line jitter,
// tracking band, channel modes (colour / black & white / snow) and a
// real "power off" collapse (picture → bright line → dot → dark).

export const CRT_VERT = /* glsl */ `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

export const CRT_FRAG = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_res;        // canvas px
uniform float u_time;
uniform float u_cover;     // (screen aspect / video aspect) for object-fit: cover
uniform float u_hasVideo;  // 0 = no frame yet → snow
uniform float u_mode;      // 0 colour, 1 b&w, 2 snow
uniform float u_static;    // 0..1 channel-change burst
uniform float u_power;     // 1 on → 0 off
uniform float u_beat;      // 0..1 kick

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec2 curve(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 off = abs(uv.yx) / vec2(5.2, 4.2);
  uv = uv + uv * off * off;
  return uv * 0.5 + 0.5;
}

vec3 snow(vec2 uv) {
  float n = hash(floor(uv * u_res / 1.5) + floor(u_time * 60.0));
  float band = 0.85 + 0.15 * sin(uv.y * 30.0 + u_time * 9.0);
  return vec3(n * band);
}

vec3 picture(vec2 uv) {
  vec2 t = vec2((uv.x - 0.5) * u_cover + 0.5, 1.0 - uv.y);
  // VHS: per-line horizontal jitter + a slow tracking band
  float line = floor(uv.y * u_res.y / 2.0);
  float jit = (hash(vec2(line, floor(u_time * 24.0))) - 0.5) * 0.0022;
  float band = smoothstep(0.03, 0.0, abs(fract(uv.y * 0.6 - u_time * 0.07) - 0.5));
  t.x += jit + band * 0.006 * sin(u_time * 40.0 + uv.y * 90.0);
  float ca = 0.0018 + 0.004 * u_beat;
  vec3 c;
  c.r = texture2D(u_tex, t + vec2(ca, 0.0)).r;
  c.g = texture2D(u_tex, t).g;
  c.b = texture2D(u_tex, t - vec2(ca, 0.0)).b;
  c += band * 0.06;
  return c;
}

void main() {
  vec2 uv = curve(v_uv);

  // power collapse: vertical squash to a line, then the line to a dot
  float p = clamp(u_power, 0.0, 1.0);
  float vs = max(0.004, smoothstep(0.25, 1.0, p));
  float hs = max(0.004, smoothstep(0.02, 0.25, p));
  vec2 q = (uv - 0.5) / vec2(hs, vs) + 0.5;

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 || p <= 0.001) {
    gl_FragColor = vec4(0.015, 0.016, 0.014, 1.0);
    return;
  }

  vec3 col;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) {
    col = vec3(0.015, 0.016, 0.014);
  } else {
    vec3 pic = picture(q);
    if (u_mode > 0.5 && u_mode < 1.5) {
      float l = dot(pic, vec3(0.299, 0.587, 0.114));
      pic = vec3(l) * vec3(1.02, 1.0, 0.94);
    }
    float snowAmt = max(u_static, max(step(1.5, u_mode), 1.0 - u_hasVideo));
    col = mix(pic, snow(q), snowAmt);
    // collapsing picture burns brighter
    col += (1.0 - vs * hs) * 1.6;
  }

  // scanlines + slot mask
  float scan = 0.82 + 0.18 * sin(uv.y * u_res.y * 1.5708);
  float m = mod(gl_FragCoord.x, 3.0);
  vec3 mask = vec3(m < 1.0 ? 1.06 : 0.94, m >= 1.0 && m < 2.0 ? 1.06 : 0.94, m >= 2.0 ? 1.06 : 0.94);
  col *= scan * mask;

  // glass: vignette + warm phosphor + beat flash
  vec2 d = uv - 0.5;
  col *= 1.0 - dot(d, d) * 1.35;
  col *= vec3(1.03, 1.0, 0.95);
  col += u_beat * 0.05;

  gl_FragColor = vec4(col, 1.0);
}
`;
