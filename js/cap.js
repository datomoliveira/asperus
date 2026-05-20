// cap.js — Boné 3D construído do zero com geometrias primitivas Three.js
import * as THREE from 'three';

/* ─── Noise texture procedural (simula tecido) ─── */
function makeNoiseTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Layered fabric-like noise using canvas operations
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const fx = x / size;
      const fy = y / size;
      // Woven fabric: horizontal + vertical threads
      const h = Math.sin(fx * 80) * 0.25 + 0.5;
      const v = Math.sin(fy * 80) * 0.25 + 0.5;
      // Coarse weave
      const coarse = (Math.sin(fx * 18) * Math.sin(fy * 18)) * 0.15;
      let val = (h + v) * 0.5 + coarse;
      // Clamp to 0-1
      val = Math.max(0, Math.min(1, val));
      const b = Math.floor(val * 255);
      img.data[i] = b; img.data[i+1] = b; img.data[i+2] = b; img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Blur for softness
  const off = document.createElement('canvas');
  off.width = size; off.height = size;
  const octx = off.getContext('2d');
  octx.filter = 'blur(0.8px)';
  octx.drawImage(canvas, 0, 0);

  const tex = new THREE.CanvasTexture(off);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

/* ─── Logo texture em canvas ─── */
function makeLogoTexture(label = 'ÁSPERUS') {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, size, size);

  // Emboss-like gold text
  ctx.font = 'bold 72px "Clash Display", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // Shadow (depth)
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillText(label, size/2 + 2, size/2 + 2);

  // Main text
  const grad = ctx.createLinearGradient(0, size/2 - 36, 0, size/2 + 36);
  grad.addColorStop(0, '#E8E2D9');
  grad.addColorStop(0.5, '#C4A96B');
  grad.addColorStop(1, '#8a7040');
  ctx.fillStyle = grad;
  ctx.fillText(label, size/2, size/2);

  const tex = new THREE.CanvasTexture(c);
  return tex;
}

/* ─── Brim geometry personalizada ─── */
function makeBrimGeometry() {
  const innerR = 1.02, outerR = 1.95;
  const segs = 64;
  const halfAngle = Math.PI * 0.37; // ~67° = 134° total

  const verts = [], normals = [], uvs = [], indices = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const angle = -halfAngle + t * halfAngle * 2;
    const ca = Math.cos(angle), sa = Math.sin(angle);

    // Inner ring (attached to crown base)
    const xi = sa * innerR, zi = ca * innerR;
    // Outer tip — droops slightly at front center
    const xo = sa * outerR, zo = ca * outerR;
    const droop = -0.12 * Math.cos(angle * 1.4);

    verts.push(xi, -0.04, zi);   // inner vertex
    verts.push(xo, droop - 0.06, zo); // outer vertex

    uvs.push(t, 0, t, 1);
    normals.push(0, 1, 0, 0, 1, 0);
  }

  for (let i = 0; i < segs; i++) {
    const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
    indices.push(a, c, b); indices.push(b, c, d);
    // Bottom face
    indices.push(b, c, a); indices.push(d, c, b);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* ─── Seam (costura) TubeGeometry ─── */
function makeSeamGeometry() {
  const pts = [];
  const n = 30;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const angle = Math.PI * 0.15 - t * Math.PI * 0.3;
    const r = 1.01;
    pts.push(new THREE.Vector3(
      Math.sin(angle) * r,
      Math.cos(angle * 0.6) * 0.18 + 0.35,
      Math.cos(angle) * r
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, 40, 0.008, 6, false);
}

/* ─── BUILD CAP ─── */
export function buildCap() {
  const cap = new THREE.Group();

  const noiseTex = makeNoiseTexture(256);
  const logoTex = makeLogoTexture();

  // ── Main fabric material ──
  const fabric = new THREE.MeshStandardMaterial({
    color: 0x0c0c0c,
    roughness: 0.88,
    metalness: 0.04,
    displacementMap: noiseTex,
    displacementScale: 0.018,
    normalMap: noiseTex,
    normalScale: new THREE.Vector2(0.4, 0.4),
  });

  // ── CROWN (copa) — half sphere ──
  const crownGeo = new THREE.SphereGeometry(1, 64, 48, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const crown = new THREE.Mesh(crownGeo, fabric);
  crown.position.y = 0.08;
  cap.add(crown);

  // ── CROWN BASE — thin cylinder ──
  const baseGeo = new THREE.CylinderGeometry(1, 1, 0.1, 64);
  const base = new THREE.Mesh(baseGeo, fabric);
  base.position.y = 0;
  cap.add(base);

  // ── BRIM (aba) ──
  const brimGeo = makeBrimGeometry();
  const brim = new THREE.Mesh(brimGeo, fabric);
  cap.add(brim);

  // ── SWEATBAND (suador) — thin torus ──
  const sweatGeo = new THREE.TorusGeometry(0.97, 0.035, 10, 64, Math.PI * 2);
  const sweatMat = new THREE.MeshStandardMaterial({
    color: 0x1a1208, roughness: 0.75, metalness: 0.08,
  });
  const sweat = new THREE.Mesh(sweatGeo, sweatMat);
  sweat.rotation.x = Math.PI / 2;
  sweat.position.y = -0.03;
  cap.add(sweat);

  // ── TOP BUTTON ──
  const btnGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.1, 10);
  const btnMat = new THREE.MeshStandardMaterial({
    color: 0x222222, roughness: 0.6, metalness: 0.2,
  });
  const btn = new THREE.Mesh(btnGeo, btnMat);
  btn.position.y = 1.02;
  cap.add(btn);

  // ── TOP BUTTON DISC ──
  const btnDiscGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.015, 10);
  const btnDisc = new THREE.Mesh(btnDiscGeo, btnMat);
  btnDisc.position.y = 1.07;
  cap.add(btnDisc);

  // ── SEAM (costura frontal) ──
  const seamGeo = makeSeamGeometry();
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a, roughness: 0.95, metalness: 0.0,
  });
  const seam = new THREE.Mesh(seamGeo, seamMat);
  cap.add(seam);

  // ── LOGO PANEL (bordado frontal) ──
  const logoGeo = new THREE.PlaneGeometry(0.85, 0.22);
  const logoMat = new THREE.MeshStandardMaterial({
    map: logoTex,
    transparent: true,
    roughness: 0.7,
    metalness: 0.15,
    alphaTest: 0.05,
  });
  const logo = new THREE.Mesh(logoGeo, logoMat);
  // Position on front face of crown
  logo.position.set(0, 0.38, 0.97);
  logo.rotation.x = -0.18;
  logo.name = 'logo';
  cap.add(logo);

  // Slight overall tilt (cap worn at angle)
  cap.rotation.x = -0.06;
  cap.rotation.z = 0.04;

  return cap;
}
