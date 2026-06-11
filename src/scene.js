// ============================================================
// Échec & Lame v3 — diorama HD-2D (three.js)
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { BOARD, MAP } from './data.js';
import {
  unitCanvas, unitFlashCanvas, composedTile, tileCanvas, treeCanvas, ruinCanvas,
  waterCanvas, rockCanvas, skyCanvas, softCircleCanvas,
} from './art.js';

const tickers = new Set();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// tween utilitaire : appelle fn(k 0→1) à chaque frame pendant dur ms
function tween(dur, fn) {
  return new Promise(resolve => {
    const t0 = performance.now();
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      fn(k);
      if (k >= 1) { tickers.delete(tick); resolve(); }
    };
    tickers.add(tick);
  });
}

function pixelTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  return t;
}

const VignetteShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: `varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      // étalonnage chaud en haut / froid en bas + vignette
      float warm = smoothstep(0.25, 0.95, vUv.y);
      c.rgb += vec3(0.030, 0.012, -0.020) * warm;
      c.rgb += vec3(-0.012, -0.004, 0.030) * (1.0 - warm);
      float d = distance(vUv, vec2(0.5, 0.47));
      c.rgb *= 1.0 - smoothstep(0.42, 0.86, d) * 0.34;
      gl_FragColor = c;
    }`,
};

export const world = (x, y) => new THREE.Vector3(x - BOARD / 2 + 0.5, 0, y - BOARD / 2 + 0.5);

export class Diorama {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;

