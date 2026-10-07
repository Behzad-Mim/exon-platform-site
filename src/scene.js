// The one WebGL scene behind the whole home page: a cloud of points that is, in turn, the moon,
// the burst you fly through, a game controller assembling itself, and a pair of gears.
//
// Every point carries all four of its places at once (attributes), and the shader mixes between
// them, so changing shape is four numbers per frame, not a new geometry. main.js tells it where
// the page is (setState) and it eases towards that.

import {
  AdditiveBlending, BufferAttribute, BufferGeometry, BoxGeometry, Color, CylinderGeometry, ExtrudeGeometry, Mesh,
  Path, PerspectiveCamera, Points, Scene, Shape, ShaderMaterial, Vector2, Vector3, WebGLRenderer,
} from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

const VERTEX = /* glsl */ `
  attribute vec3 aBurst;
  attribute vec3 aCtrl;
  attribute vec4 aGear;
  attribute vec4 aRand;

  uniform float uTime;
  uniform float uSpin;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uExplode;
  uniform float uCtrl;
  uniform float uGear;
  uniform float uAspect;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform vec3 uLight;
  uniform vec3 uCtrlOffset;
  uniform vec3 uGearOffset;
  uniform float uDrift;

  varying float vBright;
  varying float vTint;

  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }
  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
  mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0., -s, c, 0., 0., 0., 1.); }

  void main() {
    // the moon, turning, its axis leaning towards you
    vec3 moon = rotX(0.32) * rotY(uSpin) * position;

    // the burst: each point's own way out, slowly turning as a field
    vec3 burst = rotY(uSpin * 0.25) * aBurst;

    // the controller: facing you, rocking a little
    vec3 ctrl = rotX(-0.42 + 0.06 * sin(uTime * 0.5)) * rotY(0.28 * sin(uTime * 0.31)) * aCtrl + uCtrlOffset;

    // the gears: each about its own centre, the small one the other way and faster
    vec3 centre = aGear.w < 0.5 ? vec3(-0.36, 0.2, 0.0) : vec3(1.24, -0.84, 0.0);
    float turn = aGear.w < 0.5 ? uTime * 0.22 : -uTime * 0.22 * 14.0 / 8.0;
    vec3 gear = rotX(0.55) * rotY(-0.35) * (centre + rotZ(turn) * aGear.xyz) + uGearOffset;

    float e = smoothstep(0.0, 1.0, uExplode);
    vec3 p = mix(moon, burst, e);
    p = mix(p, ctrl, smoothstep(0.0, 1.0, uCtrl));
    p = mix(p, gear, smoothstep(0.0, 1.0, uGear));

    // a little life in every point
    float wobble = uDrift * (0.25 + e * 0.75);
    p += wobble * 0.05 * vec3(sin(uTime * 0.7 + aRand.y * 6.283), cos(uTime * 0.6 + aRand.z * 6.283), sin(uTime * 0.5 + aRand.w * 6.283));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;

    // the pointer parts the cloud: pushed outward in screen space, brighter for a moment
    vec2 ndc = clip.xy / clip.w;
    vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
    float dist = length(d);
    float push = uMouseStrength * smoothstep(0.32, 0.0, dist);
    ndc += (dist > 0.0001 ? d / dist : vec2(0.0)) * vec2(1.0 / uAspect, 1.0) * push * 0.09;
    clip.xy = ndc * clip.w;
    gl_Position = clip;

    // light: only the moon is lit from one side; every other shape glows evenly
    vec3 n = normalize(moon);
    float lambert = max(dot(n, uLight), 0.0);
    float rim = pow(1.0 - abs(n.z), 2.5) * 0.55;
    float lit = 0.07 + pow(lambert, 1.1) * (0.75 + 0.5 * aRand.x) + rim;
    float moonness = (1.0 - e) * (1.0 - uCtrl) * (1.0 - uGear);
    float shaped = max(smoothstep(0.0, 1.0, uCtrl), smoothstep(0.0, 1.0, uGear));
    vBright = mix(mix(0.42 + 0.58 * aRand.x, 0.8 + 0.7 * aRand.x, shaped), lit, moonness) * (1.0 + push * 1.6);
    vTint = aRand.y;

    float far = -mv.z;
    gl_PointSize = uSize * (0.55 + aRand.x * 0.9) * (1.0 + shaped * 0.35) * uPixelRatio / max(far, 0.35) * (1.0 + push);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vBright;
  varying float vTint;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    vec3 col = mix(uColorA, uColorB, vTint);
    gl_FragColor = vec4(col * vBright, a * clamp(vBright, 0.0, 1.4) * uOpacity);
  }
`;

const rand = (() => {
  // the same cloud on every visit: a seeded generator, not Math.random
  let s = 20261007;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
})();

