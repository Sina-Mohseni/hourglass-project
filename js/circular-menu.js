/* circular-menu.js
   Menu circulaire configurable qui N'AGIT PAS sur l'icône suivie.
   - Double-clic (souris) ou double-tap (tactile) sur le <body> :
       -> repère l'icône actuellement attachée (via heuristique position:fixed)
       -> la "détache" visuellement (clone figé) SANS la modifier
       -> ouvre un menu circulaire autour du clone
   - Cliquer/taper le CLONE => rattache l'icône (sans passer par le menu)
   - Le menu est libre : items, PNG, callbacks, rayon, thème…

   API globale : window.CircularMenu
     - init(options)
     - updateItems(items)
     - open() / close()
     - isOpen()
     - getState()   // { detached, frozen: {origEl, cloneEl} | null }

   Exemple d’usage plus bas.
*/
(() => {
  const DEFAULTS = {
    radius: 100,                 // rayon du menu (px)
    gapAngleDeg: 0,              // angle vide si tu veux un arc au lieu d’un cercle
    items: [                     // tu remplaceras via CircularMenu.init({ items: [...] })
      // { id:'my-action', label:'Mon action', icon:'/assets/icons/my.png', onSelect:(ctx,e)=>{} }
    ],
    doubleTapMs: 300,            // délai pour détecter double-tap tactile
    doubleTapTolPx: 40,          // tolérance de distance entre taps (px)
    theme: {
      zIndex: 1000002,
      itemBg: 'rgba(20,20,24,.92)',
      itemHoverBg: 'rgba(36,36,44,.95)',
      itemBorder: 'rgba(255,255,255,.12)',
      itemShadow: '0 8px 24px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.08)',
      labelColor: '#fff',
      labelFont: '600 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      backdropBg: 'transparent'
    },
    // Où ancrer le menu (centre du clone par défaut)
    anchor: (cloneEl) => {
      const r = cloneEl.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2 };
    }
  };

  const state = {
    opts: JSON.parse(JSON.stringify(DEFAULTS)),
    lastTap: { t: 0, x: 0, y: 0 },
    detached: false,                 // icône gelée (clone présent) ?
    frozen: null,                    // { origEl, cloneEl }
    menu: null,                      // { root, items[], backdrop }
  };

  const ICON_SELECTORS = ['[data-follow-icon]', '.pickable-icon', '.icon-follow'];

  // ---------- Utils ----------
  const ready = (fn) => (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', fn, { once:true })
    : fn();

  const $all = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function getActiveIcon() {
    // Heuristique : l’icône “suivie” est en position:fixed, visible, au z-index max
    const candidates = ICON_SELECTORS.flatMap(sel => $all(sel)).filter(el => {
      const cs = getComputedStyle(el);
      return cs.position === 'fixed'
          && cs.display !== 'none'
          && cs.visibility !== 'hidden'
          && parseFloat(cs.opacity) > 0;
    }).map(el => ({ el, z: parseInt(getComputedStyle(el).zIndex || '0', 10) || 0 }))
      .sort((a,b)=> b.z - a.z);
    return candidates[0]?.el || null;
  }

  function ensureStyle() {
    if (document.getElementById('cm-style-v2')) return;
    const s = document.createElement('style');
    s.id = 'cm-style-v2';
    s.textContent = `
      .cmv2-clone {
        position: fixed; margin:0; transform: none; transition: none;
        pointer-events: auto; box-sizing: border-box;
      }
      .cmv2-backdrop {
        position: fixed; inset: 0;
      }
      .cmv2-root { position: fixed; left:0; top:0; pointer-events: none; }
      .cmv2-item {
        position: absolute; transform: translate(-50%, -50%);
        pointer-events: auto; user-select: none;
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 12px; border-radius: 999px;
        border: 1px solid; white-space: nowrap;
        transition: transform .12s ease, background .12s ease;
        will-change: transform, background;
      }
      .cmv2-item:focus-visible { outline: 2px solid #88f; }
      .cmv2-item img {
        display:block; width: 18px; height: 18px; object-fit: contain;
        image-rendering: auto;
      }
      .cmv2-hidden { display: none !important; }
    `;
    document.head.appendChild(s);
  }

  function freezeIcon(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const clone = el.cloneNode(true);
    clone.classList.add('cmv2-clone');
    clone.style.left   = r.left + 'px';
    clone.style.top    = r.top  + 'px';
    clone.style.width  = r.width  + 'px';
    clone.style.height = r.height + 'px';
    // S’assurer visible même si l’original masque les autres
    clone.classList.remove('__ifst_hide');
    clone.style.opacity = '';
    // Empiler au-dessus
    const z = Math.max(1000001, parseInt(getComputedStyle(el).zIndex||'0',10)+1);
    clone.style.zIndex = String(z);

    document.body.appendChild(clone);
    // cacher l’original (sans le modifier autrement)
    el.style.visibility = 'hidden';

    // Rattacher en cliquant le clone (menu n’agit pas sur l’icône)
    const onCloneDown = () => reattach();
    clone.addEventListener('pointerdown', onCloneDown, { passive:true });
    clone.addEventListener('mousedown',   onCloneDown, { passive:true });
    clone.addEventListener('touchstart',  onCloneDown, { passive:true });

    state.detached = true;
    state.frozen = { origEl: el, cloneEl: clone };
    return state.frozen;
  }

  function reattach() {
    if (!state.frozen) return;
    const { origEl, cloneEl } = state.frozen;
    // supprime clone + réaffiche l’original
    if (origEl) origEl.style.visibility = '';
    if (cloneEl?.parentNode) cloneEl.parentNode.removeChild(cloneEl);
    state.frozen = null;
    state.detached = false;
    closeMenu(); // ferme un éventuel menu ouvert
  }

  function polarPlace(root, cx, cy, radius, items, gapDeg=0) {
    const n = items.length;
    if (!n) return;
    const full = Math.PI * 2;
    const span = full - (gapDeg * Math.PI/180);
    const start = -Math.PI/2 - span/2; // centré verticalement haut
    for (let i=0;i<n;i++){
      const angle = start + (i+0.5)*(span/n);
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      items[i].style.left = x + 'px';
      items[i].style.top  = y + 'px';
    }
  }

  function buildMenu(items, cx, cy) {
    const { theme, radius, gapAngleDeg } = state.opts;

    const backdrop = document.createElement('div');
    backdrop.className = 'cmv2-backdrop';
    backdrop.style.zIndex = String(theme.zIndex - 1);
    backdrop.style.background = theme.backdropBg;
    backdrop.style.pointerEvents = 'auto';
    backdrop.addEventListener('pointerdown', closeMenu, { passive:true });

    const root = document.createElement('div');
    root.className = 'cmv2-root';
    root.style.zIndex = String(theme.zIndex);

    const buttons = items.map(item => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cmv2-item';
      b.style.background = theme.itemBg;
      b.style.borderColor = theme.itemBorder;
      b.style.boxShadow = theme.itemShadow;
      b.style.color = theme.labelColor;
      b.style.font = theme.labelFont;

      if (item.icon) {
        const img = document.createElement('img');
        img.alt = item.label || item.id || '';
        img.src = item.icon;       // PNG / SVG / etc.
        b.appendChild(img);
      }
      if (item.label) {
        const span = document.createElement('span');
        span.textContent = item.label;
        b.appendChild(span);
      }

      b.addEventListener('pointerenter', () => { b.style.background = theme.itemHoverBg; });
      b.addEventListener('pointerleave', () => { b.style.background = theme.itemBg; });
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        // On passe un contexte propre au callback
        const ctx = {
          id: item.id,
          // info “où est l’ancre”
          anchor: { x: cx, y: cy },
          // état de l’icône (si gelée)
          frozen: state.frozen ? { origEl: state.frozen.origEl, cloneEl: state.frozen.cloneEl } : null,
          // fonction utilitaire (si tu veux fermer)
          closeMenu,
          // possibilité de re-attacher manuellement depuis ton callback si tu le souhaites
          reattach,
        };
        try { item.onSelect?.(ctx, e); } catch(err){ console.error('CircularMenu item error:', err); }
      });

      root.appendChild(b);
      return b;
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(root);
    polarPlace(root, cx, cy, radius, buttons, gapAngleDeg);

    state.menu = { root, items: buttons, backdrop };
  }

  function openMenu() {
    if (!state.detached || !state.frozen) return;
    closeMenu();
    const { anchor } = state.opts;
    const { cloneEl } = state.frozen;
    const { x, y } = anchor(cloneEl);
    buildMenu(state.opts.items, x, y);
  }

  function closeMenu() {
    if (!state.menu) return;
    const { root, backdrop } = state.menu;
    if (root?.parentNode) root.parentNode.removeChild(root);
    if (backdrop?.parentNode) backdrop.parentNode.removeChild(backdrop);
    state.menu = null;
  }

  // ---------- Double-clic / Double-tap déclencheur ----------
  function onBodyDblClick() {
    let active = getActiveIcon();
    if (!state.detached) {
      if (!active) return;         // rien à geler
      freezeIcon(active);          // détache visuellement
    }
    openMenu();                    // menu autour du clone
  }

  function onBodyPointerDown(ev) {
    if (ev.pointerType !== 'touch') return;
    const now = performance.now();
    const dt = now - state.lastTap.t;
    const dx = Math.abs(ev.clientX - state.lastTap.x);
    const dy = Math.abs(ev.clientY - state.lastTap.y);
    if (dt <= state.opts.doubleTapMs && dx <= state.opts.doubleTapTolPx && dy <= state.opts.doubleTapTolPx) {
      onBodyDblClick();
      state.lastTap.t = 0;
      return;
    }
    state.lastTap = { t: now, x: ev.clientX, y: ev.clientY };
  }

  // ---------- API publique ----------
  const API = {
    init(options = {}) {
      // merge shallow (simple et safe)
      state.opts = {
        ...DEFAULTS,
        ...options,
        theme: { ...DEFAULTS.theme, ...(options.theme || {}) },
        items: Array.isArray(options.items) ? options.items : DEFAULTS.items,
      };
      ensureStyle();

      // Écouteurs uniques
      if (!API._wired) {
        API._wired = true;
        document.body.addEventListener('dblclick', (e) => {
          if (e.target.closest('.cmv2-root')) return; // évite relance sur clic menu
          onBodyDblClick();
        });
        document.body.addEventListener('pointerdown', onBodyPointerDown, { passive:true });

        // Nettoyage au unload
        window.addEventListener('beforeunload', () => {
          closeMenu();
          if (state.frozen?.cloneEl?.parentNode) state.frozen.cloneEl.parentNode.removeChild(state.frozen.cloneEl);
        });
      }
    },
    updateItems(items = []) {
      state.opts.items = items;
      if (state.menu) openMenu(); // re-render menu avec nouvelles entrées
    },
    open: openMenu,
    close: closeMenu,
    isOpen: () => !!state.menu,
    getState: () => ({
      detached: state.detached,
      frozen: state.frozen ? { origEl: state.frozen.origEl, cloneEl: state.frozen.cloneEl } : null
    }),
  };

  Object.defineProperty(API, '_wired', { value:false, writable:true, enumerable:false });
  window.CircularMenu = API;

  // Auto-init avec defaults (tu ré-appelleras init avec tes options)
  ready(() => API.init());
})();

  // Exemple : 4 boutons PNG + callbacks
  window.CircularMenu.init({
    radius: 110,
    gapAngleDeg: 20, // laisse une ouverture
    theme: {
      itemBg: 'rgba(18,18,22,.92)',
      itemHoverBg: 'rgba(40,40,50,.96)',
      labelFont: '600 13px/1.2 Inter, system-ui, sans-serif',
    },
    items: [
      {
        id: 'note',
        label: 'Ajouter note',
        icon: '',
        onSelect: ({ anchor, closeMenu }) => {
          // Ton code custom ici
          console.log('note @', anchor);
          closeMenu();
        }
      },
      {
        id: 'tag',
        label: 'Tagger',
        icon: '/assets/icons/tag.png',
        onSelect: ({ frozen }) => {
          // Exemple: lire des infos DOM de l’icône gelée sans la modifier
          console.log('tag on element:', frozen?.origEl);
        }
      },
      {
        id: 'share',
        label: 'Partager',
        icon: '/assets/icons/share.png',
        onSelect: () => {
          alert('Partage à implémenter 📨');
        }
      },
      {
        id: 'settings',
        label: 'Options',
        icon: '/assets/icons/settings.png',
        onSelect: ({ closeMenu }) => closeMenu()
      }
    ]
  });

  // Tu peux à tout moment changer le menu :
  // window.CircularMenu.updateItems([...]);
