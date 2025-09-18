/* icon-follow.spring.touch.autoinit.js
   - Clic souris : les autres icônes disparaissent ; l'icône cliquée suit le curseur
     avec une dynamique de ressort (exponentiel, fluide).
   - Tactile/stylet : tap sur l'icône => drag au doigt (même sensation de ressort).
   - Auto-init : rien à écrire dans le HTML.
*/
(() => {
  // ====== CONFIG ======
  const SELECTORS = ['[data-follow-icon]', '.pickable-icon', '.icon-follow'];

  // Réglage ressort (exponentiel)
  // Plus freqHz est bas -> réaction plus lente. dampingRatio=1 => critique (sans rebond).
  const freqHz = 2.2;          // 2.0–2.8 = doux ; 4–6 = nerveux
  const dampingRatio = 1.05;   // 1.0–1.2 = doux, sans oscillation

  const FADE_MS = 160;         // fondu des autres icônes
  const Z = 999999;
  const CLAMP_TO_VIEWPORT = true;

  // Effet de mouvement léger constant pour les icônes
  const IDLE_AMPLITUDE_INITIAL = 1.5;  // amplitude avant sélection
  const IDLE_AMPLITUDE_ACTIVE = 5;     // amplitude après sélection
  const IDLE_SPEED = 1.2;              // vitesse de l'oscillation
  // ======================

  // CSS utilitaire (fondu + hygiène)
  function injectStyle() {
    const s = document.createElement('style');
    s.textContent = `
      .__ifst_init { touch-action:none; user-select:none; -webkit-user-drag:none; cursor:pointer; will-change:transform; }
      .__ifst_hide { opacity:0 !important; transition:opacity ${FADE_MS}ms ease; }
    `;
    document.head.appendChild(s);
  }
  const ready = (fn) =>
    (document.readyState === 'loading')
      ? document.addEventListener('DOMContentLoaded', fn, { once: true })
      : fn();

  ready(() => {
    injectStyle();

    // Récupérer les icônes
    let icons = [];
    for (const sel of SELECTORS) { icons = Array.from(document.querySelectorAll(sel)); if (icons.length) break; }
    if (!icons.length) { console.warn('[icon-follow] Aucune icône trouvée.'); return; }
    icons.forEach(el => el.classList.add('__ifst_init'));

    // ===== ÉTATS GÉNÉRAUX =====
    let active = null;                // élément actuellement "suivi/drag"
    let picked = false;               // a-t-on déjà choisi une icône ?
    let baseLeft = 0, baseTop = 0;    // position figée en px (viewport)
    let halfW = 0, halfH = 0;         // demi-taille (centrage souris)

    // Démarrer l'animation des 3 icônes APRÈS la déclaration des variables
    animateAllIcons();

    // Ressort (exponentiel) – position/vitesse relatives (transform)
    let x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0;

    // Tactile
    let touchDragging = false;
    let touchPointerId = null;
    const grab = { x: 0, y: 0 };      // offset doigt -> coin icône au moment de la prise

    // Pré-calculs ressort
    const TWO_PI = Math.PI * 2;
    const omega = TWO_PI * freqHz;
    const z = dampingRatio;

    let lastT = null, rafId = null;

    // Animation pour toutes les icônes (avant sélection)
    let initialAnimationId = null;

    function animateAllIcons() {
      if (picked) return; // Arrêter si une icône a été choisie
      
      const time = performance.now() / 1000;
      icons.forEach((icon, index) => {
        // Chaque icône a un décalage de phase différent
        const phaseOffset = (index * Math.PI * 2) / 3; // 120° de décalage entre chaque icône
        const offsetX = Math.sin(time * IDLE_SPEED + phaseOffset) * IDLE_AMPLITUDE_INITIAL * 0.7;
        const offsetY = Math.sin(time * IDLE_SPEED * 0.8 + phaseOffset + Math.PI / 3) * IDLE_AMPLITUDE_INITIAL;
        
        icon.style.transform = `translate3d(${Math.round(offsetX)}px, ${Math.round(offsetY)}px, 0)`;
      });
      
      initialAnimationId = requestAnimationFrame(animateAllIcons);
    }

    function stepSpring(dt) {
      // x'' + 2ζω x' + ω²(x - tx) = 0   (même pour y)
      const ax = -2 * z * omega * vx - (omega * omega) * (x - tx);
      const ay = -2 * z * omega * vy - (omega * omega) * (y - ty);
      vx += ax * dt;  vy += ay * dt;
      x  += vx * dt;  y  += vy * dt;

      // Effet de mouvement amplifié pour l'icône active
      if (active) {
        const time = performance.now() / 1000;
        const offsetX = Math.sin(time * IDLE_SPEED) * IDLE_AMPLITUDE_ACTIVE * 0.7;
        const offsetY = Math.sin(time * IDLE_SPEED * 0.8 + Math.PI / 3) * IDLE_AMPLITUDE_ACTIVE;
        
        active.style.transform = `translate3d(${Math.round(x + offsetX)}px, ${Math.round(y + offsetY)}px, 0)`;
      }
    }

    function animate(t) {
      if (lastT == null) lastT = t;
      let dt = (t - lastT) / 1000;
      lastT = t;
      if (dt > 0.033) dt = 0.033; // clamp pour stabilité
      stepSpring(dt);
      rafId = requestAnimationFrame(animate);
    }
    const ensureRAF = () => { if (rafId == null) rafId = requestAnimationFrame(animate); };

    // Cible depuis coordonnées viewport
    function setTargetFromClientXY(cx, cy, mode='mouse') {
      if (!active) return;

      // Souris : centre l'icône sous le curseur
      // Tactile : respecte l'offset de prise (grab.x/y)
      let desiredLeft, desiredTop;
      if (mode === 'mouse') {
        desiredLeft = cx - halfW;
        desiredTop  = cy - halfH;
      } else {
        desiredLeft = cx - grab.x;
        desiredTop  = cy - grab.y;
      }

      if (CLAMP_TO_VIEWPORT) {
        const maxLeft = window.innerWidth - active.offsetWidth;
        const maxTop  = window.innerHeight - active.offsetHeight;
        if (desiredLeft < 0) desiredLeft = 0; else if (desiredLeft > maxLeft) desiredLeft = maxLeft;
        if (desiredTop  < 0) desiredTop  = 0; else if (desiredTop  > maxTop)  desiredTop  = maxTop;
      }

      tx = desiredLeft - baseLeft;
      ty = desiredTop  - baseTop;
    }

    // FOLLOW SOURIS (pointer+mousemove fallback)
    function onPointerMove(e) {
      if (!active || e.pointerType !== 'mouse') return;
      setTargetFromClientXY(e.clientX, e.clientY, 'mouse');
    }
    function onMouseMove(e) {
      if (!active) return;
      setTargetFromClientXY(e.clientX, e.clientY, 'mouse');
    }

    // DRAG TACTILE
    function onTouchMove(e) {
      if (!touchDragging || !active) return;
      if (e.pointerId !== touchPointerId) return;
      e.preventDefault();
      setTargetFromClientXY(e.clientX, e.clientY, 'touch');
    }
    function onTouchUp(e) {
      if (e.pointerId !== touchPointerId) return;
      try { active.releasePointerCapture(e.pointerId); } catch {}
      touchDragging = false;
      touchPointerId = null;
      document.removeEventListener('pointermove', onTouchMove);
      document.removeEventListener('pointerup', onTouchUp);
      document.removeEventListener('pointercancel', onTouchUp);
      // On laisse l'icône là où elle est (x,y figés par le ressort)
    }

    // FOLLOW TACTILE GLOBAL (après sélection)
    function onGlobalTouchStart(e) {
      if (!active || e.pointerType === 'mouse') return;
      // Nouveau touch sur l'écran = commencer à suivre
      touchDragging = true;
      touchPointerId = e.pointerId;
      
      // Calculer offset depuis la position actuelle de l'icône
      const r = active.getBoundingClientRect();
      grab.x = e.clientX - r.left;
      grab.y = e.clientY - r.top;
      
      setTargetFromClientXY(e.clientX, e.clientY, 'touch');
      document.addEventListener('pointermove', onTouchMove, { passive: false });
      document.addEventListener('pointerup', onTouchUp, { passive: false });
      document.addEventListener('pointercancel', onTouchUp, { passive: false });
      e.preventDefault();
    }

    // Sélection d'une icône (souris ou tactile)
    icons.forEach((el) => {
      el.addEventListener('pointerdown', (e) => {
        // Première sélection => cacher les autres
        if (!picked) {
          // Arrêter l'animation initiale de toutes les icônes
          if (initialAnimationId) {
            cancelAnimationFrame(initialAnimationId);
            initialAnimationId = null;
          }
          
          icons.forEach(o => {
            if (o !== el) {
              o.classList.add('__ifst_hide');
              o.style.pointerEvents = 'none';
              setTimeout(() => { o.style.display = 'none'; }, FADE_MS);
            }
          });
          picked = true;
        }

        // Geler position écran exacte
        const r = el.getBoundingClientRect();
        el.style.position = 'fixed';
        el.style.left = r.left + 'px';
        el.style.top = r.top + 'px';
        el.style.width = r.width + 'px';
        el.style.height = r.height + 'px';
        el.style.margin = '0';
        el.style.zIndex = String(Z);
        el.style.transformOrigin = 'top left';
        el.style.transform = 'translate3d(0,0,0)';
        el.style.pointerEvents = 'none'; // pas d'interception des move
        if (el.parentNode !== document.body) document.body.appendChild(el);

        active = el;
        baseLeft = r.left; baseTop = r.top;
        halfW = r.width / 2; halfH = r.height / 2;

        // Reset ressort
        x = 0; y = 0; vx = 0; vy = 0; tx = 0; ty = 0;
        lastT = null;
        ensureRAF();

        if (e.pointerType === 'mouse') {
          // FOLLOW souris (sans cliquer/maintenir)
          setTargetFromClientXY(e.clientX ?? (r.left + halfW), e.clientY ?? (r.top + halfH), 'mouse');
          window.addEventListener('pointermove', onPointerMove, { passive: true });
          window.addEventListener('mousemove', onMouseMove, { passive: true });
        } else {
          // DRAG tactile / stylet - premier drag depuis l'icône
          touchDragging = true;
          touchPointerId = e.pointerId;
          try { el.setPointerCapture(e.pointerId); } catch {}
          // mémoriser l'offset de prise (doigt par rapport au coin)
          grab.x = e.clientX - r.left;
          grab.y = e.clientY - r.top;
          // position cible au point de prise
          setTargetFromClientXY(e.clientX, e.clientY, 'touch');
          document.addEventListener('pointermove', onTouchMove, { passive: false });
          document.addEventListener('pointerup', onTouchUp, { passive: false });
          document.addEventListener('pointercancel', onTouchUp, { passive: false });
          
          // IMPORTANT : Activer le suivi tactile global après sélection
          document.addEventListener('pointerdown', onGlobalTouchStart, { passive: false });
          
          e.preventDefault(); // évite le scroll pendant le drag
        }
      }, { passive: false });
    });
  });
})();