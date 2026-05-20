// cap.js — Boné 3D reconstruído com base na foto de referência
// Ref: 6-panel fitted cap, malha wool/knit, copa alta, aba curva pra baixo
import * as THREE from 'three';

/* ─── Textura de malha knit (waffle) — muito áspera, como na foto ─── */
function makeKnitTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base escura
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, size, size);

  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const fx = x / size;
      const fy = y / size;

      // Waffle knit: diagonais cruzadas finas
      const d1 = Math.sin((fx + fy) * 120) * 0.5 + 0.5;
      const d2 = Math.sin((fx - fy) * 120) * 0.5 + 0.5;
      // Vertical ribs (como na foto)
      const rib = Math.sin(fx * 80) * 0.3 + 0.7;
      // Horizontal cross threads
      const cross = Math.sin(fy * 80) * 0.15 + 0.85;

      let val = (d1 * 0.25 + d2 * 0.25 + rib * 0.35 + cross * 0.15);
      val = Math.pow(val, 1.5); // increase contrast
      val = Math.max(0, Math.min(1, val));

      const b = Math.floor(val * 200); // cap at 200 to stay dark
      img.data[i] = b; img.data[i+1] = b; img.data[i+2] = b; img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Slight blur
  const off = document.createElement('canvas');
  off.width = size; off.height = size;
  const octx = off.getContext('2d');
  octx.filter = 'blur(0.4px)';
  octx.drawImage(canvas, 0, 0);

  const tex = new THREE.CanvasTexture(off);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

/* ─── Normal map para malha grossa ─── */
function makeKnitNormalMap(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const fx = x / size;
      const fy = y / size;
      // Cross-hatch normals
      const nx = Math.sin(fx * 80) * 0.5 + 0.5;
      const ny = Math.sin(fy * 80) * 0.5 + 0.5;
      img.data[i]   = Math.floor(nx * 255);
      img.data[i+1] = Math.floor(ny * 255);
      img.data[i+2] = 200; // Z (pointing outward mostly)
      img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

/* ─── Logo ÁSPERUS ─── */
function makeLogoTexture(label = 'ÁSPERUS') {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  ctx.font = 'bold 68px "Clash Display", "Cabinet Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Depth shadow
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillText(label, size/2 + 2, size/2 + 3);

  // Gold gradient text
  const g = ctx.createLinearGradient(0, size/2 - 40, 0, size/2 + 40);
  g.addColorStop(0, '#F0E8D0');
  g.addColorStop(0.4, '#C4A96B');
  g.addColorStop(1, '#7a6030');
  ctx.fillStyle = g;
  ctx.fillText(label, size/2, size/2);

  const tex = new THREE.CanvasTexture(c);
  return tex;
}

/* ─── Brim geometry: longa, curva para baixo, borda enrolada ─── */
// Baseado na foto: aba media-longa, curva pra baixo no centro, bordas laterais mais altas
function makeBrimGeometry() {
  const innerR = 1.02;
  const outerR = 2.1;   // aba mais longa que o anterior
  const segs = 80;
  const halfAngle = Math.PI * 0.38; // ~68° cada lado = 136° total

  const verts = [];
  const indices = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const angle = -halfAngle + t * halfAngle * 2;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);

    // Inner ring
    const xi = sa * innerR;
    const zi = ca * innerR;
    const yi = -0.05;

    // Outer edge — curva para baixo no centro (frente), sobe nas laterais
    // Na foto: a aba dropa bastante na frente e tem borda enrolada suavemente
    const outerBend = ca * ca; // maior perto do centro frontal
    const xo = sa * outerR;
    const zo = ca * outerR;
    // Droop: até -0.35 no centro frontal, sobe nas laterais
    const yo = -0.12 - outerBend * 0.28;

    verts.push(xi, yi, zi); // inner top
    verts.push(xo, yo, zo); // outer top

    // Edge curl: adiciona um loop extra na borda com curl para cima (como na foto)
    // A borda da aba enrola levemente pra cima no final
    const curlRadius = 0.035;
    const curlAngleOffset = 0.3; // curl upward
    const xcurl = xo + sa * curlRadius * Math.sin(curlAngleOffset) * 0.3;
    const zcurl = zo + ca * curlRadius * Math.sin(curlAngleOffset) * 0.3;
    const ycurl = yo + curlRadius * (1 - Math.cos(curlAngleOffset));
    verts.push(xcurl, ycurl, zcurl); // outer curl edge
  }

  // Indices: quad strip com inner→outer→curl
  // 3 verts per row segment: inner(0), outer(1), curl(2)
  for (let i = 0; i < segs; i++) {
    const a = i * 3, b = i * 3 + 1, c = i * 3 + 2;
    const d = i * 3 + 3, e = i * 3 + 4, f = i * 3 + 5;

    // Inner to outer face (top)
    indices.push(a, d, b); indices.push(b, d, e);
    // Outer to curl
    indices.push(b, e, c); indices.push(c, e, f);
    // Bottom faces (double-sided trick)
    indices.push(b, a, d); // undo winding for bottom
    indices.push(e, b, d);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* ─── 6 costuras radiais (painéis) da base ao botão ─── */
function makePanel6Seams() {
  const group = new THREE.Group();
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, roughness: 0.98, metalness: 0.0,
  });

  for (let p = 0; p < 6; p++) {
    const angle = (p / 6) * Math.PI * 2;

    // Path: da base (raio ~1, y=0) ao botão no topo (y~1.0, raio~0)
    const pts = [];
    const steps = 20;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // Interpolate on sphere surface
      const phi = t * Math.PI * 0.52; // from equator to near-top
      const r = Math.sin(phi) * 0.0 + Math.cos(phi) * 0; // on unit sphere
      // Point on hemisphere surface
      const x = Math.cos(angle) * Math.sin(phi);
      const y = Math.cos(phi) + 0.08; // offset slightly
      const z = Math.sin(angle) * Math.sin(phi);
      // Push slightly outward (1.01 * unit sphere)
      const len = Math.sqrt(x*x + y*y + z*z);
      pts.push(new THREE.Vector3(
        x / len * 1.015,
        y / len * 1.015,
        z / len * 1.015
      ));
    }

    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 30, 0.007, 5, false);
    group.add(new THREE.Mesh(tube, seamMat));
  }
  return group;
}