function sphere(count, radius) {
  const out = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const shell = i % 9 === 0;                      // a few under the surface, for depth
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    let x = Math.cos(t) * r + (rand() - 0.5) * 0.04, z = Math.sin(t) * r + (rand() - 0.5) * 0.04, yy = y + (rand() - 0.5) * 0.04;
    const n = Math.hypot(x, yy, z);
    const k = radius * (shell ? 0.82 + rand() * 0.16 : 1) / n;
    out.set([x * k, yy * k, z * k], i * 3);
  }
  return out;
}

function burst(moon, count) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = moon[i * 3], y = moon[i * 3 + 1], z = moon[i * 3 + 2];
    const n = Math.hypot(x, y, z) || 1;
    const far = 2.4 + Math.pow(rand(), 0.55) * 10;
    const jitter = () => (rand() - 0.5) * 0.9;
    out.set([(x / n + jitter()) * far, (y / n + jitter()) * far * 0.75, (z / n + jitter()) * far + rand() * 3], i * 3);
  }
  return out;
}

function sample(meshes, weights, count, scale = 1) {
  const out = new Float32Array(count * 3);
  const total = weights.reduce((a, b) => a + b, 0);
  const v = new Vector3();
  let i = 0;
  meshes.forEach((mesh, m) => {
    const sampler = new MeshSurfaceSampler(mesh).setRandomGenerator(rand).build();
    const n = m === meshes.length - 1 ? count - i : Math.round((count * weights[m]) / total);
    for (let k = 0; k < n && i < count; k++, i++) {
      sampler.sample(v);
      out.set([v.x * scale, v.y * scale, v.z * scale], i * 3);
    }
  });
  return out;
}

function controller(count) {
  const s = new Shape();
  s.moveTo(-1.2, 0.95);
  s.bezierCurveTo(-0.6, 1.07, 0.6, 1.07, 1.2, 0.95);
  s.bezierCurveTo(1.78, 0.9, 2.08, 0.42, 2.17, -0.25);
  s.bezierCurveTo(2.27, -0.92, 2.1, -1.48, 1.68, -1.48);
  s.bezierCurveTo(1.32, -1.48, 1.13, -1.06, 0.93, -0.72);
  s.bezierCurveTo(0.58, -0.5, -0.58, -0.5, -0.93, -0.72);
  s.bezierCurveTo(-1.13, -1.06, -1.32, -1.48, -1.68, -1.48);
  s.bezierCurveTo(-2.1, -1.48, -2.27, -0.92, -2.17, -0.25);
  s.bezierCurveTo(-2.08, 0.42, -1.78, 0.9, -1.2, 0.95);
  const body = new ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.15, bevelSegments: 4, curveSegments: 28 });
  body.translate(0, 0, -0.21);

  const parts = [];
  const add = (geo, x, y, z, rx = Math.PI / 2) => { geo.rotateX(rx); geo.translate(x, y, z); parts.push(new Mesh(geo)); };
  add(new BoxGeometry(0.62, 0.2, 0.2), -1.25, 0.28, 0.42, 0);                 // d-pad
  add(new BoxGeometry(0.2, 0.62, 0.2), -1.25, 0.28, 0.42, 0);
  for (const [x, y] of [[1.25, 0.55], [1.25, 0.01], [1.0, 0.28], [1.5, 0.28]])  // face buttons
    add(new CylinderGeometry(0.13, 0.13, 0.16, 28), x, y, 0.42);
  add(new CylinderGeometry(0.28, 0.33, 0.28, 36), -0.58, -0.38, 0.46);       // sticks
  add(new CylinderGeometry(0.28, 0.33, 0.28, 36), 0.58, -0.38, 0.46);
  add(new BoxGeometry(0.22, 0.1, 0.1), -0.28, 0.42, 0.38, 0);                // select / start
  add(new BoxGeometry(0.22, 0.1, 0.1), 0.28, 0.42, 0.38, 0);

  return sample([new Mesh(body), ...parts], [60, 5, 5, 3, 3, 3, 3, 8, 8, 1, 1], count, 0.68);
}

function gearShape(teeth, outer, inner, hole) {
  const s = new Shape();
  const step = (Math.PI * 2) / teeth;
  for (let t = 0; t < teeth; t++) {
    const a = t * step;
    const pts = [[inner, a], [outer, a + step * 0.18], [outer, a + step * 0.48], [inner, a + step * 0.66]];
    pts.forEach(([r, ang], k) => {
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      if (t === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y);
    });
  }
  s.closePath();
  const h = new Path();
  h.absarc(0, 0, hole, 0, Math.PI * 2, true);
  s.holes.push(h);
  return new ExtrudeGeometry(s, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2, curveSegments: 18 })
    .translate(0, 0, -0.17);
}

