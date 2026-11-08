// Victoria Harbour from the client's photograph, brought to life in a shader:
// depth parallax with the pointer, rippling water with shimmering neon reflections, sweeping searchlights,
// drifting haze over the clouds, twinkling windows, a gentle push-in with the scroll, and a lights-out mode.
// createPhoto(renderer) -> { scene, camera, set({ mouse, time, scroll, lights }), resize(w, h) }
import * as THREE from 'three';

export function createPhoto(renderer, src) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let loaded; const ready = new Promise((r) => (loaded = r));
  const tex = new THREE.TextureLoader().load(src, () => { uniforms.img.value.set(tex.image.width, tex.image.height); loaded(); });
  // raw sRGB values: the effects work on the photo as it looks, and main() converts to linear at the end
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const uniforms = {
    tex: { value: tex }, img: { value: new THREE.Vector2(3000, 2250) }, res: { value: new THREE.Vector2(1, 1) },
    mouse: { value: new THREE.Vector2() }, time: { value: 0 }, scroll: { value: 0 }, lights: { value: 1 }, zoom: { value: 1.06 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D tex; uniform vec2 img, res, mouse; uniform float time, scroll, lights, zoom;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
      vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
      // the photo in its own coordinates: x 0..1 left to right, y 0..1 bottom to top
      const float WATER = 0.466;
      float pier(vec2 p){                       // the Star Ferry pier and the promenade, bottom left
        float diag = 0.13 + 0.39 * clamp(p.y / 0.35, 0.0, 1.0);
        float m = step(p.y, 0.445) * step(p.x, min(0.525, diag));
        return m;
      }
      float depthAt(vec2 p){                    // 0 far (sky) .. 1 near (the water at our feet)
        float water = 1.0 - smoothstep(0.0, WATER, p.y);
        float sky = smoothstep(0.6, 0.95, p.y);
        return mix(0.28, 0.08, sky) + 0.8 * water * water;
      }
      vec3 tap(vec2 p){ return texture2D(tex, p).rgb; }
      vec3 sharp(vec2 p){                        // a light unsharp mask, so the enlarged photo stays crisp
        vec2 e = 0.8 / img;
        vec3 c = tap(p);
        vec3 n = tap(p + vec2(0, e.y)) + tap(p - vec2(0, e.y)) + tap(p + vec2(e.x, 0)) + tap(p - vec2(e.x, 0));
        return clamp(c + (c - n * 0.25) * 0.55, 0.0, 1.0);
      }
      float beam(vec2 p, vec2 o, float a, float w, float len){
        vec2 d = (p - o) * vec2(img.x / img.y, 1.0);
        float r = length(d); if (d.y <= 0.0) return 0.0;
        float ang = atan(d.x, d.y);
        float k = exp(-pow((ang - a) / w, 2.0));
        return k * smoothstep(0.0, 0.03, r) * exp(-r / len);
      }
      void main(){
        // cover the screen with the photo, pushed in a little as the page scrolls
        float ra = res.x / res.y, ri = img.x / img.y;
        vec2 s = ra > ri ? vec2(1.0, ri / ra) : vec2(ra / ri, 1.0);
        float z = zoom + scroll * 0.08;
        vec2 p = (vUv - 0.5) * s / z + 0.5;
        p.y += 0.02 - scroll * 0.03;
        // depth parallax: near things slide more than far ones
        vec2 par = mouse * vec2(0.014, 0.009);
        p += par * depthAt(p + par * 0.3);
        // water: ripples that grow toward us, never on the pier
        float isWater = (1.0 - smoothstep(WATER - 0.012, WATER, p.y)) * (1.0 - pier(p));
        float near = clamp(1.0 - p.y / WATER, 0.0, 1.0);
        vec2 rip = vec2(
          sin(p.y * 260.0 - time * 1.7 + sin(p.x * 26.0 + time * 0.4) * 2.2) * 0.0016 + (fbm(vec2(p.x * 18.0, p.y * 90.0 - time * 0.5)) - 0.5) * 0.004,
          sin(p.x * 70.0 + time * 1.2) * 0.0009 + sin(p.y * 420.0 - time * 2.4) * 0.0008);
        p += rip * isWater * (0.25 + near * 1.6);
        vec3 c = sharp(p);
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        // neon reflections shimmer as the water moves
        float glint = fbm(vec2(p.x * 160.0, p.y * 520.0 - time * 1.6));
        c += isWater * c * smoothstep(0.3, 0.85, l) * (glint - 0.35) * 0.9;
        // windows twinkle along the skyline
        float band = smoothstep(WATER, WATER + 0.02, p.y) * (1.0 - smoothstep(0.62, 0.7, p.y));
        vec2 cell = floor(p * vec2(1100.0, 900.0));
        float tw = step(0.992, hash(cell + floor(time * 0.7)));
        c *= 1.0 + band * smoothstep(0.45, 0.85, l) * (tw * 0.7 - 0.05 * sin(time * 2.0 + hash(cell) * 6.28));
        // searchlights sweeping the sky from the towers, as in the Symphony of Lights
        float sky = smoothstep(WATER + 0.06, WATER + 0.2, p.y);
        float b = 0.0;
        for (int i = 0; i < 4; i++){ float fi = float(i); b += beam(p, vec2(0.2, 0.575), -0.55 + fi * 0.32 + sin(time * 0.35 + fi * 1.7) * 0.25, 0.022, 0.55); }
        b += beam(p, vec2(0.847, 0.755), -0.15 + sin(time * 0.28) * 0.35, 0.018, 0.45);
        b += beam(p, vec2(0.117, 0.672), 0.35 + sin(time * 0.31 + 2.0) * 0.3, 0.02, 0.5);
        c += vec3(0.45, 0.75, 1.0) * b * sky * 0.42 * lights;
        // haze drifting over the clouds
        float haze = fbm(vec2(p.x * 3.0 - time * 0.012, p.y * 4.0)) * smoothstep(0.55, 0.85, p.y);
        c += vec3(0.42, 0.3, 0.6) * haze * 0.07;
        // lights out: the city sleeps, a little of it remains
        float keep = smoothstep(0.12, 1.0, lights);
        vec3 dark = c * vec3(0.1, 0.12, 0.2) * (1.0 - 0.75 * smoothstep(0.35, 0.95, l)) + vec3(0.004, 0.006, 0.014);
        c = mix(dark, c, keep);
        gl_FragColor = vec4(toLin(c), 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  return {
    scene, camera, ready,
    set({ mouse, time, scroll, lights, zoom }) {
      if (zoom != null) uniforms.zoom.value = zoom;
      if (mouse) uniforms.mouse.value.copy(mouse);
      if (time != null) uniforms.time.value = time;
      if (scroll != null) uniforms.scroll.value = scroll;
      if (lights != null) uniforms.lights.value = lights;
    },
    resize(w, h) { uniforms.res.value.set(w, h); },
  };
}
