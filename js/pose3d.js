/* =========================================================
   PRACTICADOR 3D — figura articulada que enlaza posturas
   Three.js r128 (cargado vía CDN antes de este script)
   ========================================================= */
(function () {
  "use strict";
  const wrap = document.querySelector(".pose3d-canvas-wrap");
  const canvas = document.getElementById("mannequin-canvas");
  if (!wrap || !canvas || typeof THREE === "undefined") return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    const fb = wrap.querySelector(".pose3d-fallback");
    if (fb) fb.style.display = "flex";
    return;
  }

  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const R = THREE.MathUtils.degToRad;
  const lerp = THREE.MathUtils.lerp;
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // ---------- ESCENA ----------
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  scene.add(new THREE.AmbientLight(0xfff4e6, 0.72));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
  keyLight.position.set(2.2, 4, 3);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffd9b3, 0.35);
  fillLight.position.set(-3, 1.4, -2);
  scene.add(fillLight);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1.9, 48),
    new THREE.MeshBasicMaterial({ color: 0xe4d3ab, transparent: true, opacity: 0.45 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ---------- MATERIALES (figura humana propia, estilizada, atlética) ----------
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdb9f74, roughness: 0.5, metalness: 0.03 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0xfffaf1, roughness: 0.6, metalness: 0.02 });
  const shortsMat = new THREE.MeshStandardMaterial({ color: 0x2f7d6c, roughness: 0.48, metalness: 0.04 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.4, metalness: 0.08 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2c1b12, roughness: 0.6, metalness: 0.03 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a2030 });

  // ---------- DIMENSIONES (complexión atlética: hombros anchos, cintura marcada) ----------
  // Las longitudes (torsoLen, upperArmLen, foreArmLen, thighLen, shinLen) y las
  // posiciones de los pivotes están verificadas por cinemática directa: no se
  // tocan. Solo cambian los grosores/proporciones para dar un cuerpo tonificado.
  const D = {
    torsoLen: 0.6, torsoTopR: 0.185, torsoWaistR: 0.112,
    headR: 0.178,
    upperArmLen: 0.33, foreArmLen: 0.3, armR: 0.08, foreArmR: 0.062, wristR: 0.05,
    thighLen: 0.42, shinLen: 0.38, thighR: 0.108, shinR: 0.075, ankleR: 0.052,
    hipR: 0.108, shoulderR: 0.09, elbowR: 0.064, kneeR: 0.084,
  };

  function cylDown(len, r0, r1, mat) {
    const geo = new THREE.CylinderGeometry(r1, r0, len, 14);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -len / 2;
    return mesh;
  }
  function cylUp(len, r0, r1, mat) {
    const geo = new THREE.CylinderGeometry(r1, r0, len, 14);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = len / 2;
    return mesh;
  }
  function sphere(r, mat) {
    return new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat);
  }
  function ring(r, tube, mat) {
    return new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 20), mat);
  }
  function buildHand(sign) {
    const g = new THREE.Object3D();
    const palm = new THREE.Mesh(new THREE.BoxGeometry(D.wristR * 1.7, D.wristR * 0.85, D.wristR * 2.0), skinMat);
    palm.position.y = -D.wristR * 0.5;
    g.add(palm);
    const fingerLen = D.wristR * 1.35;
    for (let i = 0; i < 4; i++) {
      const f = cylDown(fingerLen, D.wristR * 0.17, D.wristR * 0.13, skinMat);
      f.position.set((i - 1.5) * D.wristR * 0.4, -D.wristR * 0.9, D.wristR * 0.85);
      f.rotation.x = R(-10);
      g.add(f);
    }
    const thumb = cylDown(fingerLen * 0.78, D.wristR * 0.18, D.wristR * 0.14, skinMat);
    thumb.position.set(sign * D.wristR * 0.95, -D.wristR * 0.45, D.wristR * 0.15);
    thumb.rotation.z = sign * R(55);
    thumb.rotation.x = R(-8);
    g.add(thumb);
    return g;
  }
  function buildFoot() {
    const g = new THREE.Object3D();
    const sole = new THREE.Mesh(new THREE.BoxGeometry(D.ankleR * 1.5, D.ankleR * 0.8, D.ankleR * 2.5), skinMat);
    sole.position.set(0, -D.ankleR * 0.5, D.ankleR * 0.55);
    g.add(sole);
    const heel = sphere(D.ankleR * 0.55, skinMat);
    heel.position.set(0, -D.ankleR * 0.5, -D.ankleR * 0.55);
    g.add(heel);
    for (let i = 0; i < 5; i++) {
      const t = sphere(D.ankleR * (0.23 - i * 0.014), skinMat);
      t.position.set((i - 2) * D.ankleR * 0.32, -D.ankleR * 0.52, D.ankleR * 1.8);
      g.add(t);
    }
    return g;
  }

  // ---------- FIGURA ----------
  const root = new THREE.Object3D();
  scene.add(root);

  // cadera / banda del short (con ribete de color)
  root.add(sphere(D.torsoWaistR * 0.92, shortsMat));
  const shortsBand = cylUp(0.17, D.torsoWaistR * 1.05, D.torsoWaistR * 1.15, shortsMat);
  root.add(shortsBand);
  const waistStripe = ring(D.torsoWaistR * 1.16, 0.012, stripeMat);
  waistStripe.rotation.x = Math.PI / 2;
  waistStripe.position.y = 0.16;
  root.add(waistStripe);

  const torsoPivot = new THREE.Object3D();
  root.add(torsoPivot);
  torsoPivot.add(cylUp(D.torsoLen, D.torsoWaistR, D.torsoTopR, topMat));
  // hombros anchos y marcados (remata la camiseta arriba del torso)
  const chestCap = sphere(D.torsoTopR, topMat);
  chestCap.position.y = D.torsoLen;
  chestCap.scale.set(1.15, 0.5, 0.9);
  torsoPivot.add(chestCap);

  // cabeza + pelo (coleta deportiva) + ojos
  const headPivot = new THREE.Object3D();
  headPivot.position.y = D.torsoLen;
  torsoPivot.add(headPivot);
  headPivot.add(sphere(D.headR * 0.38, skinMat)); // cuello
  const headMesh = sphere(D.headR, skinMat);
  headMesh.position.y = D.headR * 1.05;
  headPivot.add(headMesh);
  // pelo recogido, corto y pegado (look deportivo)
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(D.headR * 1.08, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat
  );
  hairCap.position.y = D.headR * 1.28;
  hairCap.rotation.x = R(-6);
  headPivot.add(hairCap);
  // coleta: varios segmentos que caen y se curvan hacia atrás
  const ponytailBase = new THREE.Object3D();
  ponytailBase.position.set(0, D.headR * 1.55, -D.headR * 0.85);
  ponytailBase.rotation.x = R(35);
  headPivot.add(ponytailBase);
  let ptCursor = ponytailBase;
  for (let i = 0; i < 3; i++) {
    const seg = cylDown(D.headR * 0.85, D.headR * (0.24 - i * 0.05), D.headR * (0.2 - i * 0.05), hairMat);
    ptCursor.add(seg);
    const next = new THREE.Object3D();
    next.position.y = -D.headR * 0.85;
    next.rotation.x = R(18);
    ptCursor.add(next);
    ptCursor = next;
  }
  const eyeL = sphere(0.019, eyeMat);
  eyeL.position.set(-0.058, D.headR * 1.05, D.headR * 0.9);
  const eyeR = sphere(0.019, eyeMat);
  eyeR.position.set(0.058, D.headR * 1.05, D.headR * 0.9);
  headPivot.add(eyeL, eyeR);

  function buildArm(sign) {
    const shoulder = new THREE.Object3D();
    shoulder.position.set(sign * 0.205, D.torsoLen * 0.9, 0);
    torsoPivot.add(shoulder);
    // manga de la camiseta cubriendo el hombro (deltoides marcado)
    const sleeve = sphere(D.armR * 1.5, topMat);
    sleeve.scale.set(1, 0.68, 1);
    sleeve.position.y = 0.015;
    shoulder.add(sleeve);
    shoulder.add(sphere(D.shoulderR, skinMat));
    shoulder.add(cylDown(D.upperArmLen, D.armR, D.armR * 0.82, skinMat));
    // bíceps: ligero abultamiento a media caña
    const bicep = sphere(D.armR * 1.08, skinMat);
    bicep.scale.set(1, 1.25, 1);
    bicep.position.y = -D.upperArmLen * 0.42;
    shoulder.add(bicep);
    const elbow = new THREE.Object3D();
    elbow.position.y = -D.upperArmLen;
    shoulder.add(elbow);
    elbow.add(sphere(D.elbowR, skinMat));
    elbow.add(cylDown(D.foreArmLen, D.foreArmR, D.foreArmR * 0.78, skinMat));
    const hand = buildHand(sign);
    hand.position.y = -D.foreArmLen;
    elbow.add(hand);
    return { shoulder, elbow };
  }
  const armL = buildArm(-1);
  const armR = buildArm(1);

  function buildLeg(sign) {
    const hip = new THREE.Object3D();
    hip.position.set(sign * 0.128, -0.03, 0);
    root.add(hip);
    hip.add(sphere(D.hipR, skinMat));
    // pernera del short cubriendo el muslo superior, con ribete de color
    const shortsLeg = cylDown(D.thighLen * 0.44, D.thighR * 1.34, D.thighR * 1.1, shortsMat);
    hip.add(shortsLeg);
    const hemStripe = ring(D.thighR * 1.11, 0.01, stripeMat);
    hemStripe.rotation.x = Math.PI / 2;
    hemStripe.position.y = -D.thighLen * 0.42;
    hip.add(hemStripe);
    // muslo tonificado (más ancho arriba, se afina hacia la rodilla)
    hip.add(cylDown(D.thighLen, D.thighR, D.thighR * 0.72, skinMat));
    const quad = sphere(D.thighR * 1.02, skinMat);
    quad.scale.set(1, 1.3, 1.05);
    quad.position.y = -D.thighLen * 0.5;
    hip.add(quad);
    const knee = new THREE.Object3D();
    knee.position.y = -D.thighLen;
    hip.add(knee);
    knee.add(sphere(D.kneeR, skinMat));
    knee.add(cylDown(D.shinLen, D.shinR, D.shinR * 0.68, skinMat));
    // gemelo marcado
    const calf = sphere(D.shinR * 0.98, skinMat);
    calf.scale.set(1, 1.15, 1);
    calf.position.y = -D.shinLen * 0.38;
    knee.add(calf);
    const foot = buildFoot();
    foot.position.y = -D.shinLen;
    knee.add(foot);
    return { hip, knee };
  }
  const legL = buildLeg(-1);
  const legR = buildLeg(1);

  // ---------- SECUENCIA DE POSTURAS ----------
  // Ángulos verificados con cinemática directa (sin ojo humano de por medio):
  // en cada postura se comprobó numéricamente que manos y pies caen a
  // ras de suelo donde corresponde antes de fijar estos valores.
  const POSES = [
    {
      name: "Tadasana", sub: "Postura de la montaña",
      desc: "De pie, pies firmes, coronilla hacia el techo: el punto de partida y de llegada.",
      torso: 0, head: 0, armShoulder: 0, armElbow: 3, armZ: 9,
      hipLeg: 0, knee: 0, rootY: 0.8, rootZ: 0, camY: 1.0, camZ: 2.8, lookY: 0.85,
    },
    {
      name: "Urdhva Hastasana", sub: "Brazos elevados",
      desc: "Los brazos suben en arco, ligera extensión de la columna hacia atrás.",
      torso: -10, head: -6, armShoulder: -165, armElbow: 4, armZ: 6,
      hipLeg: 0, knee: 0, rootY: 0.81, rootZ: 0, camY: 1.2, camZ: 2.9, lookY: 1.05,
    },
    {
      name: "Uttanasana", sub: "Flexión de pie",
      desc: "La cadera se pliega y el torso cae hacia adelante; las rodillas pueden ir suaves.",
      torso: 102, head: 18, armShoulder: -95, armElbow: 8, armZ: 4,
      hipLeg: 0, knee: 6, rootY: 0.8, rootZ: 0, camY: 0.65, camZ: 2.4, lookY: 0.45,
    },
    {
      name: "Ardha Uttanasana", sub: "Media elevación",
      desc: "La espalda se alarga en línea recta, la mirada busca el horizonte.",
      torso: 88, head: -4, armShoulder: -50, armElbow: 16, armZ: 4,
      hipLeg: 0, knee: 2, rootY: 0.8, rootZ: 0, camY: 0.75, camZ: 2.4, lookY: 0.55,
    },
    {
      name: "Adho Mukha Svanasana", sub: "Perro boca abajo",
      desc: "La cadera se convierte en el punto más alto: una V invertida entre manos y pies.",
      torso: 108, head: 8, armShoulder: -108, armElbow: 0, armZ: 6,
      hipLeg: 15, knee: 0, rootY: 0.8, rootZ: 0, camY: 0.85, camZ: 2.7, lookY: 0.5,
    },
    {
      name: "Balasana", sub: "Postura del niño",
      desc: "Cierre del ciclo: la cadera baja hacia los talones y el torso descansa sobre los muslos.",
      torso: 122, head: 14, armShoulder: -212, armElbow: 10, armZ: 0,
      hipLeg: -40, knee: 130, rootY: 0.38, rootZ: 0.05, camY: 0.6, camZ: 2.7, lookY: 0.28,
    },
  ];

  function applyPose(p) {
    torsoPivot.rotation.set(R(p.torso), 0, 0);
    headPivot.rotation.set(R(p.head), 0, 0);
    armL.shoulder.rotation.set(R(p.armShoulder), 0, R(p.armZ));
    armR.shoulder.rotation.set(R(p.armShoulder), 0, -R(p.armZ));
    armL.elbow.rotation.set(R(p.armElbow), 0, 0);
    armR.elbow.rotation.set(R(p.armElbow), 0, 0);
    legL.hip.rotation.set(R(p.hipLeg), 0, 0);
    legR.hip.rotation.set(R(p.hipLeg), 0, 0);
    legL.knee.rotation.set(R(p.knee), 0, 0);
    legR.knee.rotation.set(R(p.knee), 0, 0);
    root.position.set(p.rootZ || 0, p.rootY, 0);
    focusY = p.lookY;
    focusCamY = p.camY;
    focusCamZ = p.camZ;
  }

  const NUMKEYS = ["torso", "head", "armShoulder", "armElbow", "armZ", "hipLeg", "knee", "rootY", "rootZ", "camY", "camZ", "lookY"];
  function lerpPose(a, b, t) {
    const out = {};
    for (const k of NUMKEYS) out[k] = lerp(a[k], b[k], t);
    return out;
  }

  let focusY = POSES[0].lookY, focusCamY = POSES[0].camY, focusCamZ = POSES[0].camZ;

  // ---------- CÁMARA: órbita automática + arrastre manual ----------
  let orbitAngle = 0.35;
  let autoOrbit = true;
  let dragging = false;
  let lastX = 0;

  wrap.addEventListener("pointerdown", (e) => {
    dragging = true;
    autoOrbit = false;
    lastX = e.clientX;
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    orbitAngle += dx * 0.008;
  });
  window.addEventListener("pointerup", () => { dragging = false; });

  function updateCamera() {
    if (autoOrbit && !dragging && !REDUCED) orbitAngle += 0.0016;
    camera.position.set(Math.sin(orbitAngle) * focusCamZ, focusCamY, Math.cos(orbitAngle) * focusCamZ);
    camera.lookAt(0, focusY, 0);
  }

  // ---------- RESIZE ----------
  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  // ---------- REPRODUCCIÓN ----------
  const HOLD_MS = 1900;
  const TRANS_MS = REDUCED ? 1 : 1500;
  let current = 0, next = 1, phase = "hold", elapsed = 0, playing = !REDUCED;
  let lastT = performance.now();

  applyPose(POSES[current]);

  // ---------- UI ----------
  const nameEl = document.querySelector(".pose3d-name");
  const subEl = document.querySelector(".pose3d-sanskrit-en");
  const descEl = document.querySelector(".pose3d-desc");
  const stepEls = Array.from(document.querySelectorAll(".pose3d-step"));
  const playBtn = document.querySelector(".pose3d-play");
  const prevBtn = document.querySelector(".pose3d-prev");
  const nextBtn = document.querySelector(".pose3d-next");

  function renderUI(i) {
    const p = POSES[i];
    if (nameEl) nameEl.textContent = p.name;
    if (subEl) subEl.textContent = p.sub;
    if (descEl) descEl.textContent = p.desc;
    stepEls.forEach((el, idx) => el.classList.toggle("active", idx === i));
  }
  function setPlayIcon() {
    if (playBtn) playBtn.innerHTML = playing
      ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7Z"/></svg>';
  }
  function goTo(i) {
    current = ((i % POSES.length) + POSES.length) % POSES.length;
    next = (current + 1) % POSES.length;
    phase = "hold";
    elapsed = 0;
    applyPose(POSES[current]);
    renderUI(current);
  }

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      playing = !playing;
      setPlayIcon();
    });
  }
  if (prevBtn) prevBtn.addEventListener("click", () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goTo(current + 1));
  stepEls.forEach((el, idx) => el.addEventListener("click", () => goTo(idx)));

  renderUI(current);
  setPlayIcon();

  // ---------- BUCLE ----------
  function frame(now) {
    const dt = now - lastT;
    lastT = now;

    if (playing) {
      elapsed += dt;
      if (phase === "hold") {
        if (elapsed >= HOLD_MS) { phase = "transition"; elapsed = 0; }
      } else {
        const t = Math.min(elapsed / TRANS_MS, 1);
        applyPose(lerpPose(POSES[current], POSES[next], easeInOutCubic(t)));
        if (t >= 1) {
          current = next;
          next = (current + 1) % POSES.length;
          phase = "hold";
          elapsed = 0;
          renderUI(current);
        }
      }
    }

    updateCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(resize).observe(wrap);
  }
})();