function gears(count) {
  const big = Math.round(count * 0.68);
  const a = sample([new Mesh(gearShape(14, 1.5, 1.24, 0.42))], [1], big, 0.8);
  const b = sample([new Mesh(gearShape(8, 0.86, 0.64, 0.24))], [1], count - big, 0.8);
  const out = new Float32Array(count * 4);
  for (let i = 0; i < big; i++) out.set([a[i * 3], a[i * 3 + 1], a[i * 3 + 2], 0], i * 4);
  for (let i = 0; i < count - big; i++) out.set([b[i * 3], b[i * 3 + 1], b[i * 3 + 2], 1], (big + i) * 4);
  return out;
}

/** Builds the scene on a canvas. Returns null when WebGL is not there to be had. */
export function createScene(canvas, { small, still }) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    return null;
  }

  const count = small ? 9000 : 22000;
  const moon = sphere(count, 1.55);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(moon, 3));
  geometry.setAttribute("aBurst", new BufferAttribute(burst(moon, count), 3));
  geometry.setAttribute("aCtrl", new BufferAttribute(controller(count), 3));
  geometry.setAttribute("aGear", new BufferAttribute(gears(count), 4));
  const r = new Float32Array(count * 4);
  for (let i = 0; i < r.length; i++) r[i] = rand();
  geometry.setAttribute("aRand", new BufferAttribute(r, 4));

  const uniforms = {
    uTime: { value: 0 }, uSpin: { value: 0 }, uSize: { value: small ? 15 : 13 }, uPixelRatio: { value: 1 },
    uExplode: { value: 0 }, uCtrl: { value: 0 }, uGear: { value: 0 }, uAspect: { value: 1 },
    uMouse: { value: new Vector2(9, 9) }, uMouseStrength: { value: 0 },
    uLight: { value: new Vector3(0.62, 0.38, 0.68).normalize() },
    uCtrlOffset: { value: new Vector3() }, uGearOffset: { value: new Vector3() },
    uDrift: { value: still ? 0 : 1 },
    uColorA: { value: new Color("#f4f6ff") }, uColorB: { value: new Color("#a9b8ea") }, uOpacity: { value: 1 },
  };

  const material = new ShaderMaterial({
    vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;

  const scene = new Scene();
  scene.add(points);
  const camera = new PerspectiveCamera(42, 1, 0.05, 100);
  camera.position.set(0, 0, 6);

  // where the page asks the scene to be; the scene eases towards it every frame
  const target = { explode: 0, ctrl: 0, gear: 0, camZ: 6, camY: 0, opacity: 1, colorA: new Color("#f4f6ff"), colorB: new Color("#a9b8ea"),
    ctrlX: 0, gearX: 0 };
  const mouse = { x: 9, y: 9, strength: 0, last: 0 };

  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75) * quality;
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = w / h;
    uniforms.uPixelRatio.value = ratio;
  }

  // if this machine cannot keep up, draw fewer points at a lower resolution rather than stutter
  let quality = 1, slow = 0, frames = 0;
  function adapt(dt) {
    frames++;
    if (frames < 30) return;
    slow = dt > 0.034 ? slow + 1 : Math.max(0, slow - 1);
    if (slow > 40 && quality > 0.6) {
      quality = 0.6;
      geometry.setDrawRange(0, Math.floor(count * 0.6));
      size();
      slow = 0;
    }
  }

  const ease = (from, to, k) => from + (to - from) * k;
  let time = 0, last = 0;

  function frame(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (!still) time += dt;
    adapt(dt);

    const k = still ? 1 : 1 - Math.pow(0.0015, dt);    // the same ease at any frame rate
    uniforms.uTime.value = time;
    uniforms.uSpin.value = still ? 0.6 : time * 0.09;
    uniforms.uExplode.value = ease(uniforms.uExplode.value, target.explode, k);
    uniforms.uCtrl.value = ease(uniforms.uCtrl.value, target.ctrl, k);
    uniforms.uGear.value = ease(uniforms.uGear.value, target.gear, k);
    uniforms.uOpacity.value = ease(uniforms.uOpacity.value, target.opacity, k);
    uniforms.uColorA.value.lerp(target.colorA, k);
    uniforms.uColorB.value.lerp(target.colorB, k);
    uniforms.uCtrlOffset.value.x = ease(uniforms.uCtrlOffset.value.x, target.ctrlX, k);
    uniforms.uGearOffset.value.x = ease(uniforms.uGearOffset.value.x, target.gearX, k);
    camera.position.z = ease(camera.position.z, target.camZ, k);
    camera.position.y = ease(camera.position.y, target.camY, k);
    camera.lookAt(0, camera.position.y * 0.6, 0);

    mouse.strength = ease(mouse.strength, now - mouse.last < 1400 ? 1 : 0, 1 - Math.pow(0.02, dt));
    uniforms.uMouse.value.set(mouse.x, mouse.y);
    uniforms.uMouseStrength.value = mouse.strength;

    renderer.render(scene, camera);
  }

  size();

  return {
    size,
    frame,
    target,
    pointer(x, y) { mouse.x = x; mouse.y = y; mouse.last = performance.now(); },
    dispose() { renderer.dispose(); geometry.dispose(); material.dispose(); },
  };
}
