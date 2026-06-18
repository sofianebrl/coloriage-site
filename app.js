// ============================================================
//  ColorDream – Galerie principale (sans fetch, compatible file://)
// ============================================================

const CATALOG = {
  princesses: [
    { title: 'Princesse en robe de bal',  svg: 'princesse1' },
    { title: 'Princesse aux fleurs',       svg: 'princesse2' },
    { title: 'Fée magique',               svg: 'fee' },
    { title: 'Princesse fée',             svg: 'fee' },
    { title: 'Belle princesse',           svg: 'princesse1' },
    { title: 'Princesse couronnée',       svg: 'princesse2' },
  ],
  animaux: [
    { title: 'Lion royal',         svg: 'lion' },
    { title: 'Licorne magique',    svg: 'licorne' },
    { title: 'Papillon',           svg: 'papillon' },
    { title: 'Lion fierté',        svg: 'lion' },
    { title: 'Licorne étoilée',    svg: 'licorne' },
    { title: 'Grand papillon',     svg: 'papillon' },
  ],
  manga: [
    { title: 'Écolière kawaii',    svg: 'manga1' },
    { title: 'Héroïne anime',      svg: 'manga1' },
    { title: 'Fille kawaii',       svg: 'manga1' },
    { title: 'Guerrière magique',  svg: 'manga1' },
  ],
  mandala: [
    { title: 'Mandala floral',     svg: 'mandala1' },
    { title: 'Mandala zen',        svg: 'mandala1' },
    { title: 'Mandala étoilé',     svg: 'mandala1' },
    { title: 'Mandala lotus',      svg: 'mandala1' },
  ],
  nature: [
    { title: 'Rose élégante',      svg: 'rose' },
    { title: 'Bouton de rose',     svg: 'rose' },
    { title: 'Papillon fleuri',    svg: 'papillon' },
    { title: 'Jardin fleuri',      svg: 'rose' },
    { title: 'Fleurs sauvages',    svg: 'rose' },
  ],
  fee: [
    { title: 'Fée des forêts',     svg: 'fee' },
    { title: 'Fée des fleurs',     svg: 'fee' },
    { title: 'Fée étoilée',        svg: 'fee' },
    { title: 'Petite fée',         svg: 'fee' },
  ],
  noel: [
    { title: 'Sapin de Noël',      svg: 'noel' },
    { title: 'Noël enchanté',      svg: 'noel' },
    { title: 'Sapin et cadeaux',   svg: 'noel' },
    { title: 'Magie de Noël',      svg: 'noel' },
  ],
  jeux: [
    { title: 'Mario',              img: 'images/mario.png' },
  ],
  libre: [
    { title: 'Canvas vierge',      svg: null },
    { title: 'Grand format',       svg: null },
    { title: 'Format carré',       svg: null },
  ],
};

const modal        = document.getElementById('modal');
const modalClose   = document.getElementById('modalClose');
const modalTitle   = document.getElementById('modalTitle');
const coloringGrid = document.getElementById('coloringGrid');

// ── Ouvrir modal catégorie ───────────────────────────────────
function openCategory(cat, titleText) {
  const items = CATALOG[cat] || [];
  modalTitle.textContent = titleText;
  coloringGrid.innerHTML = '';

  items.forEach(item => {
    const thumb = document.createElement('div');
    thumb.className = 'coloring-thumb';

    if (item.img) {
      const imgEl = document.createElement('img');
      imgEl.src = item.img;
      imgEl.alt = item.title;
      imgEl.style.cssText = 'width:100%;height:130px;object-fit:cover;border-radius:10px;pointer-events:none;background:#fff;';
      thumb.appendChild(imgEl);
    } else if (item.svg && SVG_DATA[item.svg]) {
      const preview = document.createElement('div');
      preview.innerHTML = SVG_DATA[item.svg];
      const svg = preview.querySelector('svg');
      if (svg) {
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '130');
        svg.style.pointerEvents = 'none';
        thumb.appendChild(svg);
      }
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'width:100%;height:130px;background:linear-gradient(135deg,#f0e6ff,#e6f0ff);display:flex;align-items:center;justify-content:center;font-size:3rem;border-radius:10px;';
      placeholder.textContent = '✏️';
      thumb.appendChild(placeholder);
    }

    const label = document.createElement('p');
    label.textContent = item.title;
    thumb.appendChild(label);

    thumb.addEventListener('click', () => openEditor(item));
    coloringGrid.appendChild(thumb);
  });

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ── Ouvrir éditeur ───────────────────────────────────────────
function openEditor(item) {
  sessionStorage.setItem('currentTitle', item.title);
  if (item.img) {
    sessionStorage.removeItem('currentSvg');
    sessionStorage.setItem('currentImg', item.img);
  } else if (item.svg && SVG_DATA[item.svg]) {
    sessionStorage.setItem('currentSvg', SVG_DATA[item.svg]);
    sessionStorage.removeItem('currentImg');
  } else {
    sessionStorage.removeItem('currentSvg');
    sessionStorage.removeItem('currentImg');
  }
  window.location.href = 'editor.html';
}

// ── Clic sur les cartes catégories ──────────────────────────
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', () => {
    const cat   = card.dataset.cat;
    const title = card.querySelector('h3').textContent;
    openCategory(cat, title);
  });
});

// ── Fermer modal ─────────────────────────────────────────────
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// ── Animations d'entrée ──────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.category-card').forEach(card => {
  card.style.opacity    = '0';
  card.style.transform  = 'translateY(30px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.25s ease, border-color 0.25s ease';
  observer.observe(card);
});
