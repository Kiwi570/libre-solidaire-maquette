/* Héros : la photo de sol devient une matière vivante (OGL).
   Le curseur laisse une trace liquide (Flowmap) et porte une lumière dorée rasante. */
import { Renderer } from '../vendor/ogl/core/Renderer.js';
import { Program } from '../vendor/ogl/core/Program.js';
import { Mesh } from '../vendor/ogl/core/Mesh.js';
import { Texture } from '../vendor/ogl/core/Texture.js';
import { Triangle } from '../vendor/ogl/extras/Triangle.js';
import { Flowmap } from '../vendor/ogl/extras/Flowmap.js';
import { Vec2 } from '../vendor/ogl/math/Vec2.js';

const fond = document.querySelector('.heros__fond');
const calme = document.documentElement.classList.contains('calme');

function webglDispo() {
  try { const t = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (t.getContext('webgl2') || t.getContext('webgl'))); } catch (e) { return false; }
}
if (fond && !calme && webglDispo()) {
  try { demarrer(); } catch (e) { /* la photo fixe reste affichée */ }
}

function demarrer() {
  const canvas = fond.querySelector('canvas');
  const img = fond.querySelector('img');
  const renderer = new Renderer({ canvas, dpr: Math.min(1.75, window.devicePixelRatio || 1), alpha: false, antialias: false });
  const gl = renderer.gl;
  if (!gl) return;
  gl.clearColor(0.086, 0.07, 0.055, 1);

  const flowmap = new Flowmap(gl, { falloff: 0.28, dissipation: 0.94, alpha: 0.9 });
  const geometry = new Triangle(gl);
  const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
  const souris = new Vec2(-1), vitesse = new Vec2(), lumiere = new Vec2(0.18, 0.62);
  let imgW = 1920, imgH = 1080, pret = false;

  const program = new Program(gl, {
    vertex: /* glsl */ `
      attribute vec2 uv; attribute vec2 position; varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }`,
    fragment: /* glsl */ `
      precision highp float;
      uniform sampler2D tPhoto; uniform sampler2D tFlow; uniform float uTemps; uniform vec2 uRes; uniform vec2 uImg; uniform vec2 uLumiere;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float bruit(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
      float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * bruit(p); p *= 2.03; a *= 0.5; } return v; }
      void main() {
        vec2 r = uRes / uImg; float s = max(r.x, r.y);
        vec2 uv = (vUv - 0.5) * (r / s) + 0.5;
        vec3 flow = texture2D(tFlow, vUv).rgb;
        float respire = fbm(vUv * 3.0 + vec2(uTemps * 0.03, -uTemps * 0.02));
        vec2 deform = (vec2(respire) - 0.5) * 0.012 - flow.xy * flow.z * 0.06;
        vec3 c = texture2D(tPhoto, uv + deform).rgb;
        float lum = dot(c, vec3(0.299, 0.587, 0.114));
        vec3 humus = vec3(0.086, 0.07, 0.055), ocre = vec3(0.79, 0.54, 0.23), os = vec3(0.93, 0.9, 0.84);
        vec3 teinte = mix(humus, ocre, smoothstep(0.05, 0.75, lum));
        teinte = mix(teinte, os, smoothstep(0.75, 1.0, lum) * 0.6);
        c = mix(c, teinte, 0.55);
        vec2 d = (vUv - uLumiere) * vec2(uRes.x / uRes.y, 1.0);
        float halo = exp(-dot(d, d) * 3.2);
        float rasant = smoothstep(0.0, 1.0, 1.0 - abs(d.y) * 2.4) * smoothstep(1.2, 0.0, abs(d.x));
        c += ocre * (halo * 0.32 + rasant * 0.06);
        c += ocre * flow.z * 0.08;
        float filaments = smoothstep(0.62, 0.66, fbm(vUv * vec2(9.0, 5.0) + vec2(0.0, uTemps * 0.015))) * smoothstep(0.35, 1.0, 1.0 - vUv.y);
        c += os * filaments * 0.05 * (0.4 + halo);
        float vig = smoothstep(1.25, 0.25, length((vUv - 0.5) * vec2(1.25, 1.0)));
        c *= mix(0.55, 1.0, vig);
        c += (hash(vUv * uRes + fract(uTemps)) - 0.5) * 0.045;
        gl_FragColor = vec4(c, 1.0);
      }`,
    uniforms: {
      tPhoto: { value: texture }, tFlow: flowmap.uniform, uTemps: { value: 0 },
      uRes: { value: new Vec2(1, 1) }, uImg: { value: new Vec2(imgW, imgH) }, uLumiere: { value: lumiere },
    },
  });
  const mesh = new Mesh(gl, { geometry, program });

  const source = new Image();
  source.decoding = 'async';
  source.onload = () => { texture.image = source; imgW = source.naturalWidth; imgH = source.naturalHeight; program.uniforms.uImg.value.set(imgW, imgH); pret = true; fond.classList.add('gl-pret'); };
  source.src = img.currentSrc || img.src;

  function taille() {
    const w = fond.clientWidth, h = fond.clientHeight;
    renderer.setSize(w, h);
    program.uniforms.uRes.value.set(w, h);
    flowmap.aspect = w / h;
  }
  window.addEventListener('resize', taille);
  taille();

  let derniere = null, dernierTemps = performance.now();
  function bouge(e) {
    const r = fond.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
    souris.set(x, y);
    const t = performance.now();
    if (!derniere) { derniere = new Vec2(x, y); dernierTemps = t; return; }
    const dt = Math.max(14, t - dernierTemps);
    vitesse.x = (x - derniere.x) / dt * 16; vitesse.y = (y - derniere.y) / dt * 16;
    derniere.set(x, y); dernierTemps = t;
  }
  window.addEventListener('pointermove', bouge, { passive: true });

  // une seule boucle à la fois, suspendue hors écran
  let visible = true; let enCours = false;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible && !enCours) { enCours = true; requestAnimationFrame(boucle); } }, { threshold: 0 }).observe(fond);

  function boucle(t) {
    if (!visible) { enCours = false; return; }
    requestAnimationFrame(boucle);
    if (!pret) return;
    program.uniforms.uTemps.value = t * 0.001;
    if (souris.x >= 0) { lumiere.x += (souris.x - lumiere.x) * 0.04; lumiere.y += (souris.y - lumiere.y) * 0.04; }
    else { lumiere.x = 0.18 + Math.sin(t * 0.0003) * 0.08; lumiere.y = 0.6 + Math.cos(t * 0.0004) * 0.05; }
    flowmap.mouse.copy(souris);
    flowmap.velocity.lerp(vitesse, 0.12);
    vitesse.multiply(0.86);
    flowmap.update();
    renderer.render({ scene: mesh });
  }
}
