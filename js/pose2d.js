/* =========================================================
   PRACTICADOR 2D — figura animada en SVG
   Las coordenadas de cada postura se derivaron de una cinemática
   verificada por script (misma técnica que la versión 3D, pero
   proyectada a 2D): las longitudes de cada segmento son idénticas
   en las seis posturas, así que la figura nunca "se estira".
   ========================================================= */
(function () {
  "use strict";
  const svg = document.getElementById("pose-svg");
  if (!svg) return;

  const NS = "http://www.w3.org/2000/svg";
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // ---------- POSTURAS (coordenadas verificadas, viewBox 200x150) ----------
  const POSES = [
    {
      name: "Tadasana", sub: "Postura de la montaña",
      desc: "De pie, pies firmes, coronilla hacia el techo: el punto de partida y de llegada.",
      pts: { head: [100, 39.4], shoulder: [100, 60.3], elbow: [100, 79.4], hand: [99.1, 96.8], hip: [100, 91.6], knee: [100, 117.7], foot: [100, 139.7] },
    },
    {
      name: "Urdhva Hastasana", sub: "Brazos elevados",
      desc: "Los brazos suben en arco, ligera extensión de la columna hacia atrás.",
      pts: { head: [89.2, 40], shoulder: [94.6, 60.2], elbow: [96.2, 41.1], hand: [99, 23.9], hip: [100, 91], knee: [100, 117.1], foot: [100, 139.2] },
    },
    {
      name: "Uttanasana", sub: "Flexión de pie",
      desc: "La cadera se pliega y el torso cae hacia adelante; las rodillas pueden ir suaves.",
      pts: { head: [149.1, 107.5], shoulder: [130.6, 98.1], elbow: [128.3, 117.1], hand: [123.8, 133.9], hip: [100, 91.6], knee: [100, 117.7], foot: [97.7, 139.6] },
    },
    {
      name: "Ardha Uttanasana", sub: "Media elevación",
      desc: "La espalda se alarga en línea recta, la mirada busca el horizonte.",
      pts: { head: [152.1, 88.6], shoulder: [131.3, 90.5], elbow: [119.5, 105.6], hand: [105.4, 115.8], hip: [100, 91.6], knee: [100, 117.7], foot: [99.2, 139.7] },
    },
    {
      name: "Adho Mukha Svanasana", sub: "Perro boca abajo",
      desc: "La cadera se convierte en el punto más alto: una V invertida entre manos y pies.",
      pts: { head: [148.7, 110], shoulder: [129.8, 101.3], elbow: [129.8, 120.4], hand: [129.8, 137.8], hip: [100, 91.6], knee: [93.7, 116.9], foot: [88, 138.2] },
    },
    {
      name: "Balasana", sub: "Postura del niño",
      desc: "Cierre del ciclo: la cadera baja hacia los talones y el torso descansa sobre los muslos.",
      pts: { head: [144.5, 146.9], shoulder: [129.5, 132.6], elbow: [148.6, 132.6], hand: [165.7, 135.6], hip: [102.9, 116], knee: [118.6, 136.4], foot: [96.5, 136.4] },
    },
  ];
  const JOINTS = ["head", "shoulder", "elbow", "hand", "hip", "knee", "foot"];

  function lerpPts(a, b, t) {
    const out = {};
    for (const k of JOINTS) out[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)];
    return out;
  }

  // ---------- CONSTRUCCIÓN DEL SVG (una sola vez) ----------
  function el(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  svg.appendChild(el("line", { x1: 8, y1: 141, x2: 192, y2: 141, class: "p2-floor" }));

  const limbs = {
    torso: el("line", { class: "p2-limb" }),
    upperArm: el("line", { class: "p2-limb" }),
    foreArm: el("line", { class: "p2-limb p2-accent" }),
    thigh: el("line", { class: "p2-limb" }),
    shin: el("line", { class: "p2-limb p2-accent" }),
  };
  Object.values(limbs).forEach((l) => svg.appendChild(l));

  const joints = {
    shoulder: el("circle", { r: 4, class: "p2-joint" }),
    elbow: el("circle", { r: 3.4, class: "p2-joint" }),
    hip: el("circle", { r: 4.6, class: "p2-joint" }),
    knee: el("circle", { r: 3.8, class: "p2-joint" }),
  };
  Object.values(joints).forEach((j) => svg.appendChild(j));

  const hand = el("circle", { r: 5, class: "p2-end" });
  const foot = el("ellipse", { rx: 8, ry: 4.6, class: "p2-end" });
  svg.appendChild(hand);
  svg.appendChild(foot);

  const head = el("circle", { r: 11, class: "p2-head" });
  svg.appendChild(head);
  const eye = el("circle", { r: 1.3, class: "p2-eye" });
  svg.appendChild(eye);

  function render(pts) {
    limbs.torso.setAttribute("x1", pts.shoulder[0]); limbs.torso.setAttribute("y1", pts.shoulder[1]);
    limbs.torso.setAttribute("x2", pts.hip[0]); limbs.torso.setAttribute("y2", pts.hip[1]);

    limbs.upperArm.setAttribute("x1", pts.shoulder[0]); limbs.upperArm.setAttribute("y1", pts.shoulder[1]);
    limbs.upperArm.setAttribute("x2", pts.elbow[0]); limbs.upperArm.setAttribute("y2", pts.elbow[1]);

    limbs.foreArm.setAttribute("x1", pts.elbow[0]); limbs.foreArm.setAttribute("y1", pts.elbow[1]);
    limbs.foreArm.setAttribute("x2", pts.hand[0]); limbs.foreArm.setAttribute("y2", pts.hand[1]);

    limbs.thigh.setAttribute("x1", pts.hip[0]); limbs.thigh.setAttribute("y1", pts.hip[1]);
    limbs.thigh.setAttribute("x2", pts.knee[0]); limbs.thigh.setAttribute("y2", pts.knee[1]);

    limbs.shin.setAttribute("x1", pts.knee[0]); limbs.shin.setAttribute("y1", pts.knee[1]);
    limbs.shin.setAttribute("x2", pts.foot[0]); limbs.shin.setAttribute("y2", pts.foot[1]);

    joints.shoulder.setAttribute("cx", pts.shoulder[0]); joints.shoulder.setAttribute("cy", pts.shoulder[1]);
    joints.elbow.setAttribute("cx", pts.elbow[0]); joints.elbow.setAttribute("cy", pts.elbow[1]);
    joints.hip.setAttribute("cx", pts.hip[0]); joints.hip.setAttribute("cy", pts.hip[1]);
    joints.knee.setAttribute("cx", pts.knee[0]); joints.knee.setAttribute("cy", pts.knee[1]);

    hand.setAttribute("cx", pts.hand[0]); hand.setAttribute("cy", pts.hand[1]);
    foot.setAttribute("cx", pts.foot[0]); foot.setAttribute("cy", pts.foot[1]);

    head.setAttribute("cx", pts.head[0]); head.setAttribute("cy", pts.head[1]);
    // el ojo se desplaza un poco hacia donde "mira" la cabeza respecto al hombro
    const dx = pts.head[0] - pts.shoulder[0];
    eye.setAttribute("cx", pts.head[0] + (dx >= 0 ? 3.5 : -3.5));
    eye.setAttribute("cy", pts.head[1] - 1.5);
  }

  render(POSES[0].pts);

  // ---------- REPRODUCCIÓN ----------
  const HOLD_MS = 1900;
  const TRANS_MS = REDUCED ? 1 : 1300;
  let current = 0, next = 1, phase = "hold", elapsed = 0, playing = !REDUCED;
  let lastT = performance.now();

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
    render(POSES[current].pts);
    renderUI(current);
  }

  if (playBtn) playBtn.addEventListener("click", () => { playing = !playing; setPlayIcon(); });
  if (prevBtn) prevBtn.addEventListener("click", () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goTo(current + 1));
  stepEls.forEach((el, idx) => el.addEventListener("click", () => goTo(idx)));

  renderUI(current);
  setPlayIcon();

  function frame(now) {
    const dt = now - lastT;
    lastT = now;
    if (playing) {
      elapsed += dt;
      if (phase === "hold") {
        if (elapsed >= HOLD_MS) { phase = "transition"; elapsed = 0; }
      } else {
        const t = Math.min(elapsed / TRANS_MS, 1);
        render(lerpPts(POSES[current].pts, POSES[next].pts, easeInOutCubic(t)));
        if (t >= 1) {
          current = next;
          next = (current + 1) % POSES.length;
          phase = "hold";
          elapsed = 0;
          renderUI(current);
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
