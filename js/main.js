// ================= NAV TOGGLE (móvil) =================
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const HAMBURGER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
  const CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
      toggle.innerHTML = open ? CLOSE : HAMBURGER;
      document.body.style.overflow = open ? 'hidden' : '';
      document.body.classList.toggle('nav-open', open);
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = HAMBURGER;
      document.body.style.overflow = '';
      document.body.classList.remove('nav-open');
    }));
  }

  // ================= ACORDEONES =================
  document.querySelectorAll('.accordion-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      const wasOpen = item.classList.contains('open');
      // cierra hermanos del mismo grupo si tiene data-solo
      if (item.closest('[data-accordion-solo]')) {
        item.parentElement.querySelectorAll('.accordion-item.open').forEach(o => {
          if (o !== item) o.classList.remove('open');
        });
      }
      item.classList.toggle('open', !wasOpen);
      btn.setAttribute('aria-expanded', String(!wasOpen));
    });
  });

  // ================= FICHA AMPLIABLE DE CADA POSTURA =================
  document.querySelectorAll('.pose-more').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.pose-card');
      const isOpen = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.querySelector('.pose-more-label').textContent = isOpen ? 'Ocultar ficha' : 'Ver ficha completa';
    });
  });

  // ================= FILTROS (asanas / estilos) =================
  document.querySelectorAll('[data-filter-group]').forEach(group => {
    const buttons = group.querySelectorAll('.filter-btn');
    const targetSelector = group.dataset.filterGroup;
    const items = document.querySelectorAll(targetSelector);
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const value = btn.dataset.filter;
        items.forEach(item => {
          const tags = (item.dataset.tags || '').split(' ');
          item.style.display = (value === 'all' || tags.includes(value)) ? '' : 'none';
        });
      });
    });
  });

  // ================= DOLENCIAS: pestañas =================
  document.querySelectorAll('.ailment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('[data-ailments]');
      group.querySelectorAll('.ailment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      group.querySelectorAll('.ailment-panel').forEach(p => p.classList.remove('active'));
      const panel = group.querySelector('#' + btn.dataset.target);
      if (panel) panel.classList.add('active');
    });
  });

  // ================= RESPIRA CONMIGO (widget de respiración) =================
  const orb = document.querySelector('.practice-orb');
  const startBtn = document.querySelector('.practice-start');
  const stateLabel = document.querySelector('.practice-state');
  const modeBtns = document.querySelectorAll('.mode-btn');
  const modeTitle = document.querySelector('.mode-title');
  const modeDesc = document.querySelector('.mode-desc');

  if (orb && startBtn) {
    let running = false;
    let timeoutId = null;
    let currentMode = 'calma';

    const MODES = {
      calma: {
        title: 'Suspiro cíclico',
        desc: 'Dos inhalaciones cortas por la nariz seguidas de una exhalación larga por la boca. En un ensayo de la Universidad de Stanford (Balban et al., 2023) fue el patrón que más mejoró el estado de ánimo y más redujo la frecuencia respiratoria, por encima de la respiración cuadrada y de la meditación mindfulness.',
        steps: [
          { phase: 'Inhala', ms: 2000, scale: 1.18 },
          { phase: 'Inhala (remate)', ms: 1500, scale: 1.4 },
          { phase: 'Exhala', ms: 7000, scale: 0.75 },
        ],
      },
      energia: {
        title: 'Ujjayi ligera',
        desc: 'Respiración por la nariz contrayendo suavemente la glotis, con un sonido parecido al oleaje. Ritmo corto y sostenido, tomado de la práctica postural: ayuda a activar el cuerpo antes de moverse.',
        steps: [
          { phase: 'Inhala', ms: 3000, scale: 1.35 },
          { phase: 'Exhala', ms: 3000, scale: 0.75 },
        ],
      },
      enfoque: {
        title: 'Respiración cuádruple',
        desc: 'Cuatro tiempos iguales — inhalar, retener, exhalar, retener — conocida también como "respiración de caja". Su regularidad la hace fácil de sostener y es la que más se usa para recuperar la concentración antes de una tarea exigente.',
        steps: [
          { phase: 'Inhala', ms: 4000, scale: 1.35 },
          { phase: 'Retén', ms: 4000, scale: 1.35 },
          { phase: 'Exhala', ms: 4000, scale: 0.75 },
          { phase: 'Retén', ms: 4000, scale: 0.75 },
        ],
      },
    };

    function setMode(key) {
      currentMode = key;
      modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === key));
      if (modeTitle) modeTitle.textContent = MODES[key].title;
      if (modeDesc) modeDesc.textContent = MODES[key].desc;
      if (running) {
        clearTimeout(timeoutId);
        runCycle();
      }
    }

    function runCycle() {
      if (!running) return;
      const pattern = MODES[currentMode];
      let i = 0;
      const step = () => {
        if (!running) return;
        const s = pattern.steps[i % pattern.steps.length];
        orb.style.transitionDuration = (s.ms / 1000) + 's';
        orb.style.transform = `scale(${s.scale})`;
        if (stateLabel) stateLabel.textContent = s.phase + '…';
        i++;
        timeoutId = setTimeout(step, s.ms);
      };
      step();
    }

    modeBtns.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

    startBtn.addEventListener('click', () => {
      running = !running;
      startBtn.textContent = running ? 'Detener' : 'Comenzar';
      if (running) {
        runCycle();
      } else {
        clearTimeout(timeoutId);
        orb.style.transform = 'scale(1)';
        if (stateLabel) stateLabel.textContent = 'Lista cuando quieras';
      }
    });
  }

  // ================= FORMULARIO "PRÓXIMAMENTE" (cuenta) =================
  const notifyForm = document.querySelector('.notify-form');
  if (notifyForm) {
    notifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = notifyForm.querySelector('button');
      const original = btn.textContent;
      btn.textContent = '¡Apuntado!';
      btn.disabled = true;
      notifyForm.querySelector('input').value = '';
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2500);
    });
  }

  // Año en footer
  document.querySelectorAll('.year').forEach(el => el.textContent = new Date().getFullYear());
});
