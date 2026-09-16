/* =========================================================
   PRACTICADOR — carrusel de fotos reales por postura
   Sin figura animada: solo fotografías (licencia Unsplash),
   con controles de reproducción automática y navegación manual.
   ========================================================= */
(function () {
  "use strict";
  const img = document.getElementById("pose-photo");
  if (!img) return;

  const POSES = [
    {
      name: "Tadasana", sub: "Postura de la montaña",
      desc: "De pie, pies firmes, coronilla hacia el techo: el punto de partida y de llegada.",
      src: "https://images.unsplash.com/photo-1484452330304-377cdeb05340?auto=format&fit=crop&w=1200&q=80",
      alt: "Silueta de pie en una postura de yoga erguida",
    },
    {
      name: "Urdhva Hastasana", sub: "Brazos elevados",
      desc: "Los brazos suben en arco, ligera extensión de la columna hacia atrás.",
      src: "https://images.unsplash.com/photo-1500904156668-758cff89dcff?auto=format&fit=crop&w=1200&q=80",
      alt: "Silueta con un brazo elevado al atardecer",
    },
    {
      name: "Uttanasana", sub: "Flexión de pie",
      desc: "La cadera se pliega y el torso cae hacia adelante; las rodillas pueden ir suaves.",
      src: "https://images.unsplash.com/photo-1607914660217-754fdd90041d?auto=format&fit=crop&w=1200&q=80",
      alt: "Persona estirando el cuerpo hacia adelante",
    },
    {
      name: "Ardha Uttanasana", sub: "Media elevación",
      desc: "La espalda se alarga en línea recta, la mirada busca el horizonte.",
      src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
      alt: "Persona practicando una asana",
    },
    {
      name: "Adho Mukha Svanasana", sub: "Perro boca abajo",
      desc: "La cadera se convierte en el punto más alto: una V invertida entre manos y pies.",
      src: "https://images.unsplash.com/photo-1767611115570-92e679b820ed?auto=format&fit=crop&w=1200&q=80",
      alt: "Mujer en postura de perro boca abajo",
    },
    {
      name: "Balasana", sub: "Postura del niño",
      desc: "Cierre del ciclo: la cadera baja hacia los talones y el torso descansa sobre los muslos.",
      src: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
      alt: "Práctica de yoga al aire libre en una postura de descanso",
    },
  ];

  const HOLD_MS = 2600;
  let current = 0, playing = true, timer = null;

  const nameEl = document.querySelector(".pose3d-name");
  const subEl = document.querySelector(".pose3d-sanskrit-en");
  const descEl = document.querySelector(".pose3d-desc");
  const stepEls = Array.from(document.querySelectorAll(".pose3d-step"));
  const playBtn = document.querySelector(".pose3d-play");
  const prevBtn = document.querySelector(".pose3d-prev");
  const nextBtn = document.querySelector(".pose3d-next");

  function render(i) {
    const p = POSES[i];
    img.classList.remove("loaded");
    const swap = () => {
      img.src = p.src;
      img.alt = p.alt;
    };
    // pequeño crossfade: espera a que la imagen cargue antes de mostrarla
    const loader = new Image();
    loader.onload = () => { swap(); requestAnimationFrame(() => img.classList.add("loaded")); };
    loader.onerror = () => { swap(); };
    loader.src = p.src;

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

  function scheduleNext() {
    clearTimeout(timer);
    if (!playing) return;
    timer = setTimeout(() => goTo(current + 1), HOLD_MS);
  }

  function goTo(i) {
    current = ((i % POSES.length) + POSES.length) % POSES.length;
    render(current);
    scheduleNext();
  }

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      playing = !playing;
      setPlayIcon();
      if (playing) scheduleNext(); else clearTimeout(timer);
    });
  }
  if (prevBtn) prevBtn.addEventListener("click", () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goTo(current + 1));
  stepEls.forEach((el, idx) => el.addEventListener("click", () => goTo(idx)));

  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (REDUCED) { playing = false; clearTimeout(timer); }

  render(current);
  setPlayIcon();
  scheduleNext();
})();