    this.scene = new THREE.Scene();
    this.scene.background = pixelTexture(skyCanvas());
    this.scene.background.magFilter = THREE.LinearFilter;
    this.scene.fog = new THREE.Fog(0x83506a, 15, 34);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 160);
    this.camMode = 'menu';
    this.camTarget = new THREE.Vector3(0, 0, 0);   // point regardé (lissé)
    this.camGoalT = new THREE.Vector3(0, 0, 0);    // point regardé (désiré)
    this.duel = null;                              // {mid} pendant un combat
    this.shakeUntil = 0;
    this.orbitA = 0;

    this.unitViews = new Map(); // unit.id -> vue
    this.highlightPool = [];
    this.sparkPool = [];

    this.buildLights();
    this.buildBoard();
    this.buildCursorMarkers();
    this.buildMotes();
    this.buildComposer();

    window.addEventListener('resize', () => this.resize());
    this.resize();

    this.idleFrame = 0;
    setInterval(() => { this.idleFrame = 1 - this.idleFrame; this.applyIdleFrames(); }, 460);

    this.clock = new THREE.Clock();
    const loop = () => {
      requestAnimationFrame(loop);
      const now = performance.now();
      for (const t of [...tickers]) t(now);
      this.update(now, this.clock.getDelta());
      this.composer.render();
    };
    requestAnimationFrame(loop);
  }

  // ---------- construction ----------
  buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xbfc8ff, 0x6a5444, 0.95));
    const sun = new THREE.DirectionalLight(0xffd2a0, 1.5);
    sun.position.set(5, 9, 3);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x7a86ff, 0.4);
    fill.position.set(-6, 4, -4);
    this.scene.add(fill);
  }

  buildBoard() {
    // tuiles
    const geo = new THREE.PlaneGeometry(1, 1);
    for (let y = 0; y < BOARD; y++) {
      for (let x = 0; x < BOARD; x++) {
        const kind = MAP[y][x];
        let cv;
        if (kind === 2) cv = tileCanvas('ruinGround');
        else {
          const base = (x + y) % 2 ? 'grassB' : 'grassA';
          const h = (x * 53 + y * 97 + 11) % 23;
          const decor = kind === 0 ? (h === 3 ? 'flowers' : (h === 7 || h === 15 ? 'tufts' : null)) : null;
          cv = kind === 1 ? tileCanvas('forest') : composedTile(base, decor);
        }
        const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: pixelTexture(cv) }));
        m.rotation.x = -Math.PI / 2;
        m.position.copy(world(x, y));
        this.scene.add(m);

        if (kind === 1) this.addBillboard(treeCanvas(), x, y, 1.32, 1.76, (x * 7 + y) % 2 === 0);
        if (kind === 2) this.addBillboard(ruinCanvas(), x, y, 1.05, 1.4, (x + y) % 2 === 0);
      }
    }

    // socle rocheux
    const rockTex = pixelTexture(rockCanvas());
    rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping;
    rockTex.repeat.set(5, 1.4);
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD + 0.42, 1.7, BOARD + 0.42),
      new THREE.MeshLambertMaterial({ map: rockTex }));
    pedestal.position.y = -0.86;
    this.scene.add(pedestal);

    // eau
    this.waterTex = pixelTexture(waterCanvas());
    this.waterTex.wrapS = this.waterTex.wrapT = THREE.RepeatWrapping;
    this.waterTex.repeat.set(13, 13);
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(170, 170),
      new THREE.MeshBasicMaterial({ map: this.waterTex }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = -1.55;
    this.scene.add(water);
  }

  addBillboard(cv, x, y, sw, sh, flip) {
    const mat = new THREE.SpriteMaterial({ map: pixelTexture(cv), transparent: true, alphaTest: 0.05 });
    const s = new THREE.Sprite(mat);
    s.center.set(0.5, 0.05);
    s.scale.set(flip ? -sw : sw, sh, 1);
    s.position.copy(world(x, y));
    this.scene.add(s);
    return s;
  }

  buildCursorMarkers() {
    // texture de coins (curseur de sélection)
    const cv = document.createElement('canvas');
    cv.width = cv.height = 48;
    const c = cv.getContext('2d');
    c.fillStyle = '#ffffff';
    const L = 13, T = 5;
    for (const [px, py, w, h] of [
      [0, 0, L, T], [0, 0, T, L], [48 - L, 0, L, T], [48 - T, 0, T, L],
      [0, 48 - T, L, T], [0, 48 - L, T, L], [48 - L, 48 - T, L, T], [48 - T, 48 - L, T, L]]) {
      c.fillRect(px, py, w, h);
    }
    const mk = color => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1.12, 1.12),
        new THREE.MeshBasicMaterial({ map: pixelTexture(cv), transparent: true, color, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.03;
      m.visible = false;
      this.scene.add(m);
      return m;
    };
    this.cursor = mk(0xfff3cf);
    this.targetMark = mk(0xff5040);

    // réserve de surlignages
    const geo = new THREE.PlaneGeometry(0.96, 0.96);
    for (let i = 0; i < 90; i++) {
      const m = new THREE.Mesh(geo,
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.4, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.02;
      m.visible = false;
      m.userData.kind = null;
      this.scene.add(m);
      this.highlightPool.push(m);
    }

    // étincelles (pool de sprites additifs)
    const soft = pixelTexture(softCircleCanvas());
    soft.magFilter = THREE.LinearFilter;
    for (let i = 0; i < 70; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: soft, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      sp.visible = false;
      this.scene.add(sp);
      this.sparkPool.push({ sp, vel: new THREE.Vector3(), born: 0, life: 0 });
    }
  }

  buildMotes() {
    const n = 80;
    const pos = new Float32Array(n * 3);
    this.moteVel = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 11;
      pos[i * 3 + 1] = Math.random() * 4 + 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 11;
      this.moteVel[i] = 0.08 + Math.random() * 0.2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const soft = pixelTexture(softCircleCanvas());
    soft.magFilter = THREE.LinearFilter;
    this.motes = new THREE.Points(g, new THREE.PointsMaterial({
      map: soft, color: 0xffe9b0, size: 0.14, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    this.scene.add(this.motes);
  }

  buildComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.5, 0.75, 0.78);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new ShaderPass(VignetteShader));
    this.composer.addPass(new OutputPass());
  }

  resize() {
    const w = this.canvas.clientWidth || innerWidth;
    const h = this.canvas.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------- caméra ----------
  setMode(mode) { this.camMode = mode; }

  // distance pour que la largeur du plateau tienne à l'écran
  fitDistance() {
    const t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect;
    return Math.max(10.5, 5.0 / t);
  }

  update(now, dt) {
    // position désirée selon le mode
    const desired = new THREE.Vector3();
    const D = this.fitDistance();
    if (this.duel) {
      this.camGoalT.copy(this.duel.mid);
      desired.copy(this.duel.mid).add(new THREE.Vector3(0, 3.4, 3.0));
    } else if (this.camMode === 'menu') {
      this.orbitA += dt * 0.12;
      this.camGoalT.set(0, 0.2, 0);
      desired.set(Math.sin(this.orbitA) * D * 0.78, D * 0.6, Math.cos(this.orbitA) * D * 0.78);
    } else {
      this.camGoalT.set(0, 0, 0.3);
      const dir = new THREE.Vector3(0, 1.02, 1).normalize().multiplyScalar(D);
      desired.copy(this.camGoalT).add(dir);
      desired.x += Math.sin(now / 5200) * 0.16;
      desired.y += Math.sin(now / 4100) * 0.07;
    }
    // brouillard accordé à la distance de la caméra
    if (!this.duel) {
      this.scene.fog.near = D * 1.12;
      this.scene.fog.far = D * 1.95;
    }
    const k = this.duel ? 0.10 : 0.05;
    this.camera.position.lerp(desired, k);
    this.camTarget.lerp(this.camGoalT, k);
    const look = this.camTarget.clone();
    if (this.shakeUntil > now) {
      look.x += (Math.random() - 0.5) * 0.14;
      look.y += (Math.random() - 0.5) * 0.14;
    }
    this.camera.lookAt(look);

    // eau et poussières
    if (this.waterTex) { this.waterTex.offset.x += dt * 0.008; this.waterTex.offset.y += dt * 0.004; }
    const pos = this.motes.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + this.moteVel[i] * dt;
      if (y > 4.4) y = 0.15;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    this.motes.material.opacity = 0.35 + 0.15 * Math.sin(now / 1400);

    // pulsation des surlignages et curseurs
    const pulse = 0.5 + 0.5 * Math.sin(now / 240);
    for (const m of this.highlightPool) {
      if (!m.visible) continue;
      m.material.opacity = m.userData.kind === 'zone' ? 0.40 + pulse * 0.12 : 0.52 + pulse * 0.16;
    }
    const cs = 1 + pulse * 0.06;
    this.cursor.scale.set(cs, cs, 1);
    this.targetMark.scale.set(cs, cs, 1);

    // étincelles
    for (const p of this.sparkPool) {
      if (!p.sp.visible) continue;
      const age = (now - p.born) / p.life;
      if (age >= 1) { p.sp.visible = false; continue; }
      p.vel.y -= dt * 6.5;
      p.sp.position.addScaledVector(p.vel, dt);
      const s = p.baseScale * (1 - age * 0.6);
      p.sp.scale.set(s, s, 1);
      p.sp.material.opacity = 1 - age;
    }
  }

  async focusDuel(a, b) {
    const mid = world(a.x, a.y).lerp(world(b.x, b.y), 0.5);
    mid.y = 0.5;
    this.duel = { mid };
    await sleep(330);
  }

  async unfocus() {
    this.duel = null;
    await sleep(240);
  }

  shake(ms = 140) { this.shakeUntil = performance.now() + ms; }

  // ---------- unités ----------
  addUnit(u) {
    const frames = [pixelTexture(unitCanvas(u.cls, u.team, 0)), pixelTexture(unitCanvas(u.cls, u.team, 1))];
    const mat = new THREE.SpriteMaterial({ map: frames[0], transparent: true, alphaTest: 0.05 });
    const sp = new THREE.Sprite(mat);
    const w = unitCanvas(u.cls, u.team, 0).width / 34, h = unitCanvas(u.cls, u.team, 0).height / 34;
    sp.center.set(0.5, 0.045);
    sp.scale.set(w * 1.05, h * 1.05, 1);
    sp.position.copy(world(u.x, u.y));
    this.scene.add(sp);

    const flash = new THREE.Sprite(new THREE.SpriteMaterial({
      map: pixelTexture(unitFlashCanvas(u.cls, u.team)), transparent: true, alphaTest: 0.05,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9,
    }));
    flash.center.copy(sp.center);
    flash.scale.copy(sp.scale);
    flash.visible = false;
    this.scene.add(flash);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.4),
      new THREE.MeshBasicMaterial({
        map: pixelTexture(softCircleCanvas()), color: 0x0a0816,
        transparent: true, opacity: 0.34, depthWrite: false,
      }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.copy(world(u.x, u.y));
    shadow.position.y = 0.012;
    this.scene.add(shadow);

    // jauge de PV (visible quand l'unité est blessée)
    const hpCv = document.createElement('canvas');
    hpCv.width = 24; hpCv.height = 4;
    const hpTex = pixelTexture(hpCv);
    const hp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: hpTex, transparent: true, depthWrite: false,
    }));
    hp.scale.set(0.66, 0.11, 1);
    hp.visible = false;
    this.scene.add(hp);

    this.unitViews.set(u.id, { u, sp, flash, shadow, frames, hp, hpCv, hpTex });
  }

  view(u) { return this.unitViews.get(u.id); }

  syncUnits(game) {
    for (const u of game.units) {
      if (!this.unitViews.has(u.id)) this.addUnit(u);
      const v = this.unitViews.get(u.id);
      const visible = !u.dead;
      v.sp.visible = visible;
      v.shadow.visible = visible;
      if (!visible) v.hp.visible = false;
      v.sp.material.opacity = 1;
      if (visible) this.place(u);
    }
    for (const [id, v] of this.unitViews) {
      if (!game.units.find(u => u.id === id)) {
        this.scene.remove(v.sp, v.flash, v.shadow);
        this.unitViews.delete(id);
      }
    }
  }

  place(u) {
    const v = this.view(u);
    if (!v) return;
    const p = world(u.x, u.y);
    v.sp.position.set(p.x, 0, p.z);
    v.flash.position.copy(v.sp.position);
    v.shadow.position.set(p.x, 0.012, p.z);
    v.hp.position.set(p.x, 1.66, p.z);
  }

  // redessine la jauge de PV d'une unité
  updateHp(u, maxHp) {
    const v = this.view(u);
    if (!v) return;
    const ratio = Math.max(0, u.hp / maxHp);
    const c = v.hpCv.getContext('2d');
    c.clearRect(0, 0, 24, 4);
    c.fillStyle = 'rgba(10, 10, 24, 0.9)';
    c.fillRect(0, 0, 24, 4);
    const w = Math.max(1, Math.round(22 * ratio));
    c.fillStyle = ratio > 0.55 ? '#8df08d' : ratio > 0.28 ? '#ffe98e' : '#ff9a8e';
    c.fillRect(1, 1, w, 1);
    c.fillStyle = ratio > 0.55 ? '#46d846' : ratio > 0.28 ? '#ffd23c' : '#ff5040';
    c.fillRect(1, 2, w, 1);
    v.hpTex.needsUpdate = true;
    v.hp.visible = !u.dead && u.hp < maxHp;
  }

  applyIdleFrames() {
    for (const v of this.unitViews.values()) {
      if (v.u.dead) continue;
      v.sp.material.map = v.frames[this.idleFrame];
      v.sp.material.needsUpdate = true;
    }
  }

  async moveUnit(u, path) {
    const v = this.view(u);
    for (let i = 1; i < path.length; i++) {
      const a = world(path[i - 1][0], path[i - 1][1]);
      const b = world(path[i][0], path[i][1]);
      await tween(105, k => {
        const p = a.clone().lerp(b, k);
        v.sp.position.set(p.x, Math.sin(k * Math.PI) * 0.16, p.z);
        v.flash.position.copy(v.sp.position);
        v.shadow.position.set(p.x, 0.012, p.z);
      });
    }
    u.x = path[path.length - 1][0];
    u.y = path[path.length - 1][1];
    this.place(u);
  }

  async lunge(actor, target) {
    const v = this.view(actor);
    const a = world(actor.x, actor.y), b = world(target.x, target.y);
    const dir = b.clone().sub(a).normalize().multiplyScalar(0.34);
    await tween(170, k => {
      const o = Math.sin(k * Math.PI);
      v.sp.position.set(a.x + dir.x * o, Math.sin(k * Math.PI) * 0.05, a.z + dir.z * o);
      v.flash.position.copy(v.sp.position);
    });
    this.place(actor);
  }

  async dodge(unit, from) {
    const v = this.view(unit);
    const a = world(unit.x, unit.y), b = world(from.x, from.y);
    const dir = a.clone().sub(b).normalize().multiplyScalar(0.22);
    await tween(190, k => {
      const o = Math.sin(k * Math.PI);
      v.sp.position.set(a.x + dir.x * o, 0, a.z + dir.z * o);
      v.flash.position.copy(v.sp.position);
    });
    this.place(unit);
  }

  flash(u, ms = 130) {
    const v = this.view(u);
    v.flash.visible = true;
    setTimeout(() => { v.flash.visible = false; }, ms);
  }

  async fadeOut(u) {
    const v = this.view(u);
    await tween(430, k => {
      v.sp.material.opacity = 1 - k;
      v.shadow.material.opacity = 0.34 * (1 - k);
    });
    v.sp.visible = false;
    v.shadow.visible = false;
    v.hp.visible = false;
    v.shadow.material.opacity = 0.34;
  }

  sparks(x, y, big = false) {
    const origin = world(x, y);
    origin.y = 0.55;
    let n = big ? 22 : 12;
    const palette = [0xfff6d8, 0xffe14d, 0xffab4d, 0xffffff];
    for (const p of this.sparkPool) {
      if (n <= 0) break;
      if (p.sp.visible) continue;
      n--;
      p.sp.visible = true;
      p.sp.position.copy(origin);
      const a = Math.random() * Math.PI * 2;
      const sp = 1.4 + Math.random() * 2.4;
      p.vel.set(Math.cos(a) * sp, 1.6 + Math.random() * 2.2, Math.sin(a) * sp * 0.6);
      p.born = performance.now();
      p.life = 360 + Math.random() * 220;
      p.baseScale = (big ? 0.30 : 0.20) * (0.7 + Math.random() * 0.6);
      p.sp.material.color.setHex(palette[(Math.random() * 4) | 0]);
    }
    this.shake(big ? 220 : 130);
  }

  // ---------- surlignages ----------
  setHighlights({ move = [], attack = [], zone = [], cursor = null, target = null } = {}) {
    let i = 0;
    const colors = { move: 0x70a8ff, attack: 0xff5555, zone: 0xffb040 };
    const assign = (cells, kind) => {
      for (const [x, y] of cells) {
        if (i >= this.highlightPool.length) return;
        const m = this.highlightPool[i++];
        m.visible = true;
        m.userData.kind = kind;
        m.material.color.setHex(colors[kind]);
        const p = world(x, y);
        m.position.set(p.x, 0.02, p.z);
      }
    };
    assign(zone, 'zone');
    assign(move, 'move');
    assign(attack, 'attack');
    for (; i < this.highlightPool.length; i++) this.highlightPool[i].visible = false;

    this.cursor.visible = !!cursor;
    if (cursor) {
      const p = world(cursor[0], cursor[1]);
      this.cursor.position.set(p.x, 0.03, p.z);
    }
    this.targetMark.visible = !!target;
    if (target) {
      const p = world(target[0], target[1]);
      this.targetMark.position.set(p.x, 0.032, p.z);
    }
  }

  // ---------- entrée et projection ----------
  pick(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return null;
    const x = Math.floor(hit.x + BOARD / 2);
    const y = Math.floor(hit.z + BOARD / 2);
    if (x < 0 || y < 0 || x >= BOARD || y >= BOARD) return null;
    return [x, y];
  }

  screenPos(x, y, h = 1.1) {
    const p = world(x, y);
    p.y = h;
    p.project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return {
      left: r.left + (p.x + 1) / 2 * r.width,
      top: r.top + (1 - p.y) / 2 * r.height,
    };
  }
}
