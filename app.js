// ============================================================
//  ColorDream – Galerie principale (sans fetch, compatible file://)
// ============================================================

const CATALOG = {
  disney: [
    { title: 'Vaiana & Maui',        img: 'images/vaiana-maui.jpg' },
    { title: 'Bébé Vaiana',          img: 'images/vaiana-bebe.png' },
    { title: 'Elsa - La Reine des Neiges', img: 'images/elsa.jpg' },
    { title: 'Raiponce & Pascal',    img: 'images/raiponce.jpg' },
    { title: 'Stitch dodo',          img: 'images/stitch.jpg' },
    { title: 'Zootopie - Nick & Judy', img: 'images/zootopie.jpg' },
  ],
  princesses: [
    { title: 'Elsa - La Reine des Neiges', img: 'images/elsa.jpg' },
    { title: 'Raiponce & Pascal',    img: 'images/raiponce.jpg' },
    { title: 'Bébé Vaiana',          img: 'images/vaiana-bebe.png' },
    { title: 'Princesse en robe de bal', svg: 'princesse1' },
    { title: 'Princesse aux fleurs', svg: 'princesse2' },
  ],
  animaux: [
    { title: 'Nick & Judy (Zootopie)', img: 'images/zootopie.jpg' },
    { title: 'Lion royal',           svg: 'lion' },
    { title: 'Licorne magique',      svg: 'licorne' },
    { title: 'Papillon',             svg: 'papillon' },
  ],
  manga: [
    { title: 'Stitch dodo',          img: 'images/stitch.jpg' },
    { title: 'Nick & Judy',          img: 'images/zootopie.jpg' },
  ],
  mandala: [
    { title: 'Mandala floral',       svg: 'mandala1' },
    { title: 'Mandala zen',          svg: 'mandala1' },
    { title: 'Mandala étoilé',       svg: 'mandala1' },
    { title: 'Mandala lotus',        svg: 'mandala1' },
  ],
  nature: [
    { title: 'Rose élégante',        svg: 'rose' },
    { title: 'Bouton de rose',       svg: 'rose' },
    { title: 'Papillon fleuri',      svg: 'papillon' },
  ],
  fee: [
    { title: 'Fée des forêts',       svg: 'fee' },
    { title: 'Fée des fleurs',       svg: 'fee' },
    { title: 'Fée étoilée',         svg: 'fee' },
  ],
  noel: [
    { title: 'Sapin de Noël',        svg: 'noel' },
    { title: 'Noël enchanté',        svg: 'noel' },
  ],
  jeux: [
    { title: 'Mario',                img: 'images/mario.png' },
    { title: 'Stitch dodo',          img: 'images/stitch.jpg' },
  ],
  libre: [
    { title: 'Canvas vierge',        svg: null },
    { title: 'Grand format',         svg: null },
  ],
};

const modal        = document.getElementById('modal');
const modalClose   = document.getElementById('modalClose');
const modalTitle   = document.getElementById('modalTitle');
const coloringGrid = document.getElementById('coloringGrid');

// ── Favoris helpers ──────────────────────────────────────────
function getFavs() { return JSON.parse(localStorage.getItem('cdFavs') || '[]'); }
function setFavs(f) { localStorage.setItem('cdFavs', JSON.stringify(f)); }
function favId(cat, title) { return cat + '|' + title; }

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

    // Bouton favori
    const id = favId(cat, item.title);
    const favBtn = document.createElement('button');
    favBtn.className = 'fav-btn';
    favBtn.textContent = getFavs().includes(id) ? '❤️' : '🤍';
    favBtn.title = 'Ajouter aux favoris';
    favBtn.addEventListener('click', e => {
      e.stopPropagation();
      const favs = getFavs();
      const idx = favs.indexOf(id);
      if (idx === -1) { favs.push(id); favBtn.textContent = '❤️'; }
      else { favs.splice(idx, 1); favBtn.textContent = '🤍'; }
      setFavs(favs);
    });
    thumb.appendChild(favBtn);

    thumb.addEventListener('click', () => openEditor(item));
    coloringGrid.appendChild(thumb);
  });

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ── Historique Mes créations ─────────────────────────────────
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('cdHistory') || '[]');
  if (history.length === 0) return;
  const section = document.getElementById('creationsSection');
  const grid    = document.getElementById('creationsGrid');
  if (!section || !grid) return;
  section.style.display = 'block';
  grid.innerHTML = '';
  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'creation-thumb';
    div.innerHTML = `<img src="${item.thumbnail}" alt="${item.title}" /><p>${item.title}</p><span>${item.date}</span>`;
    grid.appendChild(div);
  });
}
loadHistory();

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