/* ─── Costura frontal central (seam no painel da frente) ─── */
function makeFrontSeam() {
  const pts = [];
  const steps = 24;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const phi = t * Math.PI * 0.5;
    const x = 0; // centro frontal (ângulo 0)
    const y = Math.cos(phi) + 0.08;
    const z = Math.sin(phi);
    const len = Math.sqrt(x*x + y*y + z*z);
    pts.push(new THREE.Vector3(
      x / len * 1.016,
      y / len * 1.016,
      z / len * 1.016
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 36, 0.008, 5, false);
  return geo;
}

/* ═══════════════════════════════════════════════
   BUILD CAP — referência foto: 6-panel fitted black wool cap
═══════════════════════════════════════════════ */
export function buildCap() {
  const cap = new THREE.Group();

  const knitTex   = makeKnitTexture(512);
  const normalTex = makeKnitNormalMap(256);
  const logoTex   = makeLogoTexture();

  /* ── Material principal: tecido wool/knit preto matte ── */
  const fabric = new THREE.MeshStandardMaterial({
    color: 0x0d0d0d,
    roughness: 0.95,    // extremamente áspero — sem brilho, como na foto
    metalness: 0.0,
    map: knitTex,
    displacementMap: knitTex,
    displacementScale: 0.022,
    normalMap: normalTex,
    normalScale: new THREE.Vector2(0.6, 0.6),
  });

  /* ── COPA (Crown) — alta e arredondada, como 6-panel fitted ── */
  // Na foto: copa bem alta, dome pronunciado, base reta
  // Usamos SphereGeometry com phiLength > PI/2 para copa mais alta
  const crownGeo = new THREE.SphereGeometry(
    1,      // radius
    64,     // widthSegs
    48,     // heightSegs
    0,      // phiStart
    Math.PI * 2,  // phiLength (full circle)
    0,      // thetaStart (top)
    Math.PI * 0.58 // thetaLength — copa alta (> meio-esfera)
  );
  const crown = new THREE.Mesh(crownGeo, fabric);
  crown.position.y = 0.06;
  cap.add(crown);

  /* ── BASE BAND — faixa estrutural na base da copa ── */
  // Na foto: banda leve onde a copa encontra o aro
  const bandGeo = new THREE.CylinderGeometry(1.01, 1.0, 0.18, 64);
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a, roughness: 0.97, metalness: 0.0,
    map: knitTex,
  });
  const band = new THREE.Mesh(bandGeo, bandMat);
  band.position.y = -0.04;
  cap.add(band);

  /* ── 6 PANEL SEAMS (costuras radiais) ── */
  const seams = makePanel6Seams();
  cap.add(seams);

  /* ── FRONT SEAM (costura do painel frontal) ── */
  const frontSeamMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, roughness: 0.98,
  });
  const frontSeam = new THREE.Mesh(makeFrontSeam(), frontSeamMat);
  cap.add(frontSeam);

  /* ── ABA (Brim) ── */
  const brim = new THREE.Mesh(makeBrimGeometry(), fabric);
  cap.add(brim);

  /* ── BRIM EDGE STITCH — filete de costura na borda da aba ── */
  // Na foto: linha fina de costura ao longo da borda
  const halfA = Math.PI * 0.38;
  const edgePts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const angle = -halfA + t * halfA * 2;
    const outerR = 2.1;
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const outerBend = ca * ca;
    edgePts.push(new THREE.Vector3(
      sa * outerR,
      -0.12 - outerBend * 0.28 + 0.02,
      ca * outerR
    ));
  }
  const edgeCurve = new THREE.CatmullRomCurve3(edgePts);
  const edgeGeo = new THREE.TubeGeometry(edgeCurve, 80, 0.009, 5, false);
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.95 });
  cap.add(new THREE.Mesh(edgeGeo, edgeMat));

  /* ── SWEATBAND (suador) — visível na base interna ── */
  const sweatGeo = new THREE.TorusGeometry(0.96, 0.04, 12, 64, Math.PI * 2);
  const sweatMat = new THREE.MeshStandardMaterial({
    color: 0x111108, roughness: 0.8, metalness: 0.05,
  });
  const sweat = new THREE.Mesh(sweatGeo, sweatMat);
  sweat.rotation.x = Math.PI / 2;
  sweat.position.y = -0.1;
  cap.add(sweat);

  /* ── TOP BUTTON (botão no topo) ── */
  // Na foto: pequeno botão circular no ápice, de tecido
  const btnGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 8);
  const btnDiscGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.02, 8);
  const btnMat = new THREE.MeshStandardMaterial({
    color: 0x111111, roughness: 0.95, map: knitTex
  });
  const btn = new THREE.Mesh(btnGeo, btnMat);
  btn.position.y = 0.58 + 0.06; // top of high crown
  cap.add(btn);
  const btnDisc = new THREE.Mesh(btnDiscGeo, btnMat);
  btnDisc.position.y = 0.58 + 0.09;
  cap.add(btnDisc);

  /* ── LOGO ÁSPERUS bordado frontal ── */
  const logoGeo = new THREE.PlaneGeometry(0.8, 0.2);
  const logoMat = new THREE.MeshStandardMaterial({
    map: logoTex,
    transparent: true,
    roughness: 0.75,
    metalness: 0.1,
    alphaTest: 0.05,
  });
  const logo = new THREE.Mesh(logoGeo, logoMat);
  // Posição na face frontal da copa — levemente inclinada
  logo.position.set(0, 0.28, 1.0);
  logo.rotation.x = -0.22;
  logo.name = 'logo';
  cap.add(logo);

  /* ── Orientação final — foto é 3/4 angle ── */
  // No site: mostramos ligeiramente rotacionado para mostrar a estrutura
  cap.rotation.y = -0.35;  // slight 3/4 view inicial
  cap.rotation.x = -0.05;
  cap.rotation.z = 0.03;

  return cap;
}
